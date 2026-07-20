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
    source_reference_identical = bool(ensemble_results.get("source_reference_identical", False))

    logger.info(
        f"Make Decision called with metrics: SSIM={ssim:.3f}, OCR Sim={ocr_sim:.2f}, "
        f"Mismatches={len(ocr_mismatches)}, Keypoints Rate={kp_ratio:.3f}, "
        f"Template Found={temp_found} ({temp_score:.2f}), Color Hist={color_sim:.3f}"
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
    template_loss = 0.0 if temp_found else 1.0

    # Weights: SSIM = 40%, OCR = 25%, Keypoints = 15%, Template/Logo = 10%, Color Correlation = 10%
    weighted_score = (ssim_loss * 40) + (ocr_loss * 25) + (min(kp_loss, 1.0) * 15) + (template_loss * 10) + (color_loss * 10)
    fraud_score = int(min(max(weighted_score * 1.5, 0.0), 100.0))
    logger.info(
        f"Local calculated losses - SSIM: {ssim_loss:.3f}, OCR: {ocr_loss:.3f}, Keypoints: {kp_loss:.3f}, "
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
