import cv2
import numpy as np
import os
import logging
from skimage.metrics import structural_similarity as ssim
from app.config import settings

logger = logging.getLogger(__name__)

# Lazy initialize EasyOCR reader to save startup memory/time
_easyocr_reader = None


def get_ocr_reader():
    global _easyocr_reader
    if _easyocr_reader is None:
        logger.info("Initializing EasyOCR Engine on CPU mode...")
        try:
            import easyocr
            _easyocr_reader = easyocr.Reader(["en"], gpu=False)
            logger.info("EasyOCR Engine successfully initialized.")
        except Exception as e:
            logger.error(f"Warning: EasyOCR failed to initialize. Details: {e}")
            _easyocr_reader = None
    return _easyocr_reader


def _ensure_rgb(img: np.ndarray) -> np.ndarray:
    if img is None:
        raise ValueError("Image input cannot be None")
    if len(img.shape) == 2:
        return cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
    return img


def _ensure_gray(img: np.ndarray) -> np.ndarray:
    return cv2.cvtColor(_ensure_rgb(img), cv2.COLOR_BGR2GRAY)


def compute_ssim_diff(src_img: np.ndarray, ref_img: np.ndarray) -> tuple[float, np.ndarray]:
    """
    Computes SSIM between source and reference.
    Returns: (ssim_score, heatmap_overlay_image)
    """
    logger.info("Executing SSIM structural anomaly detector...")
    gray_src = _ensure_gray(src_img)
    gray_ref = _ensure_gray(ref_img)

    if gray_src.shape != gray_ref.shape:
        logger.info(f"Shape mismatch in SSIM inputs: {gray_src.shape} != {gray_ref.shape}. Resizing source to match reference.")
        gray_src = cv2.resize(gray_src, (gray_ref.shape[1], gray_ref.shape[0]))
        src_img = cv2.resize(src_img, (ref_img.shape[1], ref_img.shape[0]))

    # Compute SSIM
    score, diff = ssim(gray_ref, gray_src, full=True)

    # Normalize difference image
    diff = (diff + 1) * 127.5
    diff = diff.astype("uint8")

    # Threshold diff to isolate discrepancies
    _, thresh = cv2.threshold(diff, 100, 255, cv2.THRESH_BINARY_INV)
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    # Compile heatmap bounding overlays
    heatmap = src_img.copy()
    contour_count = 0
    for c in contours:
        area = cv2.contourArea(c)
        if area > 100:  # Noise threshold filter
            contour_count += 1
            x, y, w, h = cv2.boundingRect(c)
            cv2.rectangle(heatmap, (x, y), (x + w, y + h), (0, 0, 255), 2)
            roi = heatmap[y:y + h, x:x + w]
            red_mask = np.zeros_like(roi)
            red_mask[:, :] = [0, 0, 100]
            cv2.addWeighted(roi, 0.7, red_mask, 0.3, 0, roi)

    logger.info(f"SSIM structural check complete. Score: {score:.4f}, Detected anomalous hotspots: {contour_count}")
    return float(score), heatmap


def extract_ocr_text(img: np.ndarray, roi: dict = None) -> tuple[str, bool]:
    """
    Crops ROI (if coordinates are provided) and reads text using EasyOCR.
    roi: dict like {"x": 100, "y": 150, "width": 300, "height": 80}

    Returns: (detected_text, engine_available)
    engine_available is False when the OCR engine itself could not be
    initialized/used — this is DIFFERENT from "no text found on the part",
    and downstream agents need to be able to tell the two apart instead of
    silently receiving a fabricated placeholder string.
    """
    logger.info("Executing text extraction (EasyOCR)...")
    crop = img
    if roi:
        x = roi.get("x", 0)
        y = roi.get("y", 0)
        w = roi.get("width") if "width" in roi else roi.get("w", 0)
        h = roi.get("height") if "height" in roi else roi.get("h", 0)
        logger.info(f"Cropping target image to ROI bounding boxes: x={x}, y={y}, w={w}, h={h}")
        if y + h <= img.shape[0] and x + w <= img.shape[1]:
            crop = img[y:y + h, x:x + w]
        else:
            logger.warning("Configured text label ROI exceeds image boundary dimensions. Using uncropped image.")

    reader = get_ocr_reader()
    if reader is None:
        logger.error(
            "OCR Reader offline. Returning empty detected text and flagging engine as unavailable "
            "instead of a fabricated placeholder value — the decision agent must treat this as "
            "'unverifiable', not as evidence of a missing/mismatched label."
        )
        return "", False

    try:
        results = reader.readtext(crop)
        texts = [res[1] for res in results]
        detected = " ".join(texts).strip()
        logger.info(f"EasyOCR parsing complete. Detected text label string: '{detected}'")
        return detected, True
    except Exception as e:
        logger.error(f"Error during OCR extraction: {e}")
        return "", False


