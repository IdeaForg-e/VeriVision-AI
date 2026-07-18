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

    # We will build a weighted anomaly scoring system
    # Base indicators:
    # 1. SSIM structural variance
    ssim_loss = max(0.0, 1.0 - ssim)
    
    # 2. OCR text mismatches
    ocr_loss = max(0.0, 1.0 - ocr_sim)

    # 3. Keypoint count change (indicator of components swapped or heavily scratched)
    kp_loss = abs(1.0 - kp_ratio)

    # Calculate weighted Fraud Score
    # Weights: SSIM = 50%, OCR = 30%, Keypoints = 20%
    weighted_score = (ssim_loss * 50) + (ocr_loss * 30) + (min(kp_loss, 1.0) * 20)
    fraud_score = int(min(max(weighted_score * 1.5, 0.0), 100.0))  # Scale up slightly for visibility

    # Determine Category Verdict and Recommended Action
    verdict = "clean"
    recommended_action = "Accept"
    confidence = 0.90  # Default baseline confidence

    # High ssim loss but OCR is fine -> Tampered or Reused
    if ssim_loss > 0.35:
        if kp_loss > 0.40:
            verdict = "tampered"
            recommended_action = "Quarantine & Escalate"
            confidence = 0.95
        else:
            verdict = "reused"
            recommended_action = "Request Vendor Verification"
            confidence = 0.85
    
    # Missing Label case
    # If the expected label exists, but no text is detected and ssim is low around label area
    if expected_text and not detected_text.strip():
        verdict = "missing"
        recommended_action = "Quarantine & Escalate"
        confidence = 0.98
    
    # Text mismatch case
    elif len(ocr_mismatches) > 0:
        verdict = "mismatched"
        recommended_action = "Quarantine & Escalate"
        confidence = 0.95
        
        # Check if characters are typical leet-speak substitutions
        # If it's a minor error (like O instead of 0 or I instead of 1)
        substitutions = {('O', '0'), ('0', 'O'), ('I', '1'), ('1', 'I'), ('S', '5'), ('5', 'S')}
        is_minor_leet = all(
            (m.get("detected"), m.get("expected")) in substitutions 
            for m in ocr_mismatches
        )
        if is_minor_leet:
            recommended_action = "Request Vendor Verification"
            confidence = 0.80

    # Low lighting/blur triggers retake inside routers, but if it reaches here:
    if ssim < settings.SSIM_THRESHOLD and verdict == "clean":
        verdict = "clean"
        recommended_action = "Accept"
        confidence = 0.60  # Low confidence due to structural noise

    # Force review logic on borderline cases
    if 40 <= fraud_score <= 70:
        # Flag for human intervention by dropping confidence below review threshold
        confidence = 0.45

    return {
        "fraud_score": fraud_score,
        "verdict": verdict,
        "confidence": confidence,
        "recommended_action": recommended_action
    }
