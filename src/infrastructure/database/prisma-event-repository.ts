/**
 * Prisma Event Repository Implementation
 * 
 * Production-ready event repository z uporabo PostgreSQL in Prisma.
 */

import { prisma } from '@/infrastructure/database/prisma'
import type { DomainEvent, EventStore, Snapshot, SnapshotRepository } from '@/core/domain/workflows/events/domain-event'

export class PrismaEventRepository implements EventStore {
  /**
   * Append events to aggregate
   */
  async append(aggregateId: string, events: DomainEvent[]): Promise<void> {
    const eventData = events.map(event => ({
      eventId: event.eventId,
      aggregateId,
      aggregateType: event.aggregateType,
      type: event.constructor.name,
      payload: event,
      version: event.version,
      metadata: event.metadata || {},
      occurredAt: event.occurredAt
    }))

    await prisma.workflowEvent.createMany({
      data: eventData
    })
  }

  /**
   * Append multiple events for multiple aggregates
   */
  async appendAll(events: Array<{ aggregateId: string; event: DomainEvent }>): Promise<void> {
    const eventData = events.map(({ aggregateId, event }) => ({
      eventId: event.eventId,
      aggregateId,
      aggregateType: event.aggregateType,
      type: event.constructor.name,
      payload: event,
      version: event.version,
      metadata: event.metadata || {},
      occurredAt: event.occurredAt
    }))

    await prisma.workflowEvent.createMany({
      data: eventData
    })
  }

  /**
   * Find all events for aggregate
   */
  async findByAggregateId(aggregateId: string): Promise<DomainEvent[]> {
    const events = await prisma.workflowEvent.findMany({
      where: { aggregateId },
      orderBy: { occurredAt: 'asc' }
    })

    return events.map(event => this.reconstruct(event))
  }

  /**
   * Find events by type
   */
  async findByType(eventType: string): Promise<DomainEvent[]> {
    const events = await prisma.workflowEvent.findMany({
      where: { type: eventType },
      orderBy: { occurredAt: 'asc' }
    })

    return events.map(event => this.reconstruct(event))
  }

  /**
   * Find events in date range
   */
  async findByDateRange(start: Date, end: Date): Promise<DomainEvent[]> {
    const events = await prisma.workflowEvent.findMany({
      where: {
        occurredAt: {
          gte: start,
          lte: end
        }
      },
      orderBy: { occurredAt: 'asc' }
    })

    return events.map(event => this.reconstruct(event))
  }

  /**
   * Find events since version
   */
  async findByAggregateSince(aggregateId: string, sinceVersion: number): Promise<DomainEvent[]> {
    const events = await prisma.workflowEvent.findMany({
      where: {
        aggregateId,
        version: {
          gt: sinceVersion
        }
      },
      orderBy: { version: 'asc' }
    })

    return events.map(event => this.reconstruct(event))
  }

  /**
   * Get event by ID
   */
  async findByEventId(eventId: string): Promise<DomainEvent | null> {
    const event = await prisma.workflowEvent.findUnique({
      where: { eventId }
    })

    if (!event) return null
    return this.reconstruct(event)
  }

  /**
   * Get all aggregates
   */
  async getAllAggregates(): Promise<string[]> {
    const result = await prisma.workflowEvent.groupBy({
      by: ['aggregateId']
    })

    return result.map(r => r.aggregateId)
  }

  /**
   * Get event count for aggregate
   */
  async getCount(aggregateId: string): Promise<number> {
    return await prisma.workflowEvent.count({
      where: { aggregateId }
    })
  }

  /**
   * Get latest version for aggregate
   */
  async getLatestVersion(aggregateId: string): Promise<number> {
    const latest = await prisma.workflowEvent.findFirst({
      where: { aggregateId },
      orderBy: { version: 'desc' },
      select: { version: true }
    })

    return latest?.version || 0
  }

  /**
   * Clear all events (for testing - NE USE v production!)
   */
  async clear(): Promise<void> {
    await prisma.workflowEvent.deleteMany()
    await prisma.workflowSnapshot.deleteMany()
  }

