/**
 * ManageTests UseCase Tests
 */

import { ManageTestsUseCase } from './manage-tests';

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

describe('ManageTestsUseCase', () => {
  let useCase: ManageTestsUseCase;

  beforeEach(() => {
    useCase = new ManageTestsUseCase();
    jest.clearAllMocks();
  });

  describe('execute - GET Mode (Test Suites)', () => {
    const getInput = {
      userId: 'admin-123',
      category: undefined,
      status: undefined,
      includeResults: false,
    };

    it('should return test suites when user is admin', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      // Act
      const result = await useCase.execute(getInput);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.testSuites).toBeDefined();
      expect(result.data?.summary).toBeDefined();
    });

    it('should return all test suites when no filters', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      // Act
      const result = await useCase.execute(getInput);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.testSuites).toHaveLength(5);
    });

    it('should filter by category (unit)', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      const input = { ...getInput, category: 'unit' as const };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.testSuites?.every(s => s.category === 'unit')).toBe(true);
    });

    it('should filter by category (integration)', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      const input = { ...getInput, category: 'integration' as const };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.testSuites?.every(s => s.category === 'integration')).toBe(true);
    });

    it('should filter by category (e2e)', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      const input = { ...getInput, category: 'e2e' as const };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.testSuites?.every(s => s.category === 'e2e')).toBe(true);
    });

    it('should filter by category (performance)', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      const input = { ...getInput, category: 'performance' as const };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.testSuites?.every(s => s.category === 'performance')).toBe(true);
    });

    it('should filter by category (security)', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      const input = { ...getInput, category: 'security' as const };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.testSuites?.every(s => s.category === 'security')).toBe(true);
    });

    it('should include test results when requested', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      const input = { ...getInput, includeResults: true };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.testResults).toBeDefined();
      expect(result.data?.testResults).toHaveLength(2);
    });

    it('should calculate summary correctly', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      // Act
      const result = await useCase.execute(getInput);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.summary?.totalSuites).toBe(5);
      expect(result.data?.summary?.averageCoverage).toBeGreaterThan(70);
    });

    it('should include all suite metadata', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      // Act
      const result = await useCase.execute(getInput);

      // Assert
      expect(result.success).toBe(true);
      const suite = result.data?.testSuites?.[0];
      expect(suite?.id).toBeDefined();
      expect(suite?.name).toBeDefined();
      expect(suite?.category).toBeDefined();
      expect(suite?.tests).toBeDefined();
      expect(suite?.passRate).toBeDefined();
      expect(suite?.coverage).toBeDefined();
    });
  });

  describe('execute - POST Mode (Run Tests)', () => {
    const runInput = {
      userId: 'admin-123',
      suiteId: 'unit-tests',
      force: false,
    };

    it('should run tests for specific suite', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      // Act
      const result = await useCase.execute(runInput);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.result).toBeDefined();
      expect(result.data?.message).toBe('Tests executed successfully');
    });

    it('should run tests for category', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      const input = { ...runInput, suiteId: undefined, category: 'unit' as const };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.result).toBeDefined();
    });

    it('should run all tests when no suiteId or category', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      const input = { userId: 'admin-123' };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.result).toBeDefined();
    });

    it('should handle force parameter', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      const input = { ...runInput, force: true };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(true);
    });

    it('should return test execution result with coverage', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      // Act
      const result = await useCase.execute(runInput);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.result?.coverage).toBeDefined();
      expect(result.data?.result?.coverage?.lines).toBeGreaterThanOrEqual(70);
    });
  });

  describe('execute - Authorization', () => {
    it('should fail when user is not admin', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'USER' });

      const input = {
        userId: 'user-123',
        suiteId: 'unit-tests',
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
        suiteId: 'unit-tests',
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
        suiteId: 'unit-tests',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('Test Suites Mock Data', () => {
    it('should include all test categories', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      // Act
      const result = await useCase.execute({
        userId: 'admin-123',
      });

      // Assert
      expect(result.success).toBe(true);
      const categories = result.data?.testSuites?.map(s => s.category);
      expect(categories).toContain('unit');
      expect(categories).toContain('integration');
      expect(categories).toContain('e2e');
      expect(categories).toContain('performance');
      expect(categories).toContain('security');
    });

    it('should include tests in each suite', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      // Act
      const result = await useCase.execute({
        userId: 'admin-123',
      });

      // Assert
      expect(result.success).toBe(true);
      result.data?.testSuites?.forEach(suite => {
        expect(suite.tests).toBeDefined();
        expect(suite.tests.length).toBeGreaterThan(0);
      });
    });

    it('should include coverage data', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      // Act
      const result = await useCase.execute({
        userId: 'admin-123',
      });

      // Assert
      expect(result.success).toBe(true);
      result.data?.testSuites?.forEach(suite => {
        expect(suite.coverage).toBeDefined();
      });
    });
  });
});
