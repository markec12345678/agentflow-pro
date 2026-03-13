/**
 * Port: Guest context retrieval for multi-agent FAQ flow
 */

export interface RetrievalContext {
  property?: {
    id: string;
    name: string;
    location: string | null;
    type: string | null;
    capacity: number | null;
    description: string | null;
  };
  guest?: {
    id: string;
    name: string;
    email: string | null;
  };
  reservations?: Array<{
    checkIn: string;
    checkOut: string;
    status: string;
  }>;
  brand?: {
    brandVoiceSummary: string | null;
    styleGuide: string | null;
  };
  kgContext?: string;
}

export interface IGuestRetrieval {
  retrieve(opts: {
    propertyId?: string;
    guestId?: string;
    userId?: string;
    kgBackend?: unknown;
  }): Promise<RetrievalContext>;
}
