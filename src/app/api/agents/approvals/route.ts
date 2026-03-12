/**
 * API Route - Agent Approvals Management
 * GET: List pending approvals
 * POST: Create/approve/reject approval
 */

import { NextRequest, NextResponse } from 'next/server';
import { approvalManager, assessRisk } from '@/agents/security/approval-manager';

export interface ApprovalCreateRequest {
  agentId: string;
  action: string;
  description: string;
  inputData: any;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  metadata?: any;
}

export interface ApprovalResponseRequest {
  approved: boolean;
  notes?: string;
  reviewedBy: string;
}

/**
 * GET /api/agents/approvals
 * List all pending approvals
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'pending';

    let approvals = approvalManager.getPendingApprovals();

    // Filter by status if provided
    if (status !== 'all') {
      approvals = approvals.filter(a => a.status === status);
    }

    return NextResponse.json({
      success: true,
      data: approvals,
      stats: approvalManager.getApprovalStats(),
    });
  } catch (error) {
    console.error('Failed to get approvals:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve approvals' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/agents/approvals
 * Create new approval request OR respond to existing approval
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // Respond to existing approval
    if (action === 'respond' && body.approvalId) {
      const { approvalId, approved, notes, reviewedBy } = body as ApprovalResponseRequest & { approvalId: string };

      if (!reviewedBy) {
        return NextResponse.json(
          { success: false, error: 'reviewedBy is required' },
          { status: 400 }
        );
      }

      const approval = await approvalManager.respondToApproval(approvalId, {
        approved,
        notes,
        reviewedBy,
      });

      return NextResponse.json({
        success: true,
        data: approval,
        message: `Approval ${approved ? 'approved' : 'rejected'}`,
      });
    }

    // Create new approval request
    const { agentId, action: actionName, description, inputData, riskLevel, metadata } = body as ApprovalCreateRequest;

    if (!agentId || !actionName || !description) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: agentId, action, description' },
        { status: 400 }
      );
    }

    // Assess risk if not provided
    const risk = riskLevel || assessRisk(agentId, actionName, inputData);

    const approval = await approvalManager.requestApproval(
      agentId,
      actionName,
      description,
      inputData,
      risk,
      metadata
    );

    return NextResponse.json({
      success: true,
      data: approval,
      message: 'Approval request created',
    });
  } catch (error) {
    console.error('Failed to process approval:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process approval' },
      { status: 500 }
    );
  }
}
