/**
 * AgentFlow Pro - Human-in-the-Loop Approval System
 * Enables human oversight for critical agent actions
 */

export interface ApprovalRequest {
  id: string;
  agentId: string;
  action: string;
  description: string;
  inputData: any;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  requestedBy: string;
  requestedAt: string;
  expiresAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  metadata?: {
    deployment?: { platform: string; environment: string };
    communication?: { recipientId: string; messageType: string };
    code?: { repository: string; filesChanged: number };
  };
}

export interface ApprovalResponse {
  approved: boolean;
  notes?: string;
  reviewedBy?: string;
}

export class ApprovalManager {
  private pendingApprovals: Map<string, ApprovalRequest> = new Map();
  private approvalHistory: ApprovalRequest[] = [];
  private defaultExpirationMinutes = 30;

  /**
   * Request human approval for agent action
   */
  async requestApproval(
    agentId: string,
    action: string,
    description: string,
    inputData: any,
    riskLevel: ApprovalRequest['riskLevel'],
    metadata?: ApprovalRequest['metadata']
  ): Promise<ApprovalRequest> {
    const approval: ApprovalRequest = {
      id: `approval_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      agentId,
      action,
      description,
      inputData,
      riskLevel,
      status: 'pending',
      requestedBy: agentId,
      requestedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + this.defaultExpirationMinutes * 60 * 1000).toISOString(),
      metadata,
    };

    this.pendingApprovals.set(approval.id, approval);

    // Notify reviewers (integrate with notification system)
    await this.notifyReviewers(approval);

    return approval;
  }

  /**
   * Get approval request by ID
   */
  getApproval(approvalId: string): ApprovalRequest | null {
    const approval = this.pendingApprovals.get(approvalId);
    if (!approval) {
      // Check history
      return this.approvalHistory.find(a => a.id === approvalId) || null;
    }
    return approval;
  }

  /**
   * Get all pending approvals
   */
  getPendingApprovals(): ApprovalRequest[] {
    return Array.from(this.pendingApprovals.values());
  }

  /**
   * Approve or reject approval request
   */
  async respondToApproval(
    approvalId: string,
    response: ApprovalResponse
  ): Promise<ApprovalRequest> {
    const approval = this.pendingApprovals.get(approvalId);
    if (!approval) {
      throw new Error(`Approval ${approvalId} not found`);
    }

    approval.status = response.approved ? 'approved' : 'rejected';
    approval.reviewedBy = response.reviewedBy;
    approval.reviewedAt = new Date().toISOString();
    approval.reviewNotes = response.notes;

    // Move to history
    this.pendingApprovals.delete(approvalId);
    this.approvalHistory.push(approval);

    // Notify requester
    await this.notifyRequester(approval, response);

    return approval;
  }

  /**
   * Wait for approval with timeout
   */
  async waitForApproval(
    approvalId: string,
    timeoutMs: number = 5 * 60 * 1000
  ): Promise<ApprovalRequest> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const approval = this.pendingApprovals.get(approvalId);
      if (!approval) {
        throw new Error(`Approval ${approvalId} not found`);
      }

      if (approval.status === 'approved') {
        return approval;
      }

      if (approval.status === 'rejected') {
        throw new Error(`Approval rejected: ${approval.reviewNotes}`);
      }

      if (new Date() > new Date(approval.expiresAt)) {
        approval.status = 'expired';
        this.pendingApprovals.delete(approvalId);
        this.approvalHistory.push(approval);
        throw new Error('Approval expired');
      }

      // Wait before polling again
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    throw new Error('Approval timeout');
  }

  /**
   * Check if action requires approval based on risk level
   */
  requiresApproval(riskLevel: string, userPermissions?: string[]): boolean {
    const riskThresholds: Record<string, string[]> = {
      'low': [], // No approval needed
      'medium': ['basic'],
      'high': ['basic', 'elevated'],
      'critical': ['basic', 'elevated', 'admin'],
    };

    const requiredPermissions = riskThresholds[riskLevel] || [];
    if (!userPermissions) return requiredPermissions.length > 0;

    return requiredPermissions.some(perm => !userPermissions.includes(perm));
  }

  /**
   * Auto-approve low-risk actions
   */
  shouldAutoApprove(action: string, riskLevel: string): boolean {
    if (riskLevel === 'low') {
      return true;
    }

    // Auto-approve safe actions
    const autoApproveActions = [
      'read_operation',
      'status_check',
      'log_view',
    ];

    return autoApproveActions.includes(action);
  }

  /**
   * Get approval statistics
   */
  getApprovalStats(): {
    totalPending: number;
    totalApproved: number;
    totalRejected: number;
    totalExpired: number;
    avgReviewTimeMinutes: number;
  } {
    const history = this.approvalHistory;
    const approved = history.filter(a => a.status === 'approved');
    const rejected = history.filter(a => a.status === 'rejected');
    const expired = history.filter(a => a.status === 'expired');

    const avgReviewTime = approved.length > 0
      ? approved.reduce((sum, a) => {
          const reviewTime = new Date(a.reviewedAt!).getTime() - new Date(a.requestedAt).getTime();
          return sum + reviewTime;
        }, 0) / approved.length / 60000
      : 0;

    return {
      totalPending: this.pendingApprovals.size,
      totalApproved: approved.length,
      totalRejected: rejected.length,
      totalExpired: expired.length,
      avgReviewTimeMinutes: Math.round(avgReviewTime * 100) / 100,
    };
  }

  /**
   * Clean up expired approvals
   */
  cleanupExpiredApprovals(): number {
    const now = new Date();
    let cleaned = 0;

    for (const [id, approval] of this.pendingApprovals.entries()) {
      if (new Date(approval.expiresAt) < now) {
        approval.status = 'expired';
        this.pendingApprovals.delete(id);
        this.approvalHistory.push(approval);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Notify reviewers about pending approval
   */
  private async notifyReviewers(approval: ApprovalRequest): Promise<void> {
    // TODO: Integrate with notification system
    // - Send email to reviewers
    // - Send Slack/Teams notification
    // - Create in-app notification
    logger.info(`[Approval] Notifying reviewers about ${approval.id}`);
  }

  /**
   * Notify requester about approval decision
   */
  private async notifyRequester(
    approval: ApprovalRequest,
    response: ApprovalResponse
  ): Promise<void> {
    // TODO: Integrate with notification system
    logger.info(`[Approval] Notifying requester about ${approval.id} - ${response.approved ? 'APPROVED' : 'REJECTED'}`);
  }
}

/**
 * Risk assessment for agent actions
 */
export function assessRisk(
  agentType: string,
  action: string,
  context?: any
): 'low' | 'medium' | 'high' | 'critical' {
  // Critical risk actions
  const criticalActions = [
    'deploy_to_production',
    'delete_database',
    'modify_production_config',
    'send_bulk_emails',
  ];

  // High risk actions
  const highRiskActions = [
    'deploy_to_staging',
    'modify_database_schema',
    'send_customer_email',
    'create_pull_request',
  ];

  // Medium risk actions
  const mediumRiskActions = [
    'generate_content',
    'modify_code',
    'create_reservation',
  ];

  if (criticalActions.includes(action)) return 'critical';
  if (highRiskActions.includes(action)) return 'high';
  if (mediumRiskActions.includes(action)) return 'medium';

  return 'low';
}

/**
 * Create approval middleware for agent execution
 */
export function createApprovalMiddleware(approvalManager: ApprovalManager) {
  return async function approvalMiddleware(
    agentId: string,
    action: string,
    inputData: any,
    execute: () => Promise<any>
  ): Promise<any> {
    const riskLevel = assessRisk(agentId, action);

    // Auto-approve low-risk actions
    if (approvalManager.shouldAutoApprove(action, riskLevel)) {
      return execute();
    }

    // Request approval
    const approval = await approvalManager.requestApproval(
      agentId,
      action,
      `Agent ${agentId} wants to ${action}`,
      inputData,
      riskLevel
    );

    logger.info(`[Approval] Requested ${approval.id} for ${action}`);

    // Wait for approval (with timeout)
    try {
      await approvalManager.waitForApproval(approval.id, 10 * 60 * 1000); // 10 min timeout
    } catch (error) {
      throw new Error(`Approval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Execute after approval
    return execute();
  };
}

export const approvalManager = new ApprovalManager();
