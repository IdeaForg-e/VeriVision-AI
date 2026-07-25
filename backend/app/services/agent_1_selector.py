import logging
import base64
import cv2
import os
import requests
from app.config import settings

logger = logging.getLogger(__name__)

VALID_COMMODITIES = {
    "motherboard", "label", "microchip", "processor", "ram",
    "storage", "gpu", "battery", "display", "chassis", "fan", "sensor", "other"
}

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
# Fixed: gemini-2.0-flash-exp:free returned 404 (no image input support on
# that endpoint). Use the paid Gemini 2.5 Flash multimodal endpoint.
VISION_MODEL = "google/gemini-2.5-flash"


def _call_gemini_vision(base64_image: str, prompt_text: str, max_tokens: int = 20) -> str | None:
    """
    Single shared client for all OpenRouter/Gemini vision calls in this module.
    temperature=0 for deterministic classification output.
    Returns raw text content, or None on any failure.
    """
    if not settings.OPENROUTER_API_KEY:
        return None

    headers = {
        "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/IdeaForg-e/VeriVision-AI",
        "X-Title": "VeriVision QC Platform",
    }
    payload = {
        "model": VISION_MODEL,
        "temperature": 0,
        "max_tokens": max_tokens,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt_text},
                    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{base64_image}"}},
                ],
            }
        ],
    }

    try:
        response = requests.post(OPENROUTER_URL, json=payload, headers=headers, timeout=8)
    except Exception as e:
        logger.error(f"[Agent 1: Selector] Gemini vision request raised an exception: {e}")
        return None

    if response.status_code != 200:
        logger.warning(f"[Agent 1: Selector] Gemini vision API returned status {response.status_code}: {response.text}")
        return None

    try:
        return response.json()["choices"][0]["message"]["content"].strip()
    except (KeyError, IndexError, ValueError) as e:
        logger.error(f"[Agent 1: Selector] Malformed Gemini vision response: {e}")
        return None


def _encode_image_b64(image_path: str, max_dim: int = 300) -> str | None:
    img = cv2.imread(image_path)
    if img is None:
        return None
    h, w = img.shape[:2]
    if max(h, w) > max_dim:
        scale = max_dim / max(h, w)
        img = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
    _, buffer = cv2.imencode(".png", img)
    return base64.b64encode(buffer).decode("utf-8")


def verify_comparison_viability(src_image_path: str, ref_image_path: str) -> dict:
    """
    Agent 1: Gatekeeper.
    Checks: file integrity, aspect ratio, resolution scale, keypoint layout agreement.
    """
    logger.info(f"[Agent 1: Selector] Verifying comparison viability between: {src_image_path} and {ref_image_path}")

    if not os.path.exists(src_image_path):
        return {"viable": False, "detail": "Target captured scan image file is missing on disk."}
    if not os.path.exists(ref_image_path):
        return {"viable": False, "detail": "Golden reference standard image file is missing on disk."}

    src = cv2.imread(src_image_path)
    ref = cv2.imread(ref_image_path)

    if src is None:
        return {"viable": False, "detail": "Unable to read captured target scan image."}
    if ref is None:
        return {"viable": False, "detail": "Unable to read golden reference standard image."}

    gray_src = cv2.cvtColor(src, cv2.COLOR_BGR2GRAY)
    gray_ref = cv2.cvtColor(ref, cv2.COLOR_BGR2GRAY)
    orb = cv2.ORB_create(nfeatures=500)
    kp_src, des_src = orb.detectAndCompute(gray_src, None)
    kp_ref, des_ref = orb.detectAndCompute(gray_ref, None)

    layout_warning = ""
    if des_src is not None and des_ref is not None:
        bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
        try:
            matches = bf.match(des_src, des_ref)
            good_matches = [m for m in matches if m.distance < 50]
            if len(good_matches) < 3:
                logger.info("[Agent 1: Selector] Low ORB keypoint match agreement (likely severe structural defect/burn). Proceeding with AI anomaly ensemble.")
                layout_warning = "Low visual keypoint agreement; this may indicate a wrong reference or severe structural anomaly."
        except Exception as match_err:
            logger.error(f"[Agent 1: Selector] Keypoint matching failed during viability check: {match_err}")
            layout_warning = "Unable to complete layout keypoint agreement check."
    else:
        layout_warning = "Unable to extract enough visual keypoints for reference agreement check."

    h_ref, w_ref = ref.shape[:2]
    h_src, w_src = src.shape[:2]
    ar_ref = w_ref / max(h_ref, 1)
    ar_src = w_src / max(h_src, 1)

    logger.info(f"[Agent 1: Selector] Aspect Ratios - Golden: {ar_ref:.2f}, Captured: {ar_src:.2f}")
    if abs(ar_ref - ar_src) > 0.4:
        logger.info("[Agent 1: Selector] Aspect ratio mismatch detected. Bypassing pixel alignment.")
        return {
            "viable": True,
            "warning": True,
            "detail": f"Aspect ratio mismatch detected (Golden: {ar_ref:.2f}, Captured: {ar_src:.2f}). Bypassing pixel alignment for semantic AI comparison."
        }

    w_ratio = w_src / max(w_ref, 1)
    h_ratio = h_src / max(h_ref, 1)

    logger.info(f"[Agent 1: Selector] Dimension Ratios - Width: {w_ratio:.2f}, Height: {h_ratio:.2f}")
    if w_ratio < 0.25 or w_ratio > 4.0 or h_ratio < 0.25 or h_ratio > 4.0:
        logger.info("[Agent 1: Selector] Resolution scale mismatch detected. Bypassing pixel alignment.")
        return {
            "viable": True,
            "warning": True,
            "detail": f"Resolution scale difference detected (Captured: {w_src}x{h_src}, Golden: {w_ref}x{h_ref}). Bypassing pixel alignment for semantic AI comparison."
        }

    logger.info("[Agent 1: Selector] Images verified as viable for standard pixel comparison.")
    return {"viable": True, "warning": bool(layout_warning), "detail": layout_warning}


