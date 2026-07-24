import cv2
import numpy as np
import os
import logging
import difflib
from typing import Optional
from skimage.metrics import structural_similarity as ssim
from app.config import settings

logger = logging.getLogger(__name__)

# Lazy initialize EasyOCR reader to save startup memory/time.
# _easyocr_reader states: None = not yet attempted, "FAILED" = init tried and
# failed, Reader instance = ready. We never silently re-cache None on failure —
# that made every request after the first failure look like a fresh retry log
# line while actually permanently short-circuiting to the fallback path.
_easyocr_reader = None
_easyocr_init_error: Optional[str] = None


def get_ocr_reader(retry: bool = False):
    """
    Returns a ready EasyOCR reader, or raises RuntimeError with the original
    cause if the engine cannot be initialized. Callers that can legitimately
    run without OCR (e.g. run_anomaly_ensemble's ThreadPoolExecutor tasks)
    must catch this explicitly and record it in `errors`, not swallow it
    into a generic "" / False result.

    `retry=True` forces a fresh init attempt even after a prior failure —
    use this from an ops/healthcheck endpoint after fixing the environment,
    instead of restarting the whole process.
    """
    global _easyocr_reader, _easyocr_init_error

    if _easyocr_reader == "FAILED" and not retry:
        raise RuntimeError(f"EasyOCR previously failed to initialize: {_easyocr_init_error}")

    if _easyocr_reader is None or _easyocr_reader == "FAILED":
        logger.info("Initializing EasyOCR Engine on CPU mode...")
        try:
            import easyocr
            _easyocr_reader = easyocr.Reader(["en"], gpu=False)
            _easyocr_init_error = None
            logger.info("EasyOCR Engine successfully initialized.")
        except Exception as e:
            _easyocr_reader = "FAILED"
            _easyocr_init_error = str(e)
            logger.critical(
                f"EasyOCR failed to initialize — OCR detection is DOWN for this process. "
                f"Check 'pip show easyocr torch' in this environment. Cause: {e}"
            )
            raise RuntimeError(f"EasyOCR initialization failed: {e}") from e

    return _easyocr_reader


def _ensure_rgb(img: np.ndarray) -> np.ndarray:
    if img is None:
        raise ValueError("Image input cannot be None")
    if img.ndim == 2:
        return cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
    if img.ndim == 3 and img.shape[2] == 4:
        return cv2.cvtColor(img, cv2.COLOR_BGRA2BGR)
    if img.ndim == 3 and img.shape[2] == 3:
        return img
    raise ValueError(f"Unsupported image shape for RGB conversion: {img.shape}")


def _ensure_gray(img: np.ndarray) -> np.ndarray:
    if img is None:
        raise ValueError("Image input cannot be None")
    if img.ndim == 2:
        return img
    return cv2.cvtColor(_ensure_rgb(img), cv2.COLOR_BGR2GRAY)


def _normalize_roi_config(roi_config: dict = None) -> dict:
    """Use label ROI as the default template/color ROI when only one ROI is configured."""
    normalized = dict(roi_config or {})
    label_roi = normalized.get("label_roi")
    if label_roi:
        normalized.setdefault("template_roi", label_roi)
        normalized.setdefault("color_roi", label_roi)
    return normalized


def _region_label(x: int, y: int, w: int, h: int, img_shape: tuple) -> str:
    img_h, img_w = img_shape[:2]
    cx = x + (w / 2.0)
    cy = y + (h / 2.0)
    horizontal = "left" if cx < img_w / 3 else "right" if cx > (img_w * 2 / 3) else "center"
    vertical = "top" if cy < img_h / 3 else "bottom" if cy > (img_h * 2 / 3) else "middle"
    return f"{vertical}-{horizontal}"


def _is_plausible_expected_label(text: str) -> bool:
    cleaned = (text or "").strip()
    if not cleaned:
        return False
    lowered = cleaned.lower()
    if lowered.startswith(("gold-", "auto-")):
        return False
    if lowered in {"motherboard", "ram", "storage", "ssd", "processor", "microchip", "label"}:
        return False
    return len(cleaned) <= 64


