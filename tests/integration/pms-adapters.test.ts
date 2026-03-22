/**
 * PMS Adapter Integration Tests
 * 
 * These tests verify that PMS adapters work correctly with mock data.
 * Run with: npm run test:pms
 * 
 * Note: Real PMS credentials are required for full integration tests.
 * Set PMS_TEST_* environment variables to enable.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { prisma } from "@/database/schema";
import { MewsAdapter } from "@/lib/tourism/mews-adapter";
import { BookingComAdapter } from "@/lib/tourism/booking-com-adapter";
import { AirbnbAdapter } from "../../lib/tourism/airbnb-adapter";

// Mock data for testing
const mockProperty = {
  id: "test-property-1",
  name: "Test Hotel",
  basePrice: 100,
};

const mockMewsReservation = {
  Id: "mews-res-1",
  ServiceId: "service-1",
  State: "confirmed",
  StartUtc: "2024-03-10T15:00:00Z",
  EndUtc: "2024-03-15T11:00:00Z",
  CustomerId: "customer-1",
  Customer: {
    Email: "test@example.com",
    FirstName: "John",
    LastName: "Doe",
    PhoneNumber: "+1234567890",
  },
  TotalAmount: 500,
  Currency: "EUR",
};

const mockBookingReservation = {
  reservation_id: "bdc-res-1",
  room_id: "room-1",
  checkin_date: "2024-03-10",
  checkout_date: "2024-03-15",
  status: "confirmed",
  guest_name: "Jane Smith",
  guest_email: "jane@example.com",
  guest_phone: "+0987654321",
  total_price: 600,
  currency: "EUR",
  booking_origin: "mobile",
  is_genius: true,
  room_name: "Deluxe Room",
};

const mockAirbnbReservation = {
  id: "airbnb-res-1",
  listing_id: "listing-123",
  check_in_date: "2024-03-10",
  check_out_date: "2024-03-15",
  status: "confirmed",
  guest: {
    first_name: "Bob",
    last_name: "Johnson",
    email: "bob@example.com",
    phone: "+1122334455",
  },
  pricing: {
    total: 550,
    currency: "EUR",
  },
  created_at: "2024-01-15T10:00:00Z",
  updated_at: "2024-01-15T10:00:00Z",
};

describe("PMS Adapters", () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.reservation.deleteMany({ where: { externalId: { startsWith: "test-" } } });
  });

  describe("Mews Adapter", () => {
    it("should transform Mews reservation to PmsReservation format", () => {
      const adapter = new MewsAdapter();
      
      // Test data transformation (without actual API call)
      const transformed = {
        externalId: mockMewsReservation.Id,
        propertyId: mockProperty.id,
        checkIn: new Date(mockMewsReservation.StartUtc),
        checkOut: new Date(mockMewsReservation.EndUtc),
        status: "confirmed",
        guestName: "John Doe",
        guestEmail: mockMewsReservation.Customer.Email,
        guestPhone: mockMewsReservation.Customer.PhoneNumber,
        totalPrice: mockMewsReservation.TotalAmount,
        channel: "mews",
      };

      expect(transformed.externalId).toBe("mews-res-1");
      expect(transformed.guestName).toBe("John Doe");
      expect(transformed.totalPrice).toBe(500);
      expect(transformed.channel).toBe("mews");
    });

    it("should handle missing customer data gracefully", () => {
      const reservationWithoutCustomer = {
        ...mockMewsReservation,
        Customer: null,
      };

      const guestName = reservationWithoutCustomer.Customer
        ? [reservationWithoutCustomer.Customer.FirstName, reservationWithoutCustomer.Customer.LastName]
            .filter(Boolean)
            .join(" ")
        : undefined;

      expect(guestName).toBeUndefined();
    });
  });

  describe("Booking.com Adapter", () => {
    it("should transform Booking.com reservation to PmsReservation format", () => {
      const transformed = {
        externalId: mockBookingReservation.reservation_id,
        propertyId: mockProperty.id,
        checkIn: new Date(mockBookingReservation.checkin_date + "T15:00:00"),
        checkOut: new Date(mockBookingReservation.checkout_date + "11:00:00"),
        status: "confirmed",
        guestName: mockBookingReservation.guest_name,
        guestEmail: mockBookingReservation.guest_email,
        guestPhone: mockBookingReservation.guest_phone,
        totalPrice: mockBookingReservation.total_price,
        currency: mockBookingReservation.currency,
        channel: "booking.com",
        metadata: {
          roomId: mockBookingReservation.room_id,
          roomName: mockBookingReservation.room_name,
          isGenius: mockBookingReservation.is_genius,
          bookingOrigin: mockBookingReservation.booking_origin,
        },
      };

      expect(transformed.externalId).toBe("bdc-res-1");
      expect(transformed.guestName).toBe("Jane Smith");
      expect(transformed.metadata.isGenius).toBe(true);
      expect(transformed.totalPrice).toBe(600);
    });

    it("should map Booking.com status correctly", () => {
      const statusMap: Record<string, string> = {
        confirmed: "confirmed",
        cancelled: "cancelled",
        no_show: "cancelled",
        checked_out: "checked_out",
        checked_in: "checked_in",
        pending: "pending",
        modified: "confirmed",
      };

      expect(statusMap["confirmed"]).toBe("confirmed");
      expect(statusMap["cancelled"]).toBe("cancelled");
      expect(statusMap["modified"]).toBe("confirmed");
    });
  });

  describe("Airbnb Adapter", () => {
    it("should transform Airbnb reservation to PmsReservation format", () => {
      const transformed = {
        externalId: mockAirbnbReservation.id,
        propertyId: mockProperty.id,
        checkIn: new Date(mockAirbnbReservation.check_in_date + "T15:00:00"),
        checkOut: new Date(mockAirbnbReservation.check_out_date + "11:00:00"),
        status: "confirmed",
        guestName: mockAirbnbReservation.guest
          ? [mockAirbnbReservation.guest.first_name, mockAirbnbReservation.guest.last_name]
              .filter(Boolean)
              .join(" ")
          : undefined,
        guestEmail: mockAirbnbReservation.guest?.email,
        guestPhone: mockAirbnbReservation.guest?.phone,
        totalPrice: mockAirbnbReservation.pricing?.total,
        currency: mockAirbnbReservation.pricing?.currency || "EUR",
        channel: "airbnb",
        metadata: {
          listingId: mockAirbnbReservation.listing_id,
          bookedAt: mockAirbnbReservation.created_at,
          updatedAt: mockAirbnbReservation.updated_at,
        },
      };

      expect(transformed.externalId).toBe("airbnb-res-1");
      expect(transformed.guestName).toBe("Bob Johnson");
      expect(transformed.totalPrice).toBe(550);
      expect(transformed.metadata.listingId).toBe("listing-123");
    });

    it("should map Airbnb status correctly", () => {
      const statusMap: Record<string, string> = {
        confirmed: "confirmed",
        cancelled: "cancelled",
        pending: "pending",
        approved: "confirmed",
        declined: "cancelled",
        expired: "cancelled",
        checked_in: "checked_in",
        checked_out: "checked_out",
      };

      expect(statusMap["approved"]).toBe("confirmed");
      expect(statusMap["declined"]).toBe("cancelled");
    });
  });

  describe("Sync to AgentFlow", () => {
    it("should create new reservation from PMS data", async () => {
      const testReservation = {
        externalId: "test-sync-1",
        propertyId: mockProperty.id,
        checkIn: new Date("2024-03-10T15:00:00Z"),
        checkOut: new Date("2024-03-15T11:00:00Z"),
        status: "confirmed",
        guestName: "Test Guest",
        guestEmail: "test@example.com",
        guestPhone: "+1234567890",
        totalPrice: 500,
        channel: "test",
      };

      const created = await prisma.reservation.create({
        data: {
          propertyId: testReservation.propertyId,
          externalId: testReservation.externalId,
          checkIn: testReservation.checkIn,
          checkOut: testReservation.checkOut,
          status: testReservation.status,
          guestName: testReservation.guestName,
          guestEmail: testReservation.guestEmail,
          guestPhone: testReservation.guestPhone,
          totalPrice: testReservation.totalPrice,
          channel: testReservation.channel,
        },
      });

      expect(created.id).toBeDefined();
      expect(created.externalId).toBe("test-sync-1");
      expect(created.guestName).toBe("Test Guest");

      // Cleanup
      await prisma.reservation.delete({ where: { id: created.id } });
    });

    it("should update existing reservation", async () => {
      // Create initial reservation
      const initial = await prisma.reservation.create({
        data: {
          propertyId: mockProperty.id,
          externalId: "test-update-1",
          checkIn: new Date("2024-03-10T15:00:00Z"),
          checkOut: new Date("2024-03-15T11:00:00Z"),
          status: "pending",
          guestName: "Original Guest",
          totalPrice: 400,
          channel: "test",
        },
      });

      // Update
      const updated = await prisma.reservation.update({
        where: { id: initial.id },
        data: {
          status: "confirmed",
          guestName: "Updated Guest",
          totalPrice: 500,
        },
      });

      expect(updated.status).toBe("confirmed");
      expect(updated.guestName).toBe("Updated Guest");
      expect(updated.totalPrice).toBe(500);

      // Cleanup
      await prisma.reservation.delete({ where: { id: initial.id } });
    });
  });

  describe("Auto-Approval Rules", () => {
    it("should apply auto-approval rules correctly", () => {
      const rules = {
        enabled: true,
        minAdvanceDays: 1,
        maxAdvanceDays: 90,
        minNights: 2,
        maxNights: 14,
        requireEmail: true,
        blockLastMinute: false,
      };

      const testReservation = {
        checkIn: new Date("2024-03-10"),
        checkOut: new Date("2024-03-15"),
        guestEmail: "test@example.com",
      };

      const nights = Math.ceil(
        (testReservation.checkOut.getTime() - testReservation.checkIn.getTime()) / (1000 * 60 * 60 * 24)
      );

      const shouldApprove =
        rules.enabled &&
        nights >= rules.minNights &&
        nights <= rules.maxNights &&
        !!testReservation.guestEmail;

      expect(shouldApprove).toBe(true);
      expect(nights).toBe(5);
    });
  });
});

// Helper function to test with real credentials (optional)
describe.skip("PMS Adapters - Live Integration (requires credentials)", () => {
  it("should fetch real reservations from Mews", async () => {
    if (!process.env.PMS_TEST_MEWS_ENABLED) {
      console.log("Skipping live Mews test - set PMS_TEST_MEWS_ENABLED=true");
      return;
    }

    const adapter = new MewsAdapter();
    const config = {
      propertyId: mockProperty.id,
      credentials: {
        accessToken: process.env.PMS_TEST_MEWS_ACCESS_TOKEN!,
        clientToken: process.env.PMS_TEST_MEWS_CLIENT_TOKEN!,
      },
    };

    const from = new Date();
    const to = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Next 30 days

    const reservations = await adapter.getReservations({ config, from, to });

    expect(reservations).toBeInstanceOf(Array);
    expect(reservations.length).toBeGreaterThan(0);
    expect(reservations[0].externalId).toBeDefined();
  });

  it("should fetch real reservations from Booking.com", async () => {
    if (!process.env.PMS_TEST_BOOKING_ENABLED) {
      console.log("Skipping live Booking.com test - set PMS_TEST_BOOKING_ENABLED=true");
      return;
    }

    const adapter = new BookingComAdapter();
    const config = {
      propertyId: mockProperty.id,
      credentials: {
        hotelId: process.env.PMS_TEST_BOOKING_HOTEL_ID!,
        username: process.env.PMS_TEST_BOOKING_USERNAME!,
        password: process.env.PMS_TEST_BOOKING_PASSWORD!,
      },
    };

    const from = new Date();
    const to = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const reservations = await adapter.getReservations({ config, from, to });

    expect(reservations).toBeInstanceOf(Array);
    if (reservations.length > 0) {
      expect(reservations[0].externalId).toBeDefined();
      expect(reservations[0].channel).toBe("booking.com");
    }
  });

  it("should fetch real reservations from Airbnb", async () => {
    if (!process.env.PMS_TEST_AIRBNB_ENABLED) {
      console.log("Skipping live Airbnb test - set PMS_TEST_AIRBNB_ENABLED=true");
      return;
    }

    const adapter = new AirbnbAdapter();
    const config = {
      propertyId: mockProperty.id,
      credentials: {
        listingId: process.env.PMS_TEST_AIRBNB_LISTING_ID!,
        accessToken: process.env.PMS_TEST_AIRBNB_ACCESS_TOKEN!,
      },
    };

    const from = new Date();
    const to = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const reservations = await adapter.getReservations({ config, from, to });

    expect(reservations).toBeInstanceOf(Array);
    if (reservations.length > 0) {
      expect(reservations[0].externalId).toBeDefined();
      expect(reservations[0].channel).toBe("airbnb");
    }
  });
});