def classify_part_commodity(image_path: str) -> str:
    """
    Agent 1: Classifier. Uses Gemini 2.5 Flash multimodal via OpenRouter.
    Falls back to local OCR-based heuristics if API key missing or call fails.
    """
    logger.info(f"[Agent 1: Selector] Classifying commodity for golden reference image: {image_path}")

    base64_image = _encode_image_b64(image_path)
    if base64_image is None:
        logger.error("[Agent 1: Selector] Could not read/encode image for classification. Skipping vision call.")
    else:
        prompt = (
            "Classify this manufacturing part image. Options: 'motherboard', 'label', 'microchip', "
            "'processor', 'ram', 'storage', 'gpu', 'battery', 'display', 'chassis', 'fan', 'sensor', 'other'. "
            "Return exactly one word from the options."
        )
        raw = _call_gemini_vision(base64_image, prompt)
        if raw:
            detected = "".join(c for c in raw.strip().lower() if c.isalnum() or c == "-")
            logger.info(f"[Agent 1: Selector] Gemini classification returned: '{detected}'")
            if detected in VALID_COMMODITIES:
                return detected
            logger.warning(f"[Agent 1: Selector] Gemini returned invalid commodity type: '{detected}'")

<<<<<<< HEAD
    # 1. Try OpenRouter Multimodal Vision classification
    if settings.OPENROUTER_API_KEY:
        import base64
        import requests
        import cv2
        try:
            # Read and downscale image to max 300px to ensure tiny payload size and super fast upload/inference latency
            img = cv2.imread(image_path)
            if img is None:
                raise ValueError("Could not read image for base64 encoding")
            
            h, w = img.shape[:2]
            max_dim = 300
            if max(h, w) > max_dim:
                scale = max_dim / max(h, w)
                img_resized = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
            else:
                img_resized = img
                
            _, buffer = cv2.imencode('.png', img_resized)
            base64_image = base64.b64encode(buffer).decode("utf-8")

            url = "https://openrouter.ai/api/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://github.com/IdeaForg-e/VeriVision-AI",
                "X-Title": "VeriVision QC Platform",
            }
            models_to_try = [settings.OPENROUTER_MODEL] + [m for m in getattr(settings, "FALLBACK_VISION_MODELS", []) if m != settings.OPENROUTER_MODEL]
            response = None
            for model_name in models_to_try:
                payload = {
                    "model": model_name,
                    "messages": [
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "text",
                                    "text": "Classify this manufacturing part image. Options: 'motherboard', 'label', 'microchip', 'processor', 'ram', 'storage', 'gpu', 'battery', 'display', 'chassis', 'fan', 'sensor', 'other'. Return exactly one word from the options."
                                },
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:image/png;base64,{base64_image}"
                                    }
                                }
                            ]
                        }
                    ]
                }
                try:
                    res = requests.post(url, json=payload, headers=headers, timeout=8)
                    if res.status_code == 200:
                        response = res
                        break
                    else:
                        logger.warning(f"[Agent 1: Selector] OpenRouter model '{model_name}' returned status {res.status_code}. Trying fallback...")
                except Exception as model_err:
                    logger.warning(f"[Agent 1: Selector] OpenRouter model '{model_name}' failed: {model_err}. Trying fallback...")

            if response and response.status_code == 200:
                res_data = response.json()
                detected = res_data["choices"][0]["message"]["content"].strip().lower()
                # Clean up any surrounding quotes or punctuation
                detected = "".join([c for c in detected if c.isalnum() or c == "-"])
                logger.info(f"[Agent 1: Selector] OpenRouter multimodal classification returned: '{detected}'")
                if detected in VALID_COMMODITIES:
                    return detected
                else:
                    logger.warning(f"[Agent 1: Selector] OpenRouter returned invalid commodity type: '{detected}'")
            else:
                logger.warning(f"[Agent 1: Selector] OpenRouter classifier API returned status {response.status_code}: {response.text}")
        except Exception as e:
            logger.error(f"[Agent 1: Selector] OpenRouter multimodal classifier raised an exception: {e}")

    # 2. Local Fallback Heuristics (using OCR and keyword detection)
