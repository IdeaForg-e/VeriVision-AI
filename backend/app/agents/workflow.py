import os
import cv2
import numpy as np
import logging
from typing import TypedDict, Dict, Any, Optional, List
from langgraph.graph import StateGraph, END

from app import services
from app.config import settings

logger = logging.getLogger(__name__)

class InspectionState(TypedDict):
    # Inputs
    case_id: str
    image_path: str
    golden_path: str
    expected_serial: Optional[str]
    roi_config: Optional[dict]
    
    # Ingestion/Triage results
    triage_status: str          # "pass" or "fail"
    triage_detail: str          # detail messages
    blur_score: float
    brightness_score: float
    alignment_rate: float
    aligned_image: Optional[np.ndarray]  # numpy array of aligned image
    
    # Anomaly detection results
    ssim_score: Optional[float]
    ocr_detected_text: Optional[str]
    ocr_expected_text: Optional[str]
    ocr_similarity: Optional[float]
    ocr_mismatches: Optional[List[dict]]
    keypoint_ratio: Optional[float]
    template_match_score: Optional[float]
    template_match_found: Optional[bool]
    color_hist_similarity: Optional[float]
    heatmap_path: Optional[str]
    
    # Decision/Policy results
    fraud_score: Optional[int]
    verdict: Optional[str]
    confidence: Optional[float]
    recommended_action: Optional[str]
    explanation: Optional[str]
    
    # Final workflow state
    status: str                 # "completed", "retake_needed", "failed"

# 1. Triage Agent Node
def triage_node(state: InspectionState) -> Dict[str, Any]:
    """
    Validates image quality (blur, lighting) and performs geometric alignment.
    """
    case_id = state["case_id"]
    logger.info(f"[Node: Triage] Running quality and alignment validation for Case {case_id}")
    
    image_path = state["image_path"]
    golden_path = state["golden_path"]
    
    triage_result = services.process_and_validate(image_path, golden_path)
    
    if triage_result["status"] == "fail":
        logger.warning(f"[Node: Triage] Validation failed for Case {case_id}: {triage_result['detail']}")
        return {
            "triage_status": "fail",
            "triage_detail": triage_result["detail"],
            "blur_score": triage_result.get("blur_score", 0.0),
            "brightness_score": triage_result.get("brightness_score", 0.0),
            "status": "retake_needed"
        }
    
    logger.info(f"[Node: Triage] Validation passed for Case {case_id}. Clarity: {triage_result.get('blur_score'):.1f}, Brightness: {triage_result.get('brightness_score'):.1f}, Alignment matches: {triage_result.get('alignment_rate'):.3f}")
    return {
        "triage_status": "pass",
        "triage_detail": "",
        "blur_score": triage_result.get("blur_score", 0.0),
        "brightness_score": triage_result.get("brightness_score", 0.0),
        "alignment_rate": triage_result.get("alignment_rate", 0.0),
        "aligned_image": triage_result.get("aligned_image"),
        "status": "processing"
    }

# 2. Reference Selection Node
def select_reference_node(state: InspectionState) -> Dict[str, Any]:
    """
    Ensures the golden reference parameters are parsed and ready.
    """
    case_id = state["case_id"]
    golden_path = state["golden_path"]
    logger.info(f"[Node: Ref Selector] Matching Golden Reference for Case {case_id} at: {golden_path}")
    
    if not os.path.exists(golden_path):
        logger.error(f"[Node: Ref Selector] Golden Reference missing on disk for Case {case_id}: {golden_path}")
        return {
            "status": "failed",
            "triage_status": "fail",
            "triage_detail": "Golden reference image file missing from disk."
        }
        
    logger.info(f"[Node: Ref Selector] Golden Reference file validated successfully for Case {case_id}")
    return {}

