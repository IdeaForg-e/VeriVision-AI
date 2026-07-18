from app.config import settings


def make_decision(ensemble_results: dict) -> dict:
    """
    Evaluates evidence from Vision Layer and computes the final verdict,
    fraud score (0-100), confidence level, and recommended action.
    """
    ssim = ensemble_results.get("ssim_score", 1.0)
    ocr_sim = ensemble_results.get("ocr_similarity", 1.0)
    ocr_mismatches = ensemble_results.get("ocr_mismatches", [])
    kp_ratio = ensemble_results.get("keypoint_ratio", 1.0)
    expected_text = ensemble_results.get("expected_text", "")
    detected_text = ensemble_results.get("detected_text", "")
    template_found = ensemble_results.get("template_match_found", True)
    color_similarity = ensemble_results.get("color_hist_similarity", 1.0)

    ssim_loss = max(0.0, 1.0 - ssim)
    ocr_loss = max(0.0, 1.0 - ocr_sim)
    kp_loss = abs(1.0 - kp_ratio)
    template_loss = 0.0 if template_found else 1.0
    color_loss = max(0.0, 1.0 - color_similarity)

    weighted_score = (ssim_loss * 40) + (ocr_loss * 25) + (min(kp_loss, 1.0) * 15) + (template_loss * 10) + (color_loss * 10)
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

    if not template_found and verdict == "clean":
        verdict = "mismatched"
        recommended_action = "Quarantine & Escalate"
        confidence = 0.90

    if color_similarity < 0.6 and verdict == "clean":
        verdict = "mismatched"
        recommended_action = "Request Vendor Verification"
        confidence = 0.85

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
