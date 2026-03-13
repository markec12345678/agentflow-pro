/**
 * In-Memory Event Bus Implementation
 * 
 * Preprosta implementacija Event Bus-a za development in testiranje.
 * Za production uporabi Redis/Kafka based implementation.
 */

import { DomainEvent, EventBus } from '../domain/shared/events/domain-event'

type EventHandler<T extends DomainEvent> = (event: T) => Promise<void>

export class InMemoryEventBus implements EventBus {
  private handlers: Map<string, Array<EventHandler<any>>> = new Map()
  private eventQueue: DomainEvent[] = []
  private isProcessing: boolean = false

  /**
   * Objavi dogodek vsem subscriberjem
   */
  async publish(event: DomainEvent): Promise<void> {
    // Shrani v queue za async procesiranje
    this.eventQueue.push(event)

    // Procesiraj queue
    if (!this.isProcessing) {
      await this.processQueue()
    }
  }

  /**
   * Objavi več eventov hkrati
   */
  async publishAll(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event)
    }
  }

  /**
   * Registriraj handler za dogodek
   */
  subscribe<T extends DomainEvent>(
    eventType: new (...args: any[]) => T,
    handler: (event: T) => Promise<void>
  ): void {
    const eventTypeName = eventType.name
    const handlers = this.handlers.get(eventTypeName) || []
    handlers.push(handler)
    this.handlers.set(eventTypeName, handlers)
  }

  /**
   * Odstrani handler
   */
  unsubscribe<T extends DomainEvent>(
    eventType: new (...args: any[]) => T,
    handler: (event: T) => Promise<void>
  ): void {
    const eventTypeName = eventType.name
    const handlers = this.handlers.get(eventTypeName) || []
    const index = handlers.indexOf(handler)
    if (index !== -1) {
      handlers.splice(index, 1)
    }
    this.handlers.set(eventTypeName, handlers)
  }

  /**
   * Pridobi število subscriberjev za dogodek
   */
  getSubscriberCount(eventType: new (...args: any[]) => any): number {
    const eventTypeName = eventType.name
    const handlers = this.handlers.get(eventTypeName) || []
    return handlers.length
  }

  /**
   * Počisti vse handlerje
   */
  clear(): void {
    this.handlers.clear()
  }

  /**
   * Procesiraj event queue
   */
  private async processQueue(): Promise<void> {
    if (this.eventQueue.length === 0) {
      this.isProcessing = false
      return
    }

    this.isProcessing = true

    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift()
      if (event) {
        await this.notifyHandlers(event)
      }
    }

    this.isProcessing = false
  }

  /**
   * Obvesti vse handlerje
   */
  private async notifyHandlers(event: DomainEvent): Promise<void> {
    const eventTypeName = event.constructor.name
    const handlers = this.handlers.get(eventTypeName) || []

    // Obvesti tudi handlerje za base class
    const baseHandlers = this.handlers.get('DomainEvent') || []
    const allHandlers = [...handlers, ...baseHandlers]

    // Procesiraj vse handlerje parallel
    const promises = allHandlers.map(async handler => {
      try {
        await handler(event)
      } catch (error) {
        console.error(`Error in event handler for ${eventTypeName}:`, error)
        // V productionu: pošlji v error tracking (Sentry)
      }
    })

    await Promise.all(promises)
  }

  /**
   * Pridobi statistiko
   */
  getStats(): {
    queuedEvents: number
    totalHandlers: number
    eventTypes: number
  } {
    return {
      queuedEvents: this.eventQueue.length,
      totalHandlers: Array.from(this.handlers.values()).reduce((sum, h) => sum + h.length, 0),
      eventTypes: this.handlers.size
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const eventBus = new InMemoryEventBus()
