import os
import re

def fix_error_message(root_dir):
    """Replace error.message with (error as any).message or add type narrowing"""
    
    for dirpath, dirnames, filenames in os.walk(root_dir):
        # Skip node_modules and .next directories
        if 'node_modules' in dirpath or '.next' in dirpath or 'hooks' in dirpath or 'lib' in dirpath or 'agents' in dirpath or 'ai' in dirpath or 'alerts' in dirpath or 'workflows' in dirpath:
            continue
            
        for filename in filenames:
            if filename.endswith('.ts'):
                filepath = os.path.join(dirpath, filename)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # Look for patterns like:
                    # error.message || 'default'
                    # error.message || "default"
                    # error.message }
                    # But NOT:
                    # error instanceof Error ? error.message : 
                    
                    # Pattern to match: error.message not preceded by "error instanceof Error ?"
                    lines = content.split('\n')
                    modified = False
                    new_lines = []
                    
                    for i, line in enumerate(lines):
                        # Skip if already has type narrowing
                        if 'error instanceof Error' in line:
                            new_lines.append(line)
                            continue
                        
                        # Check for error.message in catch blocks
                        if 'error.message' in line and '||' in line:
                            # Replace error.message with (error as any).message
                            new_line = line.replace('error.message', '(error as any).message')
                            new_lines.append(new_line)
                            if new_line != line:
                                modified = True
                                print(f"Fixed: {filepath}:{i+1}")
                        else:
                            new_lines.append(line)
                    
                    if modified:
                        with open(filepath, 'w', encoding='utf-8') as f:
                            f.write('\n'.join(new_lines))
                            
                except Exception as e:
                    print(f"Error processing {filepath}: {e}")

if __name__ == "__main__":
    fix_error_message(r"F:\ffff\agentflow-pro\src\app")
    print("Done!")
