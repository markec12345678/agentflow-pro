/**
 * API Route - Workflow Replay
 * GET: List replays
 * POST: Create/start replay
 */

import { NextRequest, NextResponse } from 'next/server';
import { workflowReplayer } from '@/testing/workflow-replayer';

export interface ReplayCreateRequest {
  traceId: string;
  mode?: 'full' | 'step-by-step' | 'from-step' | 'to-step';
  fromStep?: number;
  toStep?: number;
  speed?: 'normal' | 'fast' | 'slow';
  pauseOnBreakpoints?: boolean;
  pauseOnErrors?: boolean;
}

/**
 * GET /api/dev/replay
 * List all replays
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');

    const replays = workflowReplayer.listReplays(status);

    return NextResponse.json({
      success: true,
      data: replays,
    });
  } catch (error) {
    logger.error('Failed to list replays:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to list replays' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/dev/replay
 * Create and optionally start replay
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { traceId, mode, fromStep, toStep, speed, pauseOnBreakpoints, pauseOnErrors, action } = body as ReplayCreateRequest & { action?: 'create' | 'start' };

    if (!traceId) {
      return NextResponse.json(
        { success: false, error: 'traceId is required' },
        { status: 400 }
      );
    }

    // Create replay
    const replay = await workflowReplayer.createReplay(traceId, {
      mode,
      fromStep,
      toStep,
      speed,
      pauseOnBreakpoints,
      pauseOnErrors,
    });

    // Optionally start immediately
    if (action === 'start') {
      workflowReplayer.startReplay(replay.replayId);
    }

    return NextResponse.json({
      success: true,
      data: replay,
      message: 'Replay created successfully',
    });
  } catch (error) {
    logger.error('Failed to create replay:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create replay' },
      { status: 500 }
    );
  }
}
