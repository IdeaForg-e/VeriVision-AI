"""
seed_db.py — Run this script once to create default Admin and User accounts.

Usage (from the /backend folder):
    python seed_db.py

Credentials created:
  Admin  → admin@verivision.com  / admin123
  User   → user@verivision.com   / user123
"""

import sys
import os

# Ensure the backend root is on the path so app imports work
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, Base, SessionLocal
from app import models, utils


def migrate_db():
    """Safely add new columns to existing tables (SQLite ALTER TABLE)."""
    import sqlite3
    db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "verivision.db")
    if not os.path.exists(db_path):
        return  # Fresh install, create_all will handle it

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Check existing columns in inspections table
    cursor.execute("PRAGMA table_info(inspections)")
    existing_cols = {row[1] for row in cursor.fetchall()}

    migrations = [
        ("vendor", "TEXT"),
        ("component_name", "TEXT"),
        ("date", "TEXT"),
    ]

    # Check existing columns in golden_references table
    cursor.execute("PRAGMA table_info(golden_references)")
    gld_cols = {row[1] for row in cursor.fetchall()}
    if "embedding_vector" not in gld_cols:
        cursor.execute("ALTER TABLE golden_references ADD COLUMN embedding_vector TEXT")
        print("  [MIGRATE] Added column 'golden_references.embedding_vector'")

    for col_name, col_type in migrations:
        if col_name not in existing_cols:
            cursor.execute(f"ALTER TABLE inspections ADD COLUMN {col_name} {col_type}")
            print(f"  [MIGRATE] Added column 'inspections.{col_name}'")
        else:
            print(f"  [SKIP]    Column 'inspections.{col_name}' already exists")

    conn.commit()
    conn.close()


