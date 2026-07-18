import os
import cv2
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from app.database import get_db
from app.config import settings
from app import models, schemas, utils, services

router = APIRouter(prefix="/inspections", tags=["Inspections"])

@router.post("", response_model=schemas.InspectionResponse, status_code=status.HTTP_201_CREATED)
async def create_inspection(
    product_id: int = Form(...),
    capture_site: str = Form(...),
    capture_angle: str = Form("top"),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(utils.get_current_user)
):
    # 1. Verify product exists
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # 2. Verify Golden Reference exists for this product and angle
    golden_ref = db.query(models.GoldenReference).filter(
        models.GoldenReference.product_id == product_id,
        models.GoldenReference.angle == capture_angle
    ).first()
    if not golden_ref:
        raise HTTPException(
            status_code=400, 
            detail=f"No Golden Reference image found for this product and angle ({capture_angle})"
        )

    # 3. Create case folder & Save uploaded file
    case_id = str(uuid.uuid4())
    file_ext = os.path.splitext(file.filename)[1]
    filename = f"{case_id}_captured{file_ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, filename)

    try:
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save uploaded image: {str(e)}")

    # 4. Initialize Database Inspection record as pending
    db_inspection = models.Inspection(
        case_id=case_id,
        product_id=product_id,
        user_id=current_user.id,
        captured_image_path=file_path,
        capture_site=capture_site,
        capture_angle=capture_angle,
        status="pending"
    )
    db.add(db_inspection)
    db.commit()
    db.refresh(db_inspection)

    # 5. Run Ingestion & Alignment Quality check
    triage_result = services.process_and_validate(file_path, golden_ref.image_path)
    if triage_result["status"] == "fail":
        # Ingestion Quality check failed (Blurry or Poor light) -> Update status to retake_needed
        db_inspection.status = "retake_needed"
        db.commit()
        db.refresh(db_inspection)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "message": triage_result["detail"],
                "case_id": case_id,
                "status": "retake_needed"
            }
        )

    # 6. Run Vision Anomaly Detection Ensemble
    aligned_img = triage_result["aligned_image"]
    ref_img = cv2.imread(golden_ref.image_path)
    
    # Get Golden Reference ROI Config (to crop labels and check expected text)
    roi_config = {
        "label_roi": golden_ref.roi_config.get("label_roi") if golden_ref.roi_config else None,
        "expected_serial": golden_ref.expected_serial
    }
    
    ensemble_results = services.run_anomaly_ensemble(aligned_img, ref_img, roi_config)

    # 7. Run Decision Agent
    decision = services.make_decision(ensemble_results)

    # 8. Save Anomaly heatmaps to files
    heatmap_name = f"{case_id}_heatmap{file_ext}"
    heatmap_path = os.path.join(settings.UPLOAD_DIR, heatmap_name)
    try:
        cv2.imwrite(heatmap_path, ensemble_results["heatmap_img"])
    except Exception as e:
        print(f"Error saving heatmap image: {e}")
        heatmap_path = None

    # 9. Run Explainer Agent
    metrics_for_explain = {
        "ssim_score": ensemble_results["ssim_score"],
        "verdict": decision["verdict"],
        "fraud_score": decision["fraud_score"],
        "detected_text": ensemble_results["detected_text"],
        "expected_text": golden_ref.expected_serial,
        "ocr_mismatches": ensemble_results["ocr_mismatches"],
        "recommended_action": decision["recommended_action"]
    }
    explanation = services.generate_explanation(metrics_for_explain)

    # 10. Commit results to Database
    db_result = models.InspectionResult(
        inspection_id=db_inspection.id,
        ssim_score=ensemble_results["ssim_score"],
        keypoint_match_rate=triage_result["alignment_rate"],
        ocr_detected_text=ensemble_results["detected_text"],
        ocr_expected_text=golden_ref.expected_serial,
        fraud_score=decision["fraud_score"],
        verdict=decision["verdict"],
        confidence=decision["confidence"],
        recommended_action=decision["recommended_action"],
        explanation=explanation,
        heatmap_path=heatmap_path
    )
    db.add(db_result)

    # Mark inspection status completed
    db_inspection.status = "completed"
    db.commit()
    db.refresh(db_inspection)

    return db_inspection

@router.get("", response_model=List[schemas.InspectionResponse])
def list_inspections(db: Session = Depends(get_db)):
    return db.query(models.Inspection).order_by(models.Inspection.created_at.desc()).all()

@router.get("/{case_id}", response_model=schemas.InspectionResponse)
def get_inspection_by_case(case_id: str, db: Session = Depends(get_db)):
    inspection = db.query(models.Inspection).filter(models.Inspection.case_id == case_id).first()
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection case not found")
    return inspection
