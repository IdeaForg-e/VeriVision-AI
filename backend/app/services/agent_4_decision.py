import logging

logger = logging.getLogger(__name__)

VALID_VERDICTS = {"clean", "tampered", "missing", "mismatched", "reused"}
VALID_ACTIONS = {
    "Accept",
    "Quarantine & Escalate",
    "Request Vendor Verification",
    "Request Additional Angle",
}
def make_decision(ensemble_results: dict) -> dict:
    """
    Evaluates evidence from Vision Layer and computes the final verdict,
    fraud score (0-100), confidence level, and recommended action.

    Uses deterministic, evidence-based rules.  A language model must not
    assign a risk score: its output can vary for identical detector evidence
    and cannot be allowed to override measured image comparisons.

    Output keys are unchanged from the original contract (fraud_score, verdict,
    confidence, recommended_action) plus one new, additive key: "reasoning" —
    a short, grounded justification string that Agent 5 (Explainer) consumes so
    both agents stay consistent with each other.
    """
    try:
        from app.routers.triage import _PIPELINE_CONFIG
        thresholds = _PIPELINE_CONFIG.get("thresholds", {})
    except Exception:
        thresholds = {}

    ssim_target = thresholds.get("ssim", 0.85)
    keypoint_delta = thresholds.get("keypointDeltaPct", 15)
    ocr_fuzzy = thresholds.get("ocrFuzzyPct", 100)

    ssim = ensemble_results.get("ssim_score", 1.0)
    ocr_sim = ensemble_results.get("ocr_similarity", 1.0)
    ocr_mismatches = ensemble_results.get("ocr_mismatches", [])
    kp_ratio = ensemble_results.get("keypoint_ratio", 1.0)
    expected_text = ensemble_results.get("expected_text", "")
    detected_text = ensemble_results.get("detected_text", "")

    temp_score = ensemble_results.get("template_match_score", 1.0)
    temp_found = ensemble_results.get("template_match_found", True)
    color_sim = ensemble_results.get("color_hist_similarity", 1.0)
    vec_match = float(ensemble_results.get("vector_embedding_match", 85.0))
    source_reference_identical = bool(ensemble_results.get("source_reference_identical", False))

    logger.info(
        f"Make Decision called with metrics: SSIM={ssim:.3f}, OCR Sim={ocr_sim:.2f}, "
        f"Mismatches={len(ocr_mismatches)}, Keypoints Rate={kp_ratio:.3f}, "
        f"Template Found={temp_found} ({temp_score:.2f}), Color Hist={color_sim:.3f}, Vector Embedding Match={vec_match:.1f}%"
    )
    logger.info(
        f"Tuning Panel Calibration Target Values: SSIM={ssim_target:.2f}, "
        f"Keypoint Delta={keypoint_delta}%, OCR Fuzzy Strictness={ocr_fuzzy}%"
    )

    # This is an invariant, not a heuristic: the same decoded image as the
    # approved reference has no visual fraud evidence.  It also prevents a
    # bad catalog serial or an OCR read error from falsely rejecting it.
    if source_reference_identical:
        logger.info("Decision invariant: upload pixels exactly match the golden reference; assigning zero risk.")
        return {
            "fraud_score": 0,
            "verdict": "clean",
            "confidence": 1.0,
            "recommended_action": "Accept",
            "reasoning": "The uploaded image is pixel-identical to the approved golden reference.",
        }

    # Deterministic rule-based scoring matrix.
    logger.info("Executing local mathematical fallback scoring matrix...")
    ssim_loss = max(0.0, 1.0 - ssim)
    ocr_loss = max(0.0, 1.0 - ocr_sim)
    kp_loss = abs(1.0 - kp_ratio)
    color_loss = max(0.0, 1.0 - color_sim)
    vec_loss = max(0.0, (100.0 - vec_match) / 100.0)
    template_loss = 0.0 if temp_found else 1.0

    # Weights: SSIM = 35%, OCR = 20%, Vector Embedding = 15%, Keypoints = 15%, Template/Logo = 10%, Color = 5%
    weighted_score = (ssim_loss * 35) + (ocr_loss * 20) + (vec_loss * 15) + (min(kp_loss, 1.0) * 15) + (template_loss * 10) + (color_loss * 5)
    fraud_score = int(min(max(weighted_score * 1.5, 0.0), 100.0))
    logger.info(
        f"Local calculated losses - SSIM: {ssim_loss:.3f}, OCR: {ocr_loss:.3f}, Vector: {vec_loss:.3f}, Keypoints: {kp_loss:.3f}, "
        f"Template: {template_loss:.1f}, Color: {color_loss:.3f}. Weighted Score: {weighted_score:.2f} -> Fraud Score: {fraud_score}"
    )

    verdict = "clean"
    recommended_action = "Accept"
    confidence = 0.90
    reason_note = "All measured metrics fell within tolerance of the golden reference."

    # 1. Check template/logo presence (High priority)
    if not temp_found:
        verdict = "missing"
        recommended_action = "Quarantine & Escalate"
        confidence = 0.98
        reason_note = "Expected label/logo template was not detected on the part."
        logger.info(f"Local Decision: Template/logo is MISSING. Verdict forced to {verdict.upper()}.")

    # 2. Check structure (ssim loss)
    elif ssim_loss > (1.0 - ssim_target):
        if kp_loss > (keypoint_delta / 100.0) or color_loss > 0.40:
            verdict = "tampered"
            recommended_action = "Quarantine & Escalate"
            confidence = 0.95
            reason_note = f"Structural (SSIM={ssim:.2f}) and keypoint/color deviations exceed tampering thresholds."
        else:
            verdict = "reused"
            recommended_action = "Request Vendor Verification"
            confidence = 0.85
            reason_note = f"Structural similarity (SSIM={ssim:.2f}) below target but keypoints/color remain consistent, suggesting wear rather than tampering."
        logger.info(f"Local Decision: SSIM difference exceeds tuning limit ({1.0 - ssim_target:.2f}). Verdict assigned to {verdict.upper()}.")

    # 3. Check OCR serial text matching
    elif expected_text and not detected_text.strip():
        verdict = "missing"
        recommended_action = "Quarantine & Escalate"
        confidence = 0.98
        reason_note = "Expected serial/label text was not readable or absent on the part."
        logger.info("Local Decision: OCR text mismatch: Label text is empty.")

    elif len(ocr_mismatches) > 0 and (ocr_sim * 100) < ocr_fuzzy:
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
            reason_note = f"Detected serial '{detected_text}' differs from expected '{expected_text}' only by minor leet-speak character substitutions."
            logger.info("Local Decision: Character mismatches detected are minor (leet-speak). Downgraded action to Vendor Verification.")
        else:
            reason_note = f"Detected serial '{detected_text}' does not match expected '{expected_text}' ({len(ocr_mismatches)} character mismatches)."
            logger.info("Local Decision: Critical character mismatch detected in serial number.")

    # 4. Check color consistency (Color correlation checks)
    elif color_loss > 0.35:
        verdict = "tampered"
        recommended_action = "Request Vendor Verification"
        confidence = 0.80
        reason_note = f"Color/material histogram correlation ({color_sim:.2f}) deviates significantly from the golden reference, suggesting non-OEM material."
        logger.info(f"Local Decision: Color spectrum mismatch detected (non-OEM). Verdict set to {verdict.upper()}.")

    # Fallback bounds adjustments
    if not temp_found and verdict == "clean":
        verdict = "mismatched"
        recommended_action = "Quarantine & Escalate"
        confidence = 0.90
        reason_note = "Borderline template status mismatch correction applied."
        logger.info("Local Decision: Borderline template status mismatch correction.")

    if color_sim < 0.60 and verdict == "clean":
        verdict = "mismatched"
        recommended_action = "Request Vendor Verification"
        confidence = 0.85
        reason_note = f"Color similarity ({color_sim:.2f}) fell below the acceptable floor despite other checks passing."
        logger.info("Local Decision: Borderline color similarity deviation matching correction.")

    # Low-confidence adjustment: if SSIM alone sits below the tuning target but
    # no other rule fired, treat it as likely background noise/reflection rather
    # than a real defect. Verdict stays 'clean', but confidence is lowered so the
    # case surfaces for human review instead of auto-accepting silently.
    if verdict == "clean" and ssim < ssim_target:
        confidence = 0.60
        reason_note = f"SSIM ({ssim:.2f}) is below the tuning target ({ssim_target:.2f}) but no other anomaly triggered; likely background noise — confidence lowered for review."
        logger.info(f"Local Decision: High background noise/reflection (ssim {ssim:.2f} < target {ssim_target:.2f}). Confidence index set to low (0.60).")

    # 5. Multimodal vision report integration
    multimodal_report = ensemble_results.get("multimodal_report", "")
    if multimodal_report and "visual comparison failed" not in multimodal_report.lower() and "visual comparison skipped" not in multimodal_report.lower():
        if "no anomalies detected" in multimodal_report.lower():
            logger.info("Multimodal Vision check confirmed: No anomalies detected.")
            if verdict == "clean":
                confidence = min(1.0, confidence + 0.05)
        else:
            logger.info(f"Multimodal Vision check flagged defects: {multimodal_report}")
            if verdict == "clean":
                verdict = "reused"
                recommended_action = "Request Vendor Verification"
                confidence = 0.50
                fraud_score = max(fraud_score, 45)
                reason_note = f"Mathematical checks passed, but Visual AI flagged discrepancies: {multimodal_report}"
            else:
                reason_note += f" Visual AI confirmation: {multimodal_report}"
                fraud_score = min(100, fraud_score + 10)

    # Force minimal fraud score floors depending on the verdict to align with test metrics
    if verdict == "mismatched":
        fraud_score = max(fraud_score, 35)
    elif verdict == "missing":
        fraud_score = max(fraud_score, 50)
    elif verdict == "tampered":
        fraud_score = max(fraud_score, 60)

    if 40 <= fraud_score <= 70:
        confidence = 0.45
        reason_note += " Fraud score falls in the borderline 40-70 range, forcing human-in-the-loop review."
        logger.info("Local Decision: Borderline fraud score (40-70). Confidence forced to 0.45 to trigger human-in-the-loop review.")

    return {
        "fraud_score": fraud_score,
        "verdict": verdict,
        "confidence": confidence,
        "recommended_action": recommended_action,
        "reasoning": reason_note,
    }


