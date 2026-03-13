/**
 * Event Sourcing Usage Example
 * 
 * Primer kako uporabljati event sourcing v production.
 */

import { AgentRun } from '@/core/domain/workflows/agent-run'
import { PrismaEventRepository, PrismaSnapshotRepository } from '@/infrastructure/database/prisma-event-repository'
import { SnapshotService } from '@/infrastructure/events/snapshot-service'
import { EventReplayService } from '@/infrastructure/events/event-replay-service'

export class EventSourcingExample {
  private eventRepository: PrismaEventRepository
  private snapshotRepository: PrismaSnapshotRepository
  private snapshotService: SnapshotService
  private replayService: EventReplayService

  constructor() {
    this.eventRepository = new PrismaEventRepository()
    this.snapshotRepository = new PrismaSnapshotRepository()
    this.snapshotService = new SnapshotService(this.eventRepository, this.snapshotRepository)
    this.replayService = new EventReplayService(this.eventRepository)
  }

  /**
   * Example 1: Create and persist agent run
   */
  async createAgentRun(): Promise<void> {
    console.log('Creating agent run...')

    // Create new run
    const run = AgentRun.create('run_example_1', 'wf_123', { query: 'Test query' }, 'user_456')

    // Execute steps
    run.startStep('step_1', 'Research', 'search', { query: 'test' })
    run.completeStep('step_1', { results: ['result1', 'result2'] }, 1200, 50)

    run.startStep('step_2', 'Analysis', 'analyze', { data: 'data' })
    run.completeStep('step_2', { analysis: 'analysis result' }, 1800, 75)

    run.complete({ final: 'Final result' })

    // Persist events
    const events = run.getUncommittedEvents()
    await this.eventRepository.append(run.id, events)

    console.log(`Created run with ${events.length} events`)

    // Save snapshot if needed
    await this.snapshotService.saveSnapshotIfNeeded(run)
  }

  /**
   * Example 2: Load agent run from database
   */
  async loadAgentRun(runId: string): Promise<AgentRun> {
    console.log(`Loading run ${runId}...`)

    // Load with snapshot optimization
    const run = await this.snapshotService.loadAggregate(
      runId,
      (events) => AgentRun.loadFromHistory(runId, events)
    )

    console.log(`Loaded run: status=${run.status}, steps=${run.steps.length}`)
    return run
  }

  /**
   * Example 3: Replay run for debugging
   */
  async debugRun(runId: string): Promise<void> {
    console.log(`Debugging run ${runId}...`)

    // Get full run
    const run = await this.replayService.replayRun(runId)
    console.log('Run status:', run.status)
    console.log('Run result:', run.result)
    console.log('Run error:', run.error)

    // Get step-by-step execution
    const steps = await this.replayService.getStepExecution(runId)
    console.log('Steps:')
    steps.forEach((step, i) => {
      console.log(`  ${i + 1}. ${step.stepName} - ${step.status} (${step.duration}ms)`)
    })

    // Get event timeline
    const timeline = await this.replayService.getEventTimeline(runId)
    console.log('Timeline:')
    timeline.forEach(event => {
      console.log(`  - ${event.type} at ${event.occurredAt.toISOString()}`)
    })
  }

  /**
   * Example 4: Export run for compliance
   */
  async exportRun(runId: string): Promise<string> {
    console.log(`Exporting run ${runId}...`)

    const exported = await this.replayService.exportRun(runId)
    
    // Save to file or send to compliance system
    console.log('Exported run as JSON')
    return exported
  }

  /**
   * Example 5: Compare two runs
   */
  async compareRuns(runId1: string, runId2: string): Promise<void> {
    console.log(`Comparing runs ${runId1} and ${runId2}...`)

    const comparison = await this.replayService.compareRuns(runId1, runId2)
    
    console.log('Run 1:', comparison.run1)
    console.log('Run 2:', comparison.run2)
    console.log('Difference:', comparison.difference)
  }

  /**
   * Example 6: Get state at specific time
   */
  async getStateAtTime(runId: string, timestamp: Date): Promise<void> {
    console.log(`Getting state at ${timestamp.toISOString()}...`)

    const run = await this.replayService.getStateAtTime(runId, timestamp)
    
    console.log('State at time:')
    console.log('  Status:', run.status)
    console.log('  Steps:', run.steps.length)
    console.log('  Current step:', run.getCurrentStep()?.name || 'None')
  }

  /**
   * Example 7: Get database statistics
   */
  async getStats(): Promise<void> {
    console.log('Getting event store statistics...')

    const stats = await this.eventRepository.getStats()
    
    console.log('Statistics:')
    console.log('  Total Aggregates:', stats.totalAggregates)
    console.log('  Total Events:', stats.totalEvents)
    console.log('  Event Types:', stats.eventTypes)
  }

  /**
   * Run all examples
   */
  async runAllExamples(): Promise<void> {
    console.log('=== Event Sourcing Examples ===\n')

    // Example 1: Create run
    await this.createAgentRun()

    // Example 2: Load run
    const run = await this.loadAgentRun('run_example_1')

    // Example 3: Debug run
    await this.debugRun('run_example_1')

    // Example 4: Export run
    await this.exportRun('run_example_1')

    // Example 5: Compare runs (need two runs first)
    await this.createAgentRun()
    await this.compareRuns('run_example_1', 'run_example_2')

    // Example 6: Get state at time
    const time = new Date()
    await this.getStateAtTime('run_example_1', time)

    // Example 7: Get stats
    await this.getStats()

    console.log('\n=== Examples Complete ===')
  }
}

// Usage:
// const example = new EventSourcingExample()
// await example.runAllExamples()
