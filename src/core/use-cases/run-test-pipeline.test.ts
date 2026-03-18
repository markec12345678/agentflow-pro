/**
 * RunTestPipeline UseCase Tests
 */

import { RunTestPipelineUseCase } from './run-test-pipeline';

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

describe('RunTestPipelineUseCase', () => {
  let useCase: RunTestPipelineUseCase;

  beforeEach(() => {
    useCase = new RunTestPipelineUseCase();
    jest.clearAllMocks();
  });

  describe('execute - GET Mode (Pipeline Status)', () => {
    const getInput = {
      userId: 'admin-123',
      status: undefined,
      branch: undefined,
      environment: undefined,
      includeConfig: false,
      limit: 20,
      offset: 0,
    };

    it('should return pipeline status when user is admin', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN', name: 'Admin User' });

      // Act
      const result = await useCase.execute(getInput);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.pipelines).toBeDefined();
      expect(result.data?.summary).toBeDefined();
    });

    it('should return all pipelines when no filters', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      // Act
      const result = await useCase.execute(getInput);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.pipelines).toHaveLength(4);
    });

    it('should filter by status', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      const input = { ...getInput, status: 'success' };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.pipelines.every(p => p.status === 'success')).toBe(true);
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
      expect(result.data?.pipelines.every(p => p.branch === 'main')).toBe(true);
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
      expect(result.data?.pipelines.every(p => p.environment === 'staging')).toBe(true);
    });

    it('should include pipeline configs when requested', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      const input = { ...getInput, includeConfig: true };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.pipelineConfigs).toBeDefined();
      expect(result.data?.pipelineConfigs).toHaveLength(1);
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
      expect(result.data?.pipelines).toHaveLength(2);
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
      expect(result.data?.summary.totalPipelines).toBe(4);
      expect(result.data?.summary.successPipelines).toBeGreaterThanOrEqual(2);
      expect(result.data?.summary.failedPipelines).toBeGreaterThanOrEqual(1);
    });

    it('should sort pipelines by timestamp (newest first)', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      // Act
      const result = await useCase.execute(getInput);

      // Assert
      expect(result.success).toBe(true);
      const timestamps = result.data?.pipelines.map(p => new Date(p.timestamp).getTime());
      expect(timestamps).toBeDefined();
      expect(timestamps?.[0]).toBeGreaterThanOrEqual(timestamps?.[1] || 0);
    });
  });

  describe('execute - POST Mode (Trigger Pipeline)', () => {
    const postInput = {
      userId: 'admin-123',
      branch: 'feature/test',
      commit: 'abc123',
      environment: 'staging',
      pipelineConfig: undefined,
    };

    it('should trigger pipeline when user is admin', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN', name: 'Admin User' });

      // Act
      const result = await useCase.execute(postInput);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.triggeredPipeline).toBeDefined();
      expect(result.data?.triggeredPipeline?.status).toBe('running');
    });

    it('should trigger pipeline without commit (use latest)', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      const input = { ...postInput, commit: undefined };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.triggeredPipeline).toBeDefined();
    });

    it('should use default environment (staging)', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      const input = { ...postInput, environment: undefined };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.triggeredPipeline?.environment).toBe('staging');
    });

    it('should use custom pipeline config name', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      const input = {
        ...postInput,
        pipelineConfig: { name: 'Custom Pipeline' },
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.triggeredPipeline?.name).toBe('Custom Pipeline');
    });
  });

  describe('execute - Authorization', () => {
    it('should fail when user is not admin', async () => {
      // Arrange
      const { prisma } = require('@/infrastructure/database/prisma');
      prisma.user.findUnique.mockResolvedValue({ role: 'USER' });

      const input = {
        userId: 'user-123',
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
        branch: 'main',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('Pipeline Status Mock Data', () => {
    it('should include all pipeline stages', async () => {
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
      expect(result.data?.pipelines[0]?.stages).toBeDefined();
      expect(result.data?.pipelines[0]?.stages.length).toBeGreaterThanOrEqual(1);
    });

    it('should include pipeline metadata', async () => {
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
      const pipeline = result.data?.pipelines[0];
      expect(pipeline?.id).toBeDefined();
      expect(pipeline?.name).toBeDefined();
      expect(pipeline?.status).toBeDefined();
      expect(pipeline?.branch).toBeDefined();
      expect(pipeline?.commit).toBeDefined();
      expect(pipeline?.timestamp).toBeDefined();
    });
  });
});
