/**
 * Tourism KG Sync - Blok C #10
 * Tests with mocked prisma and MemoryBackend
 */
import {
  syncPropertyToKg,
  syncGuestToKg,
  syncReservationToKg,
} from "@/lib/tourism/tourism-kg-sync";

const mockCreateEntities = jest.fn();
const mockCreateRelations = jest.fn();

const mockBackend = {
  createEntities: mockCreateEntities,
  createRelations: mockCreateRelations,
};

jest.mock("@/database/schema", () => ({
  prisma: {
    property: {
      findUnique: jest.fn(),
    },
    guest: {
      findUnique: jest.fn(),
    },
    reservation: {
      findUnique: jest.fn(),
    },
  },
}));

const { prisma } = require("@/database/schema");

describe("tourism-kg-sync", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("syncPropertyToKg", () => {
    it("creates entity and relation when property exists", async () => {
      (prisma.property.findUnique as jest.Mock).mockResolvedValue({
        id: "prop-1",
        name: "Apartma Kolpa",
        location: "Bela Krajina",
        type: "apartma",
        capacity: 4,
        description: "Lep apartma",
        userId: "user-1",
      });

      await syncPropertyToKg(mockBackend as any, "prop-1");

      expect(mockCreateEntities).toHaveBeenCalledWith([
        expect.objectContaining({
          name: "property:prop-1",
          entityType: "Property",
          observations: expect.arrayContaining([
            "name: Apartma Kolpa",
            "location: Bela Krajina",
            "type: apartma",
            "capacity: 4",
          ]),
        }),
      ]);
      expect(mockCreateRelations).toHaveBeenCalledWith([
        { from: "property:prop-1", to: "user:user-1", relationType: "belongsTo" },
      ]);
    });

    it("does nothing when property not found", async () => {
      (prisma.property.findUnique as jest.Mock).mockResolvedValue(null);

      await syncPropertyToKg(mockBackend as any, "missing");

      expect(mockCreateEntities).not.toHaveBeenCalled();
      expect(mockCreateRelations).not.toHaveBeenCalled();
    });
  });

  describe("syncGuestToKg", () => {
    it("creates entity and relation when guest exists", async () => {
      (prisma.guest.findUnique as jest.Mock).mockResolvedValue({
        id: "guest-1",
        name: "Janez",
        email: "j@example.com",
        propertyId: "prop-1",
      });

      await syncGuestToKg(mockBackend as any, "guest-1");

      expect(mockCreateEntities).toHaveBeenCalledWith([
        expect.objectContaining({
          name: "guest:guest-1",
          entityType: "Guest",
        }),
      ]);
      expect(mockCreateRelations).toHaveBeenCalledWith([
        { from: "property:prop-1", to: "guest:guest-1", relationType: "hasGuest" },
      ]);
    });

    it("does nothing when guest not found", async () => {
      (prisma.guest.findUnique as jest.Mock).mockResolvedValue(null);

      await syncGuestToKg(mockBackend as any, "missing");

      expect(mockCreateEntities).not.toHaveBeenCalled();
    });
  });

  describe("syncReservationToKg", () => {
    it("creates entity and relations", async () => {
      (prisma.reservation.findUnique as jest.Mock).mockResolvedValue({
        id: "res-1",
        propertyId: "prop-1",
        guestId: "guest-1",
        checkIn: new Date("2025-06-01"),
        checkOut: new Date("2025-06-05"),
        status: "confirmed",
        channel: "booking.com",
      });

      await syncReservationToKg(mockBackend as any, "res-1");

      expect(mockCreateEntities).toHaveBeenCalledWith([
        expect.objectContaining({
          name: "reservation:res-1",
          entityType: "Reservation",
        }),
      ]);
      expect(mockCreateRelations).toHaveBeenCalledTimes(2);
      expect(mockCreateRelations).toHaveBeenNthCalledWith(1, [
        { from: "property:prop-1", to: "reservation:res-1", relationType: "hasReservation" },
      ]);
      expect(mockCreateRelations).toHaveBeenNthCalledWith(2, [
        { from: "guest:guest-1", to: "reservation:res-1", relationType: "hasReservation" },
      ]);
    });

    it("does nothing when reservation not found", async () => {
      (prisma.reservation.findUnique as jest.Mock).mockResolvedValue(null);

      await syncReservationToKg(mockBackend as any, "missing");

      expect(mockCreateEntities).not.toHaveBeenCalled();
    });
  });
});
