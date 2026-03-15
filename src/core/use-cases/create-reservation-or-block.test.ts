/**
 * Unit Test: CreateReservationOrBlock Use Case
 */

import { CreateReservationOrBlock } from "@/core/use-cases/create-reservation-or-block";
import { Reservation } from "@/core/domain/tourism/entities/reservation";
import { Guest } from "@/core/domain/guest/entities/guest";
import { Property } from "@/core/domain/tourism/entities/property";
import { Money } from "@/core/domain/shared/value-objects/money";
import { DateRange } from "@/core/domain/shared/value-objects/date-range";
import { Address } from "@/core/domain/shared/value-objects/address";

// ============================================================================
// Mock Repositories
// ============================================================================

class MockReservationRepository {
  private reservations: Reservation[] = [];

  async findConflicts(
    propertyId: string,
    roomId: string | null,
    checkIn: Date,
    checkOut: Date,
  ): Promise<Reservation[]> {
    return this.reservations.filter(
      (r) =>
        r.propertyId === propertyId &&
        r.dateRange.overlaps(new DateRange(checkIn, checkOut)),
    );
  }

  async save(reservation: Reservation): Promise<Reservation> {
    this.reservations.push(reservation);
    return reservation;
  }
}

class MockGuestRepository {
  private guests: Guest[] = [];

  async findByEmail(email: string): Promise<Guest | null> {
    return this.guests.find((g) => g.email === email) || null;
  }

  async save(guest: Guest): Promise<Guest> {
    const index = this.guests.findIndex((g) => g.id === guest.id);
    if (index >= 0) {
      this.guests[index] = guest;
    } else {
      this.guests.push(guest);
    }
    return guest;
  }
}

class MockPropertyRepository {
  async findById(id: string): Promise<Property | null> {
    if (id === "property-1") {
      return new Property({
        id: "property-1",
        name: "Test Property",
        type: "apartment",
        status: "active",
        address: new Address("Test St 1", "Ljubljana", "1000", "Slovenia"),
        description: "Test",
        baseRate: new Money(100, "EUR"),
        amenities: [],
        rooms: [],
        policies: [],
        ownerId: "user-1",
      });
    }
    return null;
  }
}

class MockNotificationRepository {
  async create(data: any): Promise<void> {
    // Mock implementation
  }
}

// ============================================================================
// Tests
// ============================================================================

describe("CreateReservationOrBlock Use Case", () => {
  let useCase: CreateReservationOrBlock;
  let reservationRepo: MockReservationRepository;
  let guestRepo: MockGuestRepository;
  let propertyRepo: MockPropertyRepository;
  let notificationRepo: MockNotificationRepository;

  beforeEach(() => {
    reservationRepo = new MockReservationRepository();
    guestRepo = new MockGuestRepository();
    propertyRepo = new MockPropertyRepository();
    notificationRepo = new MockNotificationRepository();

    useCase = new CreateReservationOrBlock(
      reservationRepo as any,
      guestRepo as any,
      propertyRepo as any,
      notificationRepo as any,
    );
  });

  describe("execute", () => {
    it("should create a new reservation for new guest", async () => {
      const input = {
        propertyId: "property-1",
        roomId: null,
        type: "reservation" as const,
        checkIn: new Date("2026-04-01"),
        checkOut: new Date("2026-04-05"),
        guestName: "John Doe",
        guestEmail: "john@example.com",
        guestPhone: "+38640123456",
        channel: "direct" as const,
        totalAmount: 400,
        deposit: 100,
        touristTax: 20,
        guests: 2,
        userId: "user-1",
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(true);
      expect(result.type).toBe("reservation");
      expect(result.reservation).toBeDefined();
      expect(result.guest).toBeDefined();
      expect(result.guest?.email).toBe("john@example.com");
      expect(result.reservation?.totalPrice).toBe(400);
    });

    it("should reuse existing guest by email", async () => {
      // Create existing guest
      const existingGuest = Guest.create({
        id: "guest-existing",
        email: "existing@example.com",
        firstName: "Jane",
        lastName: "Doe",
      });
      await guestRepo.save(existingGuest);

      const input = {
        propertyId: "property-1",
        roomId: null,
        type: "reservation" as const,
        checkIn: new Date("2026-04-01"),
        checkOut: new Date("2026-04-05"),
        guestName: "Jane Doe",
        guestEmail: "existing@example.com",
        guests: 2,
        userId: "user-1",
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(true);
      expect(result.guest?.id).toBe("guest-existing");
    });

    it("should throw error when property not found", async () => {
      const input = {
        propertyId: "non-existent",
        roomId: null,
        type: "reservation" as const,
        checkIn: new Date("2026-04-01"),
        checkOut: new Date("2026-04-05"),
        guestEmail: "test@example.com",
        guests: 2,
        userId: "user-1",
      };

      await expect(useCase.execute(input)).rejects.toThrow(
        "Property not found",
      );
    });

    it("should throw error when dates conflict and overbooking not allowed", async () => {
      // Create existing reservation
      const existing = new Reservation({
        id: "res-existing",
        propertyId: "property-1",
        guestId: "guest-1",
        dateRange: new DateRange(
          new Date("2026-04-01"),
          new Date("2026-04-05"),
        ),
        guests: 2,
        status: "confirmed",
        paymentStatus: "paid",
        totalPrice: new Money(400, "EUR"),
        paidAmount: new Money(400, "EUR"),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await reservationRepo.save(existing);

      const input = {
        propertyId: "property-1",
        roomId: null,
        type: "reservation" as const,
        checkIn: new Date("2026-04-03"),
        checkOut: new Date("2026-04-07"),
        guestEmail: "test@example.com",
        guests: 2,
        userId: "user-1",
        allowOverbooking: false,
      };

      await expect(useCase.execute(input)).rejects.toThrow("conflicts");
    });

    it("should allow overbooking when explicitly enabled", async () => {
      const input = {
        propertyId: "property-1",
        roomId: null,
        type: "reservation" as const,
        checkIn: new Date("2026-04-01"),
        checkOut: new Date("2026-04-05"),
        guestEmail: "test@example.com",
        guests: 2,
        userId: "user-1",
        allowOverbooking: true,
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(true);
      expect(result.overbookingWarning).toBeDefined();
    });

    it("should create blocked dates", async () => {
      const input = {
        propertyId: "property-1",
        roomId: null,
        type: "blocked" as const,
        checkIn: new Date("2026-04-01"),
        checkOut: new Date("2026-04-03"),
        notes: "Maintenance",
        userId: "user-1",
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(true);
      expect(result.type).toBe("blocked");
      expect(result.blockedDates).toHaveLength(3); // Apr 1, 2, 3
    });
  });
});
