import os
import shutil
from sqlalchemy.orm import Session

from app.database import SessionLocal, Base, engine
from app import models, utils
from app.config import settings

def seed():
    print("Initializing Database Seeding...")
    # Clean recreate all database tables
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db: Session = SessionLocal()

    try:
        # 1. Create Default Users
        print("Creating default user accounts...")
        users = [
            models.User(
                name="System Administrator",
                email="admin@verivision.com",
                hashed_password=utils.get_password_hash("admin123"),
                role="admin"
            ),
            models.User(
                name="Normal Operator",
                email="user@verivision.com",
                hashed_password=utils.get_password_hash("user123"),
                role="user"
            )
        ]
        db.add_all(users)
        db.commit()

        # 2. Create Default Products
        print("Creating default product parts...")
        products = {
            "XPS-MB-409": models.Product(
                part_number="XPS-MB-409",
                name="Dell XPS 15 Motherboard",
                commodity="motherboard"
            ),
            "XPS-LABEL-03": models.Product(
                part_number="XPS-LABEL-03",
                name="XPS Warranty Label Sticker",
                commodity="label"
            )
        }
        db.add_all(products.values())
        db.commit()

        # Refresh to get IDs
        db.refresh(products["XPS-MB-409"])
        db.refresh(products["XPS-LABEL-03"])

        # 3. Setup Golden References using our real dataset images
        print("Copying golden reference images and setting up database records...")
        
        # Paths to original dataset files
        dataset_dir = os.path.join(os.path.dirname(settings.BASE_DIR), "dataset")
        ref_motherboard_src = os.path.join(dataset_dir, "golden_motherboard_full_top_down.png")
        ref_label_src = os.path.join(dataset_dir, "golden_03_label_close.png")

        # Golden references list in database
        references = []

        # Product 1: Motherboard Top-Down Reference
        if os.path.exists(ref_motherboard_src):
            mb_golden_dest = os.path.join(settings.GOLDEN_DIR, "golden_mb_top.png")
            shutil.copy(ref_motherboard_src, mb_golden_dest)
            references.append(
                models.GoldenReference(
                    product_id=products["XPS-MB-409"].id,
                    image_path=mb_golden_dest,
                    expected_serial="XPS-REV-409",
                    roi_config={"label_roi": {"x": 200, "y": 620, "width": 150, "height": 80}},
                    angle="top"
                )
            )
            print("Seeded Golden Reference for Dell XPS Motherboard.")
        else:
            print(f"Warning: Motherboard reference image not found at {ref_motherboard_src}")

        # Product 2: Label Close-Up Reference
        if os.path.exists(ref_label_src):
            label_golden_dest = os.path.join(settings.GOLDEN_DIR, "golden_label_close.png")
            shutil.copy(ref_label_src, label_golden_dest)
            references.append(
                models.GoldenReference(
                    product_id=products["XPS-LABEL-03"].id,
                    image_path=label_golden_dest,
                    expected_serial="91165LUS0DDD",
                    roi_config={"label_roi": {"x": 420, "y": 50, "width": 420, "height": 220}},
                    angle="top"
                )
            )
            print("Seeded Golden Reference for Warranty Label Sticker.")
        else:
            print(f"Warning: Label reference image not found at {ref_label_src}")

        if references:
            db.add_all(references)
            db.commit()

        # 4. Create Mock Inspections for Dashboard Data
        print("Creating mock inspection cases...")
        from datetime import datetime, timedelta
        
        now = datetime.utcnow()
        
        # Case 1: Clean
        i1 = models.Inspection(
            case_id="F-2026-02",
            product_id=products["XPS-MB-409"].id,
            user_id=users[1].id,
            captured_image_path=mb_golden_dest if os.path.exists(ref_motherboard_src) else "/dataset/golden_motherboard_full_top_down.png",
            capture_site="Line-1",
            capture_angle="top",
            status="completed",
            created_at=now - timedelta(minutes=45)
        )
        db.add(i1)
        db.commit()
        db.refresh(i1)
        
        r1 = models.InspectionResult(
            inspection_id=i1.id,
            ssim_score=0.98,
            keypoint_match_rate=0.95,
            ocr_detected_text="XPS-REV-409",
            ocr_expected_text="XPS-REV-409",
            fraud_score=10,
            verdict="clean",
            confidence=0.92,
            recommended_action="Accept",
            explanation="Parts verified correctly.",
            heatmap_path=None
        )
        db.add(r1)

        # Case 2: Tampered / Quarantine
        i2 = models.Inspection(
            case_id="C-2026-03",
            product_id=products["XPS-LABEL-03"].id,
            user_id=users[1].id,
            captured_image_path="/dataset/defect_burn_marks.png",
            capture_site="Line-2",
            capture_angle="top",
            status="completed",
            created_at=now - timedelta(minutes=10)
        )
        db.add(i2)
        db.commit()
        db.refresh(i2)
        
        r2 = models.InspectionResult(
            inspection_id=i2.id,
            ssim_score=0.62,
            keypoint_match_rate=0.55,
            ocr_detected_text="91165LUSODDD",
            ocr_expected_text="91165LUS0DDD",
            fraud_score=85,
            verdict="tampered",
            confidence=0.90,
            recommended_action="Quarantine & Escalate",
            explanation="Defects and character mismatch detected.",
            heatmap_path=None
        )
        db.add(r2)

        # Case 3: Pending Review
        i3 = models.Inspection(
            case_id="P-2026-04",
            product_id=products["XPS-MB-409"].id,
            user_id=users[1].id,
            captured_image_path="/dataset/golden_motherboard_full_top_down.png",
            capture_site="Line-1",
            capture_angle="top",
            status="pending",
            created_at=now - timedelta(minutes=2)
        )
        db.add(i3)
        
        db.commit()


        print("Database Seeding Completed Successfully! [SUCCESS]")
        print("\nDefault Logins:")
        print("- Admin: admin@verivision.com / admin123")
        print("- User: user@verivision.com / user123")

    except Exception as e:
        db.rollback()
        print(f"Seeding Failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
