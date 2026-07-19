import sqlite3
import os
from datetime import datetime
import uuid

def seed_tests():
    db_path = os.path.join(os.path.dirname(__file__), 'verivision.db')
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Clear existing inspections and results
    cursor.execute("DELETE FROM inspection_results")
    cursor.execute("DELETE FROM inspections")
    
    now = datetime.utcnow().isoformat()

    # Define the 6 test cases
    test_cases = [
        {
            "case_id": "LBL-MISSING",
            "product_id": 2, # Label
            "image": "/dataset/defect_label_missing.png",
            "score": 98,
            "verdict": "missing",
            "explanation": "Warranty label is completely missing from the expected region."
        },
        {
            "case_id": "LBL-TAMPER",
            "product_id": 2, # Label
            "image": "/dataset/defect_label_tampered.png",
            "score": 85,
            "verdict": "tampered",
            "explanation": "Label shows severe signs of tampering and peeling. OCR text mismatched."
        },
        {
            "case_id": "CHP-CORRO",
            "product_id": 3, # Microchip
            "image": "/dataset/defect_microchip_corrosion.png",
            "score": 88,
            "verdict": "damaged",
            "explanation": "Extensive corrosion detected on IC pins. Component fails visual quality standards."
        },
        {
            "case_id": "CHP-LIQUID",
            "product_id": 3, # Microchip
            "image": "/dataset/defect_microchip_liquid_damage.png",
            "score": 92,
            "verdict": "damaged",
            "explanation": "Severe liquid damage and oxidation detected on the microchip surface."
        },
        {
            "case_id": "MB-BURN",
            "product_id": 1, # Motherboard
            "image": "/dataset/defect_motherboard_burn.png",
            "score": 95,
            "verdict": "damaged",
            "explanation": "Burn marks and thermal damage detected on the PCB surface."
        },
        {
            "case_id": "MB-REUSED",
            "product_id": 1, # Motherboard
            "image": "/dataset/defect_motherboard_reused.png",
            "score": 78,
            "verdict": "reused",
            "explanation": "Signs of wear, flux residue, and prior installation indicate a reused component."
        }
    ]

    for tc in test_cases:
        # Insert Inspection
        cursor.execute("""
            INSERT INTO inspections (case_id, product_id, user_id, captured_image_path, capture_site, capture_angle, status, created_at)
            VALUES (?, ?, 1, ?, 'QA-Line-1', 'top', 'completed', ?)
        """, (tc['case_id'], tc['product_id'], tc['image'], now))
        
        inspection_id = cursor.lastrowid
        
        # Insert Inspection Result
        cursor.execute("""
            INSERT INTO inspection_results (inspection_id, ssim_score, keypoint_match_rate, fraud_score, verdict, confidence, recommended_action, explanation, created_at)
            VALUES (?, 0.45, 0.30, ?, ?, 0.95, 'Quarantine & Escalate', ?, ?)
        """, (inspection_id, tc['score'], tc['verdict'], tc['explanation'], now))

    conn.commit()
    conn.close()
    print(f"Successfully seeded {len(test_cases)} defect test cases.")

if __name__ == '__main__':
    seed_tests()
