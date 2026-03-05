"""Fix check-out route by removing non-existent model references"""
import os
import re

file_path = r"F:\ffff\agentflow-pro\src\app\api\reservations\[id]\check-out\route.ts"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove check-out record creation
content = re.sub(
    r'    // Create check-out record\n    const checkOutRecord = await prisma\.checkOut\.create\(\{[^}]+\}\);',
    '    // Note: CheckOut model not implemented - using reservation directly',
    content,
    flags=re.DOTALL
)

# Remove housekeeping task creation
content = re.sub(
    r'    // Create housekeeping task if room needs cleaning.*?(?=\n    //|\n    // Process|\n    return)',
    '    // Note: HousekeepingTask model not implemented',
    content,
    flags=re.DOTALL
)

# Remove check-out record from response
content = re.sub(
    r',\n        checkOut: \{\n          id: checkOutRecord\.id,[^}]+\}',
    '',
    content,
    flags=re.DOTALL
)

# Fix room status - remove maintenance reference
content = content.replace(
    '''if (validatedData.roomCondition === "damaged") {
      roomStatus = "maintenance";
    } else''',
    'if'
)

# Fix null safety for reservation.guest
content = content.replace('reservation.guest.name', 'reservation.guest?.name || "Unknown"')
content = content.replace('reservation.guest.email', 'reservation.guest?.email || ""')
content = content.replace('reservation.guest.phone', 'reservation.guest?.phone || ""')
content = content.replace('reservation.room.name', 'reservation.room?.name || "Unassigned"')
content = content.replace('reservation.room.type', 'reservation.room?.type || "Standard"')

# Fix roomId null check
content = content.replace(
    'await prisma.room.update({\n      where: { id: reservation.roomId },',
    'if (reservation.roomId) {\n      await prisma.room.update({\n        where: { id: reservation.roomId },'
)
# Add closing brace for the if statement
content = content.replace(
    "data: {\n        updatedAt: new Date(),\n      },\n    });",
    "data: {\n          updatedAt: new Date(),\n        },\n      });\n    }"
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed check-out route!")