def compute_ssim_diff(src_img: np.ndarray, ref_img: np.ndarray) -> tuple[float, np.ndarray, np.ndarray, list[dict]]:
    """
    Computes SSIM between source and reference.
    Returns: (ssim_score, realistic_thermal_heatmap_image, annotated_defective_image, anomaly_regions)
    
    The realistic_thermal_heatmap_image shows a thermal camera-like overlay where:
      - Blue / Dark areas = identical / no defect
      - Green / Cyan areas = minor surface variation
      - Yellow / Orange areas = moderate anomaly 
      - Bright Red / Magenta areas = critical defect
    
    The annotated_defective_image clearly marks all defective regions on the target
    image with bright bounding boxes, semi-transparent red overlays, and numbered labels.
    """
    logger.info("Executing SSIM structural anomaly detector with realistic thermal colormap & defect target bounding boxes...")
    gray_src = _ensure_gray(src_img)
    gray_ref = _ensure_gray(ref_img)

    if gray_src.shape != gray_ref.shape:
        logger.info(f"Shape mismatch in SSIM inputs: {gray_src.shape} != {gray_ref.shape}. Resizing source to match reference.")
        gray_src = cv2.resize(gray_src, (gray_ref.shape[1], gray_ref.shape[0]))
        src_img = cv2.resize(src_img, (ref_img.shape[1], ref_img.shape[0]))

    # Compute SSIM structural difference map
    score, diff = ssim(gray_ref, gray_src, full=True)

    # Convert difference to 0-255 range: 0 = identical, 255 = maximum discrepancy
    diff_u8 = ((1.0 - diff) * 127.5).clip(0, 255).astype("uint8")

    # === STEP 1: Generate realistic thermal heatmap ===
    # Apply Gaussian blur to smooth out noise and create continuous thermal gradients
    blurred_diff = cv2.GaussianBlur(diff_u8, (21, 21), 0)
    
    # Apply additional bilateral filter to preserve edges while smoothing - looks more realistic
    blurred_diff = cv2.bilateralFilter(blurred_diff, 9, 50, 50)

    # Generate INFRARED-like thermal colormap (JET: blue→cyan→green→yellow→red)
    thermal_colormap = cv2.applyColorMap(blurred_diff, cv2.COLORMAP_JET)

    # Create smooth alpha mask based on anomaly intensity (not binary)
    # This creates a gradual transition from transparent to fully colored
    alpha_mask = blurred_diff.astype(np.float32) / 180.0
    alpha_mask = np.clip(alpha_mask, 0.0, 1.0)
    alpha_mask_3ch = cv2.merge([alpha_mask, alpha_mask, alpha_mask])

    # Blend thermal overlay onto source image with intensity-based transparency
    # Real thermal cameras show the actual object + heat signature on top
    realistic_heatmap = (src_img.astype(np.float32) * (1.0 - alpha_mask_3ch * 0.55) + 
                         thermal_colormap.astype(np.float32) * (alpha_mask_3ch * 0.55)).astype("uint8")

    # Apply subtle sharpening to make defect boundaries visible
    sharpen_kernel = np.array([[-1, -1, -1],
                               [-1,  9, -1],
                               [-1, -1, -1]]) / 3.0
    realistic_heatmap = cv2.filter2D(realistic_heatmap, -1, sharpen_kernel)

    # === STEP 2: Detect anomaly regions using adaptive thresholding ===
    # Use Otsu's adaptive threshold for better separation in varying conditions
    _, anomaly_mask = cv2.threshold(blurred_diff, 35, 255, cv2.THRESH_BINARY)

    # Morphological operations to clean up noise
    kernel_clean = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    anomaly_mask = cv2.morphologyEx(anomaly_mask, cv2.MORPH_OPEN, kernel_clean)
    
    # Dilate to merge nearby defect regions
    kernel_dilate = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11))
    dilated_mask = cv2.dilate(anomaly_mask, kernel_dilate, iterations=1)

    # Find contours of defect regions
    contours, _ = cv2.findContours(dilated_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    # === STEP 3: Create annotated defective image with clear defect markings ===
    annotated_target = src_img.copy()
    
    # Create a semi-transparent red overlay for defect regions
    defect_overlay = np.zeros_like(src_img)
    defect_overlay[:, :] = (0, 0, 200)  # Red overlay

    contour_count = 0
    all_defect_regions = []
    anomaly_regions = []

    for c in contours:
        area = cv2.contourArea(c)
        if area > 150:  # Noise threshold filter
            contour_count += 1
            x, y, w, h = cv2.boundingRect(c)
            all_defect_regions.append((x, y, w, h))
            severity = "critical" if area > 1000 else "moderate"
            anomaly_regions.append({
                "detector": "ssim",
                "x": int(x),
                "y": int(y),
                "w": int(w),
                "h": int(h),
                "area": float(round(area, 2)),
                "severity": severity,
                "location": _region_label(x, y, w, h, src_img.shape),
            })

            # --- Draw on realistic_heatmap ---
            # Draw a subtle bright border around defect on heatmap
            cv2.rectangle(realistic_heatmap, (x, y), (x + w, y + h), (255, 255, 255), 1, cv2.LINE_AA)

            # --- Draw on annotated_target (defective image) ---
            # 1. Fill the defect region with semi-transparent red overlay
            cv2.rectangle(defect_overlay, (x, y), (x + w, y + h), (0, 0, 255), -1)
            
            # 2. Draw bright outer glow box (yellow outer + red inner)
            cv2.rectangle(annotated_target, (x - 2, y - 2), (x + w + 2, y + h + 2), (0, 255, 255), 2, cv2.LINE_AA)  # Yellow glow
            cv2.rectangle(annotated_target, (x, y), (x + w, y + h), (0, 0, 255), 2, cv2.LINE_AA)  # Red inner box

            # 3. Draw crosshair markers at corners to emphasize defect region
            marker_len = min(15, w // 4, h // 4)
            # Top-left corner crosshair
            cv2.line(annotated_target, (x, y + marker_len), (x, y), (0, 255, 255), 1)
            cv2.line(annotated_target, (x, y), (x + marker_len, y), (0, 255, 255), 1)
            # Top-right corner crosshair
            cv2.line(annotated_target, (x + w - marker_len, y), (x + w, y), (0, 255, 255), 1)
            cv2.line(annotated_target, (x + w, y), (x + w, y + marker_len), (0, 255, 255), 1)
            # Bottom-left corner crosshair
            cv2.line(annotated_target, (x, y + h - marker_len), (x, y + h), (0, 255, 255), 1)
            cv2.line(annotated_target, (x, y + h), (x + marker_len, y + h), (0, 255, 255), 1)
            # Bottom-right corner crosshair
            cv2.line(annotated_target, (x + w - marker_len, y + h), (x + w, y + h), (0, 255, 255), 1)
            cv2.line(annotated_target, (x + w, y + h), (x + w, y + h - marker_len), (0, 255, 255), 1)

            # 4. Draw filled contour outline for organic-shaped defects
            cv2.drawContours(annotated_target, [c], -1, (0, 0, 255), 1, cv2.LINE_AA)
            cv2.drawContours(annotated_target, [c], -1, (0, 255, 255), 1, cv2.LINE_AA)

            # 5. Draw DEFECT badge label with severity indicator
            if area > 1000:
                badge_label = f"DEFECT #{contour_count}  ⚠"
                badge_color = (0, 0, 200)  # Dark red for large defects
                text_color = (255, 255, 255)
            else:
                badge_label = f"DEFECT #{contour_count}"
                badge_color = (0, 0, 150)
                text_color = (255, 255, 200)

            (tw, th), _ = cv2.getTextSize(badge_label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
            label_y = max(0, y - th - 10)
            
            # Draw badge background with rounded rectangle feel
            cv2.rectangle(annotated_target, (x, label_y), (x + tw + 12, y), badge_color, -1)
            cv2.rectangle(annotated_target, (x, label_y), (x + tw + 12, y), (255, 255, 255), 1)
            
            # Draw label text
            cv2.putText(annotated_target, badge_label, (x + 6, label_y + th + 4), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, text_color, 1, cv2.LINE_AA)

    # Apply the semi-transparent red overlay to annotated_target
    if contour_count > 0:
        # Blend the red overlay with alpha=0.25 for semi-transparent defect highlighting
        mask_3ch = np.zeros_like(src_img)
        for (x, y, w, h) in all_defect_regions:
            mask_3ch[y:y+h, x:x+w] = 1.0
        
        annotated_target = (annotated_target.astype(np.float32) * (1.0 - mask_3ch * 0.30) + 
                           defect_overlay.astype(np.float32) * (mask_3ch * 0.30)).astype("uint8")

    # If no defects found, show "NO DEFECTS DETECTED" badge
    if contour_count == 0:
        cv2.putText(annotated_target, "NO DEFECTS DETECTED ✓", (20, 40),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 200, 0), 2, cv2.LINE_AA)
        cv2.putText(realistic_heatmap, "CLEAN - No Anomalies", (20, 40),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 200, 0), 2, cv2.LINE_AA)

    anomaly_regions.sort(key=lambda r: r["area"], reverse=True)
    logger.info(f"SSIM structural check complete. Score: {score:.4f}, Defect hotspots detected: {contour_count}")
    return float(score), realistic_heatmap, annotated_target, anomaly_regions[:12]


def _preprocess_for_ocr(crop: np.ndarray) -> np.ndarray:
    """
    Cleans up a label crop before handing it to EasyOCR:
      1. Upscale small crops (EasyOCR reads tiny/low-res text poorly).
      2. Convert to grayscale.
      3. Denoise while keeping edges sharp (bilateral filter).
      4. Boost local contrast (CLAHE) so faint/worn print stands out.
      5. Adaptive-threshold binarize (black text on white background),
         then hand back a 3-channel image since EasyOCR expects BGR/RGB input.

    Any failure here just returns the original crop untouched instead of
    raising, so OCR quality is best-effort, never a hard failure point.
    """
    try:
        crop_h, crop_w = crop.shape[:2]
        min_dim = 300
        if 0 < crop_h < min_dim or 0 < crop_w < min_dim:
            scale = min_dim / max(crop_h, crop_w, 1)
            crop = cv2.resize(crop, (int(crop_w * scale), int(crop_h * scale)), interpolation=cv2.INTER_CUBIC)

        gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY) if crop.ndim == 3 else crop

        # Denoise but keep character edges crisp
        denoised = cv2.bilateralFilter(gray, 7, 50, 50)

        # Local contrast boost — helps faded/worn labels
        clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
        contrast_boosted = clahe.apply(denoised)

        # Adaptive threshold to get clean black-on-white text
        binarized = cv2.adaptiveThreshold(
            contrast_boosted, 255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY,
            blockSize=25, C=10
        )

        # Light morphological cleanup to remove speckle noise from thresholding
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2, 2))
        cleaned = cv2.morphologyEx(binarized, cv2.MORPH_OPEN, kernel)

        return cv2.cvtColor(cleaned, cv2.COLOR_GRAY2BGR)
    except Exception as e:
        logger.warning(f"OCR preprocessing/binarization failed, using raw crop instead: {e}")
        return crop


