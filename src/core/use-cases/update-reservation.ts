/**
 * Use Case: Update Reservation
 *
 * Updates an existing reservation with new details.
 */

import { Reservation } from "@/core/entities/reservation";

// ============================================================================
// Repository Interfaces
// ============================================================================

export interface ReservationRepository {
  findById(id: string): Promise<Reservation | null>;
  save(reservation: Reservation): Promise<Reservation>;
}

export interface PropertyRepository {
  findById(id: string): Promise<Property | null>;
}

interface Property {
  id: string;
  ownerId: string;
}

// ============================================================================
// Request/Response Types
// ============================================================================

export interface UpdateReservationRequest {
  reservationId: string;
  status?: string;
  notes?: string;
  totalAmount?: number;
  deposit?: number | null;
  touristTax?: number | null;
  userId: string;
}

export interface UpdateReservationResponse {
  success: true;
  reservation: {
    id: string;
    propertyId: string;
    status: string;
    notes?: string;
    totalPrice?: number;
    deposit?: number | null;
    touristTax?: number | null;
    updatedAt: Date;
  };
  message: string;
}

// ============================================================================
// Use Case
// ============================================================================

export class UpdateReservation {
  constructor(
    private reservationRepo: ReservationRepository,
    private propertyRepo: PropertyRepository,
  ) {}

  async execute(
    input: UpdateReservationRequest,
  ): Promise<UpdateReservationResponse> {
    // 1. Find existing reservation
    const reservation = await this.reservationRepo.findById(
      input.reservationId,
    );

    if (!reservation) {
      throw new Error("Reservation not found");
    }

    // 2. Verify user has access to property
    const property = await this.propertyRepo.findById(reservation.propertyId);
    if (!property) {
      throw new Error("Property not found");
    }

    // TODO: Add property access validation (owner/manager check)
    if (property.ownerId !== input.userId) {
      throw new Error("Unauthorized: User does not own this property");
    }

    // 3. Update fields
    if (input.status !== undefined) {
      reservation.updateStatus(input.status);
    }

    if (input.notes !== undefined) {
      reservation.updateNotes(input.notes);
    }

    if (input.totalAmount !== undefined) {
      reservation.updatePrice(input.totalAmount);
    }

    if (input.deposit !== undefined) {
      reservation.updateDeposit(input.deposit);
    }

    if (input.touristTax !== undefined) {
      reservation.updateTouristTax(input.touristTax);
    }

    // 4. Save changes
    const updated = await this.reservationRepo.save(reservation);

    return {
      success: true,
      reservation: {
        id: updated.id,
        propertyId: updated.propertyId,
        status: updated.status,
        notes: updated.notes,
        totalPrice: updated.totalPrice,
        deposit: updated.deposit,
        touristTax: updated.touristTax,
        updatedAt: updated.updatedAt,
      },
      message: "Rezervacija je bila uspešno posodobljena.",
    };
  }
}
