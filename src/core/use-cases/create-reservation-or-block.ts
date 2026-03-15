/**
 * Use Case: Create Reservation or Block Date
 *
 * Handles creating either:
 * - A new reservation (with guest, pricing, notifications)
 * - Blocked dates (prevent bookings for specific date range)
 */

import { Reservation } from "@/core/domain/tourism/entities/reservation";
import { Guest } from "@/core/domain/guest/entities/guest";
import { Property } from "@/core/domain/tourism/entities/property";
import { randomBytes } from "crypto";
import { eachDayOfInterval, format } from "date-fns";

// ============================================================================
// Repository Interfaces
// ============================================================================

export interface ReservationRepository {
  findConflicts(
    propertyId: string,
    roomId: string | null,
    checkIn: Date,
    checkOut: Date,
  ): Promise<Reservation[]>;
  save(reservation: Reservation): Promise<Reservation>;
}

export interface GuestRepository {
  findByEmail(email: string): Promise<Guest | null>;
  save(guest: Guest): Promise<Guest>;
}

export interface PropertyRepository {
  findById(id: string): Promise<Property | null>;
}

export interface NotificationRepository {
  create(data: {
    userId: string;
    propertyId: string;
    type: string;
    title: string;
    message: string;
    link?: string;
  }): Promise<void>;
}

// ============================================================================
// Request/Response Types
// ============================================================================

export interface CreateReservationOrBlockRequest {
  // Common
  propertyId: string;
  roomId?: string | null;
  type: "reservation" | "blocked";
  checkIn: Date;
  checkOut: Date;
  notes?: string;
  allowOverbooking?: boolean;

  // Reservation-specific
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  channel?: "direct" | "booking.com" | "airbnb" | "expedia";
  totalAmount?: number;
  deposit?: number;
  touristTax?: number;
  guests?: number;

  // User context
  userId: string;
}

export interface CreateReservationOrBlockResponse {
  success: true;
  type: "reservation" | "blocked";
  reservation?: {
    id: string;
    propertyId: string;
    roomId?: string | null;
    guestId: string;
    checkIn: Date;
    checkOut: Date;
    status: string;
    confirmationCode: string;
    totalPrice?: number;
    deposit?: number;
    touristTax?: number;
  };
  guest?: {
    id: string;
    name: string;
    email: string;
  };
  blockedDates?: Array<{
    id: string;
    propertyId: string;
    roomId?: string | null;
    date: Date;
    reason: string;
  }>;
  overbookingWarning?: string;
  message: string;
}

// ============================================================================
// Use Case
// ============================================================================

export class CreateReservationOrBlock {
  constructor(
    private reservationRepo: ReservationRepository,
    private guestRepo: GuestRepository,
    private propertyRepo: PropertyRepository,
    private notificationRepo: NotificationRepository,
  ) {}

  async execute(
    input: CreateReservationOrBlockRequest,
  ): Promise<CreateReservationOrBlockResponse> {
    // 1. Validate property exists and user has access
    const property = await this.propertyRepo.findById(input.propertyId);
    if (!property) {
      throw new Error("Property not found");
    }

    // TODO: Add property access validation (owner/manager check)

    // 2. Check for date conflicts
    const conflicts = await this.reservationRepo.findConflicts(
      input.propertyId,
      input.roomId || null,
      input.checkIn,
      input.checkOut,
    );

    let overbookingWarning: string | undefined;
    if (conflicts.length > 0) {
      if (!input.allowOverbooking) {
        throw new Error(
          `Date range conflicts with existing reservation ${conflicts[0].id}`,
        );
      }
      overbookingWarning = `Overbooking – prekrivanje z rezervacijo ${conflicts[0].id}`;
    }

    // 3. Handle based on type
    if (input.type === "reservation") {
      return this.createReservation(input, overbookingWarning);
    } else {
      return this.createBlockedDates(input, overbookingWarning);
    }
  }

  private async createReservation(
    input: CreateReservationOrBlockRequest,
    overbookingWarning?: string,
  ): Promise<CreateReservationOrBlockResponse> {
    // Validate required fields for reservation
    if (!input.guestEmail) {
      throw new Error("guestEmail is required for reservations");
    }

    // 1. Find or create guest
    let guest = await this.guestRepo.findByEmail(input.guestEmail);

    if (!guest) {
      guest = Guest.create({
        name: input.guestName || "Guest",
        email: input.guestEmail,
        phone: input.guestPhone,
      });
      await this.guestRepo.save(guest);
    }

    // 2. Create reservation
    const confirmationCode = randomBytes(24).toString("base64url");

    const reservation = Reservation.create({
      propertyId: input.propertyId,
      roomId: input.roomId || undefined,
      guestId: guest.id,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      channel: input.channel || "direct",
      totalPrice: input.totalAmount,
      deposit: input.deposit,
      touristTax: input.touristTax,
      notes: input.notes,
      status: "confirmed",
      checkInToken: confirmationCode,
      guests: input.guests,
    });

    await this.reservationRepo.save(reservation);

    // 3. Send notification
    await this.notificationRepo.create({
      userId: input.userId,
      propertyId: input.propertyId,
      type: "success",
      title: "Nova rezervacija",
      message: `${input.guestName || "Gost"} · ${format(input.checkIn, "d.M.yyyy")} - ${format(input.checkOut, "d.M.yyyy")}`,
      link: `/dashboard/tourism/calendar?reservation=${reservation.id}`,
    });

    // TODO: Trigger email confirmation (use domain events instead of direct call)

    return {
      success: true,
      type: "reservation",
      reservation: {
        id: reservation.id,
        propertyId: reservation.propertyId,
        roomId: reservation.roomId,
        guestId: reservation.guestId,
        checkIn: reservation.checkIn,
        checkOut: reservation.checkOut,
        status: reservation.status,
        confirmationCode,
        totalPrice: reservation.totalPrice,
        deposit: reservation.deposit,
        touristTax: reservation.touristTax,
      },
      guest: {
        id: guest.id,
        name: guest.name,
        email: guest.email,
      },
      overbookingWarning,
      message: "Rezervacija je bila uspešno ustvarjena.",
    };
  }

  private async createBlockedDates(
    input: CreateReservationOrBlockRequest,
    overbookingWarning?: string,
  ): Promise<CreateReservationOrBlockResponse> {
    // Generate blocked dates for each day in range
    const days = eachDayOfInterval({
      start: input.checkIn,
      end: input.checkOut,
    });

    // TODO: Use repository to bulk create blocked dates
    // For now, return mock response
    const blockedDates = days.map((day, index) => ({
      id: `blocked-${Date.now()}-${index}`,
      propertyId: input.propertyId,
      roomId: input.roomId || null,
      date: day,
      reason: input.notes || "Blocked",
    }));

    return {
      success: true,
      type: "blocked",
      blockedDates,
      overbookingWarning,
      message: `Blokiranih ${blockedDates.length} datumov.`,
    };
  }
}