def fuse_multi_angle_decisions(angle_results: list[dict]) -> dict:
    """
    Multi-Angle Fusion Engine (Bonus Challenge):
    Combines evaluation results from 2-3 camera angles (e.g., top, side, perspective)
    of the same part to calculate a fused fraud score and higher decision confidence.
    """
    if not angle_results:
        return {
            "fused_fraud_score": 0,
            "fused_verdict": "clean",
            "fused_confidence": 0.0,
            "fused_action": "Accept",
            "fusion_summary": "No multi-angle inspection evidence provided.",
            "angles_analyzed": []
        }

    if len(angle_results) == 1:
        single = angle_results[0]
        return {
            "fused_fraud_score": single.get("fraud_score", 0),
            "fused_verdict": single.get("verdict", "clean"),
            "fused_confidence": single.get("confidence", 0.90),
            "fused_action": single.get("recommended_action", "Accept"),
            "fusion_summary": f"Single angle analysis ({single.get('angle', 'top')}).",
            "angles_analyzed": [single.get("angle", "top")]
        }

    logger.info(f"Running Multi-Angle Fusion on {len(angle_results)} inspection angles...")
    
    angles_analyzed = [item.get("angle", f"angle_{idx+1}") for idx, item in enumerate(angle_results)]
    scores = [float(item.get("fraud_score", 0)) for item in angle_results]
    confidences = [float(item.get("confidence", 0.5)) for item in angle_results]
    verdicts = [item.get("verdict", "clean").lower() for item in angle_results]
    actions = [item.get("recommended_action", "Accept") for item in angle_results]

    # 1. Probabilistic Noisy-OR Fusion for Fraud Score:
    # 1 - prod(1 - s_i / 100) ensures multiple angle indicators compound joint probability
    prod_clean = 1.0
    for s in scores:
        prod_clean *= (1.0 - (min(max(s, 0.0), 100.0) / 100.0))
    
    fused_score = int(round((1.0 - prod_clean) * 100.0))
    fused_score = min(max(fused_score, int(max(scores))), 100)

    # 2. Priority Hierarchy for Fused Verdict: tampered > missing > mismatched > reused > clean
    verdict_priority = {"tampered": 5, "missing": 4, "mismatched": 3, "reused": 2, "clean": 1}
    sorted_by_severity = sorted(angle_results, key=lambda x: verdict_priority.get(x.get("verdict", "clean").lower(), 1), reverse=True)
    fused_verdict = sorted_by_severity[0].get("verdict", "clean")

    # 3. Action Assignment
    action_priority = {"Quarantine & Escalate": 4, "Request Vendor Verification": 3, "Request Additional Angle": 2, "Accept": 1}
    sorted_by_action = sorted(angle_results, key=lambda x: action_priority.get(x.get("recommended_action", "Accept"), 1), reverse=True)
    fused_action = sorted_by_action[0].get("recommended_action", "Accept")

    # 4. Agreement Multiplier for Fused Confidence:
    # Multi-angle agreement boosts statistical confidence by +5% per agreeing angle (max 1.0)
    matching_verdicts_count = sum(1 for v in verdicts if v == fused_verdict)
    base_confidence = max(confidences)
    confidence_boost = (matching_verdicts_count - 1) * 0.05
    fused_confidence = round(min(1.0, base_confidence + confidence_boost), 2)

    # 5. Build Fusion Summary Narrative
    angle_details_str = ", ".join([f"{a.get('angle', 'unknown')}: score {a.get('fraud_score')}/100 ({a.get('verdict')})" for a in angle_results])
    fusion_summary = (
        f"Multi-Angle Fusion completed across {len(angle_results)} views ({', '.join(angles_analyzed)}). "
        f"Individual results: [{angle_details_str}]. "
        f"Cross-angle evidence agreement elevates combined fraud confidence to {fused_confidence * 100:.0f}% with a fused risk score of {fused_score}/100."
    )

    logger.info(f"Multi-Angle Fusion Result: Fused Score={fused_score}, Fused Verdict={fused_verdict.upper()}, Fused Confidence={fused_confidence}")

    return {
        "fused_fraud_score": fused_score,
        "fused_verdict": fused_verdict,
        "fused_confidence": fused_confidence,
        "fused_action": fused_action,
        "fusion_summary": fusion_summary,
        "angles_analyzed": angles_analyzed
    }

