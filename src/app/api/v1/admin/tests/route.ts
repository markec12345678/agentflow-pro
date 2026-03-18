/**
 * API Route: Manage Tests
 * 
 * GET /api/v1/admin/tests
 * Get all test suites and results
 * 
 * POST /api/v1/admin/tests
 * Run tests
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { manageTestsUseCase } from '@/core/use-cases/manage-tests';
import type { TestCategory, TestStatus } from '@/core/use-cases/manage-tests';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/admin/tests
 * Get all test suites and results
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
    const category = (searchParams.get('category') as TestCategory) || undefined;
    const status = (searchParams.get('status') as TestStatus) || undefined;
    const includeResults = searchParams.get('includeResults') === 'true';

    // 3. Execute use case
    const result = await manageTestsUseCase.execute({
      userId,
      category,
      status,
      includeResults,
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
    console.error('Get test suites error:', error);
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
 * POST /api/v1/admin/tests
 * Run tests
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
    const { suiteId, category, force = false } = body;

    // 3. Execute use case
    const result = await manageTestsUseCase.execute({
      userId,
      suiteId,
      category: category as TestCategory,
      force,
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
    console.error('Run tests error:', error);
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
