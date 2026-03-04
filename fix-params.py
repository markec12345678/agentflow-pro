import re

# Read the file
with open(r'src/app/dashboard/rooms/[id]/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace all params.id with resolvedParams?.id
content = content.replace('params.id', 'resolvedParams?.id')

# Write back
with open(r'src/app/dashboard/rooms/[id]/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Replaced all params.id with resolvedParams?.id")
