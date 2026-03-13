/**
 * Agent Run Domain Events
 * 
 * Vsi eventi povezani z Agent Run lifecycle.
 */

import { BaseDomainEvent } from './domain-event'

// ============================================================================
// Agent Run Started
// ============================================================================

export class AgentRunStarted extends BaseDomainEvent {
  constructor(
    public readonly runId: string,
    public readonly workflowId: string,
    public readonly inputData: any,
    public readonly userId?: string,
    metadata?: Record<string, any>
  ) {
    super(runId, 'AgentRun', metadata)
  }
}

// ============================================================================
// Agent Run Step Started
// ============================================================================

export class AgentRunStepStarted extends BaseDomainEvent {
  constructor(
    public readonly runId: string,
    public readonly stepId: string,
    public readonly stepName: string,
    public readonly stepType: string,
    public readonly input: any,
    metadata?: Record<string, any>
  ) {
    super(runId, 'AgentRun', metadata)
  }
}

// ============================================================================
// Agent Run Step Completed
// ============================================================================

export class AgentRunStepCompleted extends BaseDomainEvent {
  constructor(
    public readonly runId: string,
    public readonly stepId: string,
    public readonly stepName: string,
    public readonly result: any,
    public readonly duration: number, // milliseconds
    public readonly tokensUsed?: number,
    metadata?: Record<string, any>
  ) {
    super(runId, 'AgentRun', metadata)
  }
}

// ============================================================================
// Agent Run Step Failed
// ============================================================================

export class AgentRunStepFailed extends BaseDomainEvent {
  constructor(
    public readonly runId: string,
    public readonly stepId: string,
    public readonly stepName: string,
    public readonly error: string,
    public readonly errorType: string,
    public readonly stackTrace?: string,
    metadata?: Record<string, any>
  ) {
    super(runId, 'AgentRun', metadata)
  }
}

// ============================================================================
// Agent Run Completed
// ============================================================================

export class AgentRunCompleted extends BaseDomainEvent {
  constructor(
    public readonly runId: string,
    public readonly result: any,
    public readonly totalDuration: number,
    public readonly totalSteps: number,
    public readonly tokensUsed?: number,
    metadata?: Record<string, any>
  ) {
    super(runId, 'AgentRun', metadata)
  }
}

// ============================================================================
// Agent Run Failed
// ============================================================================

export class AgentRunFailed extends BaseDomainEvent {
  constructor(
    public readonly runId: string,
    public readonly error: string,
    public readonly errorType: string,
    public readonly failedAtStep?: string,
    public readonly stackTrace?: string,
    metadata?: Record<string, any>
  ) {
    super(runId, 'AgentRun', metadata)
  }
}

// ============================================================================
// Agent Run Paused
// ============================================================================

export class AgentRunPaused extends BaseDomainEvent {
  constructor(
    public readonly runId: string,
    public readonly reason: string,
    public readonly pausedAtStep?: string,
    metadata?: Record<string, any>
  ) {
    super(runId, 'AgentRun', metadata)
  }
}

// ============================================================================
// Agent Run Resumed
// ============================================================================

export class AgentRunResumed extends BaseDomainEvent {
  constructor(
    public readonly runId: string,
    public readonly resumedBy: string,
    metadata?: Record<string, any>
  ) {
    super(runId, 'AgentRun', metadata)
  }
}

// ============================================================================
// Type Union
// ============================================================================

export type AgentRunEvent =
  | AgentRunStarted
  | AgentRunStepStarted
  | AgentRunStepCompleted
  | AgentRunStepFailed
  | AgentRunCompleted
  | AgentRunFailed
  | AgentRunPaused
  | AgentRunResumed
