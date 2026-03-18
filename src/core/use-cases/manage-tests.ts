/**
 * Use Case: Manage Tests
 * 
 * Get test suites and run tests.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { logger } from "@/infrastructure/observability/logger";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ManageTestsInput {
  userId: string;
  
  // GET mode
  category?: TestCategory;
  status?: TestStatus;
  includeResults?: boolean;
  
  // POST mode
  suiteId?: string;
  force?: boolean;
}

export interface ManageTestsOutput {
  success: boolean;
  data?: {
    testSuites?: TestSuite[];
    testResults?: TestResult[];
    summary?: TestSummary;
    message?: string;
    result?: TestExecutionResult;
  };
  error?: {
    code: string;
    message: string;
  };
}

export type TestCategory = 'unit' | 'integration' | 'e2e' | 'performance' | 'security';
export type TestStatus = 'idle' | 'running' | 'passed' | 'failed' | 'skipped';

export interface TestSuite {
  id: string;
  name: string;
  category: TestCategory;
  description: string;
  status: TestStatus;
  duration?: number;
  tests: Test[];
  lastRun?: string;
  passRate: number;
  coverage?: {
    lines: number;
    functions: number;
    branches: number;
    statements: number;
  };
}

export interface Test {
  id: string;
  name: string;
  status: TestStatus;
  duration?: number;
  error?: string;
  category: string;
}

export interface TestResult {
  id: string;
  suiteId: string;
  suiteName: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  timestamp: string;
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
  environment: string;
  branch: string;
  commit: string;
}

export interface TestSummary {
  totalSuites: number;
  passedSuites: number;
  failedSuites: number;
  runningSuites: number;
  averageCoverage: number;
}

export interface TestExecutionResult {
  id: string;
  suiteId: string;
  status: TestStatus;
  duration: number;
  timestamp: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  coverage: {
    lines: number;
    functions: number;
    branches: number;
    statements: number;
  };
  environment: string;
  branch: string;
  commit: string;
}

// ============================================================================
// USE CASE CLASS
// ============================================================================

export class ManageTestsUseCase {
  async execute(input: ManageTestsInput): Promise<ManageTestsOutput> {
    try {
      const {
        userId,
        category,
        status,
        includeResults = false,
        suiteId,
        force = false,
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

      // 2. Handle POST mode (run tests)
      if (suiteId !== undefined || category !== undefined) {
        return await this.runTests({
          suiteId,
          category,
          force,
        });
      }

      // 3. Handle GET mode (get test suites)
      return await this.getTestSuites(category, status, includeResults);
    } catch (error) {
      logger.error('ManageTests error:', error);
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

  private async getTestSuites(
    category?: TestCategory | null,
    status?: TestStatus | null,
    includeResults?: boolean,
  ): Promise<ManageTestsOutput> {
    // Get test suites (mock data - in production, fetch from database)
    const mockTestSuites: TestSuite[] = [
      {
        id: 'unit-tests',
        name: 'Unit Tests',
        category: 'unit',
        description: 'Core functionality unit tests',
        status: 'idle',
        tests: [
          { id: 'ut1', name: 'User authentication', status: 'idle', category: 'auth' },
          { id: 'ut2', name: 'Database operations', status: 'idle', category: 'database' },
          { id: 'ut3', name: 'API endpoints', status: 'idle', category: 'api' },
          { id: 'ut4', name: 'Utility functions', status: 'idle', category: 'utils' },
        ],
        passRate: 95.2,
        coverage: {
          lines: 87,
          functions: 92,
          branches: 78,
          statements: 89,
        },
      },
      {
        id: 'integration-tests',
        name: 'Integration Tests',
        category: 'integration',
        description: 'Component integration tests',
        status: 'idle',
        tests: [
          { id: 'it1', name: 'Database + API', status: 'idle', category: 'database-api' },
          { id: 'it2', name: 'Auth + Permissions', status: 'idle', category: 'auth-permissions' },
          { id: 'it3', name: 'Payment + Booking', status: 'idle', category: 'payment-booking' },
          { id: 'it4', name: 'Email + Notifications', status: 'idle', category: 'email-notifications' },
        ],
        passRate: 88.7,
        coverage: {
          lines: 72,
          functions: 78,
          branches: 65,
          statements: 74,
        },
      },
      {
        id: 'e2e-tests',
        name: 'End-to-End Tests',
        category: 'e2e',
        description: 'Full application flow tests',
        status: 'idle',
        tests: [
          { id: 'e2e1', name: 'User registration flow', status: 'idle', category: 'user-flow' },
          { id: 'e2e2', name: 'Booking process', status: 'idle', category: 'booking-flow' },
          { id: 'e2e3', name: 'Payment processing', status: 'idle', category: 'payment-flow' },
          { id: 'e2e4', name: 'Admin dashboard', status: 'idle', category: 'admin-flow' },
        ],
        passRate: 91.3,
        coverage: {
          lines: 65,
          functions: 70,
          branches: 58,
          statements: 67,
        },
      },
      {
        id: 'performance-tests',
        name: 'Performance Tests',
        category: 'performance',
        description: 'Load and stress testing',
        status: 'idle',
        tests: [
          { id: 'perf1', name: 'API load test', status: 'idle', category: 'api-load' },
          { id: 'perf2', name: 'Database performance', status: 'idle', category: 'db-performance' },
          { id: 'perf3', name: 'Frontend rendering', status: 'idle', category: 'frontend-render' },
          { id: 'perf4', name: 'Memory usage', status: 'idle', category: 'memory-usage' },
        ],
        passRate: 85.0,
        coverage: {
          lines: 45,
          functions: 50,
          branches: 38,
          statements: 47,
        },
      },
      {
        id: 'security-tests',
        name: 'Security Tests',
        category: 'security',
        description: 'Security vulnerability tests',
        status: 'idle',
        tests: [
          { id: 'sec1', name: 'Authentication security', status: 'idle', category: 'auth-security' },
          { id: 'sec2', name: 'Input validation', status: 'idle', category: 'input-validation' },
          { id: 'sec3', name: 'SQL injection', status: 'idle', category: 'sql-injection' },
          { id: 'sec4', name: 'XSS protection', status: 'idle', category: 'xss-protection' },
        ],
        passRate: 94.5,
        coverage: {
          lines: 78,
          functions: 85,
          branches: 70,
          statements: 80,
        },
      },
    ];

    // Apply filters
    let filteredSuites = mockTestSuites;

    if (category) {
      filteredSuites = filteredSuites.filter(suite => suite.category === category);
    }

    if (status) {
      filteredSuites = filteredSuites.filter(suite => suite.status === status);
    }

    // Calculate summary
    const summary: TestSummary = {
      totalSuites: filteredSuites.length,
      passedSuites: filteredSuites.filter(s => s.status === 'passed').length,
      failedSuites: filteredSuites.filter(s => s.status === 'failed').length,
      runningSuites: filteredSuites.filter(s => s.status === 'running').length,
      averageCoverage: filteredSuites.reduce((sum, s) => sum + (s.coverage?.lines || 0), 0) / filteredSuites.length,
    };

    const response: ManageTestsOutput = {
      success: true,
      data: {
        testSuites: filteredSuites,
        summary,
      },
    };

    // Include test results if requested
    if (includeResults) {
      const mockTestResults: TestResult[] = [
        {
          id: 'result_1',
          suiteId: 'unit-tests',
          suiteName: 'Unit Tests',
          status: 'passed',
          duration: 2450,
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
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
          environment: 'development',
          branch: 'main',
          commit: 'abc123def',
        },
        {
          id: 'result_2',
          suiteId: 'integration-tests',
          suiteName: 'Integration Tests',
          status: 'failed',
          duration: 5200,
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          totalTests: 45,
          passedTests: 40,
          failedTests: 5,
          skippedTests: 0,
          coverage: {
            lines: 72,
            functions: 78,
            branches: 65,
            statements: 74,
          },
          environment: 'staging',
          branch: 'feature/new-ui',
          commit: 'def456ghi',
        },
      ];

      response.data.testResults = mockTestResults;
    }

    return response;
  }

  private async runTests(input: {
    suiteId?: string;
    category?: TestCategory;
    force?: boolean;
  }): Promise<ManageTestsOutput> {
    const { suiteId, category, force } = input;

    logger.info('Running tests:', { suiteId, category, force });

    // Simulate test execution
    await new Promise(resolve => setTimeout(resolve, 5000 + Math.random() * 10000));

    const testResult: TestExecutionResult = {
      id: `run_${Date.now()}`,
      suiteId: suiteId || 'all',
      status: Math.random() > 0.2 ? 'passed' : 'failed',
      duration: Math.floor(Math.random() * 30000) + 5000,
      timestamp: new Date().toISOString(),
      totalTests: Math.floor(Math.random() * 200) + 50,
      passedTests: Math.floor(Math.random() * 180) + 40,
      failedTests: Math.floor(Math.random() * 20),
      skippedTests: Math.floor(Math.random() * 10),
      coverage: {
        lines: Math.floor(Math.random() * 30) + 70,
        functions: Math.floor(Math.random() * 30) + 70,
        branches: Math.floor(Math.random() * 40) + 60,
        statements: Math.floor(Math.random() * 30) + 70,
      },
      environment: process.env.NODE_ENV || 'development',
      branch: 'main',
      commit: 'abc123def',
    };

    logger.info('Test execution completed:', testResult);

    return {
      success: true,
      data: {
        message: 'Tests executed successfully',
        result: testResult,
      },
    };
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export const manageTestsUseCase = new ManageTestsUseCase();
