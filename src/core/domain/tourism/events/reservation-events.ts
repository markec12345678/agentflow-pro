/**
 * Domain Events: Reservation Events
 * 
 * Dogodki ki se zgodijo v rezervacijah.
 * Uporabljajo se za event sourcing, notifications, analytics.
 */

import { Money } from '../shared/value-objects/money'
import { DateRange } from '../shared/value-objects/date-range'

// ============================================================================
// Base Event Interface
// ============================================================================

export interface DomainEvent {
  eventId: string
  aggregateId: string
  aggregateType: string
  timestamp: Date
  metadata: Record<string, any>
}

// ============================================================================
// Reservation Events
// ============================================================================

export class ReservationCreated implements DomainEvent {
  public readonly eventId: string
  public readonly aggregateId: string
  public readonly aggregateType: string = 'Reservation'
  public readonly timestamp: Date

  constructor(
    public readonly reservationId: string,
    public readonly propertyId: string,
    public readonly guestId: string,
    public readonly dateRange: DateRange,
    public readonly guests: number,
    public readonly totalPrice: Money,
    public readonly confirmationCode: string,
    timestamp?: Date
  ) {
    this.eventId = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    this.aggregateId = reservationId
    this.timestamp = timestamp || new Date()
  }

  toJSON(): any {
    return {
      eventId: this.eventId,
      aggregateId: this.aggregateId,
      aggregateType: this.aggregateType,
      timestamp: this.timestamp.toISOString(),
      reservationId: this.reservationId,
      propertyId: this.propertyId,
      guestId: this.guestId,
      dateRange: this.dateRange.toJSON(),
      guests: this.guests,
      totalPrice: this.totalPrice.toJSON(),
      confirmationCode: this.confirmationCode
    }
  }
}

// ============================================================================

export class ReservationConfirmed implements DomainEvent {
  public readonly eventId: string
  public readonly aggregateId: string
  public readonly aggregateType: string = 'Reservation'
  public readonly timestamp: Date

  constructor(
    public readonly reservationId: string,
    public readonly confirmedAt: Date,
    timestamp?: Date
  ) {
    this.eventId = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    this.aggregateId = reservationId
    this.timestamp = timestamp || new Date()
  }

  toJSON(): any {
    return {
      eventId: this.eventId,
      aggregateId: this.aggregateId,
      aggregateType: this.aggregateType,
      timestamp: this.timestamp.toISOString(),
      reservationId: this.reservationId,
      confirmedAt: this.confirmedAt.toISOString()
    }
  }
}

// ============================================================================

export class ReservationCancelled implements DomainEvent {
  public readonly eventId: string
  public readonly aggregateId: string
  public readonly aggregateType: string = 'Reservation'
  public readonly timestamp: Date

  constructor(
    public readonly reservationId: string,
    public readonly reason: string,
    public readonly cancelledBy: 'guest' | 'host' | 'system',
    public readonly refundAmount?: Money,
    timestamp?: Date
  ) {
    this.eventId = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    this.aggregateId = reservationId
    this.timestamp = timestamp || new Date()
  }

  toJSON(): any {
    return {
      eventId: this.eventId,
      aggregateId: this.aggregateId,
      aggregateType: this.aggregateType,
      timestamp: this.timestamp.toISOString(),
      reservationId: this.reservationId,
      reason: this.reason,
      cancelledBy: this.cancelledBy,
      refundAmount: this.refundAmount?.toJSON()
    }
  }
}

// ============================================================================

export class ReservationCheckedIn implements DomainEvent {
  public readonly eventId: string
  public readonly aggregateId: string
  public readonly aggregateType: string = 'Reservation'
  public readonly timestamp: Date

  constructor(
    public readonly reservationId: string,
    public readonly checkedInAt: Date,
    timestamp?: Date
  ) {
    this.eventId = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    this.aggregateId = reservationId
    this.timestamp = timestamp || new Date()
  }

  toJSON(): any {
    return {
      eventId: this.eventId,
      aggregateId: this.aggregateId,
      aggregateType: this.aggregateType,
      timestamp: this.timestamp.toISOString(),
      reservationId: this.reservationId,
      checkedInAt: this.checkedInAt.toISOString()
    }
  }
}

// ============================================================================

export class ReservationCheckedOut implements DomainEvent {
  public readonly eventId: string
  public readonly aggregateId: string
  public readonly aggregateType: string = 'Reservation'
  public readonly timestamp: Date

  constructor(
    public readonly reservationId: string,
    public readonly checkedOutAt: Date,
    public readonly totalSpent: Money,
    timestamp?: Date
  ) {
    this.eventId = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    this.aggregateId = reservationId
    this.timestamp = timestamp || new Date()
  }

  toJSON(): any {
    return {
      eventId: this.eventId,
      aggregateId: this.aggregateId,
      aggregateType: this.aggregateType,
      timestamp: this.timestamp.toISOString(),
      reservationId: this.reservationId,
      checkedOutAt: this.checkedOutAt.toISOString(),
      totalSpent: this.totalSpent.toJSON()
    }
  }
}

// ============================================================================

export class ReservationPaymentReceived implements DomainEvent {
  public readonly eventId: string
  public readonly aggregateId: string
  public readonly aggregateType: string = 'Reservation'
  public readonly timestamp: Date

  constructor(
    public readonly reservationId: string,
    public readonly amount: Money,
    public readonly paymentMethod: string,
    public readonly transactionId: string,
    timestamp?: Date
  ) {
    this.eventId = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    this.aggregateId = reservationId
    this.timestamp = timestamp || new Date()
  }

  toJSON(): any {
    return {
      eventId: this.eventId,
      aggregateId: this.aggregateId,
      aggregateType: this.aggregateType,
      timestamp: this.timestamp.toISOString(),
      reservationId: this.reservationId,
      amount: this.amount.toJSON(),
      paymentMethod: this.paymentMethod,
      transactionId: this.transactionId
    }
  }
}

// ============================================================================
// Event Type Union
// ============================================================================

export type ReservationEvent =
  | ReservationCreated
  | ReservationConfirmed
  | ReservationCancelled
  | ReservationCheckedIn
  | ReservationCheckedOut
  | ReservationPaymentReceived
