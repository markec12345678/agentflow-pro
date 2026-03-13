/**
 * Aggregate Root Base Class
 * 
 * Base class za vse aggregate v event sourcing arhitekturi.
 */

import { DomainEvent } from './events/domain-event'

export abstract class AggregateRoot {
  protected events: DomainEvent[] = []
  protected version: number = 0
  public readonly id: string

  constructor(id: string) {
    this.id = id
  }

  /**
   * Apply event - doda event in posodobi state
   */
  protected apply(event: DomainEvent): void {
    this.events.push(event)
    this.when(event)
  }

  /**
   * State mutation logic - implementirajo subclasses
   * Ta metoda določa kako event vpliva na state
   */
  protected abstract when(event: DomainEvent): void

  /**
   * Get uncommitted events - za persistence
   */
  getUncommittedEvents(): DomainEvent[] {
    return [...this.events]
  }

  /**
   * Clear events - po persistence
   */
  clearEvents(): void {
    this.events = []
  }

  /**
   * Set version - po loading iz history
   */
  setVersion(version: number): void {
    this.version = version
  }

  /**
   * Get current version
   */
  getVersion(): number {
    return this.version
  }

  /**
   * Load from history - rekonstruira aggregate iz eventov
   */
  static loadFromHistory<T extends AggregateRoot>(
    this: new (id: string) => T,
    id: string,
    events: DomainEvent[]
  ): T {
    const aggregate = new this(id)
    events.forEach(event => aggregate.when(event))
    aggregate.version = events.length
    return aggregate
  }
}
