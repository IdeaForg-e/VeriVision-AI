import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'verivision.db')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Fix image path for C-2026-03
cursor.execute("UPDATE inspections SET captured_image_path = '/dataset/defect_label_tampered.png' WHERE case_id = 'C-2026-03'")

# Fix results for F-2026-02 (inspection_id = 1)
cursor.execute("""
    UPDATE inspection_results 
    SET fraud_score = 5, 
        verdict = 'clean', 
        recommended_action = 'Accept', 
        explanation = 'Passed all compliance checks. Authentic part.' 
    WHERE inspection_id = 1
""")

conn.commit()
conn.close()
print("Database fixes applied successfully.")