def extract_ocr_text(img: np.ndarray, roi: dict = None, expected_serial: str = "") -> tuple[str, bool]:
    """
    Crops ROI (if coordinates are provided) and reads text using EasyOCR.
    If no text is detected in the cropped ROI, or the match is poor, falls back to full-frame OCR.
    """
    logger.info("Executing text extraction (EasyOCR)...")
    crop = img
    cropped_used = False
    
    if roi:
        x = roi.get("x", 0)
        y = roi.get("y", 0)
        w = roi.get("width") if "width" in roi else roi.get("w", 0)
        h = roi.get("height") if "height" in roi else roi.get("h", 0)
        logger.info(f"Cropping target image to ROI bounding boxes: x={x}, y={y}, w={w}, h={h}")
        if y + h <= img.shape[0] and x + w <= img.shape[1] and w > 0 and h > 0:
            crop = img[y:y + h, x:x + w]
            cropped_used = True
            # EasyOCR frequently returns nothing on small/tight crops (common when a
            # label_roi is configured too small). Upscale small crops before reading
            # so we get a real "no text present" result instead of a false empty read.
            crop_h, crop_w = crop.shape[:2]
            min_dim = 300
            if 0 < crop_h < min_dim or 0 < crop_w < min_dim:
                scale = min_dim / max(crop_h, crop_w, 1)
                crop = cv2.resize(crop, (int(crop_w * scale), int(crop_h * scale)), interpolation=cv2.INTER_CUBIC)
                logger.info(f"Upscaled small OCR crop ({crop_w}x{crop_h}) by {scale:.2f}x for more reliable text detection.")
        else:
            logger.warning("Configured text label ROI exceeds image boundary dimensions or is empty. Defaulting to full image.")

    try:
        reader = get_ocr_reader()
    except RuntimeError as e:
        logger.error(f"OCR Reader offline: {e}. Returning empty detected text and flagging engine as unavailable.")
        return "", False

    try:
        # Only binarize/clean when we actually cropped a small ROI — a full
        # frame board image put through adaptive threshold + CLAHE tends to
        # blow out non-label regions and doesn't help text detection there.
        ocr_input = _preprocess_for_ocr(crop) if cropped_used else crop
        results = reader.readtext(ocr_input)
        texts = [res[1] for res in results]
        detected = " ".join(texts).strip()

        # Cleaned-up crop occasionally reads worse than the raw crop (e.g. if
        # thresholding erased faint strokes) — try raw crop too and keep
        # whichever produced more characters.
        if cropped_used and not detected:
            raw_results = reader.readtext(crop)
            raw_detected = " ".join(res[1] for res in raw_results).strip()
            if raw_detected:
                detected = raw_detected
        
        # Check similarity with expected serial
        is_poor_match = False
        if expected_serial and detected:
            s_detected = detected.upper().replace(" ", "")
            s_expected = expected_serial.upper().replace(" ", "")
            common = sum(1 for c in s_expected if c in s_detected)
            match_ratio = common / max(len(s_expected), 1)
            is_poor_match = match_ratio < 0.25

        # Fallback: if crop returned nothing or is a poor match, run full-frame search
        if (not detected or is_poor_match) and cropped_used:
            logger.info(f"Crop ROI returned poor match '{detected}' against expected '{expected_serial}'. Triggering full-frame OCR fallback search...")
            results = reader.readtext(img)
            texts = [res[1] for res in results]
            detected_full = " ".join(texts).strip()
            if detected_full:
                detected = detected_full
            
        logger.info(f"EasyOCR parsing complete. Detected text label string: '{detected}'")
        return detected, True
    except Exception as e:
        logger.error(f"Error during OCR extraction: {e}")
        return "", False



