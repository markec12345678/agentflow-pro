/**
 * Event Replay Service
 * 
 * Omogoča replay eventov za debugging, testing, in analytics.
 */

import type { DomainEvent, EventStore } from '@/core/domain/workflows/events/domain-event'
import { AgentRun } from '@/core/domain/workflows/agent-run'

export class EventReplayService {
  constructor(
    private eventStore: EventStore
  ) {}

  /**
   * Replay agent run from events
   */
  async replayRun(runId: string): Promise<AgentRun> {
    const events = await this.eventStore.findByAggregateId(runId)
    return AgentRun.loadFromHistory(runId, events)
  }

  /**
   * Get state at specific time
   */
  async getStateAtTime(runId: string, timestamp: Date): Promise<AgentRun> {
    const events = await this.eventStore.findByAggregateId(runId)
    const eventsUntil = events.filter(e => e.occurredAt <= timestamp)
    return AgentRun.loadFromHistory(runId, eventsUntil)
  }

  /**
   * Get state at specific version
   */
  async getStateAtVersion(runId: string, version: number): Promise<AgentRun> {
    const events = await this.eventStore.findByAggregateId(runId)
    const eventsUntil = events.slice(0, version)
    return AgentRun.loadFromHistory(runId, eventsUntil)
  }

  /**
   * Export run as JSON
   */
  async exportRun(runId: string): Promise<string> {
    const events = await this.eventStore.findByAggregateId(runId)
    return JSON.stringify(events, this.eventReplacer, 2)
  }

  /**
   * Import run from JSON
   */
  async importRun(runData: string): Promise<AgentRun> {
    const events = JSON.parse(runData, this.eventReviver)
    const runId = (events[0] as any).aggregateId
    return AgentRun.loadFromHistory(runId, events)
  }

  /**
   * Get event timeline
   */
  async getEventTimeline(runId: string): Promise<Array<{
    eventId: string
    type: string
    occurredAt: Date
    summary: string
  }>> {
    const events = await this.eventStore.findByAggregateId(runId)
    
    return events.map(event => ({
      eventId: event.eventId,
      type: event.constructor.name,
      occurredAt: event.occurredAt,
      summary: this.getEventSummary(event)
    }))
  }

  /**
   * Get step-by-step execution
   */
  async getStepExecution(runId: string): Promise<Array<{
    stepId: string
    stepName: string
    status: 'completed' | 'failed'
    duration: number
    result?: any
    error?: string
  }>> {
    const events = await this.eventStore.findByAggregateId(runId)
    const steps = new Map<string, any>()

    for (const event of events) {
      if (event.constructor.name === 'AgentRunStepStarted') {
        const anyEvent = event as any
        steps.set(anyEvent.stepId, {
          stepId: anyEvent.stepId,
          stepName: anyEvent.stepName,
          status: 'running',
          duration: 0
        })
      } else if (event.constructor.name === 'AgentRunStepCompleted') {
        const anyEvent = event as any
        const step = steps.get(anyEvent.stepId)
        if (step) {
          step.status = 'completed'
          step.result = anyEvent.result
          step.duration = anyEvent.duration
        }
      } else if (event.constructor.name === 'AgentRunStepFailed') {
        const anyEvent = event as any
        const step = steps.get(anyEvent.stepId)
        if (step) {
          step.status = 'failed'
          step.error = anyEvent.error
        }
      }
    }

    return Array.from(steps.values())
  }

  /**
   * Compare two runs
   */
  async compareRuns(runId1: string, runId2: string): Promise<{
    run1: { duration: number; steps: number; status: string }
    run2: { duration: number; steps: number; status: string }
    difference: { duration: number; steps: number }
  }> {
    const run1 = await this.replayRun(runId1)
    const run2 = await this.replayRun(runId2)

    return {
      run1: {
        duration: run1.totalDuration,
        steps: run1.steps.length,
        status: run1.status
      },
      run2: {
        duration: run2.totalDuration,
        steps: run2.steps.length,
        status: run2.status
      },
      difference: {
        duration: run2.totalDuration - run1.totalDuration,
        steps: run2.steps.length - run1.steps.length
      }
    }
  }

  /**
   * Get event summary for display
   */
  private getEventSummary(event: DomainEvent): string {
    const anyEvent = event as any
    
    switch (event.constructor.name) {
      case 'AgentRunStarted':
        return `Run started with workflow ${anyEvent.workflowId}`
      case 'AgentRunStepStarted':
        return `Step ${anyEvent.stepName} started`
      case 'AgentRunStepCompleted':
        return `Step ${anyEvent.stepName} completed in ${anyEvent.duration}ms`
      case 'AgentRunStepFailed':
        return `Step ${anyEvent.stepName} failed: ${anyEvent.error}`
      case 'AgentRunCompleted':
        return `Run completed in ${anyEvent.totalDuration}ms`
      case 'AgentRunFailed':
        return `Run failed: ${anyEvent.error}`
      default:
        return event.constructor.name
    }
  }

  /**
   * JSON replacer for events
   */
  private eventReplacer(key: string, value: any): any {
    if (value instanceof Date) {
      return { __type: 'Date', value: value.toISOString() }
    }
    if (key.startsWith('_') || key === 'events') {
      return undefined
    }
    return value
  }

  /**
   * JSON reviver for events
   */
  private eventReviver(key: string, value: any): any {
    if (value && value.__type === 'Date') {
      return new Date(value.value)
    }
    return value
  }
}
