/**
 * Outbox Repository
 * 
 * Upravlja z outbox eventi za reliable event publishing.
 */

import { prisma } from '@/infrastructure/database/prisma'
import { DomainEvent } from '@/core/domain/tourism/events/reservation-events'

export interface OutboxEvent {
  id: string
  eventType: string
  payload: any
  metadata?: any
  status: 'pending' | 'processing' | 'processed' | 'failed'
  attempts: number
  maxAttempts: number
  errorMessage?: string | null
  createdAt: Date
  nextRetryAt?: Date | null
}

export class OutboxRepository {
  /**
   * Shrani event v outbox
   */
  async save(event: DomainEvent, metadata?: Record<string, any>): Promise<void> {
    await prisma.outbox.create({
      data: {
        eventType: event.constructor.name,
        payload: event as any,
        metadata: metadata || null,
        status: 'pending',
        attempts: 0,
        maxAttempts: 3,
        createdAt: new Date(),
        nextRetryAt: new Date() // Takoj procesiraj
      }
    })
  }

  /**
   * Shrani več eventov hkrati (batch)
   */
  async saveBatch(
    events: Array<{ event: DomainEvent; metadata?: Record<string, any> }>
  ): Promise<void> {
    await prisma.outbox.createMany({
      data: events.map(({ event, metadata }) => ({
        eventType: event.constructor.name,
        payload: event as any,
        metadata: metadata || null,
        status: 'pending',
        attempts: 0,
        maxAttempts: 3,
        createdAt: new Date(),
        nextRetryAt: new Date()
      }))
    })
  }

  /**
   * Pridobi pending evente za procesiranje
   */
  async getPending(limit: number = 100): Promise<OutboxEvent[]> {
    const now = new Date()

    const outboxRecords = await prisma.outbox.findMany({
      where: {
        status: 'pending',
        nextRetryAt: {
          lte: now
        }
      },
      orderBy: {
        createdAt: 'asc'
      },
      take: limit
    })

    return outboxRecords.map(record => ({
      id: record.id,
      eventType: record.eventType,
      payload: record.payload,
      metadata: record.metadata,
      status: record.status as any,
      attempts: record.attempts,
      maxAttempts: record.maxAttempts,
      errorMessage: record.errorMessage,
      createdAt: record.createdAt,
      nextRetryAt: record.nextRetryAt
    }))
  }

  /**
   * Označi event kot procesiran
   */
  async markProcessed(id: string): Promise<void> {
    await prisma.outbox.update({
      where: { id },
      data: {
        status: 'processed',
        processedAt: new Date()
      }
    })
  }

  /**
   * Označi event kot failed
   */
  async markFailed(id: string, error: string): Promise<void> {
    const record = await prisma.outbox.findUnique({
      where: { id }
    })

    if (!record) {
      throw new Error(`Outbox record ${id} not found`)
    }

    const attempts = record.attempts + 1
    const isPermanentlyFailed = attempts >= record.maxAttempts

    await prisma.outbox.update({
      where: { id },
      data: {
        status: isPermanentlyFailed ? 'failed' : 'pending',
        attempts,
        errorMessage: error,
        nextRetryAt: isPermanentlyFailed
          ? null
          : this.calculateNextRetry(attempts)
      }
    })
  }

  /**
   * Označi event kot processing (v obdelavi)
   */
  async markProcessing(id: string): Promise<void> {
    await prisma.outbox.update({
      where: { id },
      data: {
        status: 'processing',
        updatedAt: new Date()
      }
    })
  }

  /**
   * Pobriši stare procesirane evente
   */
  async deleteProcessed(olderThan: Date): Promise<number> {
    const result = await prisma.outbox.deleteMany({
      where: {
        status: 'processed',
        processedAt: {
          lt: olderThan
        }
      }
    })

    return result.count
  }

  /**
   * Pridobi statistiko outbox-a
   */
  async getStats(): Promise<{
    pending: number
    processing: number
    processed: number
    failed: number
  }> {
    const [pending, processing, processed, failed] = await Promise.all([
      prisma.outbox.count({ where: { status: 'pending' } }),
      prisma.outbox.count({ where: { status: 'processing' } }),
      prisma.outbox.count({ where: { status: 'processed' } }),
      prisma.outbox.count({ where: { status: 'failed' } })
    ])

    return { pending, processing, processed, failed }
  }

  /**
   * Izračunaj naslednji retry time (exponential backoff)
   */
  private calculateNextRetry(attempts: number): Date {
    const delays = [
      1000 * 60,        // 1 minuta
      1000 * 60 * 5,    // 5 minut
      1000 * 60 * 15,   // 15 minut
      1000 * 60 * 60,   // 1 ura
      1000 * 60 * 60 * 6 // 6 ur
    ]

    const delay = delays[Math.min(attempts, delays.length - 1)]
    return new Date(Date.now() + delay)
  }
}
