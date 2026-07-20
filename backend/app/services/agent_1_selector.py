import logging
import cv2
import os
from app.config import settings

logger = logging.getLogger(__name__)

def verify_comparison_viability(src_image_path: str, ref_image_path: str) -> dict:
    """
    Agent 1: Gatekeeper.
    Verifies if the dynamically uploaded Golden Reference and Captured Scan
    are viable for a side-by-side computer vision comparison.
    
    Checks:
    1. Decodability and file integrity on disk.
    2. Aspect ratio orientation alignment (prevents mixing portrait and landscape).
    3. Resolution scale variations (prevents comparing a tiny thumbnail with a 4K image).
    """
    logger.info(f"[Agent 1: Selector] Verifying comparison viability between: {src_image_path} and {ref_image_path}")

    # 1. Read files
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

    # 2. Aspect Ratio Check
    h_ref, w_ref = ref.shape[:2]
    h_src, w_src = src.shape[:2]

    ar_ref = w_ref / max(h_ref, 1)
    ar_src = w_src / max(h_src, 1)

    logger.info(f"[Agent 1: Selector] Aspect Ratios - Golden: {ar_ref:.2f}, Captured: {ar_src:.2f}")
    if abs(ar_ref - ar_src) > 0.4:
        logger.info("[Agent 1: Selector] Aspect ratio mismatch detected. Bypassing pixel alignment.")
        return {
            "viable": True,
            "detail": f"Aspect ratio mismatch detected (Golden: {ar_ref:.2f}, Captured: {ar_src:.2f}). Bypassing pixel alignment for semantic AI comparison."
        }

    # 3. Resolution / Scale Check
    w_ratio = w_src / max(w_ref, 1)
    h_ratio = h_src / max(h_ref, 1)

    logger.info(f"[Agent 1: Selector] Dimension Ratios - Width: {w_ratio:.2f}, Height: {h_ratio:.2f}")
    if w_ratio < 0.25 or w_ratio > 4.0 or h_ratio < 0.25 or h_ratio > 4.0:
        logger.info("[Agent 1: Selector] Resolution scale mismatch detected. Bypassing pixel alignment.")
        return {
            "viable": True,
            "detail": f"Resolution scale difference detected (Captured: {w_src}x{h_src}, Golden: {w_ref}x{h_ref}). Bypassing pixel alignment for semantic AI comparison."
        }

    logger.info("[Agent 1: Selector] Images verified as viable for standard pixel comparison.")
    return {"viable": True, "detail": ""}


def classify_part_commodity(image_path: str) -> str:
    """
    Agent 1: Classifier.
    Classifies the manufacturing part commodity type based on the golden image.
    Uses OpenRouter multimodal Gemini model if API key is present.
    Otherwise, falls back to local OCR-based rule checks.
    """
    logger.info(f"[Agent 1: Selector] Classifying commodity for golden reference image: {image_path}")

    VALID_COMMODITIES = {
        "motherboard", "label", "microchip", "processor", "ram",
        "storage", "gpu", "battery", "display", "chassis", "fan", "sensor", "other"
    }

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
            # Use openrouter/free to access vision models on the free tier
            payload = {
                "model": "openrouter/free",
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

            response = requests.post(url, json=payload, headers=headers, timeout=8)


            if response.status_code == 200:
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
    logger.info("[Agent 1: Selector] Running local fallback classifier heuristics...")
    try:
        import cv2
        img = cv2.imread(image_path)
        if img is not None:
            from app.services.agent_3_detector import extract_ocr_text
            text, _ = extract_ocr_text(img)
            text = text.lower()
            logger.info(f"[Agent 1: Selector] Local fallback classifier extracted text snippet: '{text[:80]}'")
            
            if any(k in text for k in ["serial", "warranty", "void", "sticker", "seal"]):
                logger.info("[Agent 1: Selector] Local heuristic matched: label")
                return "label"
            if any(k in text for k in ["intel", "amd", "core", "ryzen", "cpu"]):
                logger.info("[Agent 1: Selector] Local heuristic matched: processor")
                return "processor"
            if any(k in text for k in ["ddr", "ram", "memory", "dimm"]):
                logger.info("[Agent 1: Selector] Local heuristic matched: ram")
                return "ram"
            if any(k in text for k in ["ssd", "nvme", "sata", "hdd"]):
                logger.info("[Agent 1: Selector] Local heuristic matched: storage")
                return "storage"
            if any(k in text for k in ["chip", "ic", "microchip", "controller"]):
                logger.info("[Agent 1: Selector] Local heuristic matched: microchip")
                return "microchip"
    except Exception as e:
        logger.error(f"[Agent 1: Selector] Local fallback classifier failed: {e}")

    logger.info("[Agent 1: Selector] Defaulting to commodity type: motherboard")
    return "motherboard"
