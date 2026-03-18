/**
 * API Route: Test Schedule
 * 
 * GET /api/v1/admin/tests/schedule
 * Get test schedules
 * 
 * POST /api/v1/admin/tests/schedule
 * Create or update test schedule
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { scheduleTestUseCase } from '@/core/use-cases/schedule-test';
import type { TestFrequency, TestNotifications } from '@/core/use-cases/schedule-test';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/admin/tests/schedule
 * Get test schedules
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await getServerSession(authOptions);
    const userId = session?.user
      ? (session.user as { userId?: string }).userId ?? session.user.email ?? null
      : null;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 },
      );
    }

    // 2. Parse query params
    const { searchParams } = new URL(request.url);
    const enabledParam = searchParams.get('enabled');
    const enabled = enabledParam === null ? undefined : (enabledParam === 'true');
    const includeHistory = searchParams.get('includeHistory') === 'true';

    // 3. Execute use case
    const result = await scheduleTestUseCase.execute({
      userId,
      enabled,
      includeHistory,
    });

    // 4. Return response
    if (result.success && result.data) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, {
        status: result.error?.code === 'FORBIDDEN' ? 403 : 500,
      });
    }
  } catch (error) {
    console.error('Get test schedules error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Internal server error',
        },
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/v1/admin/tests/schedule
 * Create or update test schedule
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await getServerSession(authOptions);
    const userId = session?.user
      ? (session.user as { userId?: string }).userId ?? session.user.email ?? null
      : null;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 },
      );
    }

    // 2. Parse request body
    const body = await request.json();
    const {
      id,
      name,
      description,
      suiteId,
      category,
      frequency,
      cronExpression,
      enabled = true,
      environment,
      branch,
      notifications,
    } = body;

    // 3. Validate required fields
    if (!name || !frequency || !environment || !branch) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Name, frequency, environment, and branch are required',
          },
        },
        { status: 400 },
      );
    }

    // 4. Execute use case
    const result = await scheduleTestUseCase.execute({
      userId,
      id,
      name,
      description,
      suiteId,
      category,
      frequency: frequency as TestFrequency,
      cronExpression,
      enabled,
      environment,
      branch,
      notifications: notifications as TestNotifications,
    });

    // 5. Return response
    if (result.success && result.data) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, {
        status: result.error?.code === 'FORBIDDEN' ? 403 : 400,
      });
    }
  } catch (error) {
    console.error('Create/update test schedule error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Internal server error',
        },
      },
      { status: 500 },
    );
  }
}
