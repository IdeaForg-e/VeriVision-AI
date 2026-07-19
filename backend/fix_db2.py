import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'verivision.db')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Fix image path for P-2026-04
cursor.execute("UPDATE inspections SET captured_image_path = '/dataset/golden_motherboard.png' WHERE case_id = 'P-2026-04'")

# Also let's fix F-2026-02 to point to dataset instead of absolute path
cursor.execute("UPDATE inspections SET captured_image_path = '/dataset/golden_motherboard.png' WHERE case_id = 'F-2026-02'")

conn.commit()
conn.close()
print("Database paths fixed successfully.")
