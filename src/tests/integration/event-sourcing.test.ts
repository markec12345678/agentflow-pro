/**
 * Integration Tests: Event Sourcing
 * 
 * Testi za event sourcing implementacijo.
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import { AgentRun } from '@/core/domain/workflows/agent-run'
import { InMemoryEventStore, InMemorySnapshotRepository } from '@/infrastructure/events/in-memory-event-store'
import { SnapshotService } from '@/infrastructure/events/snapshot-service'
import { EventReplayService } from '@/infrastructure/events/event-replay-service'

describe('Event Sourcing Integration', () => {
  let eventStore: InMemoryEventStore
  let snapshotRepository: InMemorySnapshotRepository
  let snapshotService: SnapshotService
  let replayService: EventReplayService

  beforeEach(() => {
    eventStore = new InMemoryEventStore()
    snapshotRepository = new InMemorySnapshotRepository()
    snapshotService = new SnapshotService(eventStore, snapshotRepository)
    replayService = new EventReplayService(eventStore)
  })

  describe('Agent Run Event Sourcing', () => {
    it('should create agent run and record events', async () => {
      // Arrange
      const runId = 'run_test_1'
      const workflowId = 'wf_test_1'
      const inputData = { query: 'Test query' }

      // Act
      const run = AgentRun.create(runId, workflowId, inputData, 'user_123')
      
      // Simulate steps
      run.startStep('step_1', 'Research', 'search', { query: 'test' })
      run.completeStep('step_1', { results: ['result1'] }, 1200, 50)
      
      run.startStep('step_2', 'Analysis', 'analyze', { data: 'data' })
      run.completeStep('step_2', { analysis: 'analysis' }, 1800, 75)
      
      run.complete({ final: 'result' })

      // Assert
      const events = run.getUncommittedEvents()
      expect(events).toHaveLength(7) // Started + 2x(Started+Completed) + Completed
      
      // Persist events
      await eventStore.append(runId, events)
      
      const storedEvents = await eventStore.findByAggregateId(runId)
      expect(storedEvents).toHaveLength(7)
    })

    it('should reconstruct agent run from events', async () => {
      // Arrange
      const runId = 'run_test_2'
      const workflowId = 'wf_test_2'
      
      const run = AgentRun.create(runId, workflowId, { test: 'data' })
      run.startStep('step_1', 'Step 1', 'type', {})
      run.completeStep('step_1', 'result', 1000)
      run.complete('final result')

      const events = run.getUncommittedEvents()
      await eventStore.append(runId, events)

      // Act - Load from history
      const loadedEvents = await eventStore.findByAggregateId(runId)
      const reconstructedRun = AgentRun.loadFromHistory(runId, loadedEvents)

      // Assert
      expect(reconstructedRun.id).toBe(runId)
      expect(reconstructedRun.workflowId).toBe(workflowId)
      expect(reconstructedRun.status).toBe('completed')
      expect(reconstructedRun.steps).toHaveLength(1)
      expect(reconstructedRun.result).toBe('final result')
    })

    it('should replay run to get state at specific time', async () => {
      // Arrange
      const runId = 'run_test_3'
      const run = AgentRun.create(runId, 'wf_1', {})
      
      const time1 = new Date()
      run.startStep('step_1', 'Step 1', 'type', {})
      
      const time2 = new Date()
      run.completeStep('step_1', 'result', 1000)
      
      const time3 = new Date()
      run.complete('final')

      const events = run.getUncommittedEvents()
      await eventStore.append(runId, events)

      // Act - Get state at different times
      const stateAtTime1 = await replayService.getStateAtTime(runId, time1)
      const stateAtTime2 = await replayService.getStateAtTime(runId, time2)
      const stateAtTime3 = await replayService.getStateAtTime(runId, time3)

      // Assert
      expect(stateAtTime1.steps).toHaveLength(0) // Before any steps
      expect(stateAtTime2.steps).toHaveLength(1) // After step started
      expect(stateAtTime3.status).toBe('completed') // After completion
    })

    it('should export and import run', async () => {
      // Arrange
      const runId = 'run_test_4'
      const run = AgentRun.create(runId, 'wf_1', { test: 'data' })
      run.completeStep('step_1', 'result', 1000)
      run.complete('final')

      const events = run.getUncommittedEvents()
      await eventStore.append(runId, events)

      // Act - Export
      const exported = await replayService.exportRun(runId)
      
      // Act - Import
      const importedRun = await replayService.importRun(exported)

      // Assert
      expect(importedRun.id).toBe(runId)
      expect(importedRun.status).toBe('completed')
      expect(importedRun.steps).toHaveLength(1)
    })

    it('should get event timeline', async () => {
      // Arrange
      const runId = 'run_test_5'
      const run = AgentRun.create(runId, 'wf_1', {})
      run.startStep('step_1', 'Research', 'search', {})
      run.completeStep('step_1', 'result', 1200)
      run.complete('final')

      const events = run.getUncommittedEvents()
      await eventStore.append(runId, events)

      // Act
      const timeline = await replayService.getEventTimeline(runId)

      // Assert
      expect(timeline).toHaveLength(5)
      expect(timeline[0].type).toBe('AgentRunStarted')
      expect(timeline[2].type).toBe('AgentRunStepCompleted')
      expect(timeline[4].type).toBe('AgentRunCompleted')
    })

    it('should get step execution details', async () => {
      // Arrange
      const runId = 'run_test_6'
      const run = AgentRun.create(runId, 'wf_1', {})
      run.startStep('step_1', 'Research', 'search', {})
      run.completeStep('step_1', { data: 'result' }, 1500, 100)
      run.startStep('step_2', 'Analysis', 'analyze', {})
      run.failStep('step_2', 'Error occurred', 'ErrorType')
      run.fail('Run failed', 'RunError', 'step_2')

      const events = run.getUncommittedEvents()
      await eventStore.append(runId, events)

      // Act
      const steps = await replayService.getStepExecution(runId)

      // Assert
      expect(steps).toHaveLength(2)
      expect(steps[0]).toEqual(expect.objectContaining({
        stepId: 'step_1',
        status: 'completed',
        duration: 1500
      }))
      expect(steps[1]).toEqual(expect.objectContaining({
        stepId: 'step_2',
        status: 'failed'
      }))
    })

    it('should compare two runs', async () => {
      // Arrange - Run 1
      const run1 = AgentRun.create('run_1', 'wf_1', {})
      run1.completeStep('step_1', 'result', 1000)
      run1.complete('final')
      await eventStore.append('run_1', run1.getUncommittedEvents())

      // Arrange - Run 2
      const run2 = AgentRun.create('run_2', 'wf_1', {})
      run2.completeStep('step_1', 'result', 1500)
      run2.completeStep('step_2', 'result', 2000)
      run2.complete('final')
      await eventStore.append('run_2', run2.getUncommittedEvents())

      // Act
      const comparison = await replayService.compareRuns('run_1', 'run_2')

      // Assert
      expect(comparison.run1.steps).toBe(1)
      expect(comparison.run2.steps).toBe(2)
      expect(comparison.difference.steps).toBe(1)
      expect(comparison.difference.duration).toBeGreaterThan(0)
    })
  })

  describe('Snapshot Service', () => {
    it('should create snapshot after threshold', async () => {
      // Arrange
      const runId = 'run_snapshot_1'
      const run = AgentRun.create(runId, 'wf_1', {})

      // Act - Add 100 events (threshold)
      for (let i = 0; i < 100; i++) {
        run.startStep(`step_${i}`, `Step ${i}`, 'type', {})
        run.completeStep(`step_${i}`, `result_${i}`, 100)
      }

      await eventStore.append(runId, run.getUncommittedEvents())
      await snapshotService.saveSnapshotIfNeeded(run)

      // Assert
      const snapshotInfo = await snapshotService.getSnapshotInfo(runId)
      expect(snapshotInfo?.exists).toBe(true)
      expect(snapshotInfo?.version).toBe(200) // 100 steps * 2 events each
    })

    it('should load aggregate with snapshot optimization', async () => {
      // Arrange
      const runId = 'run_snapshot_2'
      const run = AgentRun.create(runId, 'wf_1', {})
      
      // Add and snapshot
      run.startStep('step_1', 'Step 1', 'type', {})
      run.completeStep('step_1', 'result', 1000)
      await eventStore.append(runId, run.getUncommittedEvents())
      await snapshotService.saveSnapshot(runId, run, 2)

      // Add more events
      run.startStep('step_2', 'Step 2', 'type', {})
      run.completeStep('step_2', 'result', 1500)
      await eventStore.append(runId, run.getUncommittedEvents())

      // Act - Load with snapshot
      const loadedRun = await snapshotService.loadAggregate(
        runId,
        (events) => AgentRun.loadFromHistory(runId, events)
      )

      // Assert
      expect(loadedRun.steps).toHaveLength(2)
      expect(loadedRun.getVersion()).toBe(2) // From snapshot
    })
  })

  describe('Event Store Statistics', () => {
    it('should track statistics', async () => {
      // Arrange
      const run1 = AgentRun.create('run_stats_1', 'wf_1', {})
      run1.complete('result')
      await eventStore.append('run_stats_1', run1.getUncommittedEvents())

      const run2 = AgentRun.create('run_stats_2', 'wf_2', {})
      run2.complete('result')
      await eventStore.append('run_stats_2', run2.getUncommittedEvents())

      // Act
      const stats = eventStore.getStats()

      // Assert
      expect(stats.totalAggregates).toBe(2)
      expect(stats.totalEvents).toBeGreaterThan(0)
      expect(stats.eventTypes).toBeGreaterThan(0)
    })
  })
})
