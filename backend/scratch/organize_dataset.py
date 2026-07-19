import os
import shutil
import sqlite3

dataset_dir = r"c:\Users\ANIL\Desktop\VeriVision-AI\dataset"
db_path = r"c:\Users\ANIL\Desktop\VeriVision-AI\backend\verivision.db"
temp_dir = r"c:\Users\ANIL\Desktop\VeriVision-AI\backend\scratch\temp_dataset"

# Mapping of original files to new simplified descriptive names
reorganize_map = {
    # 1. Motherboard
    "golden_motherboard_full_top_down.png": "golden_motherboard.png",
    "defect_burn_marks.png": "defect_motherboard_burn.png",
    "defect_reused_board.png": "defect_motherboard_reused.png",
    
    # 2. Warranty Label
    "golden_03_label_close.png": "golden_warranty_label.png",
    "defect_tampered_label.png": "defect_label_tampered.png",
    "defect_missing_label.png": "defect_label_missing.png",
    
    # 3. Microchip / IC
    "golden_03_component_close.png": "golden_microchip.png",
    "defect_corrosion_close.png": "defect_microchip_corrosion.png",
    "defect_liquid_damage_close.png": "defect_microchip_liquid_damage.png"
}

def reorganize():
    print("=== Reorganizing Dataset Images ===")
    
    # Clean recreate temp dir
    if os.path.exists(temp_dir):
        shutil.rmtree(temp_dir)
    os.makedirs(temp_dir, exist_ok=True)
    
    # 1. Copy original dataset files to temp directory
    print("Copying target files to temp directory...")
    for src_name, dest_name in reorganize_map.items():
        src_path = os.path.join(dataset_dir, src_name)
        temp_path = os.path.join(temp_dir, dest_name)
        
        if os.path.exists(src_path):
            shutil.copy(src_path, temp_path)
            print(f"Backed up: {src_name} -> {dest_name}")
        else:
            print(f"Warning: Expected source image '{src_name}' was not found.")

    # 2. Delete ALL files in the dataset folder
    print("\nCleaning up old dataset files...")
    for filename in os.listdir(dataset_dir):
        filepath = os.path.join(dataset_dir, filename)
        try:
            if os.path.isfile(filepath):
                os.remove(filepath)
                print(f"Deleted: {filename}")
        except Exception as e:
            print(f"Failed to delete {filename}: {e}")

    # 3. Copy files from temp back to dataset
    print("\nWriting new organized dataset files...")
    for dest_name in reorganize_map.values():
        temp_path = os.path.join(temp_dir, dest_name)
        dest_path = os.path.join(dataset_dir, dest_name)
        try:
            if os.path.exists(temp_path):
                shutil.copy(temp_path, dest_path)
                print(f"[SAVED] {dest_name}")
            else:
                print(f"Warning: Temp file '{dest_name}' was missing.")
        except Exception as e:
            print(f"Failed to copy {dest_name} back: {e}")

    # Clean temp dir
    if os.path.exists(temp_dir):
        shutil.rmtree(temp_dir)

    # 4. Clean Database completely
    print("\n=== Clearing SQLite Database ===")
    if os.path.exists(db_path):
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        try:
            cursor.execute("PRAGMA foreign_keys = OFF;")
            
            print("Deleting inspections, results, and reports...")
            cursor.execute("DELETE FROM inspections;")
            cursor.execute("DELETE FROM inspection_results;")
            cursor.execute("DELETE FROM reports;")
            cursor.execute("DELETE FROM audit_logs;")
            
            print("Deleting products and golden references...")
            cursor.execute("DELETE FROM products;")
            cursor.execute("DELETE FROM golden_references;")
            
            cursor.execute("PRAGMA foreign_keys = ON;")
            conn.commit()
            print("[SUCCESS] Database fully reset. Ready for new admin uploads.")
        except Exception as e:
            conn.rollback()
            print(f"[ERROR] DB Reset failed: {e}")
        finally:
            conn.close()
    else:
        print("Database not found. Skipping SQL cleanup.")

    print("\nReorganization Completed! [SUCCESS]")

if __name__ == "__main__":
    reorganize()
