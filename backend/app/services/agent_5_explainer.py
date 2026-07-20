import os
import requests
import logging
from typing import Dict
from app.config import settings

logger = logging.getLogger(__name__)

MAX_LLM_ATTEMPTS = 2  # 1 initial attempt + 1 retry before falling back to the template


def _build_prompt(ssim, verdict, fraud_score, detected_text, expected_text,
                   ocr_mismatches, recommended_action, temp_score, temp_found,
                   color_sim, decision_reasoning, multimodal_report) -> str:
    grounding = (
        f"- Decision Agent's reasoning: \"{decision_reasoning}\"\n"
        if decision_reasoning else ""
    )
    visual_ai_finding = (
        f"- Multimodal Visual AI inspection report: \"{multimodal_report}\"\n"
        if multimodal_report and "skipped" not in multimodal_report.lower() and "failed" not in multimodal_report.lower()
        else ""
    )
    return (
        f"You are an AI Explainer Agent for an enterprise manufacturing QC audit platform.\n"
        f"A separate Decision Agent has already reached a verdict from the metrics below. Your job is ONLY to "
        f"write the audit-facing explanation for that verdict — do not re-judge or contradict it, and do not "
        f"introduce any finding, number, or detail that is not listed here.\n\n"
        f"METRICS:\n"
        f"- SSIM Structural Similarity: {ssim:.2f}\n"
        f"- Template Match Status: {'FOUND' if temp_found else 'MISSING'} (Score: {temp_score:.2f}, checks label existence)\n"
        f"- Color/Material Histogram Match: {color_sim:.2f} (lower means paint/materials deviation)\n"
        f"- OCR Expected Label: '{expected_text}'\n"
        f"- OCR Detected Label: '{detected_text}'\n"
        f"- Character Mismatches: {ocr_mismatches}\n"
        f"- Fraud Score: {fraud_score}/100\n"
        f"- Verdict Category: {verdict.upper()}\n"
        f"- Recommended Action: {recommended_action}\n"
        f"{grounding}\n"
        f"{visual_ai_finding}\n"
        f"Write a concise 2-3 sentence technical justification summarizing what visual abnormalities were found "
        f"and why this verdict/action was chosen. Keep it formal and audit-ready. Reference only the metrics, "
        f"reasoning, and Visual AI report details given above — do not speculate beyond them."
    )


def generate_explanation(metrics: dict) -> str:
    """
    Generates a natural language explanation of the inspection findings.
    If OPENROUTER_API_KEY is present in settings, it queries OpenRouter
    (with one retry on failure/empty response). Otherwise, or if both
    attempts fail, it falls back to a clean rule-based template generator.

    If metrics contains a "reasoning" key (produced by Agent 4's decision
    logic), the explanation is explicitly grounded in that reasoning so the
    decision and the explanation stay consistent with each other, rather
    than being derived independently.
    """
    ssim = metrics.get("ssim_score", 1.0)
    verdict = metrics.get("verdict", "clean")
    fraud_score = metrics.get("fraud_score", 0)
    detected_text = metrics.get("detected_text", "")
    expected_text = metrics.get("expected_text", "")
    ocr_mismatches = metrics.get("ocr_mismatches", [])
    recommended_action = metrics.get("recommended_action", "Accept")
    decision_reasoning = metrics.get("reasoning", "")
    multimodal_report = metrics.get("multimodal_report", "")

    temp_score = metrics.get("template_match_score", 1.0)
    temp_found = metrics.get("template_match_found", True)
    color_sim = metrics.get("color_hist_similarity", 1.0)

    logger.info(f"Generate Explanation called for verdict={verdict.upper()}, fraud_score={fraud_score}")

    openrouter_key = settings.OPENROUTER_API_KEY
    openrouter_model = settings.OPENROUTER_MODEL

    if openrouter_key:
        prompt = _build_prompt(
            ssim, verdict, fraud_score, detected_text, expected_text,
            ocr_mismatches, recommended_action, temp_score, temp_found,
            color_sim, decision_reasoning, multimodal_report,
        )
        url = "https://openrouter.ai/api/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {openrouter_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://github.com/IdeaForg-e/VeriVision-AI",
            "X-Title": "VeriVision QC Platform",
        }
        payload = {
            "model": openrouter_model,
            "messages": [{"role": "user", "content": prompt}],
        }

        for attempt in range(1, MAX_LLM_ATTEMPTS + 1):
            logger.info(f"Querying OpenRouter Explainer model (attempt {attempt}/{MAX_LLM_ATTEMPTS}): {openrouter_model}")
            try:
                response = requests.post(url, json=payload, headers=headers, timeout=8)
                if response.status_code != 200:
                    logger.warning(f"Explainer model endpoint returned status {response.status_code}. Details: {response.text}")
                    continue

                res_data = response.json()
                explanation = res_data["choices"][0]["message"]["content"].strip()
                if not explanation:
                    raise ValueError("Explainer model returned an empty response")

                logger.info("Explainer model returned response successfully.")
                return explanation

            except Exception as e:
                logger.error(f"Explainer LLM Agent attempt {attempt}/{MAX_LLM_ATTEMPTS} failed: {e}.")

        logger.warning("All Explainer LLM attempts exhausted. Falling back to template explainer...")

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

    # Include the Visual AI anomalies list if available
    if multimodal_report and "skipped" not in multimodal_report.lower() and "failed" not in multimodal_report.lower() and "no anomalies" not in multimodal_report.lower():
        reasons.append(f"Visual AI details: {multimodal_report}")

    # Ground the template in Agent 4's own reasoning when available, so the
    # fallback path stays consistent with why the decision was actually made,
    # rather than re-deriving generic verdict boilerplate from scratch.
    if decision_reasoning:
        reasons.append(f"Decision basis: {decision_reasoning}")

    reasons.append(f"Recommended action is '{recommended_action}' with a fraud index of {fraud_score}/100.")
    explanation_msg = " ".join(reasons)
    logger.info(f"Local compiled explanation: {explanation_msg}")
    return explanation_msg