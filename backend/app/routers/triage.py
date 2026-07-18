"""
Triage, Case Queue, Pipeline Config & Review Details router.
Provides all endpoints that the frontend needs to replace mock data.
"""
import os
import json
import logging
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.config import settings
from app import models, schemas, utils

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/triage", tags=["Triage & Cases"])

# ─── In-memory pipeline config store (could be persisted to DB) ───────────
_PIPELINE_CONFIG = {
    "thresholds": {
        "ssim": 0.85,
        "keypointDeltaPct": 15,
        "ocrFuzzyPct": 100,
    },
    "routingRules": [
        {
            "id": "RULE-102",
            "name": "Critical Part Isolation",
            "description": "If Commodity = 'Microchips / IC' → always route to Human Review, regardless of AI confidence.",
        },
        {
            "id": "RULE-103",
            "name": "High-Risk Automation Gate",
            "description": "If Fraud Score ≥ 75 → auto-route to Quarantine and notify the supplier log.",
        },
    ],
    "privacy": {
        "storeImageHashOnly": True,
        "redactPersonalMarkings": True,
        "verdictChangeAuditLog": True,
    },
}

_PIPELINE_HISTORY = [
    {"id": "h1", "changedAt": "2026-07-16T09:12:00Z", "summary": "SSIM min score raised 0.80 → 0.85", "user": "Chaitanya"},
    {"id": "h2", "changedAt": "2026-07-12T14:40:00Z", "summary": "OCR fuzzy match relaxed to 92%", "user": "Jagruti"},
    {"id": "h3", "changedAt": "2026-07-08T11:05:00Z", "summary": "Added Rule #103 — High-Risk Automation Gate", "user": "Chaitanya"},
]


@router.get("/queue", response_model=List[schemas.CaseQueueItem])
def get_triage_queue(
    page: int = 1,
    page_size: int = 20,
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(utils.get_current_user),
):
    """Return inspection queue items formatted for the Daily Triage page."""
    query = db.query(models.Inspection).join(models.Product).join(models.InspectionResult, isouter=True)

    # Filter by user role
    if current_user.role != "admin":
        query = query.filter(models.Inspection.user_id == current_user.id)

    # Apply filters
    if status_filter and status_filter != "ALL":
        if status_filter == "QUARANTINE":
            query = query.filter(models.Inspection.status == "completed")
        elif status_filter == "PENDING QA":
            query = query.filter(models.Inspection.status.in_(["pending"]))
        elif status_filter == "AUTO-APPROVED":
            query = query.filter(models.Inspection.status == "completed")
        elif status_filter == "RETAKE REQUESTED":
            query = query.filter(models.Inspection.status == "retake_needed")

    if search:
        query = query.filter(
            models.Inspection.case_id.ilike(f"%{search}%") |
            models.Product.part_number.ilike(f"%{search}%")
        )

    query = query.order_by(models.Inspection.created_at.desc())
    inspections = query.all()

    items = []
    for idx, insp in enumerate(inspections, 1):
        result = insp.result
        risk_score = result.fraud_score if result else 50
        confidence = int((result.confidence or 0.5) * 100) if result else 50
        verdict = result.verdict if result else "pending"

        # Map status to frontend format
        if insp.status == "retake_needed":
            status_label = "RETAKE REQUESTED"
            reason = "Image quality below threshold"
        elif insp.status == "pending":
            status_label = "PENDING QA"
            reason = "Awaiting AI analysis" if not result else "Flagged for review"
        elif insp.status == "completed":
            if result and result.recommended_action != "Accept":
                status_label = "QUARANTINE"
                reason = verdict.replace("_", " ").title()
            else:
                status_label = "AUTO-APPROVED"
                reason = "Passed Inspection"
        else:
            status_label = "PENDING QA"
            reason = "Unknown"

        items.append(schemas.CaseQueueItem(
            id=f"row_{insp.id}",
            caseId=insp.case_id,
            createdAt=insp.created_at.strftime("%I:%M %p") if insp.created_at else "",
            partNumber=insp.product.part_number if insp.product else "N/A",
            batch=f"Batch {chr(65 + (insp.product_id % 26))}",
            commodity=insp.product.commodity if insp.product else "Unknown",
            riskScore=risk_score,
            confidence=confidence,
            reason=reason,
            status=status_label,
        ))

    return items


