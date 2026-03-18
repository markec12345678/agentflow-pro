/**
 * API Route: Test Pipeline
 * 
 * GET /api/v1/admin/tests/pipeline
 * Get CI/CD pipeline status
 * 
 * POST /api/v1/admin/tests/pipeline
 * Trigger pipeline run
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { runTestPipelineUseCase } from '@/core/use-cases/run-test-pipeline';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/admin/tests/pipeline
 * Get CI/CD pipeline status
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
    const status = searchParams.get('status') || undefined;
    const branch = searchParams.get('branch') || undefined;
    const environment = searchParams.get('environment') || undefined;
    const includeConfig = searchParams.get('includeConfig') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // 3. Execute use case
    const result = await runTestPipelineUseCase.execute({
      userId,
      status,
      branch,
      environment,
      includeConfig,
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
    console.error('Get pipeline status error:', error);
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
 * POST /api/v1/admin/tests/pipeline
 * Trigger pipeline run
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
    const { branch, commit, environment = 'staging', pipelineConfig } = body;

    if (!branch) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Branch is required',
          },
        },
        { status: 400 },
      );
    }

    // 3. Execute use case
    const result = await runTestPipelineUseCase.execute({
      userId,
      branch,
      commit,
      environment,
      pipelineConfig,
    });

    // 4. Return response
    if (result.success && result.data) {
      return NextResponse.json({
        success: true,
        data: {
          message: 'Pipeline triggered successfully',
          pipeline: result.data.triggeredPipeline,
        },
      });
    } else {
      return NextResponse.json(result, {
        status: result.error?.code === 'FORBIDDEN' ? 403 : 500,
      });
    }
  } catch (error) {
    console.error('Trigger pipeline error:', error);
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
