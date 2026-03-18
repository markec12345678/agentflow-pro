/**
 * CheckAvailability UseCase Tests
 */

import { CheckAvailabilityUseCase } from './check-availability';
import { RoomRepositoryImpl } from '@/infrastructure/database/repositories/room-repository';
import { ReservationRepositoryImpl } from '@/infrastructure/database/repositories/reservation-repository';
import { BlockRepositoryImpl } from '@/infrastructure/database/repositories/block-repository';

// Mock repositories
const mockRoomRepository = {
  findByPropertyId: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
} as unknown as RoomRepositoryImpl;

const mockReservationRepository = {
  findByDateRange: jest.fn(),
  findByRoomId: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
} as unknown as ReservationRepositoryImpl;

const mockBlockRepository = {
  findByDateRange: jest.fn(),
  findByRoomId: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
} as unknown as BlockRepositoryImpl;

describe('CheckAvailabilityUseCase', () => {
  let useCase: CheckAvailabilityUseCase;

  beforeEach(() => {
    useCase = new CheckAvailabilityUseCase(
      mockRoomRepository,
      mockReservationRepository,
      mockBlockRepository
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const validInput = {
      propertyId: 'property-123',
      checkIn: new Date('2025-07-01'),
      checkOut: new Date('2025-07-07'),
      guests: 2,
      rooms: 1,
    };

    it('should return available rooms when rooms are available', async () => {
      // Arrange
      const mockRooms = [
        {
          id: 'room-1',
          propertyId: 'property-123',
          name: 'Deluxe Room',
          capacity: 2,
          basePrice: 100,
        },
        {
          id: 'room-2',
          propertyId: 'property-123',
          name: 'Suite',
          capacity: 4,
          basePrice: 200,
        },
      ];

      mockRoomRepository.findByPropertyId.mockResolvedValue(mockRooms);
      mockReservationRepository.findByDateRange.mockResolvedValue([]);
      mockBlockRepository.findByDateRange.mockResolvedValue([]);

      // Act
      const result = await useCase.execute(validInput);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.availableRooms).toHaveLength(2);
      expect(result.data?.available).toBe(true);
    });

    it('should return unavailable when all rooms are booked', async () => {
      // Arrange
      const mockRooms = [
        {
          id: 'room-1',
          propertyId: 'property-123',
          name: 'Deluxe Room',
          capacity: 2,
        },
      ];

      const mockReservations = [
        {
          id: 'res-1',
          roomId: 'room-1',
          checkIn: new Date('2025-06-28'),
          checkOut: new Date('2025-07-05'),
          status: 'confirmed',
        },
      ];

      mockRoomRepository.findByPropertyId.mockResolvedValue(mockRooms);
      mockReservationRepository.findByDateRange.mockResolvedValue(mockReservations);
      mockBlockRepository.findByDateRange.mockResolvedValue([]);

      // Act
      const result = await useCase.execute(validInput);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.available).toBe(false);
      expect(result.data?.availableRooms).toHaveLength(0);
    });

    it('should return unavailable when rooms are blocked', async () => {
      // Arrange
      const mockRooms = [
        {
          id: 'room-1',
          propertyId: 'property-123',
          name: 'Deluxe Room',
          capacity: 2,
        },
      ];

      const mockBlocks = [
        {
          id: 'block-1',
          roomId: 'room-1',
          startDate: new Date('2025-06-30'),
          endDate: new Date('2025-07-10'),
          reason: 'maintenance',
        },
      ];

      mockRoomRepository.findByPropertyId.mockResolvedValue(mockRooms);
      mockReservationRepository.findByDateRange.mockResolvedValue([]);
      mockBlockRepository.findByDateRange.mockResolvedValue(mockBlocks);

      // Act
      const result = await useCase.execute(validInput);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.available).toBe(false);
    });

    it('should filter rooms by capacity', async () => {
      // Arrange
      const mockRooms = [
        {
          id: 'room-1',
          propertyId: 'property-123',
          name: 'Single Room',
          capacity: 1,
        },
        {
          id: 'room-2',
          propertyId: 'property-123',
          name: 'Double Room',
          capacity: 2,
        },
        {
          id: 'room-3',
          propertyId: 'property-123',
          name: 'Family Suite',
          capacity: 4,
        },
      ];

      mockRoomRepository.findByPropertyId.mockResolvedValue(mockRooms);
      mockReservationRepository.findByDateRange.mockResolvedValue([]);
      mockBlockRepository.findByDateRange.mockResolvedValue([]);

      const input = { ...validInput, guests: 3 };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.availableRooms).toHaveLength(1); // Only Family Suite
      expect(result.data?.availableRooms[0].capacity).toBeGreaterThanOrEqual(3);
    });

    it('should handle partial availability', async () => {
      // Arrange
      const mockRooms = [
        { id: 'room-1', propertyId: 'property-123', name: 'Room 1', capacity: 2 },
        { id: 'room-2', propertyId: 'property-123', name: 'Room 2', capacity: 2 },
        { id: 'room-3', propertyId: 'property-123', name: 'Room 3', capacity: 2 },
      ];

      const mockReservations = [
        {
          id: 'res-1',
          roomId: 'room-1',
          checkIn: new Date('2025-06-28'),
          checkOut: new Date('2025-07-05'),
          status: 'confirmed',
        },
      ];

      mockRoomRepository.findByPropertyId.mockResolvedValue(mockRooms);
      mockReservationRepository.findByDateRange.mockResolvedValue(mockReservations);
      mockBlockRepository.findByDateRange.mockResolvedValue([]);

      // Act
      const result = await useCase.execute(validInput);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.available).toBe(true);
      expect(result.data?.availableRooms).toHaveLength(2); // Room 2 and 3
    });

    it('should fail when property ID is missing', async () => {
      // Arrange
      const invalidInput = { ...validInput, propertyId: undefined };

      // Act
      const result = await useCase.execute(invalidInput as any);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('propertyId');
    });

    it('should fail when check-in date is missing', async () => {
      // Arrange
      const invalidInput = { ...validInput, checkIn: undefined };

      // Act
      const result = await useCase.execute(invalidInput as any);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('checkIn');
    });

    it('should fail when check-out date is missing', async () => {
      // Arrange
      const invalidInput = { ...validInput, checkOut: undefined };

      // Act
      const result = await useCase.execute(invalidInput as any);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('checkOut');
    });

    it('should fail when check-out is before check-in', async () => {
      // Arrange
      const invalidInput = {
        ...validInput,
        checkIn: new Date('2025-07-07'),
        checkOut: new Date('2025-07-01'),
      };

      // Act
      const result = await useCase.execute(invalidInput);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('checkOut must be after checkIn');
    });

    it('should handle repository errors gracefully', async () => {
      // Arrange
      mockRoomRepository.findByPropertyId.mockRejectedValue(
        new Error('Database error')
      );

      // Act
      const result = await useCase.execute(validInput);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to check availability');
    });
  });
});
