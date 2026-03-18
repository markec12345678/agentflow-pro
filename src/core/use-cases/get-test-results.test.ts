/**
 * GetTestResults UseCase Tests
 */

import { GetTestResultsUseCase } from './get-test-results';

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

describe('GetTestResultsUseCase', () => {
  let useCase: GetTestResultsUseCase;

  beforeEach(() => {
    useCase = new GetTestResultsUseCase();
    jest.clearAllMocks();
  });

  describe('execute - GET Mode (Test Results)', () => {
    const getInput = {
      userId: 'admin-123',
      suiteId: undefined,
      status: undefined,
      environment: undefined,
      branch: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      limit: 50,
      offset: 0,
    };

    it('should return test results when user is admin', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      // Act
      const result = await useCase.execute(getInput);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.results).toBeDefined();
      expect(result.data?.summary).toBeDefined();
    });

    it('should return all test results when no filters', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      // Act
      const result = await useCase.execute(getInput);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.results).toHaveLength(5);
    });

    it('should filter by suiteId', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      const input = { ...getInput, suiteId: 'unit-tests' };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.results.every(r => r.suiteId === 'unit-tests')).toBe(true);
    });

    it('should filter by status', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      const input = { ...getInput, status: 'passed' };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.results.every(r => r.status === 'passed')).toBe(true);
    });

    it('should filter by environment', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      const input = { ...getInput, environment: 'staging' };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.results.every(r => r.environment === 'staging')).toBe(true);
    });

    it('should filter by branch', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      const input = { ...getInput, branch: 'main' };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.results.every(r => r.branch === 'main')).toBe(true);
    });

    it('should filter by date range', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      const dateFrom = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString();
      const dateTo = new Date().toISOString();

      const input = { ...getInput, dateFrom, dateTo };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(true);
      result.data?.results.forEach(r => {
        const timestamp = new Date(r.timestamp).getTime();
        expect(timestamp).toBeGreaterThanOrEqual(new Date(dateFrom).getTime());
        expect(timestamp).toBeLessThanOrEqual(new Date(dateTo).getTime());
      });
    });

    it('should apply pagination', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      const input = { ...getInput, limit: 2, offset: 0 };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.results).toHaveLength(2);
      expect(result.data?.limit).toBe(2);
    });

    it('should calculate summary correctly', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      // Act
      const result = await useCase.execute(getInput);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.summary.totalResults).toBe(5);
      expect(result.data?.summary.passedResults).toBeGreaterThanOrEqual(4);
      expect(result.data?.summary.failedResults).toBeGreaterThanOrEqual(1);
    });

    it('should sort results by timestamp (newest first)', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      // Act
      const result = await useCase.execute(getInput);

      // Assert
      expect(result.success).toBe(true);
      const timestamps = result.data?.results.map(r => new Date(r.timestamp).getTime());
      expect(timestamps).toBeDefined();
      for (let i = 1; i < (timestamps?.length || 0); i++) {
        expect(timestamps?.[i - 1]).toBeGreaterThanOrEqual(timestamps?.[i] || 0);
      }
    });
  });

  describe('execute - POST Mode (Export)', () => {
    const exportInput = {
      userId: 'admin-123',
      exportFormat: 'json' as const,
      exportFilters: undefined,
      includeDetails: false,
    };

    it('should export test results as JSON', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      // Act
      const result = await useCase.execute(exportInput);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.exportData).toBeDefined();
      expect(result.data?.filename).toContain('.json');
      expect(result.data?.contentType).toBe('application/json');
    });

    it('should export test results as CSV', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      const input = { ...exportInput, exportFormat: 'csv' as const };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.filename).toContain('.csv');
      expect(result.data?.contentType).toBe('text/csv');
    });

    it('should export test results as XLSX', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      const input = { ...exportInput, exportFormat: 'xlsx' as const };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.filename).toContain('.xlsx');
    });

    it('should export test results as PDF', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      const input = { ...exportInput, exportFormat: 'pdf' as const };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.filename).toContain('.pdf');
    });

    it('should include details when requested', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      const input = { ...exportInput, includeDetails: true };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe('execute - Authorization', () => {
    it('should fail when user is not admin', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'USER' });

      const input = {
        userId: 'user-123',
        suiteId: undefined,
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
        suiteId: undefined,
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
        suiteId: undefined,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('Test Results Mock Data', () => {
    it('should include coverage data', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      // Act
      const result = await useCase.execute({
        userId: 'admin-123',
        limit: 1,
        offset: 0,
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.results[0]?.coverage).toBeDefined();
    });

    it('should include test details', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      // Act
      const result = await useCase.execute({
        userId: 'admin-123',
        limit: 1,
        offset: 0,
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.results[0]?.testDetails).toBeDefined();
    });

    it('should include all required metadata', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      // Act
      const result = await useCase.execute({
        userId: 'admin-123',
        limit: 1,
        offset: 0,
      });

      // Assert
      expect(result.success).toBe(true);
      const testResult = result.data?.results[0];
      expect(testResult?.id).toBeDefined();
      expect(testResult?.suiteId).toBeDefined();
      expect(testResult?.suiteName).toBeDefined();
      expect(testResult?.status).toBeDefined();
      expect(testResult?.duration).toBeDefined();
      expect(testResult?.timestamp).toBeDefined();
      expect(testResult?.environment).toBeDefined();
      expect(testResult?.branch).toBeDefined();
      expect(testResult?.commit).toBeDefined();
    });
  });
});
