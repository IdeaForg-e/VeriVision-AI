import logging
from sqlalchemy.orm import Session
from app import models

logger = logging.getLogger(__name__)

def select_golden_reference(product_id: int, capture_angle: str, db: Session) -> models.GoldenReference:
    """
    Selects the best Golden Reference template from the database
    based on product ID and camera angle.
    """
    logger.info(f"[Agent 2: Selector] Fetching Golden Reference template for Product ID {product_id} and Angle {capture_angle}")
    return db.query(models.GoldenReference).filter(
        models.GoldenReference.product_id == product_id,
        models.GoldenReference.angle == capture_angle
    ).first()
