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
    commodity: Optional[str]
    
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
    source_reference_identical: bool
    heatmap_path: Optional[str]
    multimodal_report: Optional[str]
    
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
    logger.info("\n" + "="*80 + f"\n🚀 [START] NODE: triage (Agent 2: Triage & Aligner) - Case {case_id}\n" + "="*80)
    
    image_path = state["image_path"]
    golden_path = state["golden_path"]
    
    triage_result = services.process_and_validate(image_path, golden_path)
    
    if triage_result["status"] == "fail":
        logger.warning(f"❌ [Node: Triage] Validation failed for Case {case_id}: {triage_result['detail']}")
        logger.info("\n" + "="*80 + f"\n⏹️ [FINISHED] NODE: triage (FAILED) - Case {case_id}\n" + "="*80)
        return {
            "triage_status": "fail",
            "triage_detail": triage_result["detail"],
            "blur_score": triage_result.get("blur_score", 0.0),
            "brightness_score": triage_result.get("brightness_score", 0.0),
            "status": "retake_needed"
        }
    
    logger.info(f"⚙️ [Node: Triage] Clarity: {triage_result.get('blur_score'):.1f}, Brightness: {triage_result.get('brightness_score'):.1f}, Alignment matches: {triage_result.get('alignment_rate'):.3f}")
    logger.info("\n" + "="*80 + f"\n✅ [FINISHED] NODE: triage (SUCCESS) - Case {case_id}\n" + "="*80)
    return {
        "triage_status": "pass",
        "triage_detail": triage_result.get("detail", ""),
        "blur_score": triage_result.get("blur_score", 0.0),
        "brightness_score": triage_result.get("brightness_score", 0.0),
        "alignment_rate": triage_result.get("alignment_rate", 0.0),
        "aligned_image": triage_result.get("aligned_image"),
        "status": "processing"
    }

# 2. Reference Selection Node
def select_reference_node(state: InspectionState) -> Dict[str, Any]:
    """
    Checks if the uploaded golden reference standard and target scan images are fit for comparison.
    """
    case_id = state["case_id"]
    logger.info("\n" + "="*80 + f"\n🚀 [START] NODE: select_reference (Agent 1: Selector / Gatekeeper) - Case {case_id}\n" + "="*80)
    
    viability_result = services.verify_comparison_viability(state["image_path"], state["golden_path"])
    
    if not viability_result["viable"]:
        logger.warning(f"❌ [Node: Ref Selector] Viability check failed for Case {case_id}: {viability_result['detail']}")
        logger.info("\n" + "="*80 + f"\n⏹️ [FINISHED] NODE: select_reference (FAILED) - Case {case_id}\n" + "="*80)
        return {
            "status": "failed",
            "triage_detail": viability_result["detail"]
        }
        
    logger.info(f"🏷️ [Node: Ref Selector] Dynamic part classification loaded: '{state.get('commodity')}'")
    logger.info("\n" + "="*80 + f"\n✅ [FINISHED] NODE: select_reference (SUCCESS) - Case {case_id}\n" + "="*80)
    return {}


