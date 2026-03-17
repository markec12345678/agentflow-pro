// Mews Adapter stub
export class MewsAdapter {
  async syncProperties(): Promise<any[]> {
    return [];
  }

  async syncReservations(propertyId: string): Promise<any[]> {
    return [];
  }
}

export function getPmsAdapter(): MewsAdapter {
  return new MewsAdapter();
}