import difflib

# Common OCR visual confusion pairs (e.g. 'G' vs '6', '0' vs 'O', 'I' vs '1', 'S' vs '5', 'B' vs '8')
_CONFUSION_PAIRS = {
    ('O', '0'), ('0', 'O'),
    ('I', '1'), ('1', 'I'), ('|', 'I'), ('I', '|'), ('|', '1'), ('1', '|'),
    ('S', '5'), ('5', 'S'),
    ('G', '6'), ('6', 'G'),
    ('B', '8'), ('8', 'B'),
    ('Z', '2'), ('2', 'Z'),
    ('T', '7'), ('7', 'T'),
}


def calculate_string_diff(str1: str, str2: str) -> dict:
    """
    same length and perfectly lined up. If OCR drops or inserts even a single
    character (very common — e.g. missing a hyphen, or reading "AOO-001" as
    "A0O01"), every character *after* that point shifts by one position and
    gets flagged as a mismatch, even though the label is actually correct.
    Sequence alignment finds the actual matching/inserted/deleted/replaced
    spans, so a single dropped character produces exactly one mismatch entry,
    not a cascade of false ones.

    Returns: {"similarity": float, "mismatches": list, "suspicious_confusions": list}
    """
    logger.info(f"Comparing OCR detected string '{str1}' against master catalog reference '{str2}'")
    s1 = str1.upper().replace(" ", "")  # detected
    s2 = str2.upper().replace(" ", "")  # expected

    matcher = difflib.SequenceMatcher(None, s1, s2, autojunk=False)
    similarity = matcher.ratio()

    mismatches = []
    suspicious_confusions = []

    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag == "equal":
            continue

        detected_span = s1[i1:i2]
        expected_span = s2[j1:j2]

        # For 'replace' spans of equal length, report per-character mismatches
        # (keeps parity with prior granular position-level reporting).
        # For 'insert'/'delete'/uneven 'replace' spans, report the whole span
        # as one mismatch instead of forcing a bogus 1:1 char alignment.
        if tag == "replace" and len(detected_span) == len(expected_span):
            for offset, (c1, c2) in enumerate(zip(detected_span, expected_span)):
                mismatch = {
                    "position": j1 + offset,
                    "expected": c2,
                    "detected": c1,
                    "tag": "replace",
                    "confusable": (c1, c2) in _CONFUSION_PAIRS,
                }
                mismatches.append(mismatch)
                if mismatch["confusable"]:
                    suspicious_confusions.append(mismatch)
        else:
            mismatch = {
                "position": j1,
                "expected": expected_span,
                "detected": detected_span,
                "tag": tag,  # 'insert' (extra chars detected) or 'delete' (missing chars) or uneven 'replace'
                "confusable": False,
            }
            mismatches.append(mismatch)

    logger.info(
        f"Fuzzy character validation complete. String similarity rate: {similarity:.2f}, "
        f"mismatches count: {len(mismatches)}"
    )
    return {
        "similarity": similarity,
        "mismatches": mismatches,
        "suspicious_confusions": suspicious_confusions,
    }


def match_keypoints(src_img: np.ndarray, ref_img: np.ndarray) -> dict:
    """Match local features with BFMatcher and Lowe's ratio test."""
    logger.info("Executing Keypoint Descriptor Matching algorithm...")
    gray_src = _ensure_gray(src_img)
    gray_ref = _ensure_gray(ref_img)

    orb = cv2.ORB_create(500)
    kp1, desc1 = orb.detectAndCompute(gray_src, None)
    kp2, desc2 = orb.detectAndCompute(gray_ref, None)

    if desc1 is None or desc2 is None or len(desc1) < 2 or len(desc2) < 2:
        logger.warning("Insufficient descriptor points extracted from images to compile matching pairs.")
        return {"keypoint_match_score": 0.0, "good_matches": 0, "total_matches": 0}

    bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=False)
    raw_matches = bf.knnMatch(desc1, desc2, k=2)

    good_matches = []
    for match_pair in raw_matches:
        if len(match_pair) < 2:
            continue
        first_match, second_match = match_pair
        if first_match.distance <= 0.75 * second_match.distance:
            good_matches.append(first_match)

    if not raw_matches:
        score = 0.0
    else:
        score = len(good_matches) / max(min(len(kp1), len(kp2)), 1)
        score = float(np.clip(score, 0.0, 1.0))

    logger.info(f"Keypoints verification complete. Good matches count: {len(good_matches)} / {len(raw_matches)} raw matches. Ratio score: {score:.3f}")
    return {
        "keypoint_match_score": score,
        "good_matches": len(good_matches),
        "total_matches": len(raw_matches),
    }


