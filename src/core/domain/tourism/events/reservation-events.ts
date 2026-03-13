/**
 * Reservation Domain Events
 * 
 * Vsi eventi povezani z rezervacijami.
 */

import { BaseDomainEvent } from './domain-event'
import { Money } from '../value-objects/money'

// ============================================================================
// Reservation Created
// ============================================================================

export class ReservationCreated extends BaseDomainEvent {
  constructor(
    public readonly reservationId: string,
    public readonly propertyId: string,
    public readonly guestId: string,
    public readonly checkIn: Date,
    public readonly checkOut: Date,
    public readonly guests: number,
    public readonly totalPrice: Money,
    metadata?: Record<string, any>
  ) {
    super(reservationId, 'Reservation', metadata)
  }
}

// ============================================================================
// Reservation Confirmed
// ============================================================================

export class ReservationConfirmed extends BaseDomainEvent {
  constructor(
    public readonly reservationId: string,
    public readonly confirmedAt: Date,
    public readonly confirmationCode: string,
    metadata?: Record<string, any>
  ) {
    super(reservationId, 'Reservation', metadata)
  }
}

// ============================================================================
// Reservation Cancelled
// ============================================================================

export class ReservationCancelled extends BaseDomainEvent {
  constructor(
    public readonly reservationId: string,
    public readonly reason: string,
    public readonly cancelledBy: 'guest' | 'host' | 'system',
    public readonly refundAmount?: Money,
    metadata?: Record<string, any>
  ) {
    super(reservationId, 'Reservation', metadata)
  }
}

// ============================================================================
// Reservation Checked In
// ============================================================================

export class ReservationCheckedIn extends BaseDomainEvent {
  constructor(
    public readonly reservationId: string,
    public readonly checkedInAt: Date,
    public readonly assignedRoomId?: string,
    metadata?: Record<string, any>
  ) {
    super(reservationId, 'Reservation', metadata)
  }
}

// ============================================================================
// Reservation Checked Out
// ============================================================================

export class ReservationCheckedOut extends BaseDomainEvent {
  constructor(
    public readonly reservationId: string,
    public readonly checkedOutAt: Date,
    public readonly finalAmount: Money,
    metadata?: Record<string, any>
  ) {
    super(reservationId, 'Reservation', metadata)
  }
}

// ============================================================================
// Reservation Payment Received
// ============================================================================

export class ReservationPaymentReceived extends BaseDomainEvent {
  constructor(
    public readonly reservationId: string,
    public readonly amount: Money,
    public readonly paymentMethod: string,
    public readonly transactionId: string,
    metadata?: Record<string, any>
  ) {
    super(reservationId, 'Reservation', metadata)
  }
}

// ============================================================================
// Type Union
// ============================================================================

export type ReservationEvent =
  | ReservationCreated
  | ReservationConfirmed
  | ReservationCancelled
  | ReservationCheckedIn
  | ReservationCheckedOut
  | ReservationPaymentReceived
