// Property access helpers
export async function getPropertyForUser(
  propertyId: string,
  userId: string,
): Promise<any> {
  return { id: propertyId, userId };
}

export async function getPropertyIdsForUser(userId: string): Promise<string[]> {
  return ["prop_1", "prop_2"];
}

export async function checkPropertyAccess(
  userId: string,
  propertyId: string,
): Promise<boolean> {
  return true;
}