# 3. Anomaly Detection Ensemble Node
def detect_anomalies_node(state: InspectionState) -> Dict[str, Any]:
    """
    Runs the vision detection suite (SSIM difference, EasyOCR string checking, Keypoint counts).
    """
    case_id = state["case_id"]
    logger.info("\n" + "="*80 + f"\n🚀 [START] NODE: detect_anomalies (Agent 3: Vision-AI Hybrid Inspector) - Case {case_id}\n" + "="*80)
    if state.get("status") == "failed" or state.get("triage_status") == "fail":
        logger.warning(f"⚠️ [Node: Anomaly Ensemble] Skipping anomaly detection because previous step failed for Case {case_id}")
        logger.info("\n" + "="*80 + f"\n⏹️ [FINISHED] NODE: detect_anomalies (SKIPPED) - Case {case_id}\n" + "="*80)
        return {}

    aligned_img = state["aligned_image"]
    ref_img = cv2.imread(state["golden_path"])
    
    if ref_img is None:
        logger.error(f"❌ [Node: Anomaly Ensemble] Unable to load golden reference image from disk for Case {case_id}")
        logger.info("\n" + "="*80 + f"\n⏹️ [FINISHED] NODE: detect_anomalies (FAILED) - Case {case_id}\n" + "="*80)
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
    
    # Keep a direct, pre-alignment comparison as the ground truth for an
    # identical upload.  A homography/illumination pass may introduce small
    # interpolation changes, and OCR can misread a perfectly valid label.
    # Neither is evidence of fraud when the decoded upload is exactly the
    # golden reference.
    original_img = cv2.imread(state["image_path"])
    source_reference_identical = bool(
        original_img is not None
        and original_img.shape == ref_img.shape
        and np.array_equal(original_img, ref_img)
    )

    commodity = state.get("commodity", "motherboard")
    ensemble_results = services.run_anomaly_ensemble(
        aligned_img,
        ref_img,
        roi_config,
        src_image_path=state["image_path"],
        ref_image_path=state["golden_path"],
        commodity=commodity
    )
    ensemble_results["source_reference_identical"] = source_reference_identical
    
    # Save the heatmap image to disk inside this node
    file_ext = os.path.splitext(state["image_path"])[1]
    heatmap_name = f"{case_id}_heatmap{file_ext}"
    heatmap_path = os.path.join(settings.UPLOAD_DIR, heatmap_name)
    
    logger.info(f"[Node: Anomaly Ensemble] Saving annotated anomaly heatmap image to {heatmap_path}")
    try:
        cv2.imwrite(heatmap_path, ensemble_results["heatmap_img"])
    except Exception as e:
        logger.error(f"❌ [Node: Anomaly Ensemble] Failed to save heatmap image for Case {case_id}: {e}")
        heatmap_path = None

    # Also save the dynamic diagnostic card to a separate file (for audits/reports)
    if ensemble_results.get("diagnostic_card") is not None:
        diag_name = f"{case_id}_diagnostic{file_ext}"
        diag_path = os.path.join(settings.UPLOAD_DIR, diag_name)
        logger.info(f"[Node: Anomaly Ensemble] Saving side-by-side diagnostic card to {diag_path}")
        try:
            cv2.imwrite(diag_path, ensemble_results["diagnostic_card"])
        except Exception as e:
            logger.error(f"❌ [Node: Anomaly Ensemble] Failed to save diagnostic card: {e}")
        
    logger.info(f"⚙️ [Node: Anomaly Ensemble] Checks complete. SSIM: {ensemble_results['ssim_score']:.3f}, Keypoint Match: {ensemble_results['keypoint_ratio']:.3f}, Template status: {ensemble_results.get('template_match_found')}, Color corr: {ensemble_results.get('color_hist_similarity'):.3f}")
    logger.info("\n" + "="*80 + f"\n✅ [FINISHED] NODE: detect_anomalies (SUCCESS) - Case {case_id}\n" + "="*80)
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
        "source_reference_identical": source_reference_identical,
        "heatmap_path": heatmap_path,
        "multimodal_report": ensemble_results.get("multimodal_report", "No visual report generated.")
    }

