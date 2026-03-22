"""Fix remaining optional chaining in research page"""
import os

file_path = r"F:\ffff\agentflow-pro\src\app\agents\research\page.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix remaining issues
replacements = [
    ("results.metadata.confidence", "results?.metadata?.confidence"),
    ("results.metadata.analyzedAt", "results?.metadata?.analyzedAt"),
]

for old, new in replacements:
    content = content.replace(old, new)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed remaining optional chaining!")
