import os
import requests
import logging
from typing import Dict
from app.config import settings

logger = logging.getLogger(__name__)

def generate_explanation(metrics: dict) -> str:
    """
    Generates a natural language explanation of the inspection findings.
    If OPENROUTER_API_KEY is present in settings, it queries OpenRouter.
    Otherwise, it falls back to a clean rule-based template generator.
    """
    # Load dynamic thresholds from Pipeline Tuning Panel
    try:
        from app.routers.triage import _PIPELINE_CONFIG
        thresholds = _PIPELINE_CONFIG.get("thresholds", {})
    except Exception:
        thresholds = {}
        
    ssim_target = thresholds.get("ssim", 0.85)
    keypoint_delta = thresholds.get("keypointDeltaPct", 15)
    ocr_fuzzy = thresholds.get("ocrFuzzyPct", 100)

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
    openrouter_key = settings.OPENROUTER_API_KEY
    openrouter_model = settings.OPENROUTER_MODEL
    
    prompt = (
        f"You are an AI Quality Inspector explaining an inspection audit to a factory manager in plain, simple, natural human language.\n"
        f"Explain the following inspection findings directly and clearly, in relation to your calibrated safety standard thresholds. Avoid technical terms like 'SSIM' or 'histogram correlation':\n\n"
        f"--- Calibrated Safety Standards ---\n"
        f"- Target Surface/Layout Similarity: {ssim_target:.2f}\n"
        f"- Allowed Keypoint Deviation Margin: {keypoint_delta}%\n"
        f"- OCR Fuzzy Matching Strictness: {ocr_fuzzy}%\n\n"
        f"--- Inspection Findings ---\n"
        f"- Physical Match score: {ssim:.2f} (a low score below target means parts are missing, misplaced, or damaged)\n"
        f"- Sticker/Label existence: {'FOUND' if temp_found else 'MISSING'} (Score: {temp_score:.2f})\n"
        f"- Color/Material match: {color_sim:.2f} (a low score below 0.85 means discoloration, rust, burns, or stains exist)\n"
        f"- OCR Expected Label text: '{expected_text}'\n"
        f"- OCR Detected Label text: '{detected_text}'\n"
        f"- Character mismatches: {ocr_mismatches}\n"
        f"- Fraud Score: {fraud_score}/100\n"
        f"- Final Verdict: {verdict.upper()}\n"
        f"- Recommended Action: {recommended_action}\n\n"
        f"Write a clear, direct 2-3 sentence explanation summarizing what is physically wrong with the component. "
        f"Specifically mention how much the physical match score ({ssim:.2f}) or text matches deviated from the calibrated standards (e.g. target of {ssim_target:.2f}). "
        f"Keep the tone friendly, helpful, and natural, focusing on the visual defects found and what the factory should do next."
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
            "The component looks perfect! All parts are in the correct place, the colors match the golden standard, and the label text is correct."
        )
    elif verdict == "missing":
        reasons.append(
            "The inspection failed because the required sticker or label is completely missing from the component."
        )
    elif verdict == "mismatched":
        reasons.append(
            f"The printed text on the sticker does not match. We expected '{expected_text}' but detected '{detected_text}' instead."
        )
    elif verdict == "tampered":
        details = []
        if ssim < 0.65:
            details.append("physically damaged or burned components")
        if color_sim < 0.65:
            details.append("liquid wet stains, rust, or incorrect color substrate")
        
        detail_msg = " and ".join(details) if details else "unauthorized physical changes"
        reasons.append(
            f"This part has been tampered with. We detected {detail_msg} on the surface, which means "
            f"this component is damaged or has been modified."
        )
    elif verdict == "reused":
        reasons.append(
            "This part looks like a reused or old component. There are clear scratches, dirt, or tape residue on the surface."
        )

    reasons.append(f"We recommend you to {recommended_action.lower()} this part. The overall fraud risk rating is {fraud_score}%.")
    explanation_msg = " ".join(reasons)
    logger.info(f"Local compiled explanation: {explanation_msg}")
    return explanation_msg
