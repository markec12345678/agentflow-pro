/**
 * Agent Run Aggregate
 * 
 * Event-sourced aggregate za Agent Run.
 */

import { AggregateRoot } from './aggregate-root'
import {
  AgentRunStarted,
  AgentRunStepStarted,
  AgentRunStepCompleted,
  AgentRunStepFailed,
  AgentRunCompleted,
  AgentRunFailed,
  AgentRunPaused,
  AgentRunResumed
} from './events/agent-run-events'
import type { DomainEvent } from './events/domain-event'

export type AgentRunStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed'

export interface AgentStep {
  id: string
  name: string
  type: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  input?: any
  result?: any
  error?: string
  duration?: number
  tokensUsed?: number
  startedAt?: Date
  completedAt?: Date
}

export class AgentRun extends AggregateRoot {
  public workflowId: string = ''
  public status: AgentRunStatus = 'pending'
  public inputData?: any
  public result?: any
  public error?: string
  public steps: AgentStep[] = []
  public totalDuration: number = 0
  public totalTokensUsed: number = 0
  public startedAt?: Date
  public completedAt?: Date
  public pausedAt?: Date
  public resumedAt?: Date

  constructor(id: string) {
    super(id)
  }

  // ============================================================================
  // Commands (mutate state via events)
  // ============================================================================

  /**
   * Start agent run
   */
  start(workflowId: string, inputData: any, userId?: string): void {
    this.apply(new AgentRunStarted(this.id, workflowId, inputData, userId))
  }

  /**
   * Start step
   */
  startStep(stepId: string, stepName: string, stepType: string, input: any): void {
    this.apply(new AgentRunStepStarted(this.id, stepId, stepName, stepType, input))
  }

  /**
   * Complete step
   */
  completeStep(stepId: string, result: any, duration: number, tokensUsed?: number): void {
    this.apply(new AgentRunStepCompleted(this.id, stepId, stepId, result, duration, tokensUsed))
  }

  /**
   * Fail step
   */
  failStep(stepId: string, error: string, errorType: string, stackTrace?: string): void {
    this.apply(new AgentRunStepFailed(this.id, stepId, stepId, error, errorType, stackTrace))
  }

  /**
   * Complete run
   */
  complete(result: any): void {
    const totalDuration = this.steps.reduce((sum, step) => sum + (step.duration || 0), 0)
    const totalTokens = this.steps.reduce((sum, step) => sum + (step.tokensUsed || 0), 0)
    
    this.apply(new AgentRunCompleted(this.id, result, totalDuration, this.steps.length, totalTokens))
  }

  /**
   * Fail run
   */
  fail(error: string, errorType: string, failedAtStep?: string, stackTrace?: string): void {
    this.apply(new AgentRunFailed(this.id, error, errorType, failedAtStep, stackTrace))
  }

  /**
   * Pause run
   */
  pause(reason: string): void {
    this.apply(new AgentRunPaused(this.id, reason))
  }

  /**
   * Resume run
   */
  resume(resumedBy: string): void {
    this.apply(new AgentRunResumed(this.id, resumedBy))
  }

  // ============================================================================
  // State mutation logic
  // ============================================================================

  protected when(event: DomainEvent): void {
    if (event instanceof AgentRunStarted) {
      this.workflowId = event.workflowId
      this.inputData = event.inputData
      this.status = 'running'
      this.startedAt = event.occurredAt
    } 
    else if (event instanceof AgentRunStepStarted) {
      const step: AgentStep = {
        id: event.stepId,
        name: event.stepName,
        type: event.stepType,
        status: 'running',
        input: event.input,
        startedAt: event.occurredAt
      }
      this.steps.push(step)
    } 
    else if (event instanceof AgentRunStepCompleted) {
      const step = this.steps.find(s => s.id === event.stepId)
      if (step) {
        step.status = 'completed'
        step.result = event.result
        step.duration = event.duration
        step.tokensUsed = event.tokensUsed
        step.completedAt = event.occurredAt
      }
    } 
    else if (event instanceof AgentRunStepFailed) {
      const step = this.steps.find(s => s.id === event.stepId)
      if (step) {
        step.status = 'failed'
        step.error = event.error
        step.completedAt = event.occurredAt
      }
    } 
    else if (event instanceof AgentRunCompleted) {
      this.status = 'completed'
      this.result = event.result
      this.totalDuration = event.totalDuration
      this.totalTokensUsed = event.totalTokensUsed || 0
      this.completedAt = event.occurredAt
    } 
    else if (event instanceof AgentRunFailed) {
      this.status = 'failed'
      this.error = event.error
      this.completedAt = event.occurredAt
    } 
    else if (event instanceof AgentRunPaused) {
      this.status = 'paused'
      this.pausedAt = event.occurredAt
    } 
    else if (event instanceof AgentRunResumed) {
      this.status = 'running'
      this.resumedAt = event.occurredAt
    }
  }

  // ============================================================================
  // Helper methods
  // ============================================================================

  /**
   * Get current step
   */
  getCurrentStep(): AgentStep | null {
    const runningStep = this.steps.find(s => s.status === 'running')
    return runningStep || null
  }

  /**
   * Get next pending step
   */
  getNextPendingStep(): AgentStep | null {
    const pendingStep = this.steps.find(s => s.status === 'pending')
    return pendingStep || null
  }

  /**
   * Check if run is complete
   */
  isComplete(): boolean {
    return this.status === 'completed' || this.status === 'failed'
  }

  /**
   * Get progress percentage
   */
  getProgress(): number {
    if (this.steps.length === 0) return 0
    const completedSteps = this.steps.filter(s => s.status === 'completed').length
    return Math.round((completedSteps / this.steps.length) * 100)
  }

  // ============================================================================
  // Static factory methods
  // ============================================================================

  /**
   * Create new agent run
   */
  static create(id: string, workflowId: string, inputData: any, userId?: string): AgentRun {
    const run = new AgentRun(id)
    run.start(workflowId, inputData, userId)
    return run
  }

  /**
   * Load from history
   */
  static loadFromHistory(id: string, events: DomainEvent[]): AgentRun {
    const run = new AgentRun(id)
    events.forEach(event => run.when(event))
    run.version = events.length
    return run
  }
}