# 4. Policy & Decision Node
def decision_node(state: InspectionState) -> Dict[str, Any]:
    """
    Evaluates detectors output to compute final fraud score, verdict, confidence, and recommended action.
    """
    case_id = state["case_id"]
    logger.info("\n" + "="*80 + f"\n🚀 [START] NODE: decision (Agent 4: Decision Judge) - Case {case_id}\n" + "="*80)
    if state.get("status") == "failed" or state.get("triage_status") == "fail":
        logger.warning(f"⚠️ [Node: Decision Judge] Skipping decision judging because previous step failed for Case {case_id}")
        logger.info("\n" + "="*80 + f"\n⏹️ [FINISHED] NODE: decision (SKIPPED) - Case {case_id}\n" + "="*80)
        return {}

    ensemble_results = {
        "ssim_score": state["ssim_score"],
        "ocr_similarity": state["ocr_similarity"],
        "ocr_mismatches": state["ocr_mismatches"],
        "keypoint_ratio": state["keypoint_ratio"],
        "expected_text": state["expected_serial"],
        "detected_text": state["ocr_detected_text"],
        "template_match_score": state.get("template_match_score", 1.0),
        "template_match_found": state.get("template_match_found", True),
        "color_hist_similarity": state.get("color_hist_similarity", 1.0),
        "source_reference_identical": state.get("source_reference_identical", False),
        "multimodal_report": state.get("multimodal_report", ""),
    }
    
    decision = services.make_decision(ensemble_results)
    logger.info(f"⚖️ [Node: Decision Judge] Verdict: {decision['verdict'].upper()}, Score: {decision['fraud_score']}/100, Action: {decision['recommended_action']}")
    logger.info("\n" + "="*80 + f"\n✅ [FINISHED] NODE: decision (SUCCESS) - Case {case_id}\n" + "="*80)
    
    return {
        "fraud_score": decision["fraud_score"],
        "verdict": decision["verdict"],
        "confidence": decision["confidence"],
        "recommended_action": decision["recommended_action"],
        "triage_detail": decision["reasoning"],
    }

# 5. Explainer Agent Node
def explainer_node(state: InspectionState) -> Dict[str, Any]:
    """
    Generates natural language explanation for findings.
    """
    case_id = state["case_id"]
    logger.info("\n" + "="*80 + f"\n🚀 [START] NODE: explainer (Agent 5: LLM Explainer) - Case {case_id}\n" + "="*80)
    if state.get("status") == "failed" or state.get("triage_status") == "fail":
        logger.warning(f"⚠️ [Node: Explainer Agent] Skipping explanation generation because previous step failed for Case {case_id}")
        logger.info("\n" + "="*80 + f"\n⏹️ [FINISHED] NODE: explainer (SKIPPED) - Case {case_id}\n" + "="*80)
        return {}

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
        "color_hist_similarity": state.get("color_hist_similarity", 1.0),
        "reasoning": state.get("triage_detail"),
        "multimodal_report": state.get("multimodal_report", "")
    }
    
    explanation = services.generate_explanation(metrics_for_explain)
    logger.info(f"📝 [Node: Explainer Agent] Generated narrative: {explanation[:120]}...")
    logger.info("\n" + "="*80 + f"\n✅ [FINISHED] NODE: explainer (SUCCESS) - Case {case_id}\n" + "="*80)
    
    return {
        "explanation": explanation,
        "status": "completed"
    }

# Conditional Routing Functions
def check_gatekeeper_condition(state: InspectionState) -> str:
    """
    Checks if the comparison viability gatekeeper check failed.
    """
    if state.get("status") == "failed":
        logger.warning(f"[Routing: Gatekeeper Fail] Bypassing pipeline directly to End due to comparison viability rejection.")
        return "fail"
    logger.info(f"[Routing: Gatekeeper Pass] Routing flow to Triage & Aligner node.")
    return "continue"


def check_triage_condition(state: InspectionState) -> str:
    """
    Checks if triage has failed.
    """
    if state.get("triage_status") == "fail" or state.get("status") == "retake_needed":
        logger.warning(f"[Routing: Triage Fail] Bypassing pipeline directly to End due to Ingestion Quality/Alignment rejection.")
        return "fail"
    logger.info(f"[Routing: Triage Pass] Routing flow to Anomaly Detector Ensemble.")
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
workflow.set_entry_point("select_reference")

# Gatekeeper conditional routing
workflow.add_conditional_edges(
    "select_reference",
    check_gatekeeper_condition,
    {
        "fail": END,
        "continue": "triage"
    }
)

# Triage conditional routing
workflow.add_conditional_edges(
    "triage",
    check_triage_condition,
    {
        "fail": END,
        "continue": "detect_anomalies"
    }
)

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
        "commodity": initial_state.get("commodity", "motherboard"),
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
        "source_reference_identical": False,
        "heatmap_path": None,
        "multimodal_report": None,
        "fraud_score": None,
        "verdict": None,
        "confidence": None,
        "recommended_action": None,
        "explanation": None,
        "status": "pending"
    }
    
    return app_workflow.invoke(state_input)
