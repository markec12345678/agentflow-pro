/**
 * Unit tests for /api/receptor/rooms/status/route.ts
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/receptor/rooms/status/route';
import { prisma } from '@/database/schema';

// Mock dependencies
jest.mock('@/database/schema', () => ({
  prisma: {
    room: {
      findMany: jest.fn(),
    },
    reservation: {
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

describe('/api/receptor/rooms/status', () => {
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
      'http://localhost:3000/api/receptor/rooms/status?propertyId=' + mockPropertyId
    );
  });

  describe('GET /api/receptor/rooms/status', () => {
    it('should return real-time room status for authenticated user', async () => {
      // Mock rooms data
      const mockRooms = [
        {
          id: 'room-1',
          name: '101',
          type: 'Standard',
          capacity: 2,
          basePrice: 100,
        },
        {
          id: 'room-2',
          name: '102',
          type: 'Deluxe',
          capacity: 2,
          basePrice: 150,
        },
        {
          id: 'room-3',
          name: '103',
          type: 'Suite',
          capacity: 4,
          basePrice: 200,
        },
      ];

      // Mock reservations data
      const mockReservations = [
        {
          id: 'reservation-1',
          roomId: 'room-1',
          checkIn: new Date('2024-01-01T15:00:00Z'),
          checkOut: new Date('2024-01-03T11:00:00Z'),
          status: 'confirmed',
          guest: {
            id: 'guest-1',
            name: 'John Doe',
            email: 'john@example.com',
            phone: '+1234567890',
          },
        },
        {
          id: 'reservation-2',
          roomId: 'room-2',
          checkIn: new Date('2024-01-02T15:00:00Z'),
          checkOut: new Date('2024-01-04T11:00:00Z'),
          status: 'confirmed',
          guest: {
            id: 'guest-2',
            name: 'Jane Smith',
            email: 'jane@example.com',
            phone: '+1234567891',
          },
        },
      ];

      // Setup prisma mocks
      const { prisma } = require('@/database/schema');
      prisma.room.findMany.mockResolvedValue(mockRooms);
      prisma.reservation.findMany.mockResolvedValue(mockReservations);

      // Call the API
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('rooms');
      expect(data.data.rooms).toHaveLength(3);

      // Check room 1 (occupied)
      const room1 = data.data.rooms.find(r => r.id === 'room-1');
      expect(room1).toMatchObject({
        id: 'room-1',
        name: '101',
        type: 'Standard',
        capacity: 2,
        basePrice: 100,
        status: 'occupied',
        currentGuest: {
          id: 'guest-1',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
        },
        checkIn: expect.any(String),
        checkOut: expect.any(String),
      });

      // Check room 2 (occupied)
      const room2 = data.data.rooms.find(r => r.id === 'room-2');
      expect(room2.status).toBe('occupied');
      expect(room2.currentGuest.name).toBe('Jane Smith');

      // Check room 3 (available)
      const room3 = data.data.rooms.find(r => r.id === 'room-3');
      expect(room3).toMatchObject({
        id: 'room-3',
        name: '103',
        type: 'Suite',
        capacity: 4,
        basePrice: 200,
        status: 'available',
        currentGuest: null,
        nextGuest: null,
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
      const requestWithoutPropertyId = new NextRequest('http://localhost:3000/api/receptor/rooms/status');

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
      prisma.room.findMany.mockRejectedValue(new Error('Database error'));

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch room status');
    });

    it('should determine room status correctly based on reservations', async () => {
      const now = new Date('2024-01-02T10:00:00Z');
      
      const mockRooms = [
        { id: 'room-1', name: '101', type: 'Standard', capacity: 2, basePrice: 100 },
        { id: 'room-2', name: '102', type: 'Deluxe', capacity: 2, basePrice: 150 },
        { id: 'room-3', name: '103', type: 'Suite', capacity: 4, basePrice: 200 },
        { id: 'room-4', name: '104', type: 'Standard', capacity: 2, basePrice: 100 },
      ];

      // Room 1: Currently occupied (check-in yesterday, check-out tomorrow)
      // Room 2: Available (check-in tomorrow)
      // Room 3: Available (no reservations)
      // Room 4: Available (check-out yesterday)
      const mockReservations = [
        {
          id: 'res-1',
          roomId: 'room-1',
          checkIn: new Date('2024-01-01T15:00:00Z'),
          checkOut: new Date('2024-01-03T11:00:00Z'),
          status: 'confirmed',
          guest: { id: 'guest-1', name: 'John Doe', email: 'john@example.com', phone: '+1234567890' },
        },
        {
          id: 'res-2',
          roomId: 'room-2',
          checkIn: new Date('2024-01-03T15:00:00Z'),
          checkOut: new Date('2024-01-05T11:00:00Z'),
          status: 'confirmed',
          guest: { id: 'guest-2', name: 'Jane Smith', email: 'jane@example.com', phone: '+1234567891' },
        },
        {
          id: 'res-4',
          roomId: 'room-4',
          checkIn: new Date('2023-12-30T15:00:00Z'),
          checkOut: new Date('2024-01-02T11:00:00Z'),
          status: 'checked_out',
          guest: { id: 'guest-4', name: 'Bob Johnson', email: 'bob@example.com', phone: '+1234567892' },
        },
      ];

      const { prisma } = require('@/database/schema');
      prisma.room.findMany.mockResolvedValue(mockRooms);
      prisma.reservation.findMany.mockResolvedValue(mockReservations);

      const response = await GET(mockRequest);
      const data = await response.json();

      const rooms = data.data.rooms;
      
      // Room 1 should be occupied
      expect(rooms.find(r => r.id === 'room-1').status).toBe('occupied');
      
      // Room 2 should be available (future reservation)
      expect(rooms.find(r => r.id === 'room-2').status).toBe('available');
      expect(rooms.find(r => r.id === 'room-2').nextGuest.name).toBe('Jane Smith');
      
      // Room 3 should be available (no reservations)
      expect(rooms.find(r => r.id === 'room-3').status).toBe('available');
      expect(rooms.find(r => r.id === 'room-3').nextGuest).toBeNull();
      
      // Room 4 should be available (past reservation)
      expect(rooms.find(r => r.id === 'room-4').status).toBe('available');
    });

    it('should handle rooms with missing guest information', async () => {
      const mockRooms = [
        { id: 'room-1', name: '101', type: 'Standard', capacity: 2, basePrice: 100 },
      ];

      const mockReservations = [
        {
          id: 'res-1',
          roomId: 'room-1',
          checkIn: new Date('2024-01-01T15:00:00Z'),
          checkOut: new Date('2024-01-03T11:00:00Z'),
          status: 'confirmed',
          guest: null, // Missing guest information
        },
      ];

      const { prisma } = require('@/database/schema');
      prisma.room.findMany.mockResolvedValue(mockRooms);
      prisma.reservation.findMany.mockResolvedValue(mockReservations);

      const response = await GET(mockRequest);
      const data = await response.json();

      const room = data.data.rooms[0];
      expect(room.currentGuest).toBeNull();
      expect(room.status).toBe('occupied');
    });

    it('should handle empty rooms list', async () => {
      const { prisma } = require('@/database/schema');
      prisma.room.findMany.mockResolvedValue([]);
      prisma.reservation.findMany.mockResolvedValue([]);

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.rooms).toEqual([]);
    });

    it('should handle rooms with no current reservations but future reservations', async () => {
      const mockRooms = [
        { id: 'room-1', name: '101', type: 'Standard', capacity: 2, basePrice: 100 },
      ];

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);

      const mockReservations = [
        {
          id: 'res-1',
          roomId: 'room-1',
          checkIn: futureDate,
          checkOut: new Date(futureDate.getTime() + 2 * 24 * 60 * 60 * 1000),
          status: 'confirmed',
          guest: { id: 'guest-1', name: 'Future Guest', email: 'future@example.com', phone: '+1234567890' },
        },
      ];

      const { prisma } = require('@/database/schema');
      prisma.room.findMany.mockResolvedValue(mockRooms);
      prisma.reservation.findMany.mockResolvedValue(mockReservations);

      const response = await GET(mockRequest);
      const data = await response.json();

      const room = data.data.rooms[0];
      expect(room.status).toBe('available');
      expect(room.currentGuest).toBeNull();
      expect(room.nextGuest.name).toBe('Future Guest');
    });
  });

  describe('Database query validation', () => {
    it('should call prisma.room.findMany with correct parameters', async () => {
      const { prisma } = require('@/database/schema');
      prisma.room.findMany.mockResolvedValue([]);
      prisma.reservation.findMany.mockResolvedValue([]);

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

    it('should call prisma.reservation.findMany with correct parameters', async () => {
      const { prisma } = require('@/database/schema');
      prisma.room.findMany.mockResolvedValue([]);
      prisma.reservation.findMany.mockResolvedValue([]);

      await GET(mockRequest);

      expect(prisma.reservation.findMany).toHaveBeenCalledWith({
        where: {
          propertyId: mockPropertyId,
          status: {
            in: ['confirmed', 'checked_in'],
          },
        },
        include: {
          guest: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: {
          checkIn: 'asc',
        },
      });
    });
  });

  describe('Status determination logic', () => {
    it('should correctly determine occupied status for current reservations', async () => {
      const now = new Date('2024-01-02T10:00:00Z');
      
      const mockRooms = [{ id: 'room-1', name: '101', type: 'Standard', capacity: 2, basePrice: 100 }];
      
      // Reservation that should make room occupied
      const mockReservations = [
        {
          id: 'res-1',
          roomId: 'room-1',
          checkIn: new Date('2024-01-01T15:00:00Z'), // Yesterday
          checkOut: new Date('2024-01-03T11:00:00Z'), // Tomorrow
          status: 'confirmed',
          guest: { id: 'guest-1', name: 'John Doe', email: 'john@example.com', phone: '+1234567890' },
        },
      ];

      const { prisma } = require('@/database/schema');
      prisma.room.findMany.mockResolvedValue(mockRooms);
      prisma.reservation.findMany.mockResolvedValue(mockReservations);

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(data.data.rooms[0].status).toBe('occupied');
    });

    it('should correctly determine available status for past reservations', async () => {
      const now = new Date('2024-01-02T10:00:00Z');
      
      const mockRooms = [{ id: 'room-1', name: '101', type: 'Standard', capacity: 2, basePrice: 100 }];
      
      // Reservation that already ended
      const mockReservations = [
        {
          id: 'res-1',
          roomId: 'room-1',
          checkIn: new Date('2023-12-30T15:00:00Z'), // 3 days ago
          checkOut: new Date('2024-01-01T11:00:00Z'), // Yesterday
          status: 'checked_out',
          guest: { id: 'guest-1', name: 'John Doe', email: 'john@example.com', phone: '+1234567890' },
        },
      ];

      const { prisma } = require('@/database/schema');
      prisma.room.findMany.mockResolvedValue(mockRooms);
      prisma.reservation.findMany.mockResolvedValue(mockReservations);

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(data.data.rooms[0].status).toBe('available');
    });

    it('should correctly determine available status for future reservations', async () => {
      const now = new Date('2024-01-02T10:00:00Z');
      
      const mockRooms = [{ id: 'room-1', name: '101', type: 'Standard', capacity: 2, basePrice: 100 }];
      
      // Reservation that starts in the future
      const futureDate = new Date('2024-01-05T15:00:00Z');
      const mockReservations = [
        {
          id: 'res-1',
          roomId: 'room-1',
          checkIn: futureDate,
          checkOut: new Date(futureDate.getTime() + 2 * 24 * 60 * 60 * 1000),
          status: 'confirmed',
          guest: { id: 'guest-1', name: 'Future Guest', email: 'future@example.com', phone: '+1234567890' },
        },
      ];

      const { prisma } = require('@/database/schema');
      prisma.room.findMany.mockResolvedValue(mockRooms);
      prisma.reservation.findMany.mockResolvedValue(mockReservations);

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(data.data.rooms[0].status).toBe('available');
      expect(data.data.rooms[0].nextGuest.name).toBe('Future Guest');
    });
  });
});
