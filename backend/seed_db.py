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
    ]

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

    db = SessionLocal()
    try:
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

        created = 0
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
                created += 1
                print(f"  [CREATED] {acc['email']}  role={acc['role']}")

        db.commit()
        print(f"\n[OK] Done! {created} account(s) created.")
        if created == 0:
            print("   All accounts already exist - no changes made.")
        else:
            print("\n  Admin  -> admin@verivision.com / admin123")
            print("  User   -> user@verivision.com  / user123")

    except Exception as e:
        db.rollback()
        print(f"\n[ERROR] {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 50)
    print("  VeriVision-AI — Database Seeder")
    print("=" * 50)
    seed()