# 3. Anomaly Detection Ensemble Node
def detect_anomalies_node(state: InspectionState) -> Dict[str, Any]:
    """
    Runs the vision detection suite (SSIM difference, EasyOCR string checking, Keypoint counts).
    """
    case_id = state["case_id"]
    if state.get("status") == "failed" or state.get("triage_status") == "fail":
        logger.warning(f"[Node: Anomaly Ensemble] Skipping anomaly detection because previous step failed for Case {case_id}")
        return {}

    logger.info(f"[Node: Anomaly Ensemble] Running CV detectors (SSIM, Keypoints, Template, Color, OCR) for Case {case_id}")
    
    aligned_img = state["aligned_image"]
    ref_img = cv2.imread(state["golden_path"])
    
    if ref_img is None:
        logger.error(f"[Node: Anomaly Ensemble] Unable to load golden reference image from disk for Case {case_id}")
        return {
            "status": "failed",
            "triage_detail": "Could not read golden reference image during detection stage."
        }
        
    roi_config = {
        "label_roi": state["roi_config"].get("label_roi") if state["roi_config"] else None,
        "expected_serial": state["expected_serial"],
        "template_roi": state["roi_config"].get("template_roi") if state["roi_config"] else None,
        "color_roi": state["roi_config"].get("color_roi") if state["roi_config"] else None
    }
    
    ensemble_results = services.run_anomaly_ensemble(aligned_img, ref_img, roi_config)
    
    # Save the heatmap image to disk inside this node
    file_ext = os.path.splitext(state["image_path"])[1]
    heatmap_name = f"{case_id}_heatmap{file_ext}"
    heatmap_path = os.path.join(settings.UPLOAD_DIR, heatmap_name)
    
    logger.info(f"[Node: Anomaly Ensemble] Generating and saving anomaly difference heatmap to {heatmap_path}")
    try:
        cv2.imwrite(heatmap_path, ensemble_results["heatmap_img"])
    except Exception as e:
        logger.error(f"[Node: Anomaly Ensemble] Failed to save heatmap for Case {case_id}: {e}")
        heatmap_path = None
        
    logger.info(f"[Node: Anomaly Ensemble] CV Checks complete. SSIM: {ensemble_results['ssim_score']:.3f}, Keypoint Match: {ensemble_results['keypoint_ratio']:.3f}, Template status: {ensemble_results.get('template_match_found')}, Color corr: {ensemble_results.get('color_hist_similarity'):.3f}")
    return {
        "ssim_score": ensemble_results["ssim_score"],
        "ocr_detected_text": ensemble_results["detected_text"],
        "ocr_expected_text": state["expected_serial"],
        "ocr_similarity": ensemble_results["ocr_similarity"],
        "ocr_mismatches": ensemble_results["ocr_mismatches"],
        "keypoint_ratio": ensemble_results["keypoint_ratio"],
        "template_match_score": ensemble_results.get("template_match_score", 1.0),
        "template_match_found": ensemble_results.get("template_match_found", True),
        "color_hist_similarity": ensemble_results.get("color_hist_similarity", 1.0),
        "heatmap_path": heatmap_path
    }

# 4. Policy & Decision Node
def decision_node(state: InspectionState) -> Dict[str, Any]:
    """
    Evaluates detectors output to compute final fraud score, verdict, confidence, and recommended action.
    """
    case_id = state["case_id"]
    if state.get("status") == "failed" or state.get("triage_status") == "fail":
        logger.warning(f"[Node: Decision Judge] Skipping decision judging because previous step failed for Case {case_id}")
        return {}

    logger.info(f"[Node: Decision Judge] Evaluating metrics using LLM Compliance Judge for Case {case_id}")
    
    ensemble_results = {
        "ssim_score": state["ssim_score"],
        "ocr_similarity": state["ocr_similarity"],
        "ocr_mismatches": state["ocr_mismatches"],
        "keypoint_ratio": state["keypoint_ratio"],
        "expected_text": state["expected_serial"],
        "detected_text": state["ocr_detected_text"],
        "template_match_score": state.get("template_match_score", 1.0),
        "template_match_found": state.get("template_match_found", True),
        "color_hist_similarity": state.get("color_hist_similarity", 1.0)
    }
    
    decision = services.make_decision(ensemble_results)
    logger.info(f"[Node: Decision Judge] Logic complete for Case {case_id}. Verdict: {decision['verdict'].upper()}, Score: {decision['fraud_score']}/100, Action: {decision['recommended_action']}")
    
    return {
        "fraud_score": decision["fraud_score"],
        "verdict": decision["verdict"],
        "confidence": decision["confidence"],
        "recommended_action": decision["recommended_action"]
    }