def calculate_string_diff(str1: str, str2: str) -> dict:
    """
    Calculates character-level differences and character similarity.
    Returns: {"similarity": float, "mismatches": list}
    """
    logger.info(f"Comparing OCR detected string '{str1}' against master catalog reference '{str2}'")
    s1 = str1.upper().replace(" ", "")
    s2 = str2.upper().replace(" ", "")

    mismatches = []
    max_len = max(len(s1), len(s2))
    s1_padded = s1.ljust(max_len)
    s2_padded = s2.ljust(max_len)

    matches = 0
    for idx in range(max_len):
        char1 = s1_padded[idx]
        char2 = s2_padded[idx]
        if char1 == char2:
            matches += 1
        else:
            mismatches.append({
                "position": idx,
                "expected": char2.strip(),
                "detected": char1.strip()
            })

    similarity = matches / max(max_len, 1)
    logger.info(f"Character validation complete. String similarity rate: {similarity:.2f}, mismatches count: {len(mismatches)}")
    return {
        "similarity": similarity,
        "mismatches": mismatches
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

    result = cv2.matchTemplate(gray_src, template, cv2.TM_CCOEFF_NORMED)
    score = float(result.max()) if result.size else 0.0
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


def run_anomaly_ensemble(src_img: np.ndarray, ref_img: np.ndarray, roi_config: dict = None) -> dict:
    """
    Runs the ensemble comparison logic.

    Each sub-check is isolated in its own try/except so one failing check
    (e.g. a crashed OCR call) degrades gracefully with a logged, flagged
    default instead of taking down the whole inspection request. All
    original output keys are preserved; only additive keys are introduced
    ("ocr_engine_available", "checked_components", "errors").
    """
    logger.info("Starting Vision Layer Anomaly Ensemble suite processing...")
    errors = []

    try:
        ssim_val, heatmap_img = compute_ssim_diff(src_img, ref_img)
    except Exception as e:
        logger.error(f"SSIM computation failed, defaulting to worst-case score: {e}")
        ssim_val, heatmap_img = 0.0, src_img.copy()
        errors.append("ssim_failed")

    label_roi = None
    expected_serial = ""
    if roi_config:
        label_roi = roi_config.get("label_roi")
        expected_serial = roi_config.get("expected_serial", "")

    try:
        detected_text, ocr_engine_available = extract_ocr_text(src_img, label_roi)
    except Exception as e:
        logger.error(f"OCR extraction raised unexpectedly: {e}")
        detected_text, ocr_engine_available = "", False
        errors.append("ocr_failed")

    ocr_diff = {"similarity": 1.0, "mismatches": []}
    if expected_serial and ocr_engine_available:
        ocr_diff = calculate_string_diff(detected_text, expected_serial)
    elif expected_serial and not ocr_engine_available:
        logger.warning("Skipping OCR string diff: OCR engine was unavailable, so detected text cannot be trusted.")

    try:
        keypoint_results = match_keypoints(src_img, ref_img)
    except Exception as e:
        logger.error(f"Keypoint matching failed, defaulting to worst-case score: {e}")
        keypoint_results = {"keypoint_match_score": 0.0, "good_matches": 0, "total_matches": 0}
        errors.append("keypoint_failed")

    try:
        template_results = match_template_roi(src_img, ref_img, roi_config)
    except Exception as e:
        logger.error(f"Template matching failed, defaulting to worst-case score: {e}")
        template_results = {"template_match_score": 0.0, "template_match_found": False, "template_match_checked": True}
        errors.append("template_failed")

    try:
        color_results = compare_color_histograms(src_img, ref_img, roi_config)
    except Exception as e:
        logger.error(f"Color histogram comparison failed, defaulting to worst-case score: {e}")
        color_results = {"color_hist_similarity": 0.0, "color_hist_checked": True}
        errors.append("color_failed")

    # Only average components that were actually meaningfully checked.
    # Previously, an un-configured template/color ROI silently contributed a
    # perfect 1.0 to the average, inflating the overall matching_score even
    # though nothing was really verified there.
    score_components = [keypoint_results["keypoint_match_score"]]
    checked_components = ["keypoint"]
    if template_results.get("template_match_checked", True):
        score_components.append(template_results["template_match_score"])
        checked_components.append("template")
    if color_results.get("color_hist_checked", True):
        score_components.append(color_results["color_hist_similarity"])
        checked_components.append("color")

    matching_score = float(np.clip(sum(score_components) / max(len(score_components), 1), 0.0, 1.0))

    logger.info(
        f"Ensemble summary metrics - SSIM: {ssim_val:.3f}, Keypoints Rate: {keypoint_results['keypoint_match_score']:.3f}, "
        f"Template score: {template_results['template_match_score']:.3f}, Color match: {color_results['color_hist_similarity']:.3f}, "
        f"Checked components: {checked_components}, Average Matching Score: {matching_score:.3f}, Errors: {errors or 'none'}"
    )

    return {
        "ssim_score": ssim_val,
        "detected_text": detected_text,
        "expected_text": expected_serial,
        "ocr_similarity": ocr_diff["similarity"],
        "ocr_mismatches": ocr_diff["mismatches"],
        "ocr_engine_available": ocr_engine_available,
        "keypoint_ratio": keypoint_results["keypoint_match_score"],
        "keypoint_matches": keypoint_results["good_matches"],
        "template_match_score": template_results["template_match_score"],
        "template_match_found": template_results["template_match_found"],
        "color_hist_similarity": color_results["color_hist_similarity"],
        "matching_score": matching_score,
        "heatmap_img": heatmap_img,
        "checked_components": checked_components,
        "errors": errors,
    }