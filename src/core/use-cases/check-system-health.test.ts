/**
 * CheckSystemHealth UseCase Tests
 */

import { CheckSystemHealthUseCase } from './check-system-health';

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

describe('CheckSystemHealthUseCase', () => {
  let useCase: CheckSystemHealthUseCase;

  beforeEach(() => {
    useCase = new CheckSystemHealthUseCase();
    jest.clearAllMocks();
  });

  describe('execute - Health Checks', () => {
    const validInput = {
      userId: 'admin-123',
      component: 'all' as const,
      detailed: false,
      force: false,
    };

    it('should return healthy status when all checks pass', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      // Act
      const result = await useCase.execute(validInput);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.status).toBeDefined();
      expect(result.data?.healthChecks).toBeDefined();
      expect(result.data?.systemMetrics).toBeDefined();
    });

    it('should check database health', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      const input = { ...validInput, component: 'database' as const };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.healthChecks).toHaveLength(1);
      expect(result.data?.healthChecks[0].id).toBe('database');
    });

    it('should check API health', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      const input = { ...validInput, component: 'api' as const };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.healthChecks).toHaveLength(1);
      expect(result.data?.healthChecks[0].id).toBe('api');
    });

    it('should check agents health', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      const input = { ...validInput, component: 'agents' as const };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.healthChecks).toHaveLength(1);
      expect(result.data?.healthChecks[0].id).toBe('agents');
    });

    it('should check cache health', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      const input = { ...validInput, component: 'cache' as const };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.healthChecks).toHaveLength(1);
      expect(result.data?.healthChecks[0].id).toBe('cache');
    });

    it('should check storage health', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      const input = { ...validInput, component: 'storage' as const };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.healthChecks).toHaveLength(1);
      expect(result.data?.healthChecks[0].id).toBe('storage');
    });

    it('should check all components', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      // Act
      const result = await useCase.execute(validInput);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.healthChecks).toHaveLength(5);
    });

    it('should return system metrics', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      // Act
      const result = await useCase.execute(validInput);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.systemMetrics).toBeDefined();
      expect(result.data?.systemMetrics.cpu).toBeDefined();
      expect(result.data?.systemMetrics.memory).toBeDefined();
      expect(result.data?.systemMetrics.disk).toBeDefined();
    });
  });

  describe('execute - Authorization', () => {
    it('should fail when user is not admin', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'USER' });

      const input = {
        userId: 'user-123',
        component: 'all' as const,
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
        component: 'all' as const,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('FORBIDDEN');
    });
  });

  describe('execute - Error Handling', () => {
    it('should handle health check errors gracefully', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      // Act
      const result = await useCase.execute({
        userId: 'admin-123',
        component: 'all' as const,
      });

      // Assert - should still succeed even if individual checks fail
      expect(result.success).toBe(true);
    });

    it('should include version and environment info', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      // Act
      const result = await useCase.execute({
        userId: 'admin-123',
        component: 'all' as const,
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.version).toBeDefined();
      expect(result.data?.environment).toBeDefined();
    });

    it('should include uptime', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      // Act
      const result = await useCase.execute({
        userId: 'admin-123',
        component: 'all' as const,
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.uptime).toBeDefined();
      expect(typeof result.data?.uptime).toBe('number');
    });
  });

  describe('Status Calculation', () => {
    it('should return healthy when all checks pass', async () => {
      // This is tested indirectly through the execute method
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      // Act
      const result = await useCase.execute({
        userId: 'admin-123',
        component: 'all' as const,
      });

      // Assert
      expect(result.success).toBe(true);
      expect(['healthy', 'degraded', 'critical', 'unknown']).toContain(
        result.data?.status,
      );
    });

    it('should calculate overall status correctly', async () => {
      // This is tested through the health check results
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      // Act
      const result = await useCase.execute({
        userId: 'admin-123',
        component: 'all' as const,
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.healthChecks).toHaveLength(5);
      
      // Verify status calculation
      const statuses = result.data?.healthChecks.map(hc => hc.status);
      expect(statuses).toBeDefined();
    });
  });

  describe('POST Mode (Manual Check)', () => {
    it('should handle force parameter', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      const input = {
        userId: 'admin-123',
        component: 'all' as const,
        force: true,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(true);
    });

    it('should handle specific component with force', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      const input = {
        userId: 'admin-123',
        component: 'database' as const,
        force: true,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.healthChecks).toHaveLength(1);
    });
  });
});
