import os
import sys

# Add backend directory to path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(backend_dir)

from app.agents.workflow import run_inspection_pipeline

def test_missing_label():
    print("Testing Missing Label scenario...")
    
    # Paths relative to backend_dir
    image_path = os.path.join(os.path.dirname(backend_dir), "dataset", "defect_missing_label.png")
    golden_path = os.path.join(backend_dir, "data", "golden", "golden_label_close.png")
    
    print(f"Defective image exists: {os.path.exists(image_path)}")
    print(f"Golden image exists: {os.path.exists(golden_path)}")
    
    initial_state = {
        "case_id": "test-case-missing-label-uuid",
        "image_path": image_path,
        "golden_path": golden_path,
        "expected_serial": "91165LUS0DDD",
        "roi_config": {"label_roi": {"x": 420, "y": 50, "width": 420, "height": 220}}
    }
    
    print("\nInvoking LangGraph pipeline...")
    result = run_inspection_pipeline(initial_state)
    
    print("\n--- PIPELINE RESULTS ---")
    print(f"Status: {result['status']}")
    print(f"Triage status: {result['triage_status']}")
    print(f"Triage details: {result['triage_detail']}")
    print(f"SSIM Score: {result['ssim_score']}")
    print(f"OCR Detected Text: '{result['ocr_detected_text']}'")
    print(f"OCR Expected Text: '{result['ocr_expected_text']}'")
    print(f"OCR Similarity: {result['ocr_similarity']}")
    print(f"OCR Mismatches: {result['ocr_mismatches']}")
    print(f"Keypoint Ratio: {result['keypoint_ratio']}")
    print(f"Heatmap path: {result['heatmap_path']}")
    print(f"Fraud Score: {result['fraud_score']}/100")
    print(f"Verdict: {result['verdict']}")
    print(f"Confidence: {result['confidence']}")
    print(f"Recommended Action: {result['recommended_action']}")
    print(f"Explanation: {result['explanation']}")

if __name__ == "__main__":
    test_missing_label()
