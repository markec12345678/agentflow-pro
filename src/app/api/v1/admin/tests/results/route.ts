/**
 * API Route: Test Results
 * 
 * GET /api/v1/admin/tests/results
 * Get test results history
 * 
 * POST /api/v1/admin/tests/results
 * Export test results
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getTestResultsUseCase } from '@/core/use-cases/get-test-results';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/admin/tests/results
 * Get test results history
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
    const suiteId = searchParams.get('suiteId') || undefined;
    const status = searchParams.get('status') || undefined;
    const environment = searchParams.get('environment') || undefined;
    const branch = searchParams.get('branch') || undefined;
    const dateFrom = searchParams.get('dateFrom') || undefined;
    const dateTo = searchParams.get('dateTo') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // 3. Execute use case
    const result = await getTestResultsUseCase.execute({
      userId,
      suiteId,
      status,
      environment,
      branch,
      dateFrom,
      dateTo,
      limit,
      offset,
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
    console.error('Get test results error:', error);
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
 * POST /api/v1/admin/tests/results
 * Export test results
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
    const { format = 'json', filters, includeDetails = false } = body;

    // 3. Execute use case in export mode
    const result = await getTestResultsUseCase.execute({
      userId,
      exportFormat: format as 'json' | 'csv' | 'xlsx' | 'pdf',
      exportFilters: filters,
      includeDetails,
    });

    // 4. Return file response
    if (result.success && result.data?.exportData) {
      return new NextResponse(result.data.exportData as BodyInit, {
        headers: {
          'Content-Type': result.data.contentType || 'application/json',
          'Content-Disposition': `attachment; filename="${result.data.filename}"`,
        },
      });
    } else {
      return NextResponse.json(result, {
        status: result.error?.code === 'FORBIDDEN' ? 403 : 500,
      });
    }
  } catch (error) {
    console.error('Export test results error:', error);
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