=======
    # Local fallback heuristics (OCR + keyword match)
>>>>>>> fae3d01 (changed the architecture)
    logger.info("[Agent 1: Selector] Running local fallback classifier heuristics...")
    try:
        img = cv2.imread(image_path)
        if img is not None:
            from app.services.agent_3_detector import extract_ocr_text
            text, _ = extract_ocr_text(img)
            text = text.lower()
            logger.info(f"[Agent 1: Selector] Local fallback classifier extracted text snippet: '{text[:80]}'")

            keyword_map = {
                "label": ["serial", "warranty", "void", "sticker", "seal"],
                "processor": ["intel", "amd", "core", "ryzen", "cpu"],
                "ram": ["ddr", "ram", "memory", "dimm"],
                "storage": ["ssd", "nvme", "sata", "hdd"],
                "microchip": ["chip", "ic", "microchip", "controller"],
            }
            for commodity, keywords in keyword_map.items():
                if any(k in text for k in keywords):
                    logger.info(f"[Agent 1: Selector] Local heuristic matched: {commodity}")
                    return commodity
    except Exception as e:
        logger.error(f"[Agent 1: Selector] Local fallback classifier failed: {e}")

    logger.warning(
        "[Agent 1: Selector] Could not confidently classify commodity type "
        "(AI classification and local OCR heuristics both failed/inconclusive). "
        "Returning 'other' instead of guessing, so downstream agents/UI can flag this for human review."
    )
    return "other"


def auto_select_golden_reference(uploaded_image_path: str, db) -> dict:
    """
    Agent 1 (Reference Selector):
    Auto-detects and retrieves the best matching OEM Golden Standard from the
    Reference Library using 512-dim visual vector embeddings & Cosine Similarity search.
    """
    logger.info(f"[Agent 1: Reference Selector] Auto-selecting Golden Reference for: {uploaded_image_path}")
    from app.services.embedding_service import search_reference_library

    search_res = search_reference_library(uploaded_image_path, db)
    if not search_res.get("matched"):
        logger.warning(f"[Agent 1: Reference Selector] Vector search failed: {search_res.get('detail')}")
        return search_res

    top_match = search_res["top_match"]
    logger.info(
        f"[Agent 1: Reference Selector] Successfully auto-paired uploaded scan with "
        f"'{top_match['part_number']}' ({top_match['name']}) at {top_match['similarity_score']}% confidence."
    )
    return search_res