import os
import cv2
import numpy as np
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

import logging
from app.database import get_db
from app.config import settings
from app import models, schemas, utils, services
from app.agents.workflow import run_inspection_pipeline

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/inspections", tags=["Inspections"])

@router.post("", response_model=schemas.InspectionResponse, status_code=status.HTTP_201_CREATED)
async def create_inspection(
    product_id: Optional[int] = Form(None),
    capture_site: str = Form(...),
    capture_angle: str = Form("top"),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(utils.get_current_user)
):
    logger.info(f"Incoming inspection request. Product ID: {product_id}, Site: {capture_site}, Angle: {capture_angle}")
    
    # Read file content into memory
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    src_img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if src_img is None:
        raise HTTPException(status_code=400, detail="Invalid uploaded image file.")

    if product_id is None:
        logger.info("Product ID not provided. Running layout matching against all template golden references...")
        # Auto-detect product
        products = db.query(models.Product).all()
        best_product = None
        best_rate = -1.0
        
        try:
            gray_src = cv2.cvtColor(src_img, cv2.COLOR_BGR2GRAY)
            orb = cv2.ORB_create(nfeatures=1000)
            kp_src, des_src = orb.detectAndCompute(gray_src, None)
            
            if des_src is not None:
                bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
                for prod in products:
                    for ref in prod.golden_references:
                        ref_img = cv2.imread(ref.image_path)
                        if ref_img is None:
                            continue
                        gray_ref = cv2.cvtColor(ref_img, cv2.COLOR_BGR2GRAY)
                        kp_ref, des_ref = orb.detectAndCompute(gray_ref, None)
                        if des_ref is None:
                            continue
                        
                        matches = bf.match(des_src, des_ref)
                        good_matches = [m for m in matches if m.distance < 50]
                        match_rate = len(good_matches) / max(len(kp_src), len(kp_ref), 1)
                        logger.info(f"Layout matching template '{prod.part_number}': match rate = {match_rate:.3f}")
                        
                        if match_rate > best_rate:
                            best_rate = match_rate
                            best_product = prod
        except Exception as e:
            logger.error(f"Error during layout auto-detection: {e}")
            
        if best_product and best_rate >= 0.10:
            product = best_product
            product_id = product.id
            logger.info(f"Layout recognized: Product {product.part_number} (ID: {product_id}) matched with {best_rate*100:.1f}% rate")
        else:
            logger.warning("Unrecognized image layout. Match rate below threshold.")
            raise HTTPException(
                status_code=400,
                detail="Golden reference image not found for this product. Please contact your administrator to upload the golden image of the part or product."
            )
    else:
        # 1. Verify product exists
        product = db.query(models.Product).filter(models.Product.id == product_id).first()
        if not product:
            logger.warning(f"Inspection failed: Product ID {product_id} not found")
            raise HTTPException(status_code=404, detail="Product not found")

    # 2. Verify Golden Reference exists for this product and angle
    golden_ref = services.select_golden_reference(product_id, capture_angle, db)
    if not golden_ref:
        logger.warning(f"Inspection failed: Golden reference not found for product {product_id} and angle {capture_angle}")
        raise HTTPException(status_code=400, detail="Golden reference image not found for this product. Please contact your system administrator to upload the OEM golden reference standard.")

    # 3. Create case folder & Save uploaded file
    case_id = str(uuid.uuid4())
    file_ext = os.path.splitext(file.filename)[1]
    filename = f"{case_id}_captured{file_ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, filename)

    logger.info(f"Saving uploaded inspection image to {file_path} (Case ID: {case_id})")
    try:
        with open(file_path, "wb") as f:
            f.write(contents)
    except Exception as e:
        logger.error(f"Failed to save image for Case {case_id}: {str(e)}")
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
    
    logger.info(f"Triggering LangGraph Multi-Agent pipeline for Case {case_id}")
    try:
        pipeline_result = run_inspection_pipeline(initial_state)
    except Exception as e:
        logger.error(f"LangGraph execution crashed for Case {case_id}: {str(e)}")
        db_inspection.status = "failed"
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inspection pipeline execution failed: {str(e)}"
        )
        
    if pipeline_result["status"] == "retake_needed":
        logger.warning(f"Triage verification failed for Case {case_id}: {pipeline_result['triage_detail']}")
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
        logger.error(f"Pipeline status reported failure for Case {case_id}")
        db_inspection.status = "failed"
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=pipeline_result.get("triage_detail", "Internal engine failure during inspection processing.")
        )

    logger.info(f"Pipeline succeeded. Verdict: {pipeline_result['verdict']}, Fraud Score: {pipeline_result['fraud_score']}")

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
def list_inspections(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(utils.get_current_user)
):
    logger.info(f"User {current_user.email} listing inspections (Role: {current_user.role})")
    if current_user.role == "admin":
        return db.query(models.Inspection).order_by(models.Inspection.created_at.desc()).all()
    else:
        return db.query(models.Inspection).filter(
            models.Inspection.user_id == current_user.id
        ).order_by(models.Inspection.created_at.desc()).all()

@router.get("/{case_id}", response_model=schemas.InspectionResponse)
def get_inspection_by_case(
    case_id: str, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(utils.get_current_user)
):
    logger.info(f"User {current_user.email} requesting details for case: {case_id}")
    inspection = db.query(models.Inspection).filter(models.Inspection.case_id == case_id).first()
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection case not found")
        
    # Authorization verification: Admin can read all, Normal user only their own
    if current_user.role != "admin" and inspection.user_id != current_user.id:
        logger.warning(f"Unauthorized access attempt by user {current_user.email} for case: {case_id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to view this inspection case details."
        )
        
    return inspection


@router.delete("/{case_id}", status_code=status.HTTP_200_OK)
def delete_inspection(
    case_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(utils.get_current_user)
):
    """Delete an inspection case, its linked results, audit logs, and reports."""
    inspection = db.query(models.Inspection).filter(models.Inspection.case_id == case_id).first()
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection case not found")
        
    # Authorization verification: Admin can delete all, Normal user only their own
    if current_user.role != "admin" and inspection.user_id != current_user.id:
        logger.warning(f"Unauthorized delete attempt by user {current_user.email} for case: {case_id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to delete this inspection case."
        )
        
    try:
        # Delete related reports
        db.query(models.Report).filter(models.Report.inspection_id == inspection.id).delete()
        # Delete related audit logs
        db.query(models.AuditLog).filter(models.AuditLog.inspection_id == inspection.id).delete()
        # Delete related results
        db.query(models.InspectionResult).filter(models.InspectionResult.inspection_id == inspection.id).delete()
        # Delete main inspection record
        db.delete(inspection)
        db.commit()
        logger.info(f"User {current_user.email} deleted case {case_id}")
        return {"message": "Inspection case deleted successfully"}
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to delete inspection case {case_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete inspection case: {str(e)}")