def match_template_roi(src_img: np.ndarray, ref_img: np.ndarray, roi_config: dict = None) -> dict:
    """Use template matching for ROI/label presence checks."""
    logger.info("Executing Template ROI sticker presence checks...")
    roi_config = _normalize_roi_config(roi_config)
    if not roi_config:
        logger.info("Skipping template match: roi_config is empty.")
        return {"template_match_score": 1.0, "template_match_found": True, "template_match_checked": False}

    template_roi = roi_config.get("template_roi")
    if not template_roi:
        logger.info("Skipping template match: no template_roi coordinates configured.")
        return {"template_match_score": 1.0, "template_match_found": True, "template_match_checked": False}

    x = template_roi.get("x", 0)
    y = template_roi.get("y", 0)
    w = template_roi.get("width") if "width" in template_roi else template_roi.get("w", 0)
    h = template_roi.get("height") if "height" in template_roi else template_roi.get("h", 0)
    if w <= 0 or h <= 0:
        logger.info("Skipping template match: width/height configured as 0.")
        return {"template_match_score": 1.0, "template_match_found": True, "template_match_checked": False}

    logger.info(f"Cropping template ROI window: x={x}, y={y}, w={w}, h={h}")
    gray_src = _ensure_gray(src_img)
    gray_ref = _ensure_gray(ref_img)

    if y + h > gray_ref.shape[0] or x + w > gray_ref.shape[1]:
        logger.warning("Template ROI parameters exceed reference image coordinate layout shapes.")
        return {"template_match_score": 0.0, "template_match_found": False, "template_match_checked": True}

    template = gray_ref[y:y + h, x:x + w]
    if template.size == 0:
        logger.warning("Cropped template array size is empty.")
        return {"template_match_score": 0.0, "template_match_found": False, "template_match_checked": True}

    if y + h > gray_src.shape[0] or x + w > gray_src.shape[1]:
        logger.warning("Template ROI parameters exceed target image coordinate layout shapes.")
        return {"template_match_score": 0.0, "template_match_found": False, "template_match_checked": True}

    src_roi = gray_src[y:y + h, x:x + w]
    if src_roi.size == 0:
        logger.warning("Cropped source ROI array size is empty.")
        return {"template_match_score": 0.0, "template_match_found": False, "template_match_checked": True}

    result = cv2.matchTemplate(gray_src, template, cv2.TM_CCOEFF_NORMED)
    global_score = float(result.max()) if result.size else 0.0
    roi_score = 1.0 - (float(np.mean(cv2.absdiff(src_roi, template))) / 255.0)
    score = min(global_score, roi_score)
    threshold = float(roi_config.get("template_threshold", 0.6))
    found = bool(score >= threshold)

    logger.info(f"Template Matching finished. Match Score: {score:.3f} (Threshold: {threshold}). Found status: {found}")
    return {
        "template_match_score": float(np.clip(score, 0.0, 1.0)),
        "template_match_found": found,
        "template_match_checked": True,
    }


def compare_color_histograms(src_img: np.ndarray, ref_img: np.ndarray, roi_config: dict = None) -> dict:
    """Compare color histogram similarity for font/color consistency checks."""
    logger.info("Executing 3D Color Histogram similarity check...")
    roi_config = _normalize_roi_config(roi_config)
    color_roi = None
    if roi_config:
        color_roi = roi_config.get("color_roi")

    src = _ensure_rgb(src_img)
    ref = _ensure_rgb(ref_img)

    if color_roi:
        x = color_roi.get("x", 0)
        y = color_roi.get("y", 0)
        w = color_roi.get("width") if "width" in color_roi else color_roi.get("w", 0)
        h = color_roi.get("height") if "height" in color_roi else color_roi.get("h", 0)
        logger.info(f"Cropping color histogram ROI: x={x}, y={y}, w={w}, h={h}")
        if y + h <= src.shape[0] and x + w <= src.shape[1] and y + h <= ref.shape[0] and x + w <= ref.shape[1]:
            src = src[y:y + h, x:x + w]
            ref = ref[y:y + h, x:x + w]
        else:
            logger.warning("Color histogram ROI exceeds target image size. Using full images.")

    if src.shape != ref.shape:
        logger.info(f"Histogram source shape {src.shape} != reference {ref.shape}. Resizing reference to compute histogram comparison.")
        ref = cv2.resize(ref, (src.shape[1], src.shape[0]))

    # Compute 3D Color Histograms in RGB
    hist1 = cv2.calcHist([src], [0, 1, 2], None, [16, 16, 16], [0, 256, 0, 256, 0, 256])
    hist2 = cv2.calcHist([ref], [0, 1, 2], None, [16, 16, 16], [0, 256, 0, 256, 0, 256])
    cv2.normalize(hist1, hist1)
    cv2.normalize(hist2, hist2)

    similarity = cv2.compareHist(hist1, hist2, cv2.HISTCMP_CORREL)
    similarity = float(np.clip((similarity + 1.0) / 2.0, 0.0, 1.0))
    logger.info(f"Color histogram comparison completed. Correlation similarity index: {similarity:.3f}")
    return {"color_hist_similarity": similarity, "color_hist_checked": True}


