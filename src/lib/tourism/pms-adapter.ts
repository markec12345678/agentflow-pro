/**
 * AgentFlow Pro - PMS Adapter (Roadmap § 2.B.7)
 * Abstraction layer for Property Management System integrations.
 * Implementations: MewsAdapter, (future: OperaAdapter, HubSpotAdapter for deals)
 */

export interface PmsReservation {
  externalId: string;
  propertyId: string;
  checkIn: Date;
  checkOut: Date;
  status: "confirmed" | "cancelled" | "pending";
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  totalPrice?: number;
  channel?: string;
  raw?: unknown;
}

export interface PmsSyncResult {
  synced: number;
  created: number;
  updated: number;
  errors: string[];
}

export interface PmsAdapterConfig {
  propertyId: string;
  credentials: Record<string, string>; // accessToken, clientToken, etc.
}

/**
 * Abstract interface for PMS integrations.
 * Syncs reservations from external PMS into AgentFlow (Reservation, Guest).
 */
export interface PmsAdapter {
  readonly name: string;

  /**
   * Fetch reservations from PMS for the given date range.
   */
  getReservations(opts: {
    config: PmsAdapterConfig;
    from: Date;
    to: Date;
  }): Promise<PmsReservation[]>;

  /**
   * Sync reservations to AgentFlow DB. Creates/updates Guest and Reservation.
   */
  syncToAgentFlow(opts: {
    config: PmsAdapterConfig;
    reservations: PmsReservation[];
  }): Promise<PmsSyncResult>;
}
