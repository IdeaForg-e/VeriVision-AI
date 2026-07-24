import logging

logger = logging.getLogger(__name__)

VALID_VERDICTS = {"clean", "tampered", "missing", "mismatched", "reused"}
VALID_ACTIONS = {
    "Accept",
    "Quarantine & Escalate",
    "Request Vendor Verification",
    "Request Additional Angle",
    "Request additional angle",
    "Retake",
    "Escalate with evidence",
    "Escalate to vendor",
    "Triage Agent requests retake",
}

def make_decision(ensemble_results: dict) -> dict:
    """
    Agent 4: Decision & Fusion Judge.
    Evaluates evidence from Vision Layer and computes the final verdict,
    fraud score (0-100), confidence level, and recommended action.

    Uses deterministic rule-based scoring. Each detection result is evaluated
    in priority order: Missing label > Tampered (swap) > Mismatched (OCR) >
    Non-OEM label > Reused board > Clean.
    """
    try:
        from app.routers.triage import _PIPELINE_CONFIG
        thresholds = _PIPELINE_CONFIG.get("thresholds", {})
    except Exception:
        thresholds = {}

    ssim_target = thresholds.get("ssim", 0.85)
    ocr_fuzzy = thresholds.get("ocrFuzzyPct", 100)

    ssim = ensemble_results.get("ssim_score", 1.0)
    ocr_sim = ensemble_results.get("ocr_similarity", 1.0)
    ocr_mismatches = ensemble_results.get("ocr_mismatches", [])
    kp_ratio = ensemble_results.get("keypoint_ratio", 1.0)
    expected_text = ensemble_results.get("expected_text", "")
    detected_text = ensemble_results.get("detected_text", "")
    ocr_diff = ensemble_results.get("ocr_diff") or {}
    suspicious_confusions = ocr_diff.get("suspicious_confusions", [])

    temp_score = ensemble_results.get("template_match_score", 1.0)
    temp_found = ensemble_results.get("template_match_found", True)
    color_sim = ensemble_results.get("color_hist_similarity", 1.0)
    vec_match = float(ensemble_results.get("vector_embedding_match", 85.0))
    source_reference_identical = bool(ensemble_results.get("source_reference_identical", False))
    anomaly_regions = ensemble_results.get("anomaly_regions", [])

    logger.info(
        f"[Agent 4] Decision inputs: SSIM={ssim:.3f}, OCR Sim={ocr_sim:.2f}, "
        f"Mismatches={len(ocr_mismatches)}, Keypoints={kp_ratio:.3f}, "
        f"Template Found={temp_found} ({temp_score:.2f}), Color={color_sim:.3f}, Vector Match={vec_match:.1f}%"
    )

    # Invariant: pixel-identical upload = no fraud
    if source_reference_identical:
        logger.info("[Agent 4] Pixel-identical to golden reference. Verdict: CLEAN.")
        return {
            "fraud_score": 0,
            "verdict": "clean",
            "category": "Clean (OEM Verified)",
            "confidence": 1.0,
            "recommended_action": "Accept",
            "reasoning": "The uploaded image is pixel-identical to the approved golden reference. No fraud indicators detected.",
        }

    # --- COMPUTE LOSSES ---
    ssim_loss = max(0.0, 1.0 - ssim)
    ocr_loss = max(0.0, 1.0 - ocr_sim)
    kp_loss = abs(1.0 - kp_ratio)
    color_loss = max(0.0, 1.0 - color_sim)
    vec_loss = max(0.0, (100.0 - vec_match) / 100.0)
    template_loss = 0.0 if temp_found else 1.0
    multimodal_report = ensemble_results.get("multimodal_report", "")
    multimodal_lower = multimodal_report.lower()
    mentions_missing_component = "missing component" in multimodal_lower or "absent" in multimodal_lower
    strong_identity_match = ssim >= 0.80 and vec_match >= 90.0
    strong_swap_evidence = (
        kp_ratio < 0.35
        or (kp_ratio < 0.55 and (ssim < 0.65 or vec_match < 75.0))
    )
    localized_structural_issue = ssim < max(ssim_target, 0.85) or bool(anomaly_regions)
    # OCR mismatch severity: count how many characters are different
    ocr_mismatch_count = len(ocr_mismatches)
    has_ocr_mismatch = (
        expected_text
        and detected_text
        and ocr_mismatch_count > 0
        and ((ocr_sim * 100) < ocr_fuzzy or bool(suspicious_confusions))
    )

    # --- DETERMINE VERDICT (Priority order: Most Severe → Least Severe) ---

    category = "Clean (OEM Verified)"
    verdict = "clean"
    recommended_action = "Accept"
    confidence = 0.90
    fraud_score = 0
    reason_note = "All measured optical and character features fall within OEM tolerance."

    # 1. MISSING QC LABEL → Template match failed
    if not temp_found:
        category = "Missing QC label"
        verdict = "missing"
        recommended_action = "Quarantine & Escalate"
        confidence = 0.98
        fraud_score = 70
        reason_note = (
            f"MISSING QC LABEL: Golden reference shows {temp_score:.0%} template match in expected location, "
            f"but defective image has blank region. Template score: {temp_score:.2f}. "
            f"QC/security sticker appears to be removed or missing."
        )
        logger.info(f"[Agent 4] Decision: MISSING QC LABEL → Quarantine. Fraud Score: {fraud_score}")

    # 2. TAMPERED / SWAP DETECTION → Keypoints don't match (different component)
    elif strong_swap_evidence and not strong_identity_match:
        category = "Swap detection"
        verdict = "tampered"
        recommended_action = "Quarantine & Escalate"
        confidence = 0.95
        fraud_score = 75
        reason_note = (
            f"SWAP DETECTION: Keypoint mismatch (match rate={kp_ratio:.2f}) suggests a DIFFERENT COMPONENT is installed. "
            f"Only {kp_ratio:.1%} of visual features match the golden reference. "
            f"This indicates the part has been swapped with a non-OEM component."
        )
        logger.info(f"[Agent 4] Decision: SWAP DETECTION → Quarantine. Fraud Score: {fraud_score}")

    # 3. ALTERED SERIAL NUMBER → OCR mismatch detected
    elif mentions_missing_component and strong_identity_match and localized_structural_issue:
        category = "Localized missing component"
        verdict = "missing"
        recommended_action = "Quarantine & Escalate"
        confidence = 0.82
        fraud_score = 58
        reason_note = (
            f"LOCALIZED MISSING COMPONENT: Board identity remains consistent (SSIM={ssim:.2f}, vector match={vec_match:.1f}%), "
            f"but localized anomaly evidence indicates a possible absent part rather than a full board swap. "
            f"Keypoint agreement is {kp_ratio:.1%}, which is treated as alignment/local difference evidence, not standalone swap proof."
        )
        logger.info(f"[Agent 4] Decision: LOCALIZED MISSING COMPONENT -> Quarantine. Fraud Score: {fraud_score}")

    elif has_ocr_mismatch:
        category = "Altered serial number"
        verdict = "mismatched"
        recommended_action = "Escalate with evidence"
        confidence = 0.95
        fraud_score = 50
        # Build character-level diff description
        mismatch_details = "; ".join(
            [f"pos {m['position']}: expected '{m['expected']}' got '{m['detected']}'" for m in ocr_mismatches[:5]]
        )
        reason_note = (
            f"ALTERED SERIAL NUMBER: OCR text mismatch detected ({ocr_mismatch_count} character differences). "
            f"Expected: '{expected_text}', Detected: '{detected_text}'. "
            f"Character-level diffs: [{mismatch_details}]. "
            f"Likely tampered with alphanumeric alterations (e.g., '0'→'O', '1'→'I')."
        )
        logger.info(f"[Agent 4] Decision: ALTERED SERIAL NUMBER → Escalate. Fraud Score: {fraud_score}")

    # 4. NON-OEM LABEL → Color histogram mismatch despite correct text
    elif color_loss > 0.35:
        category = "Non-OEM label"
        verdict = "mismatched"
        recommended_action = "Escalate to vendor"
        confidence = 0.85
        fraud_score = 40
        reason_note = (
            f"NON-OEM LABEL: Color histogram similarity ({color_sim:.2f}) indicates "
            f"label hue/font/material differs from golden reference. "
            f"Despite correct serial number format, the label stock or printing process is non-original."
        )
        logger.info(f"[Agent 4] Decision: NON-OEM LABEL → Escalate to vendor. Fraud Score: {fraud_score}")

    # 5. REUSED BOARD → SSIM structural diff with good keypoints (layout matches but wear visible)
    elif ssim_loss > 0.15:  # SSIM < 0.85
        category = "Reused board"
        verdict = "reused"
        recommended_action = "Request additional angle"
        confidence = 0.80
        fraud_score = 35
        reason_note = (
            f"REUSED BOARD: Layout structure matches golden (keypoints={kp_ratio:.2f}) but "
            f"SSIM score ({ssim:.2f}) detects surface wear, residue, or minor physical differences. "
            f"This suggests the component was previously used and returned as new."
        )
        logger.info(f"[Agent 4] Decision: REUSED BOARD → Request additional angle. Fraud Score: {fraud_score}")

    # 6. FALSE ALARM / LIGHTING ISSUE → SSIM below target but no other indicators
    elif ssim < ssim_target:
        category = "False alarm (lighting)"
        verdict = "clean"
        recommended_action = "Triage Agent requests retake"
        confidence = 0.60
        fraud_score = 15
        reason_note = (
            f"FALSE ALARM (LIGHTING): SSIM score ({ssim:.2f}) is below threshold ({ssim_target:.2f}) "
            f"but no other fraud indicators detected (OCR={ocr_sim:.2f}, keypoints={kp_ratio:.2f}). "
            f"Anomaly hotspots likely caused by lighting/exposure differences, not actual tampering. "
            f"Recommending retake with improved lighting for confirmation."
        )
        logger.info(f"[Agent 4] Decision: FALSE ALARM (lighting) → Retake requested. Fraud Score: {fraud_score}")

    # --- MULTIMODAL VISION INTEGRATION ---
    multimodal_report = ensemble_results.get("multimodal_report", "")
    if multimodal_report and "visual comparison failed" not in multimodal_report.lower() and "visual comparison skipped" not in multimodal_report.lower():
        if "no anomalies detected" in multimodal_report.lower():
            logger.info("[Agent 4] Multimodal Vision confirmed: No anomalies.")
            if verdict == "clean":
                confidence = min(1.0, confidence + 0.08)
                fraud_score = max(0, fraud_score - 5)
        else:
            logger.info(f"[Agent 4] Multimodal Vision flagged: {multimodal_report[:100]}...")
            if verdict == "clean":
                reason_note += f" Visual AI noted possible differences, but deterministic detectors did not corroborate them: {multimodal_report[:200]}"
            else:
                fraud_score = min(100, fraud_score + 5)
                reason_note += f" Visual AI supporting note: {multimodal_report[:200]}"

    # --- COMPUTE WEIGHTED FRAUD SCORE (if not already set by specific verdict) ---
    if verdict in ("clean", "reused") and not source_reference_identical:
        weighted_score = (ssim_loss * 35) + (ocr_loss * 20) + (vec_loss * 15) + (min(kp_loss, 1.0) * 15) + (template_loss * 10) + (color_loss * 5)
        calc_fraud = int(min(max(weighted_score * 1.5, 0.0), 100.0))
        # Use the higher of calculated score vs verdict-based score
        if verdict == "reused":
            fraud_score = max(fraud_score, calc_fraud)
        elif verdict == "clean" and calc_fraud > 10:
            fraud_score = calc_fraud
            if fraud_score > 30:
                # Even clean needs some attention if fraud score creeps up
                reason_note += f" (calculated risk score: {fraud_score})"
    elif verdict in ("tampered", "missing"):
        # For severe verdicts, floor the score
        fraud_score = max(fraud_score, 60)

    # Ensure fraud score is within bounds
    fraud_score = int(min(max(fraud_score, 0), 100))

    # Borderline confidence triggers human review
    if 40 <= fraud_score <= 70:
        confidence = min(confidence, 0.45)
        reason_note += " [BORDERLINE: Fraud score 40-70 range → Human review recommended.]"

    if anomaly_regions:
        region_bits = [
            f"{r.get('location', 'unknown')} x={r.get('x')} y={r.get('y')} w={r.get('w')} h={r.get('h')}"
            for r in anomaly_regions[:3]
        ]
        reason_note += f" Evidence regions: {'; '.join(region_bits)}."

    if recommended_action not in VALID_ACTIONS:
        logger.warning(f"[Agent 4] Invalid recommended action '{recommended_action}'. Falling back to Quarantine & Escalate.")
        recommended_action = "Quarantine & Escalate"

    logger.info(f"[Agent 4] FINAL DECISION: Verdict={verdict.upper()}, Score={fraud_score}/100, Confidence={confidence:.2f}, Action={recommended_action}")

    return {
        "fraud_score": fraud_score,
        "verdict": verdict,
        "category": category,
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

    logger.info(f"[Agent 4] Running Multi-Angle Fusion on {len(angle_results)} inspection angles...")
    
    angles_analyzed = [item.get("angle", f"angle_{idx+1}") for idx, item in enumerate(angle_results)]
    scores = [float(item.get("fraud_score", 0)) for item in angle_results]
    confidences = [float(item.get("confidence", 0.5)) for item in angle_results]
    verdicts = [item.get("verdict", "clean").lower() for item in angle_results]
    actions = [item.get("recommended_action", "Accept") for item in angle_results]

    # 1. Probabilistic Noisy-OR Fusion for Fraud Score
    prod_clean = 1.0
    for s in scores:
        prod_clean *= (1.0 - (min(max(s, 0.0), 100.0) / 100.0))
    
    fused_score = int(round((1.0 - prod_clean) * 100.0))
    fused_score = min(max(fused_score, int(max(scores))), 100)

    # 2. Priority Hierarchy for Fused Verdict
    verdict_priority = {"tampered": 5, "missing": 4, "mismatched": 3, "reused": 2, "clean": 1}
    sorted_by_severity = sorted(angle_results, key=lambda x: verdict_priority.get(x.get("verdict", "clean").lower(), 1), reverse=True)
    fused_verdict = sorted_by_severity[0].get("verdict", "clean")

    # 3. Action Assignment
    action_priority = {"Quarantine & Escalate": 4, "Request Vendor Verification": 3, "Request Additional Angle": 2, "Accept": 1}
    sorted_by_action = sorted(angle_results, key=lambda x: action_priority.get(x.get("recommended_action", "Accept"), 1), reverse=True)
    fused_action = sorted_by_action[0].get("recommended_action", "Accept")

    # 4. Agreement Multiplier for Fused Confidence
    matching_verdicts_count = sum(1 for v in verdicts if v == fused_verdict)
    base_confidence = max(confidences)
    confidence_boost = (matching_verdicts_count - 1) * 0.05
    fused_confidence = round(min(1.0, base_confidence + confidence_boost), 2)

    # 5. Build Fusion Summary
    angle_details_str = ", ".join([f"{a.get('angle', 'unknown')}: score {a.get('fraud_score')}/100 ({a.get('verdict')})" for a in angle_results])
    fusion_summary = (
        f"Multi-Angle Fusion completed across {len(angle_results)} views ({', '.join(angles_analyzed)}). "
        f"Individual results: [{angle_details_str}]. "
        f"Cross-angle evidence agreement elevates combined fraud confidence to {fused_confidence * 100:.0f}% with a fused risk score of {fused_score}/100."
    )

    logger.info(f"[Agent 4] Multi-Angle Fusion Result: Fused Score={fused_score}, Verdict={fused_verdict.upper()}, Confidence={fused_confidence}")

    return {
        "fused_fraud_score": fused_score,
        "fused_verdict": fused_verdict,
        "fused_confidence": fused_confidence,
        "fused_action": fused_action,
        "fusion_summary": fusion_summary,
        "angles_analyzed": angles_analyzed
    }
