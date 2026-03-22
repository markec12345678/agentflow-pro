import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getUserId } from '@/lib/auth-users';
import { prisma } from '@/database/schema';

export const dynamic = "force-dynamic";

interface TestSchedule {
  id: string;
  name: string;
  description: string;
  suiteId?: string;
  category?: string;
  frequency: "hourly" | "daily" | "weekly" | "monthly" | "custom";
  cronExpression?: string;
  enabled: boolean;
  environment: string;
  branch: string;
  notifications: {
    onSuccess: boolean;
    onFailure: boolean;
    emails: string[];
  };
  lastRun?: string;
  nextRun: string;
  createdAt: string;
  updatedAt: string;
}

interface ScheduledTestRun {
  id: string;
  scheduleId: string;
  status: "pending" | "running" | "completed" | "failed";
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

/**
 * GET /api/admin/tests/schedule
 * Get test schedules
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
    const enabled = searchParams.get('enabled');
    const includeHistory = searchParams.get('includeHistory') === 'true';

    // Get test schedules (in real implementation, this would fetch from database)
    const mockSchedules: TestSchedule[] = [
      {
        id: "schedule_1",
        name: "Daily Unit Tests",
        description: "Run all unit tests daily at 2 AM",
        suiteId: "unit-tests",
        frequency: "daily",
        enabled: true,
        environment: "development",
        branch: "main",
        notifications: {
          onSuccess: false,
          onFailure: true,
          emails: ["admin@example.com", "dev-team@example.com"]
        },
        lastRun: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        nextRun: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "schedule_2",
        name: "Weekly Integration Tests",
        description: "Run integration tests every Sunday at 1 AM",
        suiteId: "integration-tests",
        frequency: "weekly",
        enabled: true,
        environment: "staging",
        branch: "develop",
        notifications: {
          onSuccess: true,
          onFailure: true,
          emails: ["admin@example.com"]
        },
        lastRun: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        nextRun: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "schedule_3",
        name: "Hourly Health Checks",
        description: "Run performance tests every hour",
        suiteId: "performance-tests",
        frequency: "hourly",
        enabled: false,
        environment: "production",
        branch: "main",
        notifications: {
          onSuccess: false,
          onFailure: true,
          emails: ["ops@example.com"]
        },
        lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        nextRun: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "schedule_4",
        name: "Monthly Security Tests",
        description: "Run security tests monthly on the 1st",
        suiteId: "security-tests",
        frequency: "monthly",
        enabled: true,
        environment: "staging",
        branch: "main",
        notifications: {
          onSuccess: true,
          onFailure: true,
          emails: ["security@example.com", "admin@example.com"]
        },
        lastRun: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        nextRun: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "schedule_5",
        name: "Custom E2E Tests",
        description: "Run E2E tests on business days at 9 AM",
        suiteId: "e2e-tests",
        frequency: "custom",
        cronExpression: "0 9 * * 1-5",
        enabled: true,
        environment: "production",
        branch: "main",
        notifications: {
          onSuccess: false,
          onFailure: true,
          emails: ["qa@example.com"]
        },
        lastRun: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        nextRun: new Date(Date.now() + 16 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    // Apply filters
    let filteredSchedules = mockSchedules;
    
    if (enabled !== null) {
      const isEnabled = enabled === 'true';
      filteredSchedules = filteredSchedules.filter(schedule => schedule.enabled === isEnabled);
    }

    const response: any = {
      success: true,
      data: {
        schedules: filteredSchedules,
        summary: {
          totalSchedules: filteredSchedules.length,
          enabledSchedules: filteredSchedules.filter(s => s.enabled).length,
          disabledSchedules: filteredSchedules.filter(s => !s.enabled).length
        }
      }
    };

    // Include scheduled runs history if requested
    if (includeHistory) {
      const mockRuns: ScheduledTestRun[] = [
        {
          id: "run_1",
          scheduleId: "schedule_1",
          status: "completed",
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
              statements: 89
            }
          },
          logs: [
            "Starting unit test execution...",
            "Running authentication tests...",
            "Running database tests...",
            "Tests completed successfully"
          ]
        },
        {
          id: "run_2",
          scheduleId: "schedule_2",
          status: "failed",
          startTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 8 * 60 * 1000).toISOString(),
          duration: 480000,
          result: {
            totalTests: 45,
            passedTests: 40,
            failedTests: 5,
            skippedTests: 0
          },
          logs: [
            "Starting integration test execution...",
            "Database connection established...",
            "API integration test failed: Connection timeout",
            "Test execution failed"
          ]
        }
      ];

      response.data.scheduledRuns = mockRuns;
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Get test schedules error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/tests/schedule
 * Create or update test schedule
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
    const { 
      name, 
      description, 
      suiteId, 
      category, 
      frequency, 
      cronExpression, 
      enabled = true, 
      environment, 
      branch, 
      notifications 
    } = body;

    if (!name || !frequency || !environment || !branch) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Name, frequency, environment, and branch are required' } },
        { status: 400 }
      );
    }

    // Validate frequency
    const validFrequencies = ["hourly", "daily", "weekly", "monthly", "custom"];
    if (!validFrequencies.includes(frequency)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_FREQUENCY', message: 'Invalid frequency' } },
        { status: 400 }
      );
    }

    // Validate cron expression for custom frequency
    if (frequency === "custom" && !cronExpression) {
      return NextResponse.json(
        { success: false, error: { code: 'CRON_REQUIRED', message: 'Cron expression required for custom frequency' } },
        { status: 400 }
      );
    }

    // Calculate next run time
    const nextRun = calculateNextRun(frequency, cronExpression);

    // Create/update schedule (in real implementation)
    const schedule: TestSchedule = {
      id: body.id || `schedule_${Date.now()}`,
      name,
      description: description || "",
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
        emails: []
      },
      nextRun,
      createdAt: body.id ? new Date().toISOString() : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log('Created/updated test schedule:', schedule);

    // Log activity
    await logActivity(userId, body.id ? "Test Schedule Updated" : "Test Schedule Created", `${body.id ? 'Updated' : 'Created'} schedule: ${name}`, request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || "unknown");

    return NextResponse.json({
      success: true,
      data: {
        message: body.id ? 'Test schedule updated successfully' : 'Test schedule created successfully',
        schedule
      }
    });

  } catch (error) {
    console.error('Create/update test schedule error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }

function calculateNextRun(frequency: string, cronExpression?: string): string {
  const now = new Date();
  
  switch (frequency) {
    case "hourly":
      now.setHours(now.getHours() + 1);
      now.setMinutes(0, 0, 0);
      break;
    case "daily":
      now.setDate(now.getDate() + 1);
      now.setHours(2, 0, 0, 0);
      break;
    case "weekly":
      now.setDate(now.getDate() + (7 - now.getDay()));
      now.setHours(1, 0, 0, 0);
      break;
    case "monthly":
      now.setMonth(now.getMonth() + 1);
      now.setDate(1);
      now.setHours(1, 0, 0, 0);
      break;
    case "custom":
      // In real implementation, this would parse the cron expression
      // For now, we'll just add 1 hour as a placeholder
      now.setHours(now.getHours() + 1);
      break;
    default:
      now.setHours(now.getHours() + 1);
  }
  
  return now.toISOString();
}

async function logActivity(userId: string, action: string, details: string, ipAddress: string) {
  // In real implementation, this would be stored in database
  console.log('Activity log:', {
    userId,
    action,
    details,
    ipAddress,
    timestamp: new Date().toISOString()
  });
}
}
