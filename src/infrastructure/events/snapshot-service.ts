/**
 * Snapshot Service
 * 
 * Upravlja s snapshot-i za optimizacijo loading-a.
 */

import type { AggregateRoot } from '@/core/domain/workflows/aggregate-root'
import type { DomainEvent, EventStore, SnapshotRepository } from '@/core/domain/workflows/events/domain-event'

export class SnapshotService {
  private readonly SNAPSHOT_THRESHOLD = 100  // Create snapshot every 100 events

  constructor(
    private eventStore: EventStore,
    private snapshotRepository: SnapshotRepository
  ) {}

  /**
   * Save snapshot if needed
   */
  async saveSnapshotIfNeeded(aggregate: AggregateRoot): Promise<void> {
    const version = aggregate.getVersion()
    
    if (version > 0 && version % this.SNAPSHOT_THRESHOLD === 0) {
      await this.saveSnapshot(aggregate.id, aggregate, version)
    }
  }

  /**
   * Save snapshot
   */
  async saveSnapshot(aggregateId: string, aggregate: AggregateRoot, version: number): Promise<void> {
    const snapshot = {
      aggregateId,
      version,
      state: this.getAggregateState(aggregate),
      createdAt: new Date()
    }

    await this.snapshotRepository.save(snapshot)
  }

  /**
   * Load aggregate with snapshot optimization
   */
  async loadAggregate<T extends AggregateRoot>(
    id: string,
    loadFromEvents: (events: DomainEvent[]) => T
  ): Promise<T> {
    // Try to load from snapshot first
    const snapshot = await this.snapshotRepository.findById(id)
    
    if (snapshot) {
      // Load events since snapshot
      const events = await this.eventStore.findByAggregateSince(id, snapshot.version)
      const aggregate = loadFromEvents(events)
      aggregate.setVersion(snapshot.version)
      return aggregate
    } else {
      // Load all events
      const events = await this.eventStore.findByAggregateId(id)
      return loadFromEvents(events)
    }
  }

  /**
   * Get aggregate state (for snapshot)
   */
  private getAggregateState(aggregate: AggregateRoot): any {
    // Extract public properties
    const state: any = {}
    
    for (const key in aggregate) {
      if (aggregate.hasOwnProperty(key) && !key.startsWith('_')) {
        state[key] = (aggregate as any)[key]
      }
    }

    return state
  }

  /**
   * Delete snapshot
   */
  async deleteSnapshot(aggregateId: string): Promise<void> {
    await this.snapshotRepository.delete(aggregateId)
  }

  /**
   * Get snapshot info
   */
  async getSnapshotInfo(aggregateId: string): Promise<{
    exists: boolean
    version?: number
    createdAt?: Date
  } | null> {
    const snapshot = await this.snapshotRepository.findById(aggregateId)
    
    if (!snapshot) {
      return { exists: false }
    }

    return {
      exists: true,
      version: snapshot.version,
      createdAt: snapshot.createdAt
    }
  }
}
