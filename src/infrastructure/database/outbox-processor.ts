/**
 * Outbox Processor
 * 
 * Periodično procesira pending evente iz outbox-a.
 * Run kot background service.
 */

import { OutboxRepository } from './outbox-repository'
import { eventBus } from '../messaging/in-memory-event-bus'
import { logger } from '../observability/logger'

export class OutboxProcessor {
  private isRunning = false
  private intervalId: NodeJS.Timeout | null = null

  constructor(
    private outboxRepo: OutboxRepository,
    private batchSize: number = 100,
    private pollIntervalMs: number = 5000 // 5 sekund
  ) {}

  /**
   * Začni procesiranje
   */
  start(): void {
    if (this.intervalId) {
      logger.warn('OutboxProcessor already running')
      return
    }

    logger.info('Starting OutboxProcessor', {
      batchSize: this.batchSize,
      pollIntervalMs: this.pollIntervalMs
    })

    // Takoj procesiraj prve evente
    this.process().catch(error => {
      logger.error('Initial outbox processing failed', error)
    })

    // Nastavi interval
    this.intervalId = setInterval(() => {
      if (!this.isRunning) {
        this.process().catch(error => {
          logger.error('Outbox processing failed', error)
        })
      }
    }, this.pollIntervalMs)
  }

  /**
   * Ustavi procesiranje
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
      logger.info('OutboxProcessor stopped')
    }
  }

  /**
   * Procesiraj batch eventov
   */
  private async process(): Promise<void> {
    if (this.isRunning) {
      return // Prepreči concurrent execution
    }

    this.isRunning = true

    try {
      // 1. Pridobi pending evente
      const pendingEvents = await this.outboxRepo.getPending(this.batchSize)

      if (pendingEvents.length === 0) {
        return // Ni eventov za procesirat
      }

      logger.info(`Processing ${pendingEvents.length} outbox events`)

      // 2. Procesiraj vsak event
      const promises = pendingEvents.map(async (outboxEvent) => {
        const eventId = outboxEvent.id

        try {
          // Označi kot processing
          await this.outboxRepo.markProcessing(eventId)

          // Parsaj event
          const event = outboxEvent.payload

          // Objavi event
          await eventBus.publish(event)

          // Označi kot procesiran
          await this.outboxRepo.markProcessed(eventId)

          logger.debug(`Outbox event processed: ${eventId}`)
        } catch (error) {
          logger.error(`Outbox event processing failed: ${eventId}`, error)

          // Označi kot failed (z retry logic)
          await this.outboxRepo.markFailed(eventId, error.message)
        }
      })

      // Počakaj na vse
      await Promise.all(promises)

      // 3. Logiraj statistiko
      const stats = await this.outboxRepo.getStats()
      logger.debug('Outbox stats', stats)
    } catch (error) {
      logger.error('Outbox processing error', error)
      throw error
    } finally {
      this.isRunning = false
    }
  }

  /**
   * Ročno procesiraj vse pending evente (za debugging)
   */
  async processAll(): Promise<void> {
    logger.info('Manual outbox processing triggered')
    await this.process()
  }

  /**
   * Pobriši stare evente (cleanup job)
   */
  async cleanup(daysToKeep: number = 7): Promise<void> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

    const deletedCount = await this.outboxRepo.deleteProcessed(cutoffDate)

    if (deletedCount > 0) {
      logger.info(`Cleaned up ${deletedCount} old outbox events`)
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const outboxProcessor = new OutboxProcessor(
  new OutboxRepository(),
  100,  // batch size
  5000  // poll every 5 seconds
)
