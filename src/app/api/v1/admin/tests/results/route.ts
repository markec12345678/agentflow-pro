import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/infrastructure/observability/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getUserId } from '@/lib/auth-users';
import { prisma } from '@/database/schema';

export const dynamic = "force-dynamic";

interface TestResult {
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
  testDetails?: {
    testName: string;
    status: string;
    duration: number;
    error?: string;
  }[];
}

/**
 * GET /api/admin/tests/results
 * Get test results history
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Check if user is admin
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const suiteId = searchParams.get('suiteId');
    const status = searchParams.get('status');
    const environment = searchParams.get('environment');
    const branch = searchParams.get('branch');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get test results (in real implementation, this would fetch from database)
    const mockTestResults: TestResult[] = [
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
          statements: 89
        },
        environment: "development",
        branch: "main",
        commit: "abc123def",
        testDetails: [
          { testName: "User authentication", status: "passed", duration: 120 },
          { testName: "Database operations", status: "passed", duration: 85 },
          { testName: "API endpoints", status: "failed", duration: 230, error: "Timeout exceeded" },
          { testName: "Utility functions", status: "passed", duration: 45 }
        ]
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
          statements: 74
        },
        environment: "staging",
        branch: "feature/new-ui",
        commit: "def456ghi",
        testDetails: [
          { testName: "Database + API", status: "passed", duration: 1200 },
          { testName: "Auth + Permissions", status: "failed", duration: 800, error: "Permission denied" },
          { testName: "Payment + Booking", status: "passed", duration: 1500 },
          { testName: "Email + Notifications", status: "failed", duration: 600, error: "SMTP connection failed" }
        ]
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
          statements: 67
        },
        environment: "production",
        branch: "main",
        commit: "ghi789jkl",
        testDetails: [
          { testName: "User registration flow", status: "passed", duration: 3200 },
          { testName: "Booking process", status: "passed", duration: 2800 },
          { testName: "Payment processing", status: "failed", duration: 1500, error: "Payment gateway error" },
          { testName: "Admin dashboard", status: "passed", duration: 2400 }
        ]
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
          statements: 47
        },
        environment: "staging",
        branch: "develop",
        commit: "jkl012mno",
        testDetails: [
          { testName: "API load test", status: "passed", duration: 3200 },
          { testName: "Database performance", status: "passed", duration: 2100 },
          { testName: "Frontend rendering", status: "passed", duration: 1800 },
          { testName: "Memory usage", status: "passed", duration: 1500 }
        ]
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
          statements: 80
        },
        environment: "development",
        branch: "main",
        commit: "mno345pqr",
        testDetails: [
          { testName: "Authentication security", status: "passed", duration: 1800 },
          { testName: "Input validation", status: "passed", duration: 1200 },
          { testName: "SQL injection", status: "passed", duration: 1500 },
          { testName: "XSS protection", status: "passed", duration: 2100 }
        ]
      }
    ];

    // Apply filters
    let filteredResults = mockTestResults;
    
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

    // Sort by timestamp (newest first)
    filteredResults.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply pagination
    const paginatedResults = filteredResults.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: {
        results: paginatedResults,
        total: filteredResults.length,
        limit,
        offset,
        filters: {
          suiteId,
          status,
          environment,
          branch,
          dateFrom,
          dateTo
        },
        summary: {
          totalResults: filteredResults.length,
          passedResults: filteredResults.filter(r => r.status === "passed").length,
          failedResults: filteredResults.filter(r => r.status === "failed").length,
          averageDuration: filteredResults.reduce((sum, r) => sum + r.duration, 0) / filteredResults.length,
          averageCoverage: filteredResults.reduce((sum, r) => sum + (r.coverage?.lines || 0), 0) / filteredResults.length
        }
      }
    });

  } catch (error) {
    logger.error('Get test results error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/tests/results
 * Export test results
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Check if user is admin
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { format = "json", filters, includeDetails = false } = body;

    // Get test results (in real implementation, this would fetch from database)
    const mockTestResults: TestResult[] = [
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
          statements: 89
        },
        environment: "development",
        branch: "main",
        commit: "abc123def"
      }
    ];

    // Apply filters if provided
    let filteredResults = mockTestResults;
    if (filters) {
      if (filters.suiteId) {
        filteredResults = filteredResults.filter(result => result.suiteId === filters.suiteId);
      }
      if (filters.status) {
        filteredResults = filteredResults.filter(result => result.status === filters.status);
      }
      if (filters.environment) {
        filteredResults = filteredResults.filter(result => result.environment === filters.environment);
      }
    }

    // Generate export based on format
    let exportData;
    let filename;
    let contentType;

    switch (format) {
      case "csv":
        exportData = generateCSVExport(filteredResults);
        filename = `test-results-${new Date().toISOString().split('T')[0]}.csv`;
        contentType = "text/csv";
        break;
      case "xlsx":
        exportData = await generateExcelExport(filteredResults);
        filename = `test-results-${new Date().toISOString().split('T')[0]}.xlsx`;
        contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        break;
      case "pdf":
        exportData = await generatePDFExport(filteredResults);
        filename = `test-results-${new Date().toISOString().split('T')[0]}.pdf`;
        contentType = "application/pdf";
        break;
      default:
        exportData = JSON.stringify(filteredResults, null, 2);
        filename = `test-results-${new Date().toISOString().split('T')[0]}.json`;
        contentType = "application/json";
    }

    // Log activity
    await logActivity(userId, "Test Results Exported", `Exported ${filteredResults.length} test results in ${format} format`, request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || "unknown");

    return new NextResponse(exportData as BodyInit, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });

  } catch (error) {
    logger.error('Export test results error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }

function generateCSVExport(results: TestResult[]): string {
  const headers = [
    'ID', 'Suite Name', 'Status', 'Duration (ms)', 'Timestamp', 
    'Total Tests', 'Passed Tests', 'Failed Tests', 'Skipped Tests',
    'Coverage Lines', 'Coverage Functions', 'Coverage Branches', 'Coverage Statements',
    'Environment', 'Branch', 'Commit'
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
      result.commit
    ];
    csvRows.push(row.join(','));
  });

  return csvRows.join('\n');
}

async function generateExcelExport(results: TestResult[]): Promise<Buffer> {
  // In real implementation, this would use a library like xlsx to generate an Excel file
  // For now, we'll return a mock buffer
  const mockExcelData = JSON.stringify(results, null, 2);
  return Buffer.from(mockExcelData, 'utf-8');
}

async function generatePDFExport(results: TestResult[]): Promise<Buffer> {
  // In real implementation, this would use a library like puppeteer or jsPDF to generate a PDF
  // For now, we'll return a mock buffer
  const mockPDFData = JSON.stringify(results, null, 2);
  return Buffer.from(mockPDFData, 'utf-8');
}

async function logActivity(userId: string, action: string, details: string, ipAddress: string) {
  // In real implementation, this would be stored in database
  logger.info('Activity log:', {
    userId,
    action,
    details,
    ipAddress,
    timestamp: new Date().toISOString()
  });
}
}
