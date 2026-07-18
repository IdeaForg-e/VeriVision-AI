import os
import json
import requests
from app.config import settings

def clean_json_string(text: str) -> str:
    """Helper to clean markdown wrappers from LLM JSON responses."""
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()

def make_decision(ensemble_results: dict) -> dict:
    """
    Evaluates evidence from Vision Layer and computes the final verdict,
    fraud score (0-100), confidence level, and recommended action.
    
    Tries calling OpenRouter LLM first. On API/parsing failure or missing key,
    gracefully falls back to local weighted mathematical thresholds.
    """
    ssim = ensemble_results.get("ssim_score", 1.0)
    ocr_sim = ensemble_results.get("ocr_similarity", 1.0)
    ocr_mismatches = ensemble_results.get("ocr_mismatches", [])
    kp_ratio = ensemble_results.get("keypoint_ratio", 1.0)
    expected_text = ensemble_results.get("expected_text", "")
    detected_text = ensemble_results.get("detected_text", "")

    # ==========================================
    # 🧠 METHOD 1: Try OpenRouter LLM Compliance Judge
    # ==========================================
    openrouter_key = os.getenv("OPENROUTER_API_KEY")
    openrouter_model = os.getenv("OPENROUTER_MODEL", "nvidia/nemotron-3-ultra-550b-a55b:free")

    if openrouter_key:
        prompt = (
            f"You are the Compliance & Decision Agent for a visual manufacturing QC parts inspection system.\n"
            f"Analyze these vision inspection anomaly metrics and output a final decision:\n"
            f"- SSIM structural similarity score: {ssim:.3f} (1.0 is identical, lower means changes found)\n"
            f"- Keypoint match ratio: {kp_ratio:.2f} (1.0 is identical count, deviation indicates alterations)\n"
            f"- OCR Expected serial/label: '{expected_text}'\n"
            f"- OCR Detected serial/label: '{detected_text}'\n"
            f"- OCR Character Mismatches: {ocr_mismatches}\n"
            f"- OCR similarity rate: {ocr_sim:.2f} (1.0 is exact string match)\n\n"
            f"Follow these verdict categorization rules:\n"
            f"1. Verdict is 'missing' if expected label exists but detected text is empty.\n"
            f"2. Verdict is 'mismatched' if text contains character discrepancies. If minor leet-speak matches, recommend 'Request Vendor Verification'.\n"
            f"3. Verdict is 'tampered' if ssim < 0.65 or keypoint mismatch is very high.\n"
            f"4. Verdict is 'reused' if layout is mostly matching but contains scratches, wear, or slight ssim differences.\n"
            f"5. Verdict is 'clean' if everything matches.\n\n"
            f"Respond ONLY with a valid, parseable JSON object with no markdown fences, no reasoning text. Use this exact schema:\n"
            f"{{\n"
            f"  \"fraud_score\": <integer, 0 to 100 representing probability of fraud>,\n"
            f"  \"verdict\": \"<string, must be one of: clean, tampered, missing, mismatched, reused>\",\n"
            f"  \"confidence\": <float, 0.0 to 1.0 representing classification confidence>,\n"
            f"  \"recommended_action\": \"<string, must be one of: Accept, Quarantine & Escalate, Request Vendor Verification, Request Additional Angle>\"\n"
            f"}}"
        )

        try:
            url = "https://openrouter.ai/api/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {openrouter_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://github.com/IdeaForg-e/VeriVision-AI",
                "X-Title": "VeriVision QC Decision"
            }
            payload = {
                "model": openrouter_model,
                "messages": [
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.0  # Strict deterministic answers
            }
            response = requests.post(url, json=payload, headers=headers, timeout=10)
            if response.status_code == 200:
                res_data = response.json()
                raw_reply = res_data["choices"][0]["message"]["content"].strip()
                cleaned_reply = clean_json_string(raw_reply)
                decision_data = json.loads(cleaned_reply)
                
                # Basic validation of keys
                required_keys = ["fraud_score", "verdict", "confidence", "recommended_action"]
                if all(k in decision_data for k in required_keys):
                    # Ensure correct data types
                    return {
                        "fraud_score": int(decision_data["fraud_score"]),
                        "verdict": str(decision_data["verdict"]).lower(),
                        "confidence": float(decision_data["confidence"]),
                        "recommended_action": str(decision_data["recommended_action"])
                    }
        except Exception as e:
            print(f"Decision LLM Agent failed: {e}. Falling back to local rules...")

    # ==========================================
    # 🧮 METHOD 2: Local Rule-Based Fallback Matrix
    # ==========================================
    ssim_loss = max(0.0, 1.0 - ssim)
    ocr_loss = max(0.0, 1.0 - ocr_sim)
    kp_loss = abs(1.0 - kp_ratio)

    # Weights: SSIM = 50%, OCR = 30%, Keypoints = 20%
    weighted_score = (ssim_loss * 50) + (ocr_loss * 30) + (min(kp_loss, 1.0) * 20)
    fraud_score = int(min(max(weighted_score * 1.5, 0.0), 100.0))

    verdict = "clean"
    recommended_action = "Accept"
    confidence = 0.90

    if ssim_loss > 0.35:
        if kp_loss > 0.40:
            verdict = "tampered"
            recommended_action = "Quarantine & Escalate"
            confidence = 0.95
        else:
            verdict = "reused"
            recommended_action = "Request Vendor Verification"
            confidence = 0.85
    
    if expected_text and not detected_text.strip():
        verdict = "missing"
        recommended_action = "Quarantine & Escalate"
        confidence = 0.98
    elif len(ocr_mismatches) > 0:
        verdict = "mismatched"
        recommended_action = "Quarantine & Escalate"
        confidence = 0.95
        
        substitutions = {('O', '0'), ('0', 'O'), ('I', '1'), ('1', 'I'), ('S', '5'), ('5', 'S')}
        is_minor_leet = all(
            (m.get("detected"), m.get("expected")) in substitutions 
            for m in ocr_mismatches
        )
        if is_minor_leet:
            recommended_action = "Request Vendor Verification"
            confidence = 0.80

    if ssim < settings.SSIM_THRESHOLD and verdict == "clean":
        verdict = "clean"
        recommended_action = "Accept"
        confidence = 0.60

    if 40 <= fraud_score <= 70:
        confidence = 0.45

    return {
        "fraud_score": fraud_score,
        "verdict": verdict,
        "confidence": confidence,
        "recommended_action": recommended_action
    }