def seed():
    # Run migrations first (safe for existing DBs)
    migrate_db()

    # Create all tables if they don't exist yet
    Base.metadata.create_all(bind=engine)

    import shutil
    from app.config import settings

    db = SessionLocal()
    try:
        # 1. Seed Accounts
        accounts = [
            {
                "name": "Admin",
                "email": "admin@verivision.com",
                "password": "admin123",
                "role": "admin",
            },
            {
                "name": "Operator",
                "email": "user@verivision.com",
                "password": "user123",
                "role": "user",
            },
        ]

        created_acc = 0
        for acc in accounts:
            existing = db.query(models.User).filter(models.User.email == acc["email"]).first()
            if existing:
                print(f"  [SKIP]    {acc['email']} already exists (role={existing.role})")
            else:
                hashed = utils.get_password_hash(acc["password"])
                user = models.User(
                    name=acc["name"],
                    email=acc["email"],
                    hashed_password=hashed,
                    role=acc["role"],
                )
                db.add(user)
                created_acc += 1
                print(f"  [CREATED] {acc['email']}  role={acc['role']}")

        db.commit()

        # 2. Seed Golden Catalog Reference Library
        catalog_products = [
            {
                "part_number": "GOLD-RAM-DELL",
                "name": "Dell DDR5 RAM",
                "commodity": "ram",
                "filename": "golden Dell ddr5 ram.png",
                "expected_serial": "DELL-RAM-DDR5-001"
            },
            {
                "part_number": "GOLD-BATTERY-DELL",
                "name": "Dell Standard Battery",
                "commodity": "battery",
                "filename": "golden dell battery.png",
                "expected_serial": "DELL-BATT-8822"
            },
            {
                "part_number": "GOLD-MB-DELL",
                "name": "Dell OEM Motherboard",
                "commodity": "motherboard",
                "filename": "golden dell motherboard.jpg",
                "expected_serial": "DELL-MB-A01"
            },
            {
                "part_number": "GOLD-HDD-SEAGATE",
                "name": "Seagate 1TB HDD",
                "commodity": "storage",
                "filename": "golden hdd.jpeg",
                "expected_serial": "SG-HDD-1000"
            },
            {
                "part_number": "GOLD-MICROCHIP-A",
                "name": "Microchip Controller A",
                "commodity": "microchip",
                "filename": "golden microchip .jpeg",
                "expected_serial": "IC-MCP-9922"
            },
            {
                "part_number": "GOLD-MB-STANDARD",
                "name": "Standard Motherboard",
                "commodity": "motherboard",
                "filename": "golden motherboard.jpeg",
                "expected_serial": "MB-STD-V2"
            },
            {
                "part_number": "GOLD-RAM-GENERIC",
                "name": "Generic RAM Module",
                "commodity": "ram",
                "filename": "golden ram.jpeg",
                "expected_serial": "RAM-GEN-16G"
            },
            {
                "part_number": "GOLD-ROM-BIOS",
                "name": "BIOS ROM Standard",
                "commodity": "storage",
                "filename": "golden rom.jpeg",
                "expected_serial": "ROM-BIOS-V8"
            },
            {
                "part_number": "GOLD-SSD-M2-SAMSUNG-980",
                "name": "Samsung 980 Pro SSD M.2",
                "commodity": "storage",
                "filename": "golden samsung m2-ssd 2.png",
                "expected_serial": "MZ-V8P1T0"
            },
            {
                "part_number": "GOLD-SSD-M2-SAMSUNG-970",
                "name": "Samsung 970 Evo SSD M.2",
                "commodity": "storage",
                "filename": "golden samsung m2-ssd.png",
                "expected_serial": "MZ-V7E500"
            },
            {
                "part_number": "GOLD-SSD-SATA",
                "name": "SATA SSD Standard",
                "commodity": "storage",
                "filename": "golden ssd.jpeg",
                "expected_serial": "SSD-SATA-512"
            },
            {
                "part_number": "GOLD-MICROCHIP-AI",
                "name": "AI Processing Microchip",
                "commodity": "microchip",
                "filename": "golden_microchip.png",
                "expected_serial": "AI-MCP-2026"
            },
            {
                "part_number": "GOLD-MB-ROG",
                "name": "Asus Rog Motherboard",
                "commodity": "motherboard",
                "filename": "golden_motherboard.png",
                "expected_serial": "ASUS-ROG-Z790"
            },
            {
                "part_number": "GOLD-LABEL-WARRANTY",
                "name": "OEM Warranty Seal Label",
                "commodity": "label",
                "filename": "golden_warranty_label.png",
                "expected_serial": "QC-PASS-VOID-0"
            },
            {
                "part_number": "GOLD-GPU-AUDIO",
                "name": "GPU Audio Processor Card",
                "commodity": "gpu",
                "filename": "gpu sound.jpeg",
                "expected_serial": "GPU-AUD-X1"
            }
        ]

        # Root folder path containing source images
        project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        source_folder = os.path.join(project_root, "Golden_Images")
        os.makedirs(settings.GOLDEN_DIR, exist_ok=True)

        created_prod = 0
        for prod in catalog_products:
            # Check if product is already seeded
            existing_prod = db.query(models.Product).filter(models.Product.part_number == prod["part_number"]).first()
            if existing_prod:
                print(f"  [SKIP]    Catalog part {prod['part_number']} already registered")
                continue

            # Copy image standard to data/golden
            src_file_path = os.path.join(source_folder, prod["filename"])
            dst_filename = f"golden_{prod['part_number'].lower()}.png"
            dst_file_path = os.path.join(settings.GOLDEN_DIR, dst_filename)

            if not os.path.exists(src_file_path):
                print(f"  [WARN]    Source reference file {src_file_path} not found on disk, skipping.")
                continue

            try:
                shutil.copy(src_file_path, dst_file_path)
            except Exception as copy_err:
                print(f"  [ERROR]   Failed to copy reference {prod['filename']}: {copy_err}")
                continue

            # Determine default ROIs
            if prod["commodity"] == "label":
                roi_json = { "label_roi": { "x": 420, "y": 50, "width": 420, "height": 220 } }
            elif prod["commodity"] == "motherboard":
                roi_json = { "label_roi": { "x": 200, "y": 620, "width": 150, "height": 80 } }
            elif prod["commodity"] == "microchip":
                roi_json = { "label_roi": { "x": 250, "y": 250, "width": 200, "height": 100 } }
            else:
                roi_json = { "label_roi": { "x": 100, "y": 100, "width": 300, "height": 200 } }

            # Create DB Records
            new_prod = models.Product(
                part_number=prod["part_number"],
                name=prod["name"],
                commodity=prod["commodity"]
            )
            db.add(new_prod)
            db.commit()
            db.refresh(new_prod)

            # Calculate 512-dim visual vector embedding
            from app.services.embedding_service import extract_image_embedding
            emb_vec = extract_image_embedding(dst_file_path)

            new_golden = models.GoldenReference(
                product_id=new_prod.id,
                image_path=f"data/golden/{dst_filename}",
                expected_serial=prod["expected_serial"],
                roi_config=roi_json,
                angle="top",
                embedding_vector=emb_vec
            )
            db.add(new_golden)
            db.commit()
            created_prod += 1
            print(f"  [CREATED] Seeded catalog product '{prod['name']}' ({prod['part_number']}) with 512-dim vector embedding.")

        print(f"\n[OK] Seeding complete! {created_acc} accounts, {created_prod} catalog parts registered.")

    except Exception as e:
        db.rollback()
        print(f"\n[ERROR] Seeding process failed: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 50)
    print("  VeriVision-AI — Database Seeder")
    print("=" * 50)
    seed()
