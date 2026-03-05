"""Fix optional chaining in research page"""
import os

file_path = r"F:\ffff\agentflow-pro\src\app\agents\research\page.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix all results. references to results?.
replacements = [
    ("{results.summary}", "{results?.summary}"),
    ("{results.trends?.map(", "{results?.trends?.map("),
    ("{results.analysis?.map(", "{results?.analysis?.map("),
    ("{results.metadata.sourcesCount}", "{results?.metadata?.sourcesCount}"),
    ("{results.metadata.confidence * 100}%", "{results?.metadata?.confidence * 100}%"),
    ("{new Date(results.metadata.analyzedAt)", "{new Date(results?.metadata?.analyzedAt)"),
]

for old, new in replacements:
    content = content.replace(old, new)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed research page!")
