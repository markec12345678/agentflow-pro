/**
 * API Route: System Health Check
 * 
 * GET /api/v1/admin/health
 * Get system health status
 * 
 * POST /api/v1/admin/health
 * Run manual health check
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { checkSystemHealthUseCase } from '@/core/use-cases/check-system-health';
import type { HealthComponent } from '@/core/use-cases/check-system-health';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/admin/health
 * Get system health status
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
    const component = (searchParams.get('component') as HealthComponent) || 'all';
    const detailed = searchParams.get('detailed') === 'true';

    // 3. Execute use case
    const result = await checkSystemHealthUseCase.execute({
      userId,
      component,
      detailed,
    });

    // 4. Return response
    if (result.success && result.data) {
      return NextResponse.json(result.data);
    } else {
      return NextResponse.json(result, {
        status: result.error?.code === 'FORBIDDEN' ? 403 : 500,
      });
    }
  } catch (error) {
    console.error('Health check error:', error);
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
 * POST /api/v1/admin/health
 * Run manual health check
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
    const { component = 'all', force = false } = body;

    // 3. Execute use case
    const result = await checkSystemHealthUseCase.execute({
      userId,
      component: component as HealthComponent,
      force,
    });

    // 4. Return response
    if (result.success && result.data) {
      return NextResponse.json({
        success: true,
        data: {
          message: 'Health check completed successfully',
          ...result.data,
        },
      });
    } else {
      return NextResponse.json(result, {
        status: result.error?.code === 'FORBIDDEN' ? 403 : 500,
      });
    }
  } catch (error) {
    console.error('Manual health check error:', error);
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