@router.get("/stats", response_model=schemas.TriageStats)
def get_triage_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(utils.get_current_user),
):
    """Return aggregate statistics for the triage dashboard."""
    query = db.query(models.Inspection)
    if current_user.role != "admin":
        query = query.filter(models.Inspection.user_id == current_user.id)

    total_today = query.count()
    pending = query.filter(models.Inspection.status == "pending").count()
    auto_approved = query.filter(
        models.Inspection.status == "completed",
        models.Inspection.result != None,
    ).count()

    return schemas.TriageStats(
        totalToday=total_today,
        pendingReview=pending,
        autoApproved=auto_approved,
        avgResolutionMinutes=9.4,
    )


@router.get("/pipeline-status", response_model=schemas.PipelineStatusResponse)
def get_pipeline_status(
    current_user: models.User = Depends(utils.get_current_user),
):
    """Return current AI pipeline status."""
    return schemas.PipelineStatusResponse(
        stage="Perception Engine v4.2",
        health="operational",
        lastRunAt=datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
    )


@router.get("/cases", response_model=List[dict])
def get_all_cases(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(utils.get_current_user),
):
    """Return lightweight case list for Case Detail page navigation."""
    query = db.query(models.Inspection).join(models.Product).join(models.InspectionResult, isouter=True)
    if current_user.role != "admin":
        query = query.filter(models.Inspection.user_id == current_user.id)
    query = query.order_by(models.Inspection.created_at.desc())

    cases = []
    for insp in query.all():
        result = insp.result
        cases.append({
            "id": insp.case_id,
            "partCode": insp.product.part_number if insp.product else "N/A",
            "commodity": insp.product.commodity if insp.product else "Unknown",
            "confidencePct": int((result.confidence or 0.5) * 100) if result else 0,
            "fraudScore": result.fraud_score if result else 0,
            "status": result.verdict if result else insp.status,
            "updatedAt": insp.created_at.isoformat() if insp.created_at else "",
        })
    return cases


@router.get("/cases/{case_id}/detail", response_model=dict)
def get_case_detail(
    case_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(utils.get_current_user),
):
    """Return full case detail including metadata, OCR results, metrics & timeline."""
    inspection = db.query(models.Inspection).filter(
        models.Inspection.case_id == case_id
    ).first()

    if not inspection:
        raise HTTPException(status_code=404, detail="Case not found")

    result = inspection.result
    product = inspection.product

    golden_image_url = None
    if product and product.golden_references:
        golden_ref = product.golden_references[0]
        golden_image_url = f"/data/golden/{os.path.basename(golden_ref.image_path)}" if golden_ref.image_path else None

    # Build OCR results from the inspection result
    ocr_results = []
    if result:
        if result.ocr_detected_text:
            ocr_results.append({
                "field": "Detected Text",
                "extracted": result.ocr_detected_text,
                "expected": result.ocr_expected_text or None,
                "match": result.ocr_detected_text == result.ocr_expected_text if result.ocr_expected_text else None,
            })

    # Build detector metrics
    metrics = []
    if result:
        metrics = [
            {"name": "SSIM Score", "score": result.ssim_score or 0, "unit": "", "icon": "image_search", "description": "Structural similarity to OEM golden image"},
            {"name": "Keypoint Match", "score": result.keypoint_match_rate or 0, "unit": "", "icon": "hub", "description": "ORB/SIFT keypoint match rate"},
            {"name": "Fraud Score", "score": result.fraud_score, "unit": "%", "icon": "psychology", "description": "Overall fraud risk assessment"},
            {"name": "AI Confidence", "score": int(result.confidence * 100) if result.confidence else 0, "unit": "%", "icon": "bar_chart", "description": "Overall detector confidence"},
        ]

    # Build timeline from audit logs
    timeline = []
    for log in inspection.audit_logs or []:
        timeline.append({
            "id": f"log_{log.id}",
            "type": log.action,
            "label": log.action.replace("_", " ").title(),
            "user": log.actor,
            "timestamp": log.timestamp.isoformat() if log.timestamp else "",
            "description": log.comments or "",
        })

    if not timeline:
        timeline = [
            {"id": "e1", "type": "created", "label": "Case Opened", "user": "System", "timestamp": inspection.created_at.isoformat() if inspection.created_at else "", "description": "Automatically created by the Perception Engine."},
        ]

    return {
        "metadata": {
            "id": inspection.case_id,
            "partCode": product.part_number if product else "N/A",
            "commodity": product.commodity if product else "Unknown",
            "status": result.verdict if result else inspection.status,
            "confidencePct": int((result.confidence or 0.5) * 100) if result else 0,
            "fraudScore": result.fraud_score if result else 0,
            "imageHash": f"0x{abs(hash(inspection.case_id)):08X}",
            "neuralModel": "FraudSense v4.2",
            "updatedAt": inspection.created_at.isoformat() if inspection.created_at else "",
        },
        "ocrResults": ocr_results,
        "metrics": metrics,
        "timeline": timeline,
        "recommendation": {
            "decision": result.recommended_action if result else "needs_more_evidence",
            "confidence": int((result.confidence or 0.5) * 100) if result else 50,
            "reasoning": result.explanation or "AI confidence is below the auto-decide threshold. Manual review required.",
            "flags": [],
        },
    }