  /**
   * Get statistics
   */
  async getStats(): Promise<{
    totalAggregates: number
    totalEvents: number
    eventTypes: number
  }> {
    const [aggregates, events, types] = await Promise.all([
      prisma.workflowEvent.groupBy({ by: ['aggregateId'] }),
      prisma.workflowEvent.count(),
      prisma.workflowEvent.groupBy({ by: ['type'] })
    ])

    return {
      totalAggregates: aggregates.length,
      totalEvents: events,
      eventTypes: types.length
    }
  }

  /**
   * Reconstruct event from database record
   */
  private reconstruct(record: any): DomainEvent {
    // Get event class from type
    const EventClass = this.getEventClass(record.type)
    
    // Create event instance
    const event = Object.assign(new EventClass(), record.payload)
    
    // Set metadata
    event.metadata = record.metadata
    event.version = record.version
    event.occurredAt = new Date(record.occurredAt)
    
    return event
  }

  /**
   * Get event class from type string
   */
  private getEventClass(type: string): new (...args: any[]) => DomainEvent {
    // Dynamic import from events directory
    const eventTypes: Record<string, new (...args: any[]) => DomainEvent> = {
      // Agent Run Events
      'AgentRunStarted': require('@/core/domain/workflows/events/agent-run-events').AgentRunStarted,
      'AgentRunStepStarted': require('@/core/domain/workflows/events/agent-run-events').AgentRunStepStarted,
      'AgentRunStepCompleted': require('@/core/domain/workflows/events/agent-run-events').AgentRunStepCompleted,
      'AgentRunStepFailed': require('@/core/domain/workflows/events/agent-run-events').AgentRunStepFailed,
      'AgentRunCompleted': require('@/core/domain/workflows/events/agent-run-events').AgentRunCompleted,
      'AgentRunFailed': require('@/core/domain/workflows/events/agent-run-events').AgentRunFailed,
      'AgentRunPaused': require('@/core/domain/workflows/events/agent-run-events').AgentRunPaused,
      'AgentRunResumed': require('@/core/domain/workflows/events/agent-run-events').AgentRunResumed,
      
      // Workflow Events
      'WorkflowCreated': require('@/core/domain/workflows/events/workflow-events').WorkflowCreated,
      'WorkflowUpdated': require('@/core/domain/workflows/events/workflow-events').WorkflowUpdated,
      'WorkflowPublished': require('@/core/domain/workflows/events/workflow-events').WorkflowPublished,
      'WorkflowDeprecated': require('@/core/domain/workflows/events/workflow-events').WorkflowDeprecated,
      'WorkflowDeleted': require('@/core/domain/workflows/events/workflow-events').WorkflowDeleted,
    }

    const EventClass = eventTypes[type]
    if (!EventClass) {
      throw new Error(`Unknown event type: ${type}`)
    }

    return EventClass
  }
}

/**
 * Prisma Snapshot Repository Implementation
 */
export class PrismaSnapshotRepository implements SnapshotRepository {
  /**
   * Find snapshot by aggregate ID
   */
  async findById(aggregateId: string): Promise<Snapshot | null> {
    const snapshot = await prisma.workflowSnapshot.findUnique({
      where: { aggregateId }
    })

    if (!snapshot) return null

    return {
      aggregateId: snapshot.aggregateId,
      version: snapshot.version,
      state: snapshot.state,
      createdAt: snapshot.createdAt
    }
  }

  /**
   * Save snapshot
   */
  async save(snapshot: Snapshot): Promise<void> {
    await prisma.workflowSnapshot.upsert({
      where: { aggregateId: snapshot.aggregateId },
      update: {
        version: snapshot.version,
        state: snapshot.state,
        updatedAt: new Date()
      },
      create: {
        aggregateId: snapshot.aggregateId,
        version: snapshot.version,
        state: snapshot.state,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })
  }

  /**
   * Delete snapshot
   */
  async delete(aggregateId: string): Promise<void> {
    await prisma.workflowSnapshot.delete({
      where: { aggregateId }
    })
  }

  /**
   * Clear all snapshots (for testing)
   */
  async clear(): Promise<void> {
    await prisma.workflowSnapshot.deleteMany()
  }
}
