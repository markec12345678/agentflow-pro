/**
 * Event Handlers / Projections
 * 
 * Handlerji ki poslušajo evente in ustvarjajo read models za queries.
 */

import type { DomainEvent } from '@/core/domain/workflows/events/domain-event'
import { logger } from '@/infrastructure/observability/logger';
import type {
  AgentRunStarted,
  AgentRunStepCompleted,
  AgentRunCompleted,
  AgentRunFailed
} from '@/core/domain/workflows/events/agent-run-events'
import { prisma } from '@/infrastructure/database/prisma'

// ============================================================================
// Agent Run Projections
// ============================================================================

export class AgentRunProjections {
  /**
   * Handle AgentRunStarted - Create run record
   */
  async handleRunStarted(event: AgentRunStarted): Promise<void> {
    await prisma.agentRunView.create({
      data: {
        id: event.runId,
        workflowId: event.workflowId,
        status: 'running',
        inputData: event.inputData,
        userId: event.userId,
        startedAt: event.occurredAt,
        updatedAt: event.occurredAt
      }
    })

    // Log event for analytics
    await this.logEvent(event)
  }

  /**
   * Handle AgentRunStepCompleted - Update step progress
   */
  async handleStepCompleted(event: AgentRunStepCompleted): Promise<void> {
    await prisma.agentRunView.update({
      where: { id: event.runId },
      data: {
        status: 'running',
        totalSteps: { increment: 1 },
        totalDuration: { increment: event.duration },
        totalTokensUsed: { increment: event.tokensUsed || 0 },
        updatedAt: event.occurredAt
      }
    })

    // Save step details
    await prisma.agentRunStep.create({
      data: {
        id: event.stepId,
        runId: event.runId,
        name: event.stepName,
        status: 'completed',
        result: event.result,
        duration: event.duration,
        tokensUsed: event.tokensUsed,
        completedAt: event.occurredAt
      }
    })

    await this.logEvent(event)
  }

  /**
   * Handle AgentRunCompleted - Finalize run
   */
  async handleRunCompleted(event: AgentRunCompleted): Promise<void> {
    await prisma.agentRunView.update({
      where: { id: event.runId },
      data: {
        status: 'completed',
        result: event.result,
        totalDuration: event.totalDuration,
        totalSteps: event.totalSteps,
        totalTokensUsed: event.totalTokensUsed,
        completedAt: event.occurredAt,
        updatedAt: event.occurredAt
      }
    })

    await this.logEvent(event)
  }

  /**
   * Handle AgentRunFailed - Mark as failed
   */
  async handleRunFailed(event: AgentRunFailed): Promise<void> {
    await prisma.agentRunView.update({
      where: { id: event.runId },
      data: {
        status: 'failed',
        error: event.error,
        errorType: event.errorType,
        failedAtStep: event.failedAtStep,
        completedAt: event.occurredAt,
        updatedAt: event.occurredAt
      }
    })

    await this.logEvent(event)
  }

  /**
   * Log event for analytics
   */
  private async logEvent(event: DomainEvent): Promise<void> {
    await prisma.eventLog.create({
      data: {
        eventId: event.eventId,
        type: event.constructor.name,
        aggregateId: event.aggregateId,
        userId: event.metadata?.userId,
        payload: event,
        metadata: event.metadata,
        processed: true,
        processedAt: new Date()
      }
    })
  }
}

// ============================================================================
// Analytics Projections
// ============================================================================

export class AnalyticsProjections {
  /**
   * Update run statistics
   */
  async updateRunStatistics(): Promise<void> {
    const stats = await prisma.agentRunView.groupBy({
      by: ['status', 'workflowId'],
      _count: true,
      _sum: {
        totalDuration: true,
        totalTokensUsed: true
      }
    })

    for (const stat of stats) {
      await prisma.analyticsRunStats.upsert({
        where: { workflowId: stat.workflowId || 'unknown' },
        update: {
          totalRuns: stat._count,
          successfulRuns: stat._count,
          avgDuration: stat._sum.totalDuration || 0,
          avgTokens: stat._sum.totalTokensUsed || 0
        },
        create: {
          workflowId: stat.workflowId || 'unknown',
          totalRuns: stat._count,
          successfulRuns: stat._count,
          avgDuration: stat._sum.totalDuration || 0,
          avgTokens: stat._sum.totalTokensUsed || 0
        }
      })
    }
  }

  /**
   * Update daily statistics
   */
  async updateDailyStats(date: Date): Promise<void> {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const runs = await prisma.agentRunView.findMany({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    })

    const totalRuns = runs.length
    const completedRuns = runs.filter(r => r.status === 'completed').length
    const failedRuns = runs.filter(r => r.status === 'failed').length
    const totalDuration = runs.reduce((sum, r) => sum + (r.totalDuration || 0), 0)
    const totalTokens = runs.reduce((sum, r) => sum + (r.totalTokensUsed || 0), 0)

    await prisma.analyticsDailyStats.upsert({
      where: { date: startOfDay },
      update: {
        totalRuns,
        completedRuns,
        failedRuns,
        totalDuration,
        totalTokens
      },
      create: {
        date: startOfDay,
        totalRuns,
        completedRuns,
        failedRuns,
        totalDuration,
        totalTokens
      }
    })
  }
}

// ============================================================================
// Event Handler Registration
// ============================================================================

export function registerEventHandlers(eventBus: any): void {
  const projections = new AgentRunProjections()
  const analytics = new AnalyticsProjections()

  // Agent Run Events
  eventBus.subscribe('AgentRunStarted', projections.handleRunStarted.bind(projections))
  eventBus.subscribe('AgentRunStepCompleted', projections.handleStepCompleted.bind(projections))
  eventBus.subscribe('AgentRunCompleted', projections.handleRunCompleted.bind(projections))
  eventBus.subscribe('AgentRunFailed', projections.handleRunFailed.bind(projections))

  logger.info('Event handlers registered')
}
