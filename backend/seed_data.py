import os
import sys
import shutil
from sqlalchemy.orm import Session

from app.database import SessionLocal, Base, engine
from app import models, utils

# Paths relative to this backend directory
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BACKEND_DIR)
DATASET_DIR = os.path.join(PROJECT_ROOT, "dataset")
GOLDEN_DIR = os.path.join(BACKEND_DIR, "data", "golden")

def seed(force=False):
    print("Checking Database state...")
    
    # Check if force drop requested
    if force:
        print("[FORCE] Dropping and recreating all database tables...")
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
    else:
        # Make sure tables exist without dropping existing data
        Base.metadata.create_all(bind=engine)

    # Ensure golden directory exists
    os.makedirs(GOLDEN_DIR, exist_ok=True)

    db: Session = SessionLocal()

    try:
        # Check if users and products already exist
        user_count = db.query(models.User).count()
        product_count = db.query(models.Product).count()

        if not force and user_count > 0 and product_count > 0:
            print("[INFO] Database already populated. Seeding skipped.")
            return

        print("Seeding default user accounts...")
        # Clear existing users if forcing
        if force:
            db.query(models.User).delete()
            db.query(models.Product).delete()
            db.query(models.GoldenReference).delete()

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
        db.flush() # Populate IDs

        print("Registering default parts templates...")
        products = [
            models.Product(
                part_number="XPS-MB-409",
                name="Dell XPS 15 Motherboard",
                commodity="motherboard"
            ),
            models.Product(
                part_number="XPS-LABEL-03",
                name="XPS Warranty Label Sticker",
                commodity="label"
            ),
            models.Product(
                part_number="XPS-CHIP-IC",
                name="XPS Microchip Assembly",
                commodity="microchip"
            )
        ]
        db.add_all(products)
        db.flush()

        print("Copying and linking OEM Golden reference standards...")
        
        # Product 1: Motherboard
        mb_src = os.path.join(DATASET_DIR, "golden_motherboard.png")
        mb_dest_filename = "golden_motherboard.png"
        mb_dest = os.path.join(GOLDEN_DIR, mb_dest_filename)
        if os.path.exists(mb_src):
            shutil.copy(mb_src, mb_dest)
            db.add(models.GoldenReference(
                product_id=products[0].id,
                image_path=f"data/golden/{mb_dest_filename}",
                expected_serial="XPS-REV-409",
                angle="top",
                roi_config={}
            ))
            print(f"Linked golden reference for: {products[0].part_number}")

        # Product 2: Warranty Label
        lbl_src = os.path.join(DATASET_DIR, "golden_warranty_label.png")
        lbl_dest_filename = "golden_warranty_label.png"
        lbl_dest = os.path.join(GOLDEN_DIR, lbl_dest_filename)
        if os.path.exists(lbl_src):
            shutil.copy(lbl_src, lbl_dest)
            db.add(models.GoldenReference(
                product_id=products[1].id,
                image_path=f"data/golden/{lbl_dest_filename}",
                expected_serial="91165LUS0DDD",
                angle="top",
                roi_config={"label_roi": {"x": 420, "y": 50, "width": 420, "height": 220}}
            ))
            print(f"Linked golden reference for: {products[1].part_number}")

        # Product 3: Microchip
        chip_src = os.path.join(DATASET_DIR, "golden_microchip.png")
        chip_dest_filename = "golden_microchip.png"
        chip_dest = os.path.join(GOLDEN_DIR, chip_dest_filename)
        if os.path.exists(chip_src):
            shutil.copy(chip_src, chip_dest)
            db.add(models.GoldenReference(
                product_id=products[2].id,
                image_path=f"data/golden/{chip_dest_filename}",
                expected_serial=None,
                angle="top",
                roi_config={"label_roi": {"x": 250, "y": 250, "width": 200, "height": 100}}
            ))
            print(f"Linked golden reference for: {products[2].part_number}")

        db.commit()
        print("\n[SUCCESS] Setup Completed! Default products and golden standards are ready.")
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Seeding failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    force_seed = "--force" in sys.argv
    seed(force=force_seed)
