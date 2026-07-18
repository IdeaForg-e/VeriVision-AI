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

        print("Database Seeding Completed Successfully! ✅")
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
