/**
 * Use Case: Schedule Test
 * 
 * Get test schedules and create/update test schedules.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { logger } from "@/infrastructure/observability/logger";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ScheduleTestInput {
  userId: string;
  
  // GET mode
  enabled?: boolean;
  includeHistory?: boolean;
  
  // POST mode
  id?: string;
  name?: string;
  description?: string;
  suiteId?: string;
  category?: string;
  frequency?: TestFrequency;
  cronExpression?: string;
  environment?: string;
  branch?: string;
  notifications?: TestNotifications;
}

export interface ScheduleTestOutput {
  success: boolean;
  data?: {
    schedules?: TestSchedule[];
    schedule?: TestSchedule;
    scheduledRuns?: ScheduledTestRun[];
    summary?: TestScheduleSummary;
    message?: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

export type TestFrequency = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom';

export interface TestSchedule {
  id: string;
  name: string;
  description: string;
  suiteId?: string;
  category?: string;
  frequency: TestFrequency;
  cronExpression?: string;
  enabled: boolean;
  environment: string;
  branch: string;
  notifications: TestNotifications;
  lastRun?: string;
  nextRun: string;
  createdAt: string;
  updatedAt: string;
}

export interface TestNotifications {
  onSuccess: boolean;
  onFailure: boolean;
  emails: string[];
}

export interface ScheduledTestRun {
  id: string;
  scheduleId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
  duration?: number;
  result?: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    skippedTests: number;
    coverage?: {
      lines: number;
      functions: number;
      branches: number;
      statements: number;
    };
  };
  logs?: string[];
}

export interface TestScheduleSummary {
  totalSchedules: number;
  enabledSchedules: number;
  disabledSchedules: number;
}

// ============================================================================
// USE CASE CLASS
// ============================================================================

export class ScheduleTestUseCase {
  async execute(input: ScheduleTestInput): Promise<ScheduleTestOutput> {
    try {
      const {
        userId,
        enabled,
        includeHistory = false,
        id,
        name,
        description,
        suiteId,
        category,
        frequency,
        cronExpression,
        environment,
        branch,
        notifications,
      } = input;

      // 1. Verify user is admin
      const isAdmin = await this.verifyAdminAccess(userId);
      if (!isAdmin) {
        return {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Admin access required',
          },
        };
      }

      // 2. Handle POST mode (create/update schedule)
      if (name && frequency && environment && branch) {
        return await this.createOrUpdateSchedule({
          id,
          name,
          description,
          suiteId,
          category,
          frequency,
          cronExpression,
          enabled: enabled ?? true,
          environment,
          branch,
          notifications,
        });
      }

      // 3. Handle GET mode (get schedules)
      return await this.getSchedules(enabled, includeHistory);
    } catch (error) {
      logger.error('ScheduleTest error:', error);
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Internal server error',
        },
      };
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private async verifyAdminAccess(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    return user?.role === 'ADMIN';
  }

  private async getSchedules(
    enabled?: boolean | null,
    includeHistory?: boolean,
  ): Promise<ScheduleTestOutput> {
    // Get test schedules (mock data - in production, fetch from database)
    const mockSchedules: TestSchedule[] = [
      {
        id: 'schedule_1',
        name: 'Daily Unit Tests',
        description: 'Run all unit tests daily at 2 AM',
        suiteId: 'unit-tests',
        frequency: 'daily',
        enabled: true,
        environment: 'development',
        branch: 'main',
        notifications: {
          onSuccess: false,
          onFailure: true,
          emails: ['admin@example.com', 'dev-team@example.com'],
        },
        lastRun: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        nextRun: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'schedule_2',
        name: 'Weekly Integration Tests',
        description: 'Run integration tests every Sunday at 1 AM',
        suiteId: 'integration-tests',
        frequency: 'weekly',
        enabled: true,
        environment: 'staging',
        branch: 'develop',
        notifications: {
          onSuccess: true,
          onFailure: true,
          emails: ['admin@example.com'],
        },
        lastRun: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        nextRun: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'schedule_3',
        name: 'Hourly Health Checks',
        description: 'Run performance tests every hour',
        suiteId: 'performance-tests',
        frequency: 'hourly',
        enabled: false,
        environment: 'production',
        branch: 'main',
        notifications: {
          onSuccess: false,
          onFailure: true,
          emails: ['ops@example.com'],
        },
        lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        nextRun: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'schedule_4',
        name: 'Monthly Security Tests',
        description: 'Run security tests monthly on the 1st',
        suiteId: 'security-tests',
        frequency: 'monthly',
        enabled: true,
        environment: 'staging',
        branch: 'main',
        notifications: {
          onSuccess: true,
          onFailure: true,
          emails: ['security@example.com', 'admin@example.com'],
        },
        lastRun: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        nextRun: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'schedule_5',
        name: 'Custom E2E Tests',
        description: 'Run E2E tests on business days at 9 AM',
        suiteId: 'e2e-tests',
        frequency: 'custom',
        cronExpression: '0 9 * * 1-5',
        enabled: true,
        environment: 'production',
        branch: 'main',
        notifications: {
          onSuccess: false,
          onFailure: true,
          emails: ['qa@example.com'],
        },
        lastRun: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        nextRun: new Date(Date.now() + 16 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    // Apply filters
    let filteredSchedules = mockSchedules;

    if (enabled !== undefined && enabled !== null) {
      filteredSchedules = filteredSchedules.filter(schedule => schedule.enabled === enabled);
    }

    // Calculate summary
    const summary: TestScheduleSummary = {
      totalSchedules: filteredSchedules.length,
      enabledSchedules: filteredSchedules.filter(s => s.enabled).length,
      disabledSchedules: filteredSchedules.filter(s => !s.enabled).length,
    };

    const response: ScheduleTestOutput = {
      success: true,
      data: {
        schedules: filteredSchedules,
        summary,
      },
    };

    // Include scheduled runs history if requested
    if (includeHistory) {
      const mockRuns: ScheduledTestRun[] = [
        {
          id: 'run_1',
          scheduleId: 'schedule_1',
          status: 'completed',
          startTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() - 24 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString(),
          duration: 300000,
          result: {
            totalTests: 156,
            passedTests: 148,
            failedTests: 8,
            skippedTests: 0,
            coverage: {
              lines: 87,
              functions: 92,
              branches: 78,
              statements: 89,
            },
          },
          logs: [
            'Starting unit test execution...',
            'Running authentication tests...',
            'Running database tests...',
            'Tests completed successfully',
          ],
        },
        {
          id: 'run_2',
          scheduleId: 'schedule_2',
          status: 'failed',
          startTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 8 * 60 * 1000).toISOString(),
          duration: 480000,
          result: {
            totalTests: 45,
            passedTests: 40,
            failedTests: 5,
            skippedTests: 0,
          },
          logs: [
            'Starting integration test execution...',
            'Database connection established...',
            'API integration test failed: Connection timeout',
            'Test execution failed',
          ],
        },
      ];

      response.data!.scheduledRuns = mockRuns;
    }

    return response;
  }

  private async createOrUpdateSchedule(input: {
    id?: string;
    name: string;
    description?: string;
    suiteId?: string;
    category?: string;
    frequency: TestFrequency;
    cronExpression?: string;
    enabled: boolean;
    environment: string;
    branch: string;
    notifications?: TestNotifications;
  }): Promise<ScheduleTestOutput> {
    const {
      id,
      name,
      description,
      suiteId,
      category,
      frequency,
      cronExpression,
      enabled,
      environment,
      branch,
      notifications,
    } = input;

    // Validate frequency
    const validFrequencies = ['hourly', 'daily', 'weekly', 'monthly', 'custom'];
    if (!validFrequencies.includes(frequency)) {
      return {
        success: false,
        error: {
          code: 'INVALID_FREQUENCY',
          message: 'Invalid frequency',
        },
      };
    }

    // Validate cron expression for custom frequency
    if (frequency === 'custom' && !cronExpression) {
      return {
        success: false,
        error: {
          code: 'CRON_REQUIRED',
          message: 'Cron expression required for custom frequency',
        },
      };
    }

    // Calculate next run time
    const nextRun = this.calculateNextRun(frequency, cronExpression);

    // Create schedule object
    const schedule: TestSchedule = {
      id: id || `schedule_${Date.now()}`,
      name,
      description: description || '',
      suiteId,
      category,
      frequency,
      cronExpression,
      enabled,
      environment,
      branch,
      notifications: notifications || {
        onSuccess: false,
        onFailure: true,
        emails: [],
      },
      nextRun,
      createdAt: id ? new Date().toISOString() : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    logger.info('Created/updated test schedule:', schedule);

    // Log activity
    await this.logActivity(
      id ? 'Test Schedule Updated' : 'Test Schedule Created',
      `${id ? 'Updated' : 'Created'} schedule: ${name}`,
    );

    return {
      success: true,
      data: {
        message: id ? 'Test schedule updated successfully' : 'Test schedule created successfully',
        schedule,
      },
    };
  }

  private calculateNextRun(frequency: TestFrequency, cronExpression?: string): string {
    const now = new Date();

    switch (frequency) {
      case 'hourly':
        now.setHours(now.getHours() + 1);
        now.setMinutes(0, 0, 0);
        break;
      case 'daily':
        now.setDate(now.getDate() + 1);
        now.setHours(2, 0, 0, 0);
        break;
      case 'weekly':
        now.setDate(now.getDate() + (7 - now.getDay()));
        now.setHours(1, 0, 0, 0);
        break;
      case 'monthly':
        now.setMonth(now.getMonth() + 1);
        now.setDate(1);
        now.setHours(1, 0, 0, 0);
        break;
      case 'custom':
        // In real implementation, this would parse the cron expression
        // For now, we'll just add 1 hour as a placeholder
        now.setHours(now.getHours() + 1);
        break;
      default:
        now.setHours(now.getHours() + 1);
    }

    return now.toISOString();
  }

  private async logActivity(action: string, details: string): Promise<void> {
    logger.info('Activity log:', {
      action,
      details,
      timestamp: new Date().toISOString(),
    });
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export const scheduleTestUseCase = new ScheduleTestUseCase();
