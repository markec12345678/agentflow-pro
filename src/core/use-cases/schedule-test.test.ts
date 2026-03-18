/**
 * ScheduleTest UseCase Tests
 */

import { ScheduleTestUseCase } from './schedule-test';

// Mock dependencies
jest.mock('@/infrastructure/database/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('@/infrastructure/observability/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('ScheduleTestUseCase', () => {
  let useCase: ScheduleTestUseCase;

  beforeEach(() => {
    useCase = new ScheduleTestUseCase();
    jest.clearAllMocks();
  });

  describe('execute - GET Mode (Schedules)', () => {
    const getInput = {
      userId: 'admin-123',
      enabled: undefined,
      includeHistory: false,
    };

    it('should return test schedules when user is admin', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      // Act
      const result = await useCase.execute(getInput);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.schedules).toBeDefined();
      expect(result.data?.summary).toBeDefined();
    });

    it('should return all schedules when no filters', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      // Act
      const result = await useCase.execute(getInput);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.schedules).toHaveLength(5);
    });

    it('should filter by enabled status', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      const input = { ...getInput, enabled: true };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.schedules?.every(s => s.enabled === true)).toBe(true);
    });

    it('should filter by disabled status', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      const input = { ...getInput, enabled: false };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.schedules?.every(s => s.enabled === false)).toBe(true);
    });

    it('should include scheduled runs history when requested', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      const input = { ...getInput, includeHistory: true };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.scheduledRuns).toBeDefined();
      expect(result.data?.scheduledRuns).toHaveLength(2);
    });

    it('should calculate summary correctly', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      // Act
      const result = await useCase.execute(getInput);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.summary?.totalSchedules).toBe(5);
      expect(result.data?.summary?.enabledSchedules).toBeGreaterThanOrEqual(4);
      expect(result.data?.summary?.disabledSchedules).toBeLessThanOrEqual(1);
    });

    it('should include all schedule metadata', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      // Act
      const result = await useCase.execute(getInput);

      // Assert
      expect(result.success).toBe(true);
      const schedule = result.data?.schedules?.[0];
      expect(schedule?.id).toBeDefined();
      expect(schedule?.name).toBeDefined();
      expect(schedule?.frequency).toBeDefined();
      expect(schedule?.enabled).toBeDefined();
      expect(schedule?.environment).toBeDefined();
      expect(schedule?.branch).toBeDefined();
      expect(schedule?.nextRun).toBeDefined();
    });
  });

  describe('execute - POST Mode (Create/Update)', () => {
    const createInput = {
      userId: 'admin-123',
      name: 'Test Schedule',
      frequency: 'daily' as const,
      environment: 'staging',
      branch: 'main',
      description: 'Test description',
      enabled: true,
    };

    it('should create schedule when input is valid', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      // Act
      const result = await useCase.execute(createInput);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.schedule).toBeDefined();
      expect(result.data?.message).toContain('created');
    });

    it('should update schedule when id is provided', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      const input = { ...createInput, id: 'schedule_1' };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.message).toContain('updated');
    });

    it('should create schedule with custom frequency', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      const input = {
        ...createInput,
        frequency: 'custom' as const,
        cronExpression: '0 9 * * 1-5',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.schedule?.frequency).toBe('custom');
      expect(result.data?.schedule?.cronExpression).toBe('0 9 * * 1-5');
    });

    it('should create schedule with notifications', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      const input = {
        ...createInput,
        notifications: {
          onSuccess: true,
          onFailure: true,
          emails: ['test@example.com'],
        },
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.schedule?.notifications).toBeDefined();
    });

    it('should calculate next run time correctly', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      // Act
      const result = await useCase.execute(createInput);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.schedule?.nextRun).toBeDefined();
      expect(new Date(result.data?.schedule?.nextRun || '').getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('execute - Validation', () => {
    it('should fail when name is missing', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      const input = {
        userId: 'admin-123',
        frequency: 'daily' as const,
        environment: 'staging',
        branch: 'main',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_INPUT');
    });

    it('should fail when frequency is missing', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      const input = {
        userId: 'admin-123',
        name: 'Test Schedule',
        environment: 'staging',
        branch: 'main',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_INPUT');
    });

    it('should fail when environment is missing', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      const input = {
        userId: 'admin-123',
        name: 'Test Schedule',
        frequency: 'daily' as const,
        branch: 'main',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_INPUT');
    });

    it('should fail when branch is missing', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      const input = {
        userId: 'admin-123',
        name: 'Test Schedule',
        frequency: 'daily' as const,
        environment: 'staging',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_INPUT');
    });

    it('should fail when frequency is invalid', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      const input = {
        userId: 'admin-123',
        name: 'Test Schedule',
        frequency: 'invalid' as any,
        environment: 'staging',
        branch: 'main',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_FREQUENCY');
    });

    it('should fail when custom frequency without cron', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      const input = {
        userId: 'admin-123',
        name: 'Test Schedule',
        frequency: 'custom' as const,
        environment: 'staging',
        branch: 'main',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('CRON_REQUIRED');
    });
  });

  describe('execute - Authorization', () => {
    it('should fail when user is not admin', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'USER' });

      const input = {
        userId: 'user-123',
        name: 'Test Schedule',
        frequency: 'daily' as const,
        environment: 'staging',
        branch: 'main',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('FORBIDDEN');
    });

    it('should fail when user does not exist', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue(null);

      const input = {
        userId: 'nonexistent-123',
        name: 'Test Schedule',
        frequency: 'daily' as const,
        environment: 'staging',
        branch: 'main',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('FORBIDDEN');
    });
  });

  describe('execute - Error Handling', () => {
    it('should handle errors gracefully', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockRejectedValue(new Error('Database error'));

      const input = {
        userId: 'admin-123',
        name: 'Test Schedule',
        frequency: 'daily' as const,
        environment: 'staging',
        branch: 'main',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INTERNAL_ERROR');
    });
  });
});
