import sqlite3
import os
from datetime import datetime

def fix_golden_and_products():
    db_path = os.path.join(os.path.dirname(__file__), 'verivision.db')
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()

    # 1. Ensure Product 3 exists
    cursor.execute("SELECT id FROM products WHERE id = 3")
    if not cursor.fetchone():
        cursor.execute("""
            INSERT INTO products (id, part_number, name, commodity, created_at)
            VALUES (3, 'XPS-CHIP-IC', 'XPS Microchip Assembly', 'microchip', ?)
        """, (now,))

    # 2. Update/Insert Golden References to point directly to /dataset/ images
    
    # For Product 1 (Motherboard)
    cursor.execute("SELECT id FROM golden_references WHERE product_id = 1")
    if cursor.fetchone():
        cursor.execute("UPDATE golden_references SET image_path = '/dataset/golden_motherboard.png' WHERE product_id = 1")
    else:
        cursor.execute("""
            INSERT INTO golden_references (product_id, image_path, expected_serial, angle, created_at)
            VALUES (1, '/dataset/golden_motherboard.png', 'XPS-REV-409', 'top', ?)
        """, (now,))

    # For Product 2 (Label)
    cursor.execute("SELECT id FROM golden_references WHERE product_id = 2")
    if cursor.fetchone():
        cursor.execute("UPDATE golden_references SET image_path = '/dataset/golden_warranty_label.png' WHERE product_id = 2")
    else:
        cursor.execute("""
            INSERT INTO golden_references (product_id, image_path, expected_serial, angle, created_at)
            VALUES (2, '/dataset/golden_warranty_label.png', '91165LUS0DDD', 'top', ?)
        """, (now,))

    # For Product 3 (Microchip)
    cursor.execute("SELECT id FROM golden_references WHERE product_id = 3")
    if cursor.fetchone():
        cursor.execute("UPDATE golden_references SET image_path = '/dataset/golden_microchip.png' WHERE product_id = 3")
    else:
        cursor.execute("""
            INSERT INTO golden_references (product_id, image_path, expected_serial, angle, created_at)
            VALUES (3, '/dataset/golden_microchip.png', 'N/A', 'top', ?)
        """, (now,))

    conn.commit()
    conn.close()
    print("Successfully fixed products and golden references.")

if __name__ == '__main__':
    fix_golden_and_products()
