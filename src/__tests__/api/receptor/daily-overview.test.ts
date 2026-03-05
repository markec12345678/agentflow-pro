/**
 * Unit tests for /api/receptor/daily-overview/route.ts
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/receptor/daily-overview/route';
import { prisma } from '@/database/schema';

// Mock dependencies
jest.mock('@/database/schema', () => ({
  prisma: {
    reservation: {
      findMany: jest.fn(),
    },
    room: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/auth-options', () => ({
  authOptions: {},
}));

jest.mock('@/lib/auth-users', () => ({
  getUserId: jest.fn(),
}));

jest.mock('@/lib/tourism/property-access', () => ({
  getPropertyForUser: jest.fn(),
}));

describe('/api/receptor/daily-overview', () => {
  let mockRequest: NextRequest;
  let mockUserId: string;
  let mockPropertyId: string;

  beforeEach(() => {
    mockUserId = 'user-123';
    mockPropertyId = 'property-123';
    
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default successful auth
    const { getUserId } = require('@/lib/auth-users');
    getUserId.mockReturnValue(mockUserId);
    
    const { getPropertyForUser } = require('@/lib/tourism/property-access');
    getPropertyForUser.mockResolvedValue({
      id: mockPropertyId,
      name: 'Test Property',
    });
    
    const { getServerSession } = require('next-auth');
    getServerSession.mockResolvedValue({
      user: { id: mockUserId },
    });
    
    mockRequest = new NextRequest(
      'http://localhost:3000/api/receptor/daily-overview?propertyId=' + mockPropertyId
    );
  });

  describe('GET /api/receptor/daily-overview', () => {
    it('should return daily overview data for authenticated user', async () => {
      // Mock database responses
      const mockArrivals = [
        {
          id: 'reservation-1',
          checkIn: new Date('2024-01-01T10:00:00Z'),
          status: 'confirmed',
          guest: { id: 'guest-1', name: 'John Doe', email: 'john@example.com', phone: '+1234567890' },
          room: { id: 'room-1', name: '101', type: 'Standard', basePrice: 100 },
          totalPrice: 300,
          channel: 'direct',
          notes: 'Early check-in requested',
        },
      ];

      const mockDepartures = [
        {
          id: 'reservation-2',
          checkOut: new Date('2024-01-01T11:00:00Z'),
          status: 'confirmed',
          guest: { id: 'guest-2', name: 'Jane Smith', email: 'jane@example.com', phone: '+1234567891' },
          room: { id: 'room-2', name: '102', type: 'Deluxe', basePrice: 150 },
          totalPrice: 450,
          channel: 'booking.com',
          notes: 'Late check-out',
        },
      ];

      const mockInHouse = [
        {
          id: 'reservation-3',
          checkIn: new Date('2023-12-31T15:00:00Z'),
          checkOut: new Date('2024-01-02T11:00:00Z'),
          status: 'confirmed',
          guest: { id: 'guest-3', name: 'Bob Johnson', email: 'bob@example.com', phone: '+1234567892' },
          room: { id: 'room-3', name: '103', type: 'Suite', basePrice: 200 },
          totalPrice: 400,
          channel: 'direct',
        },
      ];

      const mockRooms = [
        { id: 'room-1', name: '101', type: 'Standard', capacity: 2, basePrice: 100 },
        { id: 'room-2', name: '102', type: 'Deluxe', capacity: 2, basePrice: 150 },
        { id: 'room-3', name: '103', type: 'Suite', capacity: 4, basePrice: 200 },
        { id: 'room-4', name: '104', type: 'Standard', capacity: 2, basePrice: 100 },
      ];

      const mockPending = [
        {
          id: 'reservation-4',
          checkIn: new Date('2024-01-02T15:00:00Z'),
          status: 'pending',
          guest: { id: 'guest-4', name: 'Alice Brown', email: 'alice@example.com', phone: '+1234567893' },
          room: { id: 'room-4', name: '104', type: 'Standard', basePrice: 100 },
          totalPrice: 200,
          channel: 'direct',
          createdAt: new Date('2024-01-01T09:00:00Z'),
        },
      ];

      // Setup prisma mocks
      const { prisma } = require('@/database/schema');
      prisma.reservation.findMany
        .mockResolvedValueOnce(mockArrivals) // arrivals
        .mockResolvedValueOnce(mockDepartures) // departures
        .mockResolvedValueOnce(mockInHouse) // in-house
        .mockResolvedValueOnce(mockPending); // pending

      prisma.room.findMany.mockResolvedValue(mockRooms);

      // Call the API
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('date');
      expect(data.data).toHaveProperty('stats');
      expect(data.data).toHaveProperty('arrivals');
      expect(data.data).toHaveProperty('departures');
      expect(data.data).toHaveProperty('inHouse');
      expect(data.data).toHaveProperty('pendingReservations');

      // Check stats
      expect(data.data.stats).toEqual({
        arrivals: 1,
        departures: 1,
        inHouse: 1,
        available: 3, // 4 total rooms - 1 in-house
        occupancyRate: 25, // 1/4 * 100
        revenue: 300, // from arrivals
        pendingReservations: 1,
      });

      // Check arrivals formatting
      expect(data.data.arrivals).toHaveLength(1);
      expect(data.data.arrivals[0]).toMatchObject({
        id: 'reservation-1',
        guestName: 'John Doe',
        guestEmail: 'john@example.com',
        guestPhone: '+1234567890',
        roomNumber: '101',
        roomType: 'Standard',
        checkInTime: '10:00',
        totalPrice: 300,
        channel: 'direct',
        status: 'confirmed',
        notes: 'Early check-in requested',
      });
    });

    it('should return 401 for unauthenticated user', async () => {
      // Mock unauthenticated session
      const { getUserId } = require('@/lib/auth-users');
      getUserId.mockReturnValue(null);

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });

    it('should return 400 when propertyId is missing', async () => {
      const requestWithoutPropertyId = new NextRequest('http://localhost:3000/api/receptor/daily-overview');

      const response = await GET(requestWithoutPropertyId);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Property ID is required');
    });

    it('should return 404 when property not found or access denied', async () => {
      // Mock property access denied
      const { getPropertyForUser } = require('@/lib/tourism/property-access');
      getPropertyForUser.mockResolvedValue(null);

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Property not found or access denied');
    });

    it('should handle database errors gracefully', async () => {
      // Mock database error
      const { prisma } = require('@/database/schema');
      prisma.reservation.findMany.mockRejectedValue(new Error('Database error'));

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch daily overview');
    });

    it('should handle custom date parameter', async () => {
      const customDate = '2024-01-15';
      const requestWithDate = new NextRequest(
        `http://localhost:3000/api/receptor/daily-overview?propertyId=${mockPropertyId}&date=${customDate}`
      );

      // Mock empty results for custom date
      const { prisma } = require('@/database/schema');
      prisma.reservation.findMany.mockResolvedValue([]);
      prisma.room.findMany.mockResolvedValue([]);

      const response = await GET(requestWithDate);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.date).toBe(customDate);
      expect(data.data.stats).toEqual({
        arrivals: 0,
        departures: 0,
        inHouse: 0,
        available: 0,
        occupancyRate: 0,
        revenue: 0,
        pendingReservations: 0,
      });
    });

    it('should format guest and room information correctly', async () => {
      // Mock reservation with missing guest/room data
      const mockReservation = {
        id: 'reservation-1',
        checkIn: new Date('2024-01-01T10:00:00Z'),
        status: 'confirmed',
        guest: null, // Missing guest
        room: null, // Missing room
        totalPrice: 300,
        channel: 'direct',
        notes: 'Test note',
      };

      const { prisma } = require('@/database/schema');
      prisma.reservation.findMany.mockResolvedValue([mockReservation]);
      prisma.room.findMany.mockResolvedValue([]);

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.arrivals[0]).toMatchObject({
        guestName: 'Unknown',
        guestEmail: '',
        guestPhone: '',
        roomNumber: 'Unassigned',
        roomType: 'Standard',
        totalPrice: 300,
        channel: 'direct',
        status: 'confirmed',
        notes: 'Test note',
      });
    });

    it('should calculate occupancy rate correctly', async () => {
      // Mock 2 occupied rooms out of 5 total
      const mockInHouse = [
        { id: 'res1', checkIn: new Date(), checkOut: new Date(), status: 'confirmed' },
        { id: 'res2', checkIn: new Date(), checkOut: new Date(), status: 'confirmed' },
      ];

      const mockRooms = [
        { id: 'room1', name: '101' },
        { id: 'room2', name: '102' },
        { id: 'room3', name: '103' },
        { id: 'room4', name: '104' },
        { id: 'room5', name: '105' },
      ];

      const { prisma } = require('@/database/schema');
      prisma.reservation.findMany.mockResolvedValue(mockInHouse);
      prisma.room.findMany.mockResolvedValue(mockRooms);

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(data.data.stats.occupancyRate).toBe(40); // 2/5 * 100 = 40
      expect(data.data.stats.inHouse).toBe(2);
      expect(data.data.stats.available).toBe(3); // 5 - 2 = 3
    });

    it('should handle zero division in occupancy rate calculation', async () => {
      // Mock no rooms
      const { prisma } = require('@/database/schema');
      prisma.reservation.findMany.mockResolvedValue([]);
      prisma.room.findMany.mockResolvedValue([]);

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(data.data.stats.occupancyRate).toBe(0);
      expect(data.data.stats.available).toBe(0);
    });
  });

  describe('Database query validation', () => {
    it('should call prisma.reservation.findMany with correct parameters for arrivals', async () => {
      const { prisma } = require('@/database/schema');
      prisma.reservation.findMany.mockResolvedValue([]);
      prisma.room.findMany.mockResolvedValue([]);

      await GET(mockRequest);

      // Check arrivals query
      expect(prisma.reservation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            propertyId: mockPropertyId,
            checkIn: expect.any(Object),
            status: { in: ['confirmed', 'pending'] },
          }),
          include: expect.objectContaining({
            guest: expect.objectContaining({
              select: expect.objectContaining({
                id: true,
                name: true,
                email: true,
                phone: true,
              }),
            }),
            room: expect.objectContaining({
              select: expect.objectContaining({
                id: true,
                name: true,
                type: true,
                basePrice: true,
              }),
            }),
          }),
          orderBy: {
            checkIn: 'asc',
          },
        })
      );
    });

    it('should call prisma.room.findMany with correct parameters', async () => {
      const { prisma } = require('@/database/schema');
      prisma.reservation.findMany.mockResolvedValue([]);
      prisma.room.findMany.mockResolvedValue([]);

      await GET(mockRequest);

      expect(prisma.room.findMany).toHaveBeenCalledWith({
        where: {
          propertyId: mockPropertyId,
        },
        select: {
          id: true,
          name: true,
          type: true,
          capacity: true,
          basePrice: true,
        },
      });
    });
  });
});
