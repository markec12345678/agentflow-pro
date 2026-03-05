"""Fix Zod error.errors -> error.issues in all TS files"""
import os
import re

root_dir = r"F:\ffff\agentflow-pro\src"

files_to_fix = [
    "app/api/rooms/[id]/status/route.ts",
    "app/api/rooms/housekeeping/schedule/route.ts",
    "app/api/reservations/[id]/payment/route.ts",
    "app/api/reservations/[id]/check-out/route.ts",
    "app/api/reservations/[id]/check-in/route.ts",
    "app/api/reports/export/route.ts",
    "app/api/receptor/reservations/quick/route.ts",
]

for file_path in files_to_fix:
    full_path = os.path.join(root_dir, file_path)
    if os.path.exists(full_path):
        with open(full_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Replace .error.errors with .error.issues
        new_content = content.replace('.error.errors', '.error.issues')
        
        if new_content != content:
            with open(full_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Fixed: {file_path}")
        else:
            print(f"No changes: {file_path}")
    else:
        print(f"File not found: {file_path}")

print("\nDone!")
