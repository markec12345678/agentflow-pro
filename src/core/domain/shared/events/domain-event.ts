/**
 * Domain Event Base Interface
 * 
 * Vsi domain eventi morajo implementirati ta interface.
 */

export interface DomainEvent {
  /**
   * Unikatni ID dogodka
   */
  eventId: string
  
  /**
   * ID agregata ki je sprožil dogodek
   */
  aggregateId: string
  
  /**
   * Tip agregata (npr. 'Reservation', 'Property', 'Guest')
   */
  aggregateType: string
  
  /**
   * Čas ko je dogodek nastal
   */
  occurredAt: Date
  
  /**
   * Verzija eventa (za event sourcing)
   */
  version: number
  
  /**
   * Metadata (user ID, correlation ID, itd.)
   */
  metadata?: Record<string, any>
}

/**
 * Base class za vse domain evente
 */
export abstract class BaseDomainEvent implements DomainEvent {
  public readonly eventId: string
  public readonly aggregateId: string
  public readonly aggregateType: string
  public readonly occurredAt: Date
  public readonly version: number
  public readonly metadata?: Record<string, any>

  constructor(
    aggregateId: string,
    aggregateType: string,
    metadata?: Record<string, any>
  ) {
    this.eventId = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    this.aggregateId = aggregateId
    this.aggregateType = aggregateType
    this.occurredAt = new Date()
    this.version = 1
    this.metadata = metadata
  }
}

/**
 * Event Store interface za shranjevanje eventov
 */
export interface EventStore {
  /**
   * Shrani dogodek
   */
  save(event: DomainEvent): Promise<void>
  
  /**
   * Shrani več eventov hkrati
   */
  saveAll(events: DomainEvent[]): Promise<void>
  
  /**
   * Pridobi vse evente za agregat
   */
  findByAggregateId(aggregateId: string): Promise<DomainEvent[]>
  
  /**
   * Pridobi evente po tipu
   */
  findByType(eventType: string): Promise<DomainEvent[]>
  
  /**
   * Pridobi evente v časovnem obdobju
   */
  findByDateRange(start: Date, end: Date): Promise<DomainEvent[]>
}

/**
 * Event Bus interface za objavljanje eventov
 */
export interface EventBus {
  /**
   * Objavi dogodek vsem subscriberjem
   */
  publish(event: DomainEvent): Promise<void>
  
  /**
   * Objavi več eventov hkrati
   */
  publishAll(events: DomainEvent[]): Promise<void>
  
  /**
   * Registriraj handler za dogodek
   */
  subscribe<T extends DomainEvent>(eventType: new (...args: any[]) => T, handler: (event: T) => Promise<void>): void
  
  /**
   * Odstrani handler
   */
  unsubscribe<T extends DomainEvent>(eventType: new (...args: any[]) => T, handler: (event: T) => Promise<void>): void
}