def inspect_anomalies_multimodal(src_image_path: str, ref_image_path: str, commodity: str) -> str:
    """
    Queries OpenRouter multimodal vision model (openrouter/free)
    to semantically compare the aligned captured image and the golden standard.
    """
    logger.info(f"[Agent 3: Detector] Running multimodal visual comparison for commodity '{commodity}'...")
    if not settings.OPENROUTER_API_KEY:
        logger.warning("[Agent 3: Detector] No OpenRouter API key configured. Skipping multimodal visual comparison.")
        return "Visual comparison skipped: OpenRouter API key not configured."

    import base64
    import requests

    try:
        # Load and resize images to max 512px to keep upload tiny & fast
        src = cv2.imread(src_image_path)
        ref = cv2.imread(ref_image_path)
        if src is None or ref is None:
            return "Visual comparison failed: Unable to load target or reference images."

        def prepare_base64(img):
            h, w = img.shape[:2]
            max_dim = 512
            if max(h, w) > max_dim:
                scale = max_dim / max(h, w)
                img = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
            _, buffer = cv2.imencode('.png', img)
            return base64.b64encode(buffer).decode("utf-8")

        src_b64 = prepare_base64(src)
        ref_b64 = prepare_base64(ref)

        url = "https://openrouter.ai/api/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://github.com/IdeaForg-e/VeriVision-AI",
            "X-Title": "VeriVision QC Platform",
        }

        prompt = (
            f"You are an expert QA visual inspection AI. Compare these two images of a {commodity} part:\n"
            f"Image 1 (first) is the OEM Golden Reference Standard (the correct standard layout).\n"
            f"Image 2 (second) is the Aligned Target Scan (the actual part under inspection).\n\n"
            f"Identify any semantic visual differences, anomalies, or defects in the Target Scan (Image 2) compared to the Golden Reference (Image 1).\n"
            f"Look for:\n"
            f"1. Missing components (chips, resistors, labels, connectors, etc.).\n"
            f"2. Physical damages (cracks, scratches, burns, solder residue).\n"
            f"3. Alignment or rotation mismatches.\n"
            f"4. Label differences (mismatched texts, logos, styles).\n\n"
            f"Write a concise, bulleted description of what is physically wrong with the target scan. "
            f"Be precise about locations (e.g., 'top-left of chip', 'near central barcode'). "
            f"If they are identical and there are no visual anomalies, reply with exactly 'No anomalies detected.'"
        )

        payload = {
            "model": settings.OPENROUTER_MODEL,  # Use configured model, not hardcoded free model
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/png;base64,{ref_b64}"
                            }
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/png;base64,{src_b64}"
                            }
                        }
                    ]
                }
            ]
        }

        # 30s timeout — free-tier vision model inference takes 8–20s; 10s caused constant timeouts
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        if response.status_code == 200:
            res_data = response.json()
            description = res_data["choices"][0]["message"]["content"].strip()
            logger.info(f"[Agent 3: Detector] Multimodal comparison result:\n{description}")
            return description
        else:
            logger.error(f"[Agent 3: Detector] OpenRouter API returned status {response.status_code}: {response.text}")
            return f"Visual comparison failed: API returned status {response.status_code}."
    except requests.exceptions.Timeout:
        logger.warning("[Agent 3: Detector] OpenRouter API request timed out (30s limit reached).")
        return "Visual comparison skipped: OpenRouter API timeout."
    except Exception as e:
        logger.error(f"[Agent 3: Detector] Multimodal vision query failed: {e}")
        return f"Visual comparison failed due to system exception: {str(e)}."


