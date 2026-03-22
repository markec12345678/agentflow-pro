import os
import re

def fix_request_ip(root_dir):
    """Replace request.ip || "unknown" with request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || "unknown" """
    
    replacement = "request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || \"unknown\""
    
    for dirpath, dirnames, filenames in os.walk(root_dir):
        # Skip node_modules and .next directories
        if 'node_modules' in dirpath or '.next' in dirpath:
            continue
            
        for filename in filenames:
            if filename.endswith('.ts'):
                filepath = os.path.join(dirpath, filename)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # Check if file contains the pattern
                    if 'request.ip || "unknown"' in content:
                        new_content = content.replace('request.ip || "unknown"', replacement)
                        with open(filepath, 'w', encoding='utf-8') as f:
                            f.write(new_content)
                        print(f"Fixed: {filepath}")
                except Exception as e:
                    print(f"Error processing {filepath}: {e}")

if __name__ == "__main__":
    fix_request_ip(r"F:\ffff\agentflow-pro\src")
    print("Done!")
