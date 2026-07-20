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
    logger.info("Executing SSIM structural anomaly detector with premium JET highlighting...")
    gray_src = _ensure_gray(src_img)
    gray_ref = _ensure_gray(ref_img)

    if gray_src.shape != gray_ref.shape:
        logger.info(f"Shape mismatch in SSIM inputs: {gray_src.shape} != {gray_ref.shape}. Resizing source to match reference.")
        gray_src = cv2.resize(gray_src, (gray_ref.shape[1], gray_ref.shape[0]))
        src_img = cv2.resize(src_img, (ref_img.shape[1], ref_img.shape[0]))

    # Compute SSIM
    score, diff = ssim(gray_ref, gray_src, full=True)

    # Normalize difference image: 255 is identical, 0 is completely different
    diff_u8 = ((diff + 1) * 127.5).astype("uint8")

    # Invert diff so that larger differences are brighter (closer to 255)
    inv_diff = 255 - diff_u8

    # Threshold diff: values below 100 in diff_u8 (meaning high difference) become 255 in thresh
    _, thresh = cv2.threshold(diff_u8, 100, 255, cv2.THRESH_BINARY_INV)

    # 1. Create a glowing colored JET heatmap background overlay
    # Blur the inverted difference to create a smooth, glowing thermal gradient
    blurred_diff = cv2.GaussianBlur(inv_diff, (21, 21), 0)
    color_heatmap = cv2.applyColorMap(blurred_diff, cv2.COLORMAP_JET)

    # Blend the color heatmap with the original image (65% original scan, 35% thermal heatmap)
    # This creates a high-tech glowing background representing difference density
    glowing_base = cv2.addWeighted(src_img, 0.65, color_heatmap, 0.35, 0)

    # 2. Group nearby small points (like pin connections) into unified contiguous regions
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (25, 25))
    dilated_mask = cv2.dilate(thresh, kernel, iterations=1)

    contours, _ = cv2.findContours(dilated_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    # 3. Compile premium shaded bounding overlays
    overlay = glowing_base.copy()
    contour_count = 0
    for c in contours:
        area = cv2.contourArea(c)
        if area > 150:  # Noise threshold filter
            contour_count += 1
            x, y, w, h = cv2.boundingRect(c)
            # Draw a filled red transparent box in the overlay mask
            cv2.rectangle(overlay, (x, y), (x + w, y + h), (0, 0, 230), -1)
            # Draw a thick neon-red border on the base
            cv2.rectangle(glowing_base, (x, y), (x + w, y + h), (0, 0, 255), 2)
            # Draw an outer dark border for maximum depth contrast
            cv2.rectangle(glowing_base, (x - 1, y - 1), (x + w + 1, y + h + 1), (0, 0, 50), 1)

    # Blend the filled transparent boxes overlay with the bordered glowing base
    # (75% bordered base, 25% transparent filled warning boxes)
    final_heatmap = cv2.addWeighted(overlay, 0.25, glowing_base, 0.75, 0)

    logger.info(f"SSIM structural check complete. Score: {score:.4f}, Grouped anomalous hotspots: {contour_count}")
    return float(score), final_heatmap


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
        else:
            logger.warning("Configured text label ROI exceeds image boundary dimensions or is empty. Defaulting to full image.")

    reader = get_ocr_reader()
    if reader is None:
        logger.error(
            "OCR Reader offline. Returning empty detected text and flagging engine as unavailable."
        )
        return "", False

    try:
        results = reader.readtext(crop)
        texts = [res[1] for res in results]
        detected = " ".join(texts).strip()
        
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
            "model": "openrouter/free",
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

        # Set 25s timeout for heavy vision model inference
        response = requests.post(url, json=payload, headers=headers, timeout=25)
        if response.status_code == 200:
            res_data = response.json()
            description = res_data["choices"][0]["message"]["content"].strip()
            logger.info(f"[Agent 3: Detector] Multimodal comparison result:\n{description}")
            return description
        else:
            logger.error(f"[Agent 3: Detector] OpenRouter API returned status {response.status_code}: {response.text}")
            return f"Visual comparison failed: API returned status {response.status_code}."
    except Exception as e:
        logger.error(f"[Agent 3: Detector] Multimodal vision query failed: {e}")
        return f"Visual comparison failed due to system exception: {str(e)}."


def generate_diagnostic_card(src_img: np.ndarray, ref_img: np.ndarray, heatmap_overlay: np.ndarray) -> np.ndarray:
    """
    Combines the Golden Reference, Aligned Target Scan, and SSIM delta heatmap side-by-side
    into a single image, complete with textual title headers.
    """
    logger.info("Generating unified visual diagnostic card...")
    src = _ensure_rgb(src_img)
    ref = _ensure_rgb(ref_img)
    heat = _ensure_rgb(heatmap_overlay)

    # Resize all to match ref height/width for clean side-by-side combination
    h, w = ref.shape[:2]
    # Standardize size for display cards: e.g., 360px height
    card_h = 360
    card_w = int(w * (card_h / h))

    src_resized = cv2.resize(src, (card_w, card_h))
    ref_resized = cv2.resize(ref, (card_w, card_h))
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

    ref_card = add_header(ref_resized, "GOLDEN STANDARD", (6, 182, 212))       # Cyan border
    src_card = add_header(src_resized, "INSPECTION TARGET", (59, 130, 246))    # Blue border
    heat_card = add_header(heat_resized, "ANOMALY HEATMAP", (239, 68, 68))      # Red border

    # Stack them side-by-side with separator borders
    separator = np.ones((card_h + header_h, 4, 3), dtype=np.uint8) * 15 # dark divider line
    diagnostic_card = np.hstack([ref_card, separator, src_card, separator, heat_card])
    return diagnostic_card


def run_anomaly_ensemble(src_img: np.ndarray, ref_img: np.ndarray, roi_config: dict = None, src_image_path: str = None, ref_image_path: str = None, commodity: str = "motherboard") -> dict:
    """
    Runs the hybrid CV + Vision LLM ensemble comparison logic.
    Generates a visual diagnostic card and extracts text/features.
    """
    logger.info("Starting Vision Layer Anomaly Ensemble suite processing...")
    errors = []

    # 1. Grayscale difference SSIM
    try:
        ssim_val, heatmap_img = compute_ssim_diff(src_img, ref_img)
    except Exception as e:
        logger.error(f"SSIM computation failed, defaulting to worst-case score: {e}")
        ssim_val, heatmap_img = 0.0, src_img.copy()
        errors.append("ssim_failed")

    # 2. Multimodal visual inspection semantic checks
    multimodal_report = "Visual comparison skipped: inputs unavailable."
    if src_image_path and ref_image_path:
        try:
            multimodal_report = inspect_anomalies_multimodal(src_image_path, ref_image_path, commodity)
        except Exception as e:
            logger.error(f"Multimodal vision inspection failed: {e}")
            multimodal_report = f"Visual comparison failed: {str(e)}"
            errors.append("multimodal_failed")

    # 3. Generate visual side-by-side diagnostic card
    diagnostic_card = None
    try:
        diagnostic_card = generate_diagnostic_card(src_img, ref_img, heatmap_img)
    except Exception as e:
        logger.error(f"Failed to generate side-by-side diagnostic card: {e}")
        errors.append("card_generation_failed")

    # 4. OCR check
    label_roi = None
    expected_serial = ""
    if roi_config:
        label_roi = roi_config.get("label_roi")
        expected_serial = roi_config.get("expected_serial", "")

    try:
        detected_text, ocr_engine_available = extract_ocr_text(src_img, label_roi, expected_serial)
    except Exception as e:
        logger.error(f"OCR extraction raised unexpectedly: {e}")
        detected_text, ocr_engine_available = "", False
        errors.append("ocr_failed")

    ocr_diff = {"similarity": 1.0, "mismatches": []}
    if expected_serial and ocr_engine_available:
        ocr_diff = calculate_string_diff(detected_text, expected_serial)
    elif expected_serial and not ocr_engine_available:
        logger.warning("Skipping OCR string diff: OCR engine was unavailable.")

    # 5. Local CV metrics
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
        f"Average Matching Score: {matching_score:.3f}, Errors: {errors or 'none'}"
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
        "diagnostic_card": diagnostic_card,
        "checked_components": checked_components,
        "errors": errors,
        "multimodal_report": multimodal_report,
    }