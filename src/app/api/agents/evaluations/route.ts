/**
 * API Route - Agent Evaluation
 * GET: Get evaluation reports
 * POST: Create evaluation or add feedback
 */

import { NextRequest, NextResponse } from 'next/server';
import { agentEvaluator } from '@/agents/evaluation/agent-evaluator';

export interface EvaluationCreateRequest {
  agentId: string;
  taskId: string;
  input: any;
  output: any;
  executionTimeMs: number;
  tokenUsage: { input: number; output: number };
}

export interface FeedbackRequest {
  evaluationId: string;
  rating: number;
  comment?: string;
  wouldRecommend: boolean;
  taskCompleted: boolean;
}

/**
 * GET /api/agents/evaluations
 * Get evaluation reports and agent performance
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const agentId = searchParams.get('agentId');
    const type = searchParams.get('type') || 'report';

    if (type === 'performance' && agentId) {
      // Get specific agent performance
      const performance = agentEvaluator.getAgentPerformance(agentId);
      return NextResponse.json({
        success: true,
        data: performance,
      });
    }

    // Get overall evaluation report
    const report = agentEvaluator.getEvaluationReport(agentId || undefined);
    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error) {
    logger.error('Failed to get evaluations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve evaluations' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/agents/evaluations
 * Create evaluation or add user feedback
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // Add user feedback
    if (action === 'feedback' && body.evaluationId) {
      const { evaluationId, rating, comment, wouldRecommend, taskCompleted } = body as FeedbackRequest;

      if (!rating || rating < 1 || rating > 5) {
        return NextResponse.json(
          { success: false, error: 'Rating must be between 1 and 5' },
          { status: 400 }
        );
      }

      const evaluation = await agentEvaluator.addUserFeedback(evaluationId, {
        rating,
        comment,
        wouldRecommend,
        taskCompleted,
      });

      return NextResponse.json({
        success: true,
        data: evaluation,
        message: 'Feedback added successfully',
      });
    }

    // Create new evaluation
    const { agentId, taskId, input, output, executionTimeMs, tokenUsage } = body as EvaluationCreateRequest;

    if (!agentId || !taskId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: agentId, taskId' },
        { status: 400 }
      );
    }

    const evaluation = await agentEvaluator.evaluate(
      agentId,
      taskId,
      input,
      output,
      executionTimeMs,
      tokenUsage
    );

    return NextResponse.json({
      success: true,
      data: evaluation,
      message: 'Evaluation created successfully',
    });
  } catch (error) {
    logger.error('Failed to process evaluation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process evaluation' },
      { status: 500 }
    );
  }
}
