/**
 * GetRecommendations UseCase Tests
 */

import { GetRecommendationsUseCase } from './get-recommendations';

// Mock dependencies
jest.mock('@/infrastructure/database/prisma', () => ({
  prisma: {
    property: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    agentRun: {
      create: jest.fn(),
    },
  },
}));

jest.mock('@/services/ai.service', () => ({
  AiService: jest.fn().mockImplementation(() => ({
    generateWithLogging: jest.fn(),
  })),
}));

jest.mock('@/infrastructure/ai', () => ({
  OpenAIAdapter: jest.fn().mockImplementation(() => ({})),
}));

describe('GetRecommendationsUseCase', () => {
  let useCase: GetRecommendationsUseCase;

  beforeEach(() => {
    useCase = new GetRecommendationsUseCase();
    jest.clearAllMocks();
  });

  describe('execute - Category-based Recommendations', () => {
    const validInput = {
      userId: 'user-123',
      propertyId: 'property-456',
      category: 'pricing' as const,
    };

    it('should generate pricing recommendations when input is valid', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      const { AiService } = require('@/services/ai.service');

      prisma.property.findFirst.mockResolvedValue({ id: 'property-456' });
      prisma.property.findUnique.mockResolvedValue({
        id: 'property-456',
        rooms: [{ id: 'room-1' }],
        reservations: [
          {
            totalAmount: 500,
            checkIn: new Date(),
            checkOut: new Date(Date.now() + 86400000),
            status: 'confirmed',
          },
        ],
      });

      (AiService as any).mockImplementation(() => ({
        generateWithLogging: jest.fn().mockResolvedValue({
          text: JSON.stringify([
            {
              recommendation: 'Increase weekend rates by 15%',
              impact: 'high',
              confidence: 0.85,
              implementationSteps: ['Analyze demand', 'Update rates', 'Monitor bookings'],
            },
          ]),
        }),
      }));

      // Act
      const result = await useCase.execute(validInput);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.recommendations).toHaveLength(1);
      expect(result.data?.category).toBe('pricing');
    });

    it('should generate occupancy recommendations', async () => {
      // Arrange
      const input = { ...validInput, category: 'occupancy' as const };
      const { prisma } = require('@/infrastructure/database/prisma');
      const { AiService } = require('@/services/ai.service');

      prisma.property.findFirst.mockResolvedValue({ id: 'property-456' });
      prisma.property.findUnique.mockResolvedValue({
        id: 'property-456',
        rooms: [{ id: 'room-1' }],
        reservations: [],
      });

      (AiService as any).mockImplementation(() => ({
        generateWithLogging: jest.fn().mockResolvedValue({
          text: JSON.stringify([
            {
              recommendation: 'Launch early-bird discount campaign',
              impact: 'medium',
              confidence: 0.75,
              implementationSteps: ['Create campaign', 'Set discount', 'Promote'],
            },
          ]),
        }),
      }));

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.category).toBe('occupancy');
    });

    it('should generate revenue recommendations', async () => {
      // Arrange
      const input = { ...validInput, category: 'revenue' as const };
      const { prisma } = require('@/infrastructure/database/prisma');

      prisma.property.findFirst.mockResolvedValue({ id: 'property-456' });
      prisma.property.findUnique.mockResolvedValue({
        id: 'property-456',
        rooms: [{ id: 'room-1' }],
        reservations: [
          { totalAmount: 1000, checkIn: new Date(), checkOut: new Date(), status: 'confirmed' },
        ],
      });

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.category).toBe('revenue');
    });

    it('should generate guest experience recommendations', async () => {
      // Arrange
      const input = { ...validInput, category: 'guest_experience' as const };
      const { prisma } = require('@/infrastructure/database/prisma');

      prisma.property.findFirst.mockResolvedValue({ id: 'property-456' });
      prisma.property.findUnique.mockResolvedValue({
        id: 'property-456',
        rooms: [{ id: 'room-1' }],
        reservations: [],
      });

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.category).toBe('guest_experience');
    });

    it('should fail when user does not have property access', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.property.findFirst.mockResolvedValue(null);

      // Act
      const result = await useCase.execute(validInput);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Access denied');
    });

    it('should fail when property not found', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.property.findFirst.mockResolvedValue({ id: 'property-456' });
      prisma.property.findUnique.mockResolvedValue(null);

      // Act
      const result = await useCase.execute(validInput);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Property not found');
    });

    it('should handle AI service errors gracefully', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      const { AiService } = require('@/services/ai.service');

      prisma.property.findFirst.mockResolvedValue({ id: 'property-456' });
      prisma.property.findUnique.mockResolvedValue({
        id: 'property-456',
        rooms: [],
        reservations: [],
      });

      (AiService as any).mockImplementation(() => ({
        generateWithLogging: jest.fn().mockRejectedValue(new Error('AI service error')),
      }));

      // Act
      const result = await useCase.execute(validInput);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle malformed AI response', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      const { AiService } = require('@/services/ai.service');

      prisma.property.findFirst.mockResolvedValue({ id: 'property-456' });
      prisma.property.findUnique.mockResolvedValue({
        id: 'property-456',
        rooms: [{ id: 'room-1' }],
        reservations: [],
      });

      (AiService as any).mockImplementation(() => ({
        generateWithLogging: jest.fn().mockResolvedValue({
          text: 'Invalid JSON response',
        }),
      }));

      // Act
      const result = await useCase.execute(validInput);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.recommendations).toHaveLength(1);
      expect(result.data?.recommendations[0].recommendation).toBe('Invalid JSON response');
    });
  });

  describe('execute - Custom Question Mode', () => {
    const customInput = {
      userId: 'user-123',
      propertyId: 'property-456',
      category: 'custom' as const,
      customQuestion: 'How can I improve my property rating?',
      customContext: 'Current rating: 4.2/5',
    };

    it('should generate custom recommendations for question', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      const { AiService } = require('@/services/ai.service');

      prisma.property.findFirst.mockResolvedValue({ id: 'property-456' });

      (AiService as any).mockImplementation(() => ({
        generateWithLogging: jest.fn().mockResolvedValue({
          text: 'To improve your rating, focus on cleanliness and guest communication.',
        }),
      }));

      // Act
      const result = await useCase.execute(customInput);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.category).toBe('custom');
      expect(result.data?.recommendations[0].recommendation).toContain('improve');
    });

    it('should handle custom question without context', async () => {
      // Arrange
      const input = {
        ...customInput,
        customContext: undefined,
      };

      const { prisma } = require('@/infrastructure/database/prisma');
      const { AiService } = require('@/services/ai.service');

      prisma.property.findFirst.mockResolvedValue({ id: 'property-456' });

      (AiService as any).mockImplementation(() => ({
        generateWithLogging: jest.fn().mockResolvedValue({
          text: 'General advice...',
        }),
      }));

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(true);
    });

    it('should handle custom question without propertyId', async () => {
      // Arrange
      const input = {
        userId: 'user-123',
        propertyId: null as any,
        category: 'custom' as const,
        customQuestion: 'General hospitality question?',
      };

      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.property.findFirst.mockResolvedValue(null);

      (AiService as any).mockImplementation(() => ({
        generateWithLogging: jest.fn().mockResolvedValue({
          text: 'Answer...',
        }),
      }));

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe('Metrics Calculation', () => {
    it('should calculate metrics correctly', async () => {
      // This is tested indirectly through the recommendation generation
      const { prisma } = require('@/infrastructure/database/prisma');
      const { AiService } = require('@/services/ai.service');

      prisma.property.findFirst.mockResolvedValue({ id: 'property-456' });
      prisma.property.findUnique.mockResolvedValue({
        id: 'property-456',
        rooms: [{ id: 'room-1' }, { id: 'room-2' }],
        reservations: [
          {
            totalAmount: 600,
            checkIn: new Date(),
            checkOut: new Date(Date.now() + 172800000), // 2 days
            status: 'confirmed',
          },
        ],
      });

      (AiService as any).mockImplementation(() => ({
        generateWithLogging: jest.fn().mockResolvedValue({
          text: '[]',
        }),
      }));

      // Act
      const result = await useCase.execute({
        userId: 'user-123',
        propertyId: 'property-456',
        category: 'pricing',
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.metrics.occupancyRate).toBe(50); // 1/2 rooms
      expect(result.data?.metrics.totalReservations).toBe(1);
    });
  });
});
