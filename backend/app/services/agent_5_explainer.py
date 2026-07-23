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
        f"Write a detailed, fluent paragraph (6-8 sentences) that explains the inspection findings "
        f"in natural, audit-ready language. Structure it as follows:\n\n"
        f"1. Start by describing what the SSIM heatmap analysis revealed — mention specific SSIM score and "
        f"what areas of the component showed structural deviation from the golden reference.\n"
        f"2. Then describe the label verification results — what text was expected versus what was detected by OCR, "
        f"and whether character mismatches were found.\n"
        f"3. If relevant, mention template/logo presence and color/material correlation findings.\n"
        f"4. Conclude with the verdict, fraud risk score, and recommended action.\n\n"
        f"Make it sound like a senior quality auditor writing an official inspection report. "
        f"Do not speculate beyond the metrics provided."
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

    # ── Rule-Based Fallback — Rich Paragraph ──────────────────────────────
    logger.info("Assembling rule-based local explanation template...")

    ssim_pct = ssim * 100
    color_pct = color_sim * 100

    # --- 1. SSIM / Heatmap paragraph ---
    if ssim >= 0.85:
        heatmap_part = (
            f"SSIM heatmap analysis registered a structural similarity index of {ssim:.2f} ({ssim_pct:.0f}%), "
            f"indicating the component surface matches the golden reference within acceptable tolerances. "
            f"Pixel-level comparison shows no significant deviations in the inspected regions."
        )
    elif ssim >= 0.65:
        heatmap_part = (
            f"SSIM heatmap analysis recorded a structural similarity score of {ssim:.2f} ({ssim_pct:.0f}%), "
            f"which falls moderately below the ideal threshold. The heatmap overlay reveals mild structural "
            f"differences concentrated around specific zones of the component, suggesting surface-level wear "
            f"or potential localized tampering. These regions appear as warmer (red/orange) areas in the "
            f"difference heatmap, indicating pixel-level discrepancy between the uploaded part and the golden reference."
        )
    else:
        heatmap_part = (
            f"SSIM heatmap analysis returned a critically low structural similarity index of {ssim:.2f} ({ssim_pct:.0f}%), "
            f"well below the acceptable threshold. The anomaly heatmap shows extensive red-highlighted regions "
            f"across the component surface, indicating substantial structural deviation from the golden reference. "
            f"These high-discrepancy zones are distributed across multiple areas, suggesting either a different "
            f"manufacturing revision, significant physical damage, or a counterfeit replacement part."
        )

    # --- 2. OCR / Label paragraph ---
    if verdict == "clean" or (expected_text and detected_text and expected_text == detected_text):
        ocr_part = (
            f"OCR-based label verification confirmed that the printed label text '{detected_text}' "
            f"exactly matches the expected golden reference '{expected_text}', with zero character mismatches. "
            f"The label appears authentic and unmodified."
        )
    elif not detected_text.strip():
        ocr_part = (
            f"OCR label verification failed to detect any readable text on the part surface. "
            f"The system expected to find '{expected_text}' but the label area appears blank, illegible, "
            f"or physically removed. This is a strong indicator of label tampering or part substitution."
        )
    elif detected_text != expected_text:
        mismatch_count = len(ocr_mismatches)
        mismatch_positions = ", ".join(
            [f"position {m['position']} ('{m['detected']}' instead of '{m['expected']}')" 
             for m in ocr_mismatches[:5]]
        ) if ocr_mismatches else "throughout the label"
        ocr_part = (
            f"OCR label verification flagged a text mismatch: the system detected '{detected_text}' "
            f"where '{expected_text}' was expected, with {mismatch_count} character-level discrepancies "
            f"identified at {mismatch_positions}. This serial/label discrepancy raises concerns about "
            f"label authenticity or part tracking integrity."
        )
    else:
        ocr_part = ""

    # --- 3. Template & Color paragraph ---
    extra_parts = []
    if not temp_found:
        extra_parts.append(
            f"Template matching analysis confirms that the expected manufacturer logo or certification mark "
            f"is absent from the component surface (template match score: {temp_score:.2f}). "
            f"Missing visual branding elements are commonly associated with counterfeit or unauthorized parts."
        )
    if color_sim < 0.70:
        extra_parts.append(
            f"Color/material histogram correlation measured {color_pct:.0f}%, indicating a significant "
            f"deviation in surface material properties compared to the OEM golden reference. "
            f"This discrepancy suggests the use of non-original materials, possibly from an alternate supplier "
            f"or a counterfeit manufacturing source."
        )

    # --- 4. Verdict & Conclusion ---
    verdict_lines = {
        "clean": (
            f"Based on the complete analysis, the inspection verdict is CLEAN with a fraud risk score of {fraud_score}/100. "
            f"The recommended action is '{recommended_action}'. All visual, structural, and textual checks are consistent "
            f"with an authentic OEM component that meets quality standards."
        ),
        "tampered": (
            f"The evidence collectively supports a TAMPERED verdict with a fraud risk score of {fraud_score}/100. "
            f"Multiple detection signals converge to indicate physical alteration or unauthorized modification of the component. "
            f"The recommended action is '{recommended_action}' to prevent non-compliant parts from entering the supply chain."
        ),
        "missing": (
            f"The inspection concludes with a MISSING component alert and a fraud risk score of {fraud_score}/100. "
            f"Critical visual elements expected on an authentic part were not detected. "
            f"The recommended action is '{recommended_action}' to investigate and quarantine."
        ),
        "mismatched": (
            f"The overall verdict is MISMATCHED with a fraud risk score of {fraud_score}/100. "
            f"The detected discrepancies between the submitted part and the golden reference indicate "
            f"a possible substitution or mislabeling event. "
            f"The recommended action is '{recommended_action}'."
        ),
        "reused": (
            f"The inspection verdict is REUSED with a fraud risk score of {fraud_score}/100. "
            f"Surface registration and wear patterns suggest the component may have been previously deployed, "
            f"refurbished, or harvested from recycled equipment. "
            f"The recommended action is '{recommended_action}'."
        ),
    }
    conclusion = verdict_lines.get(verdict, (
        f"Inspection complete with verdict {verdict.upper()} (fraud score: {fraud_score}/100). "
        f"Recommended action: '{recommended_action}'."
    ))

    # Include decision agent's reasoning if available
    if decision_reasoning:
        reasoning_clause = f" The decision agent further notes: {decision_reasoning}"
    else:
        reasoning_clause = ""

    # Include multimodal report if available
    if multimodal_report and "skipped" not in multimodal_report.lower() and "failed" not in multimodal_report.lower() and "no anomalies" not in multimodal_report.lower():
        visual_clause = f" Visual AI inspection additionally highlights: {multimodal_report}"
    else:
        visual_clause = ""

    # Assemble final paragraph
    all_parts = [heatmap_part, ocr_part] + extra_parts + [conclusion + reasoning_clause + visual_clause]
    explanation_msg = " ".join(all_parts)

    logger.info(f"Local compiled explanation: {explanation_msg[:200]}...")
    return explanation_msg