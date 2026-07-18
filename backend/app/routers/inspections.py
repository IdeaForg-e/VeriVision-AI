import os
import cv2
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from app.database import get_db
from app.config import settings
from app import models, schemas, utils, services
from app.agents.workflow import run_inspection_pipeline

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

    # 5. Run Ingestion, Alignment & Anomaly Detection using the LangGraph Workflow
    initial_state = {
        "case_id": case_id,
        "image_path": file_path,
        "golden_path": golden_ref.image_path,
        "expected_serial": golden_ref.expected_serial,
        "roi_config": golden_ref.roi_config
    }
    
    try:
        pipeline_result = run_inspection_pipeline(initial_state)
    except Exception as e:
        db_inspection.status = "failed"
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inspection pipeline execution failed: {str(e)}"
        )
        
    if pipeline_result["status"] == "retake_needed":
        db_inspection.status = "retake_needed"
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "message": pipeline_result["triage_detail"],
                "case_id": case_id,
                "status": "retake_needed"
            }
        )
        
    if pipeline_result["status"] == "failed":
        db_inspection.status = "failed"
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=pipeline_result.get("triage_detail", "Internal engine failure during inspection processing.")
        )

    # 6. Commit results to Database
    db_result = models.InspectionResult(
        inspection_id=db_inspection.id,
        ssim_score=pipeline_result["ssim_score"],
        keypoint_match_rate=pipeline_result["alignment_rate"],
        ocr_detected_text=pipeline_result["ocr_detected_text"],
        ocr_expected_text=pipeline_result["ocr_expected_text"],
        fraud_score=pipeline_result["fraud_score"],
        verdict=pipeline_result["verdict"],
        confidence=pipeline_result["confidence"],
        recommended_action=pipeline_result["recommended_action"],
        explanation=pipeline_result["explanation"],
        heatmap_path=pipeline_result["heatmap_path"]
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
