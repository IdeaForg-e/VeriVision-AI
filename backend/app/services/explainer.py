import os
import requests
from typing import Dict

def generate_explanation(metrics: dict) -> str:
    """
    Generates a natural language explanation of the inspection findings.
    If GEMINI_API_KEY is present in env, it queries Gemini.
    Otherwise, it falls back to a clean rule-based template generator.
    """
    ssim = metrics.get("ssim_score", 1.0)
    verdict = metrics.get("verdict", "clean")
    fraud_score = metrics.get("fraud_score", 0)
    detected_text = metrics.get("detected_text", "")
    expected_text = metrics.get("expected_text", "")
    ocr_mismatches = metrics.get("ocr_mismatches", [])
    recommended_action = metrics.get("recommended_action", "Accept")
    
    # 1. Check for OpenRouter API key first
    openrouter_key = os.getenv("OPENROUTER_API_KEY")
    openrouter_model = os.getenv("OPENROUTER_MODEL", "google/gemini-2.5-flash")
    
    prompt = (
        f"You are an AI Explainer Agent for an enterprise manufacturing QC audit platform.\n"
        f"Explain the following part inspection metrics in a professional, audit-ready manner:\n"
        f"- SSIM Structural Similarity: {ssim:.2f}\n"
        f"- OCR Expected Label: '{expected_text}'\n"
        f"- OCR Detected Label: '{detected_text}'\n"
        f"- Character Mismatches: {ocr_mismatches}\n"
        f"- Fraud Score: {fraud_score}/100\n"
        f"- Verdict Category: {verdict.upper()}\n"
        f"- Recommended Action: {recommended_action}\n\n"
        f"Write a concise 2-3 sentence technical justification summarizing what visual abnormalities were found "
        f"and why this verdict/action was chosen. Keep it formal."
    )

    if openrouter_key:
        try:
            url = "https://openrouter.ai/api/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {openrouter_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://github.com/IdeaForg-e/VeriVision-AI",
                "X-Title": "VeriVision QC Platform"
            }
            payload = {
                "model": openrouter_model,
                "messages": [
                    {"role": "user", "content": prompt}
                ]
            }
            response = requests.post(url, json=payload, headers=headers, timeout=8)
            if response.status_code == 200:
                res_data = response.json()
                explanation = res_data["choices"][0]["message"]["content"].strip()
                return explanation
        except Exception as e:
            print(f"OpenRouter API Call failed: {e}. Trying native Gemini...")

    # 2. Check for Native Gemini API key
    api_key = os.getenv("GEMINI_API_KEY")
    if api_key:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
            headers = {"Content-Type": "application/json"}
            payload = {
                "contents": [
                    {"parts": [{"text": prompt}]}
                ]
            }
            response = requests.post(url, json=payload, headers=headers, timeout=5)
            if response.status_code == 200:
                res_data = response.json()
                explanation = res_data["candidates"][0]["content"]["parts"][0]["text"].strip()
                return explanation
        except Exception as e:
            print(f"Gemini API Call failed: {e}. Falling back to template explainer.")

    # Rule-Based Fallback template
    reasons = []
    if verdict == "clean":
        reasons.append(
            f"The component passed visual checks with high structural similarity (SSIM: {ssim:.2f}) "
            f"and matched all expected label markings."
        )
    elif verdict == "missing":
        reasons.append(
            f"A missing component anomaly was triggered because expected label text '{expected_text}' "
            f"was not detected on the part (SSIM: {ssim:.2f})."
        )
    elif verdict == "mismatched":
        mismatch_str = ", ".join([f"position {m['position']} ('{m['detected']}' instead of '{m['expected']}')" for m in ocr_mismatches])
        reasons.append(
            f"A label mismatch was flagged. Expected '{expected_text}' but detected '{detected_text}'. "
            f"Mismatches found at: {mismatch_str}."
        )
    elif verdict == "tampered":
        reasons.append(
            f"Physical tampering detected. The structural layout deviates significantly from the "
            f"Golden Reference (SSIM: {ssim:.2f}), suggesting component alteration or non-OEM screws/parts."
        )
    elif verdict == "reused":
        reasons.append(
            f"Reused hardware indicators found. The surface registration reveals minor wear, adhesive residue, "
            f"or trace scratches mismatching the golden reference board."
        )

    reasons.append(f"Recommended action is '{recommended_action}' with a fraud index of {fraud_score}/100.")
    return " ".join(reasons)
