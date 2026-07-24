import os
import requests
import logging
from typing import Dict
from app.config import settings

logger = logging.getLogger(__name__)

MAX_LLM_ATTEMPTS = 1  # Single fast attempt before falling back to local template


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
    First tries to call the OpenRouter LLM for a rich audit narrative.
    Falls back to a local template if the API key is missing or the call fails.
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
    anomaly_regions = metrics.get("anomaly_regions", []) or []
    keypoint_ratio = metrics.get("keypoint_ratio")
    temp_score = metrics.get("template_match_score", 1.0)
    temp_found = metrics.get("template_match_found", True)
    color_sim = metrics.get("color_hist_similarity", 1.0)

    logger.info(f"Generate Explanation called for verdict={verdict.upper()}, fraud_score={fraud_score}")

    openrouter_key = settings.OPENROUTER_API_KEY
    openrouter_model = settings.OPENROUTER_MODEL

    # Default to enabled when an API key is present — the env var exists only
    # as an escape hatch to force the template fallback (e.g. for offline demos).
    use_llm_explainer = os.getenv("ENABLE_LLM_EXPLAINER", "true").lower() == "true"
    if openrouter_key and use_llm_explainer:
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
                response = requests.post(url, json=payload, headers=headers, timeout=30)
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
    if anomaly_regions:
        region_text = "; ".join(
            f"the {r.get('location', 'unknown')} area of the component"
            for r in anomaly_regions[:3]
        )
    else:
        region_text = "no localized defect regions above the detection threshold"

    # --- 1. SSIM / Heatmap paragraph ---
    if ssim >= 0.85:
        heatmap_part = (
            f"SSIM heatmap analysis registered a structural similarity index of {ssim:.2f} ({ssim_pct:.0f}%), "
            f"indicating the component surface matches the golden reference within acceptable tolerances. "
            f"Pixel-level comparison produced {region_text}."
        )
    elif verdict == "missing":
        parts.append(
            "The inspection found that a critical element is missing from this part. "
            "A label, sticker, or serial tag that should be present on the golden reference "
            "could not be found on the submitted scan. This is a strong indicator of tampering or part substitution."
        )
    elif verdict == "mismatched":
        parts.append(
            "The inspection found that the label or serial number on this part does not match the golden reference. "
            "The printed text appears to have been altered, which raises concerns about the authenticity "
            "and traceability of this component."
        )
    elif verdict == "reused":
        parts.append(
            "The inspection suggests this part may have been previously used and returned as new. "
            "While the overall layout matches the golden reference, there are visible signs of wear, "
            "residue, or surface damage that are inconsistent with a brand-new OEM component."
        )
    else:
        parts.append(
            "The inspection is complete. The system has analyzed the submitted scan and produced a verdict "
            f"of {verdict.upper()} with a fraud risk score of {fraud_score} out of 100."
        )

    # --- OCR / Label details ---
    if verdict in ("mismatched", "missing", "tampered") and expected_text and detected_text:
        if expected_text != detected_text and ocr_mismatches:
            mismatch_count = len(ocr_mismatches)
            parts.append(
                f"The label text on the part reads '{detected_text}', but the golden reference expects '{expected_text}'. "
                f"There are {mismatch_count} character-level differences between the two. "
                f"This kind of text alteration is a common sign of counterfeit or tampered parts."
            )
        elif not detected_text.strip() and expected_text:
            parts.append(
                f"The system expected to find the label text '{expected_text}' on the part, "
                f"but no readable text could be extracted from the label area. "
                f"This could mean the label is missing, illegible, or has been removed."
            )
        elif detected_text and expected_text and detected_text == expected_text:
            parts.append(
                f"The label text '{detected_text}' was read successfully and matches the golden reference exactly. "
                f"The label appears authentic."
            )

    # --- Template / sticker check ---
    if not temp_found:
        parts.append(
            "The system could not find the expected manufacturer logo, QC sticker, or warranty seal "
            "in its usual location. Missing visual branding elements are commonly associated with "
            "counterfeit or unauthorized parts."
        )

    # --- Visual AI note ---
    if multimodal_report and "no anomalies detected" not in multimodal_report.lower() and "skipped" not in multimodal_report.lower() and "failed" not in multimodal_report.lower():
        parts.append(
            "The visual AI inspection also noted physical differences between the part and the golden reference. "
            f"{multimodal_report}"
        )

    # --- Conclusion / Action ---
    action_phrases = {
        "Quarantine & Escalate": "This part should be quarantined immediately and escalated to the quality team for further investigation.",
        "Request Vendor Verification": "The system recommends contacting the vendor to verify the authenticity of this component.",
        "Request Additional Angle": "The system recommends capturing this part from an additional angle to confirm the findings.",
        "Accept": "This part can be accepted and released into the supply chain.",
        "Triage Agent requests retake": "The image quality was not sufficient for a reliable decision. A retake with better lighting or focus is recommended.",
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

    # Assemble detailed paragraph
    all_parts = [heatmap_part, ocr_part] + extra_parts + [conclusion + reasoning_clause + visual_clause]
    detailed_paragraph = " ".join(all_parts)

    # --- Plain-English bullet summary (readable at a glance, ahead of the audit paragraph) ---
    status_map = {
        "clean": "Clean",
        "tampered": "Tampered",
        "missing": "Defective (Missing Element)",
        "mismatched": "Defective (Label Mismatch)",
        "reused": "Defective (Reused/Worn)",
    }
    part_status = status_map.get(verdict, verdict.title())

    if ssim >= 0.85:
        visual_finding = "No meaningful visual differences found compared to the golden reference."
    elif ssim >= 0.65:
        visual_finding = f"Some visual differences found ({region_text})."
    else:
        visual_finding = f"Major visual differences found ({region_text})."

    if not expected_text:
        serial_check = "Not checked (no expected serial/label text configured for this part)."
    elif expected_text and detected_text and expected_text == detected_text:
        serial_check = f"Match — expected '{expected_text}', found '{detected_text}'."
    elif not detected_text.strip():
        serial_check = f"Could not read any label — expected '{expected_text}', label appears blank or unreadable."
    else:
        serial_check = f"Mismatch — expected '{expected_text}', found '{detected_text}' ({len(ocr_mismatches)} character difference(s))."

    action_item = f"{recommended_action}."

    bullet_summary = (
        f"• Part Status: {part_status}\n"
        f"• Visual Findings: {visual_finding}\n"
        f"• Serial Check: {serial_check}\n"
        f"• Inspector Action Item: {action_item}"
    )

    explanation_msg = f"{bullet_summary}\n\n{detailed_paragraph}"

    logger.info(f"Local compiled explanation: {explanation_msg[:200]}...")
    return explanation_msg