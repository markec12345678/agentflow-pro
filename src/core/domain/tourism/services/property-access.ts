/**
 * Centralized property access for tourism APIs.
 * Returns property if user is owner (userId) or has shared access (users relation).
 */
import { prisma } from "@/database/schema";

export async function getPropertyForUser(
  propertyId: string,
  userId: string
) {
  return prisma.property.findFirst({
    where: {
      id: propertyId,
      OR: [
        { userId },
        { users: { some: { id: userId } } },
      ],
    },
  });
}

/**
 * Returns IDs of all properties the user can access (owner or shared).
 */
export async function getPropertyIdsForUser(userId: string): Promise<string[]> {
  const properties = await prisma.property.findMany({
    where: {
      OR: [
        { userId },
        { users: { some: { id: userId } } },
      ],
    },
    select: { id: true },
  });
  return properties.map((p) => p.id);
}
