/**
 * Use Case: Get Test Results
 * 
 * Get test results history and export test results.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { logger } from "@/infrastructure/observability/logger";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface GetTestResultsInput {
  userId: string;
  suiteId?: string;
  status?: string;
  environment?: string;
  branch?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
  
  // Export mode
  exportFormat?: 'json' | 'csv' | 'xlsx' | 'pdf';
  exportFilters?: any;
  includeDetails?: boolean;
}

export interface GetTestResultsOutput {
  success: boolean;
  data?: {
    results: TestResult[];
    total: number;
    limit: number;
    offset: number;
    summary: TestResultsSummary;
    exportData?: string | Buffer;
    filename?: string;
    contentType?: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface TestResult {
  id: string;
  suiteId: string;
  suiteName: string;
  status: "passed" | "failed" | "skipped";
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
  testDetails?: Array<{
    testName: string;
    status: string;
    duration: number;
    error?: string;
  }>;
}

export interface TestResultsSummary {
  totalResults: number;
  passedResults: number;
  failedResults: number;
  averageDuration: number;
  averageCoverage: number;
}

// ============================================================================
// USE CASE CLASS
// ============================================================================

export class GetTestResultsUseCase {
  async execute(input: GetTestResultsInput): Promise<GetTestResultsOutput> {
    try {
      const {
        userId,
        suiteId,
        status,
        environment,
        branch,
        dateFrom,
        dateTo,
        limit = 50,
        offset = 0,
        exportFormat,
        exportFilters,
        includeDetails = false,
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

      // 2. Get test results
      const testResults = await this.getTestResults();

      // 3. Apply filters
      let filteredResults = testResults;

      if (suiteId) {
        filteredResults = filteredResults.filter(result => result.suiteId === suiteId);
      }

      if (status) {
        filteredResults = filteredResults.filter(result => result.status === status);
      }

      if (environment) {
        filteredResults = filteredResults.filter(result => result.environment === environment);
      }

      if (branch) {
        filteredResults = filteredResults.filter(result => result.branch === branch);
      }

      if (dateFrom) {
        const fromDate = new Date(dateFrom);
        filteredResults = filteredResults.filter(result => new Date(result.timestamp) >= fromDate);
      }

      if (dateTo) {
        const toDate = new Date(dateTo);
        filteredResults = filteredResults.filter(result => new Date(result.timestamp) <= toDate);
      }

      // 4. Sort by timestamp (newest first)
      filteredResults.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      // 5. Apply pagination
      const paginatedResults = filteredResults.slice(offset, offset + limit);

      // 6. Calculate summary
      const summary = this.calculateSummary(filteredResults);

      // 7. Handle export mode
      if (exportFormat) {
        const exportData = await this.generateExport(
          filteredResults,
          exportFormat,
          exportFilters,
          includeDetails,
        );

        return {
          success: true,
          data: {
            results: [],
            total: filteredResults.length,
            limit,
            offset,
            summary,
            ...exportData,
          },
        };
      }

      // 8. Return standard response
      return {
        success: true,
        data: {
          results: paginatedResults,
          total: filteredResults.length,
          limit,
          offset,
          summary,
        },
      };
    } catch (error) {
      logger.error('GetTestResults error:', error);
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

  private async getTestResults(): Promise<TestResult[]> {
    // Mock test results (in production, fetch from database)
    const mockResults: TestResult[] = [
      {
        id: "result_1",
        suiteId: "unit-tests",
        suiteName: "Unit Tests",
        status: "passed",
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
        environment: "development",
        branch: "main",
        commit: "abc123def",
        testDetails: [
          { testName: "User authentication", status: "passed", duration: 120 },
          { testName: "Database operations", status: "passed", duration: 85 },
          { testName: "API endpoints", status: "failed", duration: 230, error: "Timeout exceeded" },
          { testName: "Utility functions", status: "passed", duration: 45 },
        ],
      },
      {
        id: "result_2",
        suiteId: "integration-tests",
        suiteName: "Integration Tests",
        status: "failed",
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
        environment: "staging",
        branch: "feature/new-ui",
        commit: "def456ghi",
        testDetails: [
          { testName: "Database + API", status: "passed", duration: 1200 },
          { testName: "Auth + Permissions", status: "failed", duration: 800, error: "Permission denied" },
          { testName: "Payment + Booking", status: "passed", duration: 1500 },
          { testName: "Email + Notifications", status: "failed", duration: 600, error: "SMTP connection failed" },
        ],
      },
      {
        id: "result_3",
        suiteId: "e2e-tests",
        suiteName: "End-to-End Tests",
        status: "passed",
        duration: 12400,
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        totalTests: 28,
        passedTests: 26,
        failedTests: 2,
        skippedTests: 0,
        coverage: {
          lines: 65,
          functions: 70,
          branches: 58,
          statements: 67,
        },
        environment: "production",
        branch: "main",
        commit: "ghi789jkl",
        testDetails: [
          { testName: "User registration flow", status: "passed", duration: 3200 },
          { testName: "Booking process", status: "passed", duration: 2800 },
          { testName: "Payment processing", status: "failed", duration: 1500, error: "Payment gateway error" },
          { testName: "Admin dashboard", status: "passed", duration: 2400 },
        ],
      },
      {
        id: "result_4",
        suiteId: "performance-tests",
        suiteName: "Performance Tests",
        status: "passed",
        duration: 8900,
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        totalTests: 12,
        passedTests: 12,
        failedTests: 0,
        skippedTests: 0,
        coverage: {
          lines: 45,
          functions: 50,
          branches: 38,
          statements: 47,
        },
        environment: "staging",
        branch: "develop",
        commit: "jkl012mno",
        testDetails: [
          { testName: "API load test", status: "passed", duration: 3200 },
          { testName: "Database performance", status: "passed", duration: 2100 },
          { testName: "Frontend rendering", status: "passed", duration: 1800 },
          { testName: "Memory usage", status: "passed", duration: 1500 },
        ],
      },
      {
        id: "result_5",
        suiteId: "security-tests",
        suiteName: "Security Tests",
        status: "passed",
        duration: 6700,
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        totalTests: 35,
        passedTests: 35,
        failedTests: 0,
        skippedTests: 0,
        coverage: {
          lines: 78,
          functions: 85,
          branches: 70,
          statements: 80,
        },
        environment: "development",
        branch: "main",
        commit: "mno345pqr",
        testDetails: [
          { testName: "Authentication security", status: "passed", duration: 1800 },
          { testName: "Input validation", status: "passed", duration: 1200 },
          { testName: "SQL injection", status: "passed", duration: 1500 },
          { testName: "XSS protection", status: "passed", duration: 2100 },
        ],
      },
    ];

    return mockResults;
  }

  private calculateSummary(results: TestResult[]): TestResultsSummary {
    return {
      totalResults: results.length,
      passedResults: results.filter(r => r.status === "passed").length,
      failedResults: results.filter(r => r.status === "failed").length,
      averageDuration: results.reduce((sum, r) => sum + r.duration, 0) / results.length,
      averageCoverage: results.reduce((sum, r) => sum + (r.coverage?.lines || 0), 0) / results.length,
    };
  }

  private async generateExport(
    results: TestResult[],
    format: 'json' | 'csv' | 'xlsx' | 'pdf',
    filters?: any,
    includeDetails?: boolean,
  ): Promise<{ exportData: string | Buffer; filename: string; contentType: string }> {
    let exportData: string | Buffer;
    let filename: string;
    let contentType: string;

    const dateStr = new Date().toISOString().split('T')[0];

    switch (format) {
      case 'csv':
        exportData = this.generateCSVExport(results, includeDetails);
        filename = `test-results-${dateStr}.csv`;
        contentType = 'text/csv';
        break;

      case 'xlsx':
        exportData = await this.generateExcelExport(results, includeDetails);
        filename = `test-results-${dateStr}.xlsx`;
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;

      case 'pdf':
        exportData = await this.generatePDFExport(results, includeDetails);
        filename = `test-results-${dateStr}.pdf`;
        contentType = 'application/pdf';
        break;

      default:
        exportData = JSON.stringify(results, null, 2);
        filename = `test-results-${dateStr}.json`;
        contentType = 'application/json';
    }

    // Log activity
    await this.logActivity('Export Test Results', `Exported ${results.length} test results in ${format} format`);

    return { exportData, filename, contentType };
  }

  private generateCSVExport(results: TestResult[], includeDetails?: boolean): string {
    const headers = [
      'ID', 'Suite Name', 'Status', 'Duration (ms)', 'Timestamp',
      'Total Tests', 'Passed Tests', 'Failed Tests', 'Skipped Tests',
      'Coverage Lines', 'Coverage Functions', 'Coverage Branches', 'Coverage Statements',
      'Environment', 'Branch', 'Commit',
    ];

    const csvRows = [headers.join(',')];

    results.forEach(result => {
      const row = [
        result.id,
        result.suiteName,
        result.status,
        result.duration,
        result.timestamp,
        result.totalTests,
        result.passedTests,
        result.failedTests,
        result.skippedTests,
        result.coverage?.lines || '',
        result.coverage?.functions || '',
        result.coverage?.branches || '',
        result.coverage?.statements || '',
        result.environment,
        result.branch,
        result.commit,
      ];
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }

  private async generateExcelExport(results: TestResult[], includeDetails?: boolean): Promise<Buffer> {
    // In real implementation, this would use a library like xlsx
    const mockExcelData = JSON.stringify(results, null, 2);
    return Buffer.from(mockExcelData, 'utf-8');
  }

  private async generatePDFExport(results: TestResult[], includeDetails?: boolean): Promise<Buffer> {
    // In real implementation, this would use a library like jsPDF or puppeteer
    const mockPDFData = JSON.stringify(results, null, 2);
    return Buffer.from(mockPDFData, 'utf-8');
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

export const getTestResultsUseCase = new GetTestResultsUseCase();
