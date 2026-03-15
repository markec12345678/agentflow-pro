/**
 * Use Case: Cancel Reservation or Remove Blocked Date
 *
 * Handles cancelling reservations or removing blocked dates.
 */

import { Reservation } from "@/core/entities/reservation";

// ============================================================================
// Repository Interfaces
// ============================================================================

export interface ReservationRepository {
  findById(id: string): Promise<Reservation | null>;
  cancel(id: string): Promise<void>;
}

export interface BlockedDateRepository {
  findById(
    id: string,
  ): Promise<{ id: string; propertyId: string; roomId?: string | null } | null>;
  delete(id: string): Promise<void>;
}

export interface PropertyRepository {
  findById(id: string): Promise<{ id: string; ownerId: string } | null>;
}

// ============================================================================
// Request/Response Types
// ============================================================================

export interface CancelReservationOrBlockRequest {
  id: string;
  type: "reservation" | "blocked";
  userId: string;
}

export interface CancelReservationOrBlockResponse {
  success: true;
  type: "reservation" | "blocked";
  message: string;
}

// ============================================================================
// Use Case
// ============================================================================

export class CancelReservationOrBlock {
  constructor(
    private reservationRepo: ReservationRepository,
    private blockedDateRepo: BlockedDateRepository,
    private propertyRepo: PropertyRepository,
  ) {}

  async execute(
    input: CancelReservationOrBlockRequest,
  ): Promise<CancelReservationOrBlockResponse> {
    let propertyId: string | null = null;

    // 1. Find the entity and get property ID
    if (input.type === "reservation") {
      const reservation = await this.reservationRepo.findById(input.id);
      if (!reservation) {
        throw new Error("Reservation not found");
      }
      propertyId = reservation.propertyId;
    } else {
      const blocked = await this.blockedDateRepo.findById(input.id);
      if (!blocked) {
        throw new Error("Blocked date not found");
      }
      propertyId = blocked.propertyId;
    }

    // 2. Verify user has access to property
    const property = await this.propertyRepo.findById(propertyId);
    if (!property) {
      throw new Error("Property not found");
    }

    // TODO: Add property access validation (owner/manager check)
    if (property.ownerId !== input.userId) {
      throw new Error("Unauthorized: User does not own this property");
    }

    // 3. Cancel or delete
    if (input.type === "reservation") {
      await this.reservationRepo.cancel(input.id);

      return {
        success: true,
        type: "reservation",
        message: "Rezervacija je bila uspešno preklicana.",
      };
    } else {
      await this.blockedDateRepo.delete(input.id);

      return {
        success: true,
        type: "blocked",
        message: "Blokirani datum je bil uspešno odstranjen.",
      };
    }
  }
}
