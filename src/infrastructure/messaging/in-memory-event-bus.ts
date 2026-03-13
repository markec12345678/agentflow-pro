/**
 * Infrastructure Implementation: In-Memory Event Bus
 * 
 * Preprost event bus za development in testiranje.
 * Za production uporabi KafkaEventBus.
 */

import { DomainEvent } from '@/core/domain/tourism/events/reservation-events'

type EventHandler<T extends DomainEvent> = (event: T) => Promise<void> | void

export class InMemoryEventBus {
  private handlers: Map<string, Array<EventHandler<any>>> = new Map()

  /**
   * Objavi dogodek vsem subscriberjem
   */
  async publish<T extends DomainEvent>(event: T): Promise<void> {
    const eventType = event.constructor.name
    const subscribers = this.handlers.get(eventType) || []

    // Objavi vsem subscriberjem parallel
    await Promise.all(
      subscribers.map(async handler => {
        try {
          await handler(event)
        } catch (error) {
          console.error(`Error handling event ${eventType}:`, error)
          // V productionu: pošlji v error tracking (Sentry)
        }
      })
    )
  }

  /**
   * Naroči handler na dogodek
   */
  subscribe<T extends DomainEvent>(
    eventType: new (...args: any[]) => T,
    handler: EventHandler<T>
  ): void {
    const eventTypeName = eventType.name
    const subscribers = this.handlers.get(eventTypeName) || []
    subscribers.push(handler)
    this.handlers.set(eventTypeName, subscribers)
  }

  /**
   * Odjavi handler iz dogodka
   */
  unsubscribe<T extends DomainEvent>(
    eventType: new (...args: any[]) => T,
    handler: EventHandler<T>
  ): void {
    const eventTypeName = eventType.name
    const subscribers = this.handlers.get(eventTypeName) || []
    const index = subscribers.indexOf(handler)
    if (index !== -1) {
      subscribers.splice(index, 1)
      this.handlers.set(eventTypeName, subscribers)
    }
  }

  /**
   * Počisti vse subscriberje
   */
  clear(): void {
    this.handlers.clear()
  }

  /**
   * Pridobi število subscriberjev za dogodek
   */
  getSubscriberCount(eventType: new (...args: any[]) => any): number {
    const eventTypeName = eventType.name
    return this.handlers.get(eventTypeName)?.length || 0
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const eventBus = new InMemoryEventBus()
