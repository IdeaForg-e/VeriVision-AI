import os
import requests
import logging
from typing import Dict

logger = logging.getLogger(__name__)

def generate_explanation(metrics: dict) -> str:
    """
    Generates a natural language explanation of the inspection findings.
    If OPENROUTER_API_KEY is present in env, it queries OpenRouter.
    Otherwise, it falls back to a clean rule-based template generator.
    """
    ssim = metrics.get("ssim_score", 1.0)
    verdict = metrics.get("verdict", "clean")
    fraud_score = metrics.get("fraud_score", 0)
    detected_text = metrics.get("detected_text", "")
    expected_text = metrics.get("expected_text", "")
    ocr_mismatches = metrics.get("ocr_mismatches", [])
    recommended_action = metrics.get("recommended_action", "Accept")
    
    # New metrics
    temp_score = metrics.get("template_match_score", 1.0)
    temp_found = metrics.get("template_match_found", True)
    color_sim = metrics.get("color_hist_similarity", 1.0)

    logger.info(f"Generate Explanation called for verdict={verdict.upper()}, fraud_score={fraud_score}")

    # 1. Check for OpenRouter API key first
    openrouter_key = os.getenv("OPENROUTER_API_KEY")
    openrouter_model = os.getenv("OPENROUTER_MODEL", "nvidia/nemotron-3-ultra-550b-a55b:free")
    
    prompt = (
        f"You are an AI Explainer Agent for an enterprise manufacturing QC audit platform.\n"
        f"Explain the following part inspection metrics in a professional, audit-ready manner:\n"
        f"- SSIM Structural Similarity: {ssim:.2f}\n"
        f"- Template Match Status: {'FOUND' if temp_found else 'MISSING'} (Score: {temp_score:.2f}, checks label existence)\n"
        f"- Color/Material Histogram Match: {color_sim:.2f} (lower means paint/materials deviation)\n"
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
        logger.info(f"Querying OpenRouter Explainer model: {openrouter_model}")
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
                logger.info("Explainer model returned response successfully.")
                return explanation
            else:
                logger.warning(f"Explainer model endpoint returned status {response.status_code}. Falling back to template...")
        except Exception as e:
            logger.error(f"OpenRouter API Call failed: {e}. Falling back to template explainer.")

    # Rule-Based Fallback template
    logger.info("Assembling rule-based local explanation template...")
    reasons = []
    if verdict == "clean":
        reasons.append(
            f"The component passed visual checks with high structural similarity (SSIM: {ssim:.2f}) "
            f"and matched all expected label markings."
        )
    elif verdict == "missing":
        reasons.append(
            f"A missing component anomaly was triggered because the expected label sticker/logo "
            f"was not detected on the part (SSIM: {ssim:.2f}, Template Match: {'FOUND' if temp_found else 'MISSING'})."
        )
    elif verdict == "mismatched":
        mismatch_str = ", ".join([f"position {m['position']} ('{m['detected']}' instead of '{m['expected']}')" for m in ocr_mismatches])
        reasons.append(
            f"A label mismatch was flagged. Expected '{expected_text}' but detected '{detected_text}'. "
            f"Mismatches found at: {mismatch_str}."
        )
    elif verdict == "tampered":
        details = []
        if ssim < 0.65:
            details.append(f"low structural similarity SSIM of {ssim:.2f}")
        if color_sim < 0.65:
            details.append(f"non-OEM color correlation shift ({color_sim:.2f})")
        
        detail_msg = ", ".join(details) if details else "layout modifications"
        reasons.append(
            f"Physical tampering detected. The analysis indicates {detail_msg} deviating significantly "
            f"from the Golden Reference, suggesting component alteration or counterfeit replacement."
        )
    elif verdict == "reused":
        reasons.append(
            f"Reused hardware indicators found. The surface registration reveals minor wear, adhesive residue, "
            f"or trace scratches mismatching the golden reference board."
        )

    reasons.append(f"Recommended action is '{recommended_action}' with a fraud index of {fraud_score}/100.")
    explanation_msg = " ".join(reasons)
    logger.info(f"Local compiled explanation: {explanation_msg}")
    return explanation_msg
