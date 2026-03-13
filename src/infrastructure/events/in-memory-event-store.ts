/**
 * Event Store Implementation
 * 
 * In-memory implementation za demo. V production uporabi database.
 */

import type { DomainEvent, EventStore, Snapshot, SnapshotRepository } from './events/domain-event'

export class InMemoryEventStore implements EventStore {
  private events: Map<string, DomainEvent[]> = new Map()
  private eventIndex: Map<string, DomainEvent> = new Map()
  private typeIndex: Map<string, DomainEvent[]> = new Map()

  constructor(
    private snapshotRepository?: SnapshotRepository
  ) {}

  /**
   * Append events to aggregate
   */
  async append(aggregateId: string, events: DomainEvent[]): Promise<void> {
    const existingEvents = this.events.get(aggregateId) || []
    const newEvents = [...existingEvents, ...events]
    this.events.set(aggregateId, newEvents)

    // Index events
    for (const event of events) {
      this.eventIndex.set(event.eventId, event)
      
      const type = event.constructor.name
      const typeEvents = this.typeIndex.get(type) || []
      typeEvents.push(event)
      this.typeIndex.set(type, typeEvents)
    }

    // Save snapshot if threshold reached
    if (this.snapshotRepository && newEvents.length > 0 && newEvents.length % 100 === 0) {
      await this.saveSnapshot(aggregateId, newEvents)
    }
  }

  /**
   * Append multiple events for multiple aggregates
   */
  async appendAll(events: Array<{ aggregateId: string; event: DomainEvent }>): Promise<void> {
    const byAggregate = new Map<string, DomainEvent[]>()
    
    for (const { aggregateId, event } of events) {
      const aggEvents = byAggregate.get(aggregateId) || []
      aggEvents.push(event)
      byAggregate.set(aggregateId, aggEvents)
    }

    const promises = Array.from(byAggregate.entries()).map(([aggregateId, aggEvents]) =>
      this.append(aggregateId, aggEvents)
    )

    await Promise.all(promises)
  }

  /**
   * Find all events for aggregate
   */
  async findByAggregateId(aggregateId: string): Promise<DomainEvent[]> {
    return this.events.get(aggregateId) || []
  }

  /**
   * Find events by type
   */
  async findByType(eventType: string): Promise<DomainEvent[]> {
    return this.typeIndex.get(eventType) || []
  }

  /**
   * Find events in date range
   */
  async findByDateRange(start: Date, end: Date): Promise<DomainEvent[]> {
    const allEvents = Array.from(this.eventIndex.values())
    return allEvents.filter(event => 
      event.occurredAt >= start && event.occurredAt <= end
    )
  }

  /**
   * Find events since version
   */
  async findByAggregateSince(aggregateId: string, sinceVersion: number): Promise<DomainEvent[]> {
    const events = await this.findByAggregateId(aggregateId)
    return events.slice(sinceVersion)
  }

  /**
   * Get event by ID
   */
  async findByEventId(eventId: string): Promise<DomainEvent | null> {
    return this.eventIndex.get(eventId) || null
  }

  /**
   * Get all aggregates
   */
  async getAllAggregates(): Promise<string[]> {
    return Array.from(this.events.keys())
  }

  /**
   * Get event count for aggregate
   */
  async getCount(aggregateId: string): Promise<number> {
    const events = await this.findByAggregateId(aggregateId)
    return events.length
  }

  /**
   * Save snapshot
   */
  private async saveSnapshot(aggregateId: string, events: DomainEvent[]): Promise<void> {
    if (!this.snapshotRepository) return

    const snapshot = {
      aggregateId,
      version: events.length,
      state: this.reconstructState(aggregateId, events),
      createdAt: new Date()
    }

    await this.snapshotRepository.save(snapshot)
  }

  /**
   * Reconstruct state from events (for snapshot)
   */
  private reconstructState(aggregateId: string, events: DomainEvent[]): any {
    // This would use the aggregate's when() method
    // For now, return events
    return { events }
  }

  /**
   * Clear all events (for testing)
   */
  clear(): void {
    this.events.clear()
    this.eventIndex.clear()
    this.typeIndex.clear()
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalAggregates: number
    totalEvents: number
    eventTypes: number
  } {
    return {
      totalAggregates: this.events.size,
      totalEvents: this.eventIndex.size,
      eventTypes: this.typeIndex.size
    }
  }
}

/**
 * In-Memory Snapshot Repository
 */
export class InMemorySnapshotRepository implements SnapshotRepository {
  private snapshots: Map<string, any> = new Map()

  async findById(aggregateId: string): Promise<any | null> {
    return this.snapshots.get(aggregateId) || null
  }

  async save(snapshot: any): Promise<void> {
    this.snapshots.set(snapshot.aggregateId, snapshot)
  }

  async delete(aggregateId: string): Promise<void> {
    this.snapshots.delete(aggregateId)
  }

  clear(): void {
    this.snapshots.clear()
  }
}