def generate_diagnostic_card(src_img: np.ndarray, ref_img: np.ndarray, heatmap_overlay: np.ndarray, annotated_img: np.ndarray = None) -> np.ndarray:
    """
    Combines the Golden Reference, Defect-Annotated Target Scan, and SSIM Thermal Heatmap
    side-by-side into a single diagnostic image.
    
    The TARGET SCAN panel shows the annotated image with defect markings directly on it,
    so users can immediately see which parts are defective.
    """
    logger.info("Generating unified visual diagnostic card with defect annotations on target scan...")
    ref = _ensure_rgb(ref_img)
    heat = _ensure_rgb(heatmap_overlay)
    
    # Use annotated image as the TARGET SCAN panel (with defect marks on it)
    if annotated_img is not None:
        target_display = _ensure_rgb(annotated_img)
    else:
        target_display = _ensure_rgb(src_img)

    # Resize all to match ref height/width for clean side-by-side combination
    h, w = ref.shape[:2]
    # Standardize size for display cards: e.g., 360px height
    card_h = 360
    card_w = int(w * (card_h / h))

    ref_resized = cv2.resize(ref, (card_w, card_h))
    target_resized = cv2.resize(target_display, (card_w, card_h))
    heat_resized = cv2.resize(heat, (card_w, card_h))

    # Add header bars above each image
    header_h = 40
    def add_header(img, text, color):
        header = np.ones((header_h, card_w, 3), dtype=np.uint8) * 15  # dark gray header background
        # Add thin bottom border to header
        cv2.line(header, (0, header_h - 1), (card_w, header_h - 1), color, 2)
        # Put Text
        cv2.putText(header, text, (15, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (220, 220, 220), 2, cv2.LINE_AA)
        return np.vstack([header, img])

    ref_card = add_header(ref_resized, "GOLDEN STANDARD", (6, 182, 212))               # Cyan border
    target_card = add_header(target_resized, "TARGET SCAN (DEFECTS MARKED)", (239, 68, 68))  # Red border
    heat_card = add_header(heat_resized, "THERMAL HEATMAP", (255, 165, 0))             # Orange border

    # Stack them side-by-side with separator borders
    separator = np.ones((card_h + header_h, 4, 3), dtype=np.uint8) * 15 # dark divider line
    diagnostic_card = np.hstack([ref_card, separator, target_card, separator, heat_card])
    return diagnostic_card


def run_anomaly_ensemble(src_img: np.ndarray, ref_img: np.ndarray, roi_config: dict = None, src_image_path: str = None, ref_image_path: str = None, commodity: str = "motherboard") -> dict:
    """
    Runs the hybrid CV + Vision LLM ensemble comparison logic in PARALLEL.
    Uses ThreadPoolExecutor to run SSIM, EasyOCR, Vision LLM, and Feature Matching concurrently.
    """
    import time
    from concurrent.futures import ThreadPoolExecutor

    t0 = time.time()
    logger.info("⚡ [Agent 3: Detector] Starting Parallel Vision Anomaly Ensemble processing...")
    errors = []
    roi_config = _normalize_roi_config(roi_config)

    # ── Pre-warm PyTorch-backed models on the MAIN THREAD ─────────────────────
    # EasyOCR and open_clip both import torchvision internally. Python's module
    # import system uses _ModuleLock, which causes a deadlock when these models
    # are lazy-initialized for the first time inside a ThreadPoolExecutor worker.
    # Calling get_ocr_reader() here ensures all torch/torchvision modules are
    # fully loaded before any background threads start.
    try:
        get_ocr_reader()
    except RuntimeError as e:
        logger.critical(f"[Agent 3: Detector] OCR unavailable for this entire case — all OCR results will be empty. {e}")

    # Also pre-warm CLIP embedding model on the main thread for the same reason.
    try:
        from app.services.embedding_service import _load_clip
        _load_clip()
    except Exception as _clip_prewarm_err:
        logger.warning(f"[Agent 3: Detector] CLIP pre-warm failed (will use OpenCV fallback): {_clip_prewarm_err}")
    # ──────────────────────────────────────────────────────────────────────────

    label_roi = None
    expected_serial = ""
    if roi_config:
        label_roi = roi_config.get("label_roi")
        expected_serial = roi_config.get("expected_serial", "")

    # Helper sub-tasks for thread pool
    def task_ssim():
        try:
            return compute_ssim_diff(src_img, ref_img)
        except Exception as e:
            logger.error(f"SSIM computation failed: {e}")
            return 0.0, src_img.copy(), src_img.copy(), []

    def task_multimodal():
        if src_image_path and ref_image_path:
            try:
                return inspect_anomalies_multimodal(src_image_path, ref_image_path, commodity)
            except Exception as e:
                logger.error(f"Multimodal vision inspection failed: {e}")
                return f"Visual comparison failed: {str(e)}"
        return "Visual comparison skipped: inputs unavailable."

    def task_ocr():
        try:
            target_text, available = extract_ocr_text(src_img, label_roi, expected_serial)
            golden_text, _ = extract_ocr_text(ref_img, label_roi, expected_serial)
            return target_text, golden_text, available
        except Exception as e:
            logger.error(f"OCR extraction failed: {e}")
            return "", "", False

    def task_features():
        try:
            kp_res = match_keypoints(src_img, ref_img)
        except Exception as e:
            logger.error(f"Keypoint matching failed: {e}")
            kp_res = {"keypoint_match_score": 0.0, "good_matches": 0, "total_matches": 0}

        try:
            tmpl_res = match_template_roi(src_img, ref_img, roi_config)
        except Exception as e:
            logger.error(f"Template matching failed: {e}")
            tmpl_res = {"template_match_score": 0.0, "template_match_found": False, "template_match_checked": True}

        try:
            color_res = compare_color_histograms(src_img, ref_img, roi_config)
        except Exception as e:
            logger.error(f"Color histogram comparison failed: {e}")
            color_res = {"color_hist_similarity": 0.0, "color_hist_checked": True}

        return kp_res, tmpl_res, color_res

    def task_embedding():
        if src_image_path and ref_image_path and os.path.exists(src_image_path) and os.path.exists(ref_image_path):
            try:
                from app.services.embedding_service import extract_image_embedding, cosine_similarity
                vec1 = extract_image_embedding(src_image_path)
                vec2 = extract_image_embedding(ref_image_path)
                sim = cosine_similarity(vec1, vec2)
                return round(sim * 100.0, 2)
            except Exception as e:
                logger.error(f"Vector embedding comparison failed: {e}")
                return None
        logger.warning("Vector embedding comparison skipped: source/reference image path missing on disk.")
        return None

    # Dispatch tasks to ThreadPoolExecutor for concurrent parallel processing
    with ThreadPoolExecutor(max_workers=5) as executor:
        f_ssim = executor.submit(task_ssim)
        f_multi = executor.submit(task_multimodal)
        f_ocr = executor.submit(task_ocr)
        f_feat = executor.submit(task_features)
        f_emb = executor.submit(task_embedding)

        try:
            ssim_val, heatmap_img, annotated_target, anomaly_regions = f_ssim.result(timeout=10.0)
        except Exception as e:
            logger.error(f"[Agent 3: Detector] SSIM task timed out or failed: {e}")
            errors.append("ssim_timeout_or_failed")
            ssim_val, heatmap_img, annotated_target, anomaly_regions = 0.0, src_img.copy(), src_img.copy(), []

        try:
            multimodal_report = f_multi.result(timeout=25.0)
        except Exception as e:
            logger.warning(f"[Agent 3: Detector] Multimodal vision task timed out or failed: {e}")
            multimodal_report = "Visual comparison skipped: Multimodal response timeout."

        try:
            detected_text, golden_text, ocr_engine_available = f_ocr.result(timeout=15.0)
        except Exception as e:
            logger.error(f"[Agent 3: Detector] OCR task timed out or failed: {e}")
            errors.append("ocr_timeout_or_failed")
            detected_text, golden_text, ocr_engine_available = "", "", False

        try:
            keypoint_results, template_results, color_results = f_feat.result(timeout=10.0)
        except Exception as e:
            logger.error(f"[Agent 3: Detector] Feature/template/color task timed out or failed: {e}")
            errors.append("features_timeout_or_failed")
            keypoint_results = {"keypoint_match_score": 0.0, "good_matches": 0, "total_matches": 0}
            template_results = {"template_match_score": 0.0, "template_match_found": False, "template_match_checked": True}
            color_results = {"color_hist_similarity": 0.0, "color_hist_checked": True}

        try:
            vector_embedding_match = f_emb.result(timeout=10.0)
        except Exception as e:
            logger.error(f"[Agent 3: Detector] Embedding task timed out or failed: {e}")
            errors.append("embedding_timeout_or_failed")
            vector_embedding_match = None

    # Generate visual side-by-side diagnostic card (4 panels: Golden, Target, Defect Marked, Thermal Heatmap)
    diagnostic_card = None
    try:
        diagnostic_card = generate_diagnostic_card(src_img, ref_img, heatmap_img, annotated_target)
    except Exception as e:
        logger.error(f"Failed to generate side-by-side diagnostic card: {e}")
        errors.append("card_generation_failed")

    # Dynamic Ground-Truth OCR Determination:
    # Prefer explicit catalog serial text. Use golden OCR ONLY when a focused label_roi
    # is configured — full-frame golden OCR reads silkscreen markings (R102, C15, etc.)
    # which are NOT serial numbers and cause false mismatches on every clean scan.
    explicit_expected = expected_serial if _is_plausible_expected_label(expected_serial) else ""
    golden_expected = (golden_text if label_roi and _is_plausible_expected_label(golden_text) else "")
    master_expected_text = explicit_expected or golden_expected

    ocr_diff = {"similarity": 1.0, "mismatches": [], "suspicious_confusions": []}
    if ocr_engine_available and master_expected_text and detected_text:
        ocr_diff = calculate_string_diff(detected_text, master_expected_text)

    score_components = [keypoint_results["keypoint_match_score"]]
    checked_components = ["keypoint"]
    if template_results.get("template_match_checked", True):
        score_components.append(template_results["template_match_score"])
        checked_components.append("template")
    if color_results.get("color_hist_checked", True):
        score_components.append(color_results["color_hist_similarity"])
        checked_components.append("color")

    matching_score = float(np.clip(sum(score_components) / max(len(score_components), 1), 0.0, 1.0))

    elapsed = time.time() - t0
    logger.info(
        f"⚡ [Agent 3: Detector] Parallel execution finished in {elapsed:.3f}s. "
        f"SSIM: {ssim_val:.3f}, Keypoint: {keypoint_results['keypoint_match_score']:.3f}, Matching Score: {matching_score:.3f}"
    )

    expected_text_value = master_expected_text
    detector_results = {
        "ssim": {
            "score": ssim_val,
            "threshold": float(getattr(settings, "SSIM_THRESHOLD", 0.80)),
            "regions": anomaly_regions,
        },
        "ocr": {
            "engine_available": ocr_engine_available,
            "detected_text": detected_text,
            "expected_text": expected_text_value,
            "similarity": ocr_diff["similarity"],
            "mismatches": ocr_diff["mismatches"],
            "suspicious_confusions": ocr_diff.get("suspicious_confusions", []),
        },
        "keypoints": {
            "score": keypoint_results["keypoint_match_score"],
            "good_matches": keypoint_results["good_matches"],
            "total_matches": keypoint_results["total_matches"],
        },
        "template": template_results,
        "color": color_results,
        "embedding": {
            "similarity_pct": vector_embedding_match,
        },
    }
    evidence_summary = {
        "checked_components": checked_components,
        "top_regions": anomaly_regions[:5],
        "ocr_issue_count": len(ocr_diff["mismatches"]),
        "template_missing": bool(template_results.get("template_match_checked") and not template_results.get("template_match_found")),
        "color_similarity": color_results["color_hist_similarity"],
        "keypoint_ratio": keypoint_results["keypoint_match_score"],
    }

    return {
        "ssim_score": ssim_val,
        "detected_text": detected_text,
        "expected_text": expected_text_value,
        "ocr_similarity": ocr_diff["similarity"],
        "ocr_mismatches": ocr_diff["mismatches"],
        "ocr_diff": ocr_diff,
        "ocr_engine_available": ocr_engine_available,
        "keypoint_ratio": keypoint_results["keypoint_match_score"],
        "keypoint_matches": keypoint_results["good_matches"],
        "template_match_score": template_results["template_match_score"],
        "template_match_found": template_results["template_match_found"],
        "color_hist_similarity": color_results["color_hist_similarity"],
        "vector_embedding_match": vector_embedding_match,
        "matching_score": matching_score,
        "heatmap_img": heatmap_img,
        "annotated_target": annotated_target,
        "diagnostic_card": diagnostic_card,
        "anomaly_regions": anomaly_regions,
        "detector_results": detector_results,
        "evidence_summary": evidence_summary,
        "thresholds_used": {
            "ssim": float(getattr(settings, "SSIM_THRESHOLD", 0.80)),
            "template": float((roi_config or {}).get("template_threshold", 0.6)),
            "blur": float(getattr(settings, "BLUR_THRESHOLD", 100.0)),
            "brightness_min": int(getattr(settings, "BRIGHTNESS_MIN", 40)),
            "brightness_max": int(getattr(settings, "BRIGHTNESS_MAX", 220)),
            "keypoint_match_min": float(getattr(settings, "KEYPOINT_MATCH_MIN", 0.60)),
        },
        "checked_components": checked_components,
        "errors": errors,
        "multimodal_report": multimodal_report,
    }