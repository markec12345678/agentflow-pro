/**
 * Event Sourcing Database Migration
 * 
 * Script za migracijo iz in-memory v PostgreSQL event store.
 */

import { prisma } from '@/infrastructure/database/prisma'
import { InMemoryEventStore } from '@/infrastructure/events/in-memory-event-store'

export class EventSourcingMigration {
  /**
   * Migrate from in-memory to PostgreSQL
   */
  static async migrateFromInMemory(
    inMemoryStore: InMemoryEventStore,
    batchSize: number = 100
  ): Promise<{
    migrated: number
    aggregates: number
    errors: string[]
  }> {
    const errors: string[] = []
    let migrated = 0
    let aggregates = 0

    try {
      // Get all aggregates from in-memory store
      const aggregateIds = await inMemoryStore.getAllAggregates()
      aggregates = aggregateIds.length

      console.log(`Found ${aggregateIds.length} aggregates to migrate`)

      // Migrate each aggregate
      for (const aggregateId of aggregateIds) {
        try {
          const events = await inMemoryStore.findByAggregateId(aggregateId)

          if (events.length === 0) continue

          // Batch insert events
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

          // Insert in batches
          for (let i = 0; i < eventData.length; i += batchSize) {
            const batch = eventData.slice(i, i + batchSize)
            await prisma.workflowEvent.createMany({
              data: batch
            })
            migrated += batch.length
          }

          console.log(`Migrated aggregate ${aggregateId} (${events.length} events)`)
        } catch (error: any) {
          errors.push(`Failed to migrate aggregate ${aggregateId}: ${error.message}`)
          console.error(error)
        }
      }

      console.log(`Migration complete: ${migrated} events, ${aggregates} aggregates`)
      
      return { migrated, aggregates, errors }
    } catch (error: any) {
      console.error('Migration failed:', error)
      throw error
    }
  }

  /**
   * Verify migration
   */
  static async verifyMigration(
    inMemoryStore: InMemoryEventStore
  ): Promise<{
    verified: boolean
    discrepancies: string[]
  }> {
    const discrepancies: string[] = []
    const aggregateIds = await inMemoryStore.getAllAggregates()

    for (const aggregateId of aggregateIds) {
      const inMemoryEvents = await inMemoryStore.findByAggregateId(aggregateId)
      const databaseEvents = await prisma.workflowEvent.findMany({
        where: { aggregateId },
        orderBy: { occurredAt: 'asc' }
      })

      if (inMemoryEvents.length !== databaseEvents.length) {
        discrepancies.push(
          `Aggregate ${aggregateId}: In-memory ${inMemoryEvents.length} vs Database ${databaseEvents.length}`
        )
      }
    }

    return {
      verified: discrepancies.length === 0,
      discrepancies
    }
  }

  /**
   * Rollback migration
   */
  static async rollback(): Promise<void> {
    console.log('Rolling back migration...')
    
    await prisma.workflowEvent.deleteMany()
    await prisma.workflowSnapshot.deleteMany()
    
    console.log('Rollback complete')
  }

  /**
   * Get migration stats
   */
  static async getStats(): Promise<{
    totalEvents: number
    totalAggregates: number
    eventTypes: Record<string, number>
    oldestEvent: Date | null
    newestEvent: Date | null
  }> {
    const [totalEvents, aggregates, types, oldest, newest] = await Promise.all([
      prisma.workflowEvent.count(),
      prisma.workflowEvent.groupBy({ by: ['aggregateId'] }),
      prisma.workflowEvent.groupBy({ 
        by: ['type'],
        _count: true
      }),
      prisma.workflowEvent.findFirst({
        orderBy: { occurredAt: 'asc' },
        select: { occurredAt: true }
      }),
      prisma.workflowEvent.findFirst({
        orderBy: { occurredAt: 'desc' },
        select: { occurredAt: true }
      })
    ])

    const eventTypes = types.reduce((acc, type) => ({
      ...acc,
      [type.type]: type._count
    }), {})

    return {
      totalEvents,
      totalAggregates: aggregates.length,
      eventTypes,
      oldestEvent: oldest?.occurredAt || null,
      newestEvent: newest?.occurredAt || null
    }
  }
}