# 5. Explainer Agent Node
def explainer_node(state: InspectionState) -> Dict[str, Any]:
    """
    Generates natural language explanation for findings.
    """
    case_id = state["case_id"]
    if state.get("status") == "failed" or state.get("triage_status") == "fail":
        logger.warning(f"[Node: Explainer Agent] Skipping explanation generation because previous step failed for Case {case_id}")
        return {}

    logger.info(f"[Node: Explainer Agent] Writing audit reasoning for Case {case_id}")
    
    metrics_for_explain = {
        "ssim_score": state["ssim_score"],
        "verdict": state["verdict"],
        "fraud_score": state["fraud_score"],
        "detected_text": state["ocr_detected_text"],
        "expected_text": state["expected_serial"],
        "ocr_mismatches": state["ocr_mismatches"],
        "recommended_action": state["recommended_action"],
        "template_match_score": state.get("template_match_score", 1.0),
        "template_match_found": state.get("template_match_found", True),
        "color_hist_similarity": state.get("color_hist_similarity", 1.0)
    }
    
    explanation = services.generate_explanation(metrics_for_explain)
    logger.info(f"[Node: Explainer Agent] Audit rationale successfully compiled for Case {case_id}")
    
    return {
        "explanation": explanation,
        "status": "completed"
    }

# Conditional Routing Function
def check_triage_condition(state: InspectionState) -> str:
    """
    Checks if triage has failed.
    """
    if state.get("triage_status") == "fail":
        logger.warning(f"[Routing: Ingestion Fail] Bypassing pipeline directly to End due to Ingestion Quality rejection.")
        return "retake"
    logger.info(f"[Routing: Ingestion Pass] Routing flow to Reference selector node.")
    return "continue"

# Build the LangGraph StateGraph workflow
workflow = StateGraph(InspectionState)

# Add all agent/service nodes
workflow.add_node("triage", triage_node)
workflow.add_node("select_reference", select_reference_node)
workflow.add_node("detect_anomalies", detect_anomalies_node)
workflow.add_node("decision", decision_node)
workflow.add_node("explainer", explainer_node)

# Define execution flow edges
workflow.set_entry_point("triage")

# Triage conditional routing
workflow.add_conditional_edges(
    "triage",
    check_triage_condition,
    {
        "retake": END,
        "continue": "select_reference"
    }
)

workflow.add_edge("select_reference", "detect_anomalies")
workflow.add_edge("detect_anomalies", "decision")
workflow.add_edge("decision", "explainer")
workflow.add_edge("explainer", END)

# Compile graph
app_workflow = workflow.compile()

def run_inspection_pipeline(initial_state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Helper function to run the compiled StateGraph with initial parameters.
    """
    state_input = {
        "case_id": initial_state["case_id"],
        "image_path": initial_state["image_path"],
        "golden_path": initial_state["golden_path"],
        "expected_serial": initial_state.get("expected_serial"),
        "roi_config": initial_state.get("roi_config"),
        "triage_status": "pass",
        "triage_detail": "",
        "blur_score": 0.0,
        "brightness_score": 0.0,
        "alignment_rate": 0.0,
        "aligned_image": None,
        "ssim_score": None,
        "ocr_detected_text": None,
        "ocr_expected_text": None,
        "ocr_similarity": None,
        "ocr_mismatches": None,
        "keypoint_ratio": None,
        "template_match_score": None,
        "template_match_found": None,
        "color_hist_similarity": None,
        "heatmap_path": None,
        "fraud_score": None,
        "verdict": None,
        "confidence": None,
        "recommended_action": None,
        "explanation": None,
        "status": "pending"
    }
    
    return app_workflow.invoke(state_input)
