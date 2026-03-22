"""Fix params.id -> id in reservation routes"""
import os
import re

files_to_fix = [
    r"src\app\api\reservations\[id]\check-in\route.ts",
    r"src\app\api\reservations\[id]\check-out\route.ts",
    r"src\app\api\reservations\[id]\payment\route.ts",
]

for file_path in files_to_fix:
    full_path = os.path.join(r"F:\ffff\agentflow-pro", file_path)
    if os.path.exists(full_path):
        with open(full_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Read the file to check if it has params destructuring
        if 'const { id } = await params' in content or '{ params }: { params: Promise<{ id: string }>' in content:
            # Replace params.id with id
            new_content = content.replace('params.id', 'id')
            
            if new_content != content:
                with open(full_path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Fixed: {file_path}")
            else:
                print(f"No changes: {file_path}")
        else:
            print(f"Skipping (no params destructuring): {file_path}")
    else:
        print(f"File not found: {file_path}")

print("\nDone!")
