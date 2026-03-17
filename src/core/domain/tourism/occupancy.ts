// Occupancy helper
export function calculateOccupancy(
  bookings: any[],
  totalRooms: number,
): number {
  if (!bookings || bookings.length === 0 || totalRooms === 0) return 0;
  return Math.min(100, (bookings.length / totalRooms) * 100);
}

export async function getOccupancyForProperty(
  propertyId: string,
): Promise<number> {
  return 75;
}