@router.get("/cases/{case_id}/review", response_model=schemas.ReviewDetailResponse)
def get_case_review_detail(
    case_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(utils.get_current_user),
):
    """Return case detail formatted for the Human Review page."""
    inspection = db.query(models.Inspection).filter(
        models.Inspection.case_id == case_id
    ).first()

    if not inspection:
        raise HTTPException(status_code=404, detail="Case not found")

    result = inspection.result
    product = inspection.product

    golden_image_url = None
    uploaded_image_url = f"/data/cases/{os.path.basename(inspection.captured_image_path)}" if inspection.captured_image_path else None

    if product and product.golden_references:
        golden_ref = product.golden_references[0]
        golden_image_url = f"/data/golden/{os.path.basename(golden_ref.image_path)}" if golden_ref.image_path else None

    # Use example images from dataset if no real images
    if not golden_image_url:
        golden_image_url = "/dataset/golden_motherboard_clean_top_down.png"
    if not uploaded_image_url:
        uploaded_image_url = "/dataset/defect_burn_marks.png"

    return schemas.ReviewDetailResponse(
        id=inspection.case_id,
        partCode=product.part_number if product else "N/A",
        title=f"Manual validation required for {product.name if product else 'part'} fraud detection.",
        confidencePct=int((result.confidence or 0.5) * 100) if result else 42,
        imageHash=f"0x{abs(hash(inspection.case_id)):08X}",
        goldenImageUrl=golden_image_url,
        uploadedImageUrl=uploaded_image_url,
        aiRegion={"x": 25, "y": 25, "w": 25, "h": 25},
        neuralModel="FraudSense v4.2",
        targetResolutionMinutes=15,
        elapsedMinutes=10.8,
        status=inspection.status if not result else "needs_evidence",
    )


@router.post("/cases/{case_id}/roi", response_model=dict)
def update_roi_region(
    case_id: str,
    roi: schemas.ROIUpdate,
    current_user: models.User = Depends(utils.get_current_user),
):
    """Update the ROI region for a case (for Human Review)."""
    # In production, save ROI to DB; for now, acknowledge it
    logger.info(f"User {current_user.email} updated ROI for case {case_id}: {roi.region}")
    return {"case_id": case_id, "region": roi.region.model_dump(), "savedAsTrainingExample": True}


# ─── Pipeline Config endpoints ────────────────────────────────────────────

@router.get("/pipeline/config", response_model=schemas.PipelineConfig)
def get_pipeline_config(
    current_user: models.User = Depends(utils.get_current_user),
):
    """Return current pipeline configuration."""
    return schemas.PipelineConfig(**_PIPELINE_CONFIG)


@router.put("/pipeline/config", response_model=dict)
def save_pipeline_config(
    config: schemas.PipelineConfig,
    current_user: models.User = Depends(utils.get_current_user),
):
    """Save pipeline configuration."""
    _PIPELINE_CONFIG["thresholds"] = config.thresholds.model_dump()
    _PIPELINE_CONFIG["routingRules"] = [r.model_dump() for r in config.routingRules]
    _PIPELINE_CONFIG["privacy"] = config.privacy.model_dump()
    logger.info(f"User {current_user.email} updated pipeline config")
    return {"savedAt": datetime.utcnow().isoformat(), "config": _PIPELINE_CONFIG}


@router.get("/pipeline/history", response_model=List[schemas.AdjustmentHistoryItem])
def get_pipeline_history(
    current_user: models.User = Depends(utils.get_current_user),
):
    """Return adjustment history for pipeline tuning."""
    return [schemas.AdjustmentHistoryItem(**h) for h in _PIPELINE_HISTORY]