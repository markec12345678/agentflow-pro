/**
 * Use Case: Cancel Reservation
 * 
 * Prekliči rezervacijo.
 * Izračuna refundacijo glede na cancellation policy.
 */

import { Reservation } from '../tourism/entities/reservation'
import { Property } from '../tourism/entities/property'
import { Money } from '../shared/value-objects/money'
import { ReservationCancelled } from '../tourism/events/reservation-events'

// ============================================================================
// Input/Output DTOs
// ============================================================================

export interface CancelReservationInput {
  reservation: Reservation
  property: Property
  cancelledBy: 'guest' | 'host' | 'system'
  reason: string
}

export interface CancelReservationOutput {
  reservation: Reservation
  refundAmount: Money
  cancellationFee: Money
  event: ReservationCancelled
}

// ============================================================================
// Cancellation Policy
// ============================================================================

export interface CancellationPolicy {
  type: 'flexible' | 'moderate' | 'strict' | 'super_strict'
  fullRefundDays: number    // Popoln refund če prekličeš X dni pred check-in
  partialRefundDays: number // Delni refund (50%) če prekličeš X dni pred check-in
  partialRefundPercent: number // Koliko % refunda v partial refund obdobju
}

// ============================================================================
// Use Case Class
// ============================================================================

export class CancelReservation {
  /**
   * Prekliči rezervacijo
   */
  async execute(input: CancelReservationInput): Promise<CancelReservationOutput> {
    const { reservation, property, cancelledBy, reason } = input

    // 1. Validacija
    this.validateCancellation(reservation, cancelledBy)

    // 2. Izračunaj refundacijo
    const { refundAmount, cancellationFee } = this.calculateRefund(
      reservation,
      property
    )

    // 3. Posodobi status rezervacije
    reservation.cancel(reason)

    // 4. Obdelaj refundacijo
    if (refundAmount.amount > 0 && reservation.paymentStatus === 'paid') {
      // TODO: Process refund through payment gateway
      // await paymentGateway.refund(reservation.id, refundAmount)
      reservation.paymentStatus = 'refunded'
    }

    // 5. Ustvari dogodek
    const event = new ReservationCancelled(
      reservation.id,
      reason,
      cancelledBy,
      refundAmount
    )

    // 6. Objavi dogodek (če bi imeli event bus)
    // await eventBus.publish(event)

    return {
      reservation,
      refundAmount,
      cancellationFee,
      event
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Validiraj ali se rezervacija lahko prekliče
   */
  private validateCancellation(
    reservation: Reservation,
    cancelledBy: 'guest' | 'host' | 'system'
  ): void {
    if (!reservation.canBeCancelled()) {
      throw new Error('This reservation cannot be cancelled')
    }

    // Gost ne more preklicati če je že check-in
    if (cancelledBy === 'guest' && reservation.status === 'checked_in') {
      throw new Error('Cannot cancel after check-in')
    }

    // Host lahko prekliče samo v izjemnih primerih
    if (cancelledBy === 'host') {
      // TODO: Preveri ali je razlog veljaven (force majeure, etc.)
    }
  }

  /**
   * Izračunaj refundacijo glede na cancellation policy
   */
  private calculateRefund(
    reservation: Reservation,
    property: Property
  ): { refundAmount: Money; cancellationFee: Money } {
    // Pridobi cancellation policy za property
    const policy = this.getPropertyCancellationPolicy(property)

    // Izračunaj dni do check-in
    const daysUntilCheckIn = Math.ceil(
      (reservation.dateRange.start.getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24)
    )

    // Določi višino refundacije
    let refundPercent = 0

    if (daysUntilCheckIn >= policy.fullRefundDays) {
      // Popoln refund
      refundPercent = 100
    } else if (daysUntilCheckIn >= policy.partialRefundDays) {
      // Delni refund
      refundPercent = policy.partialRefundPercent
    } else {
      // Brez refunda
      refundPercent = 0
    }

    // Prilagodi glede na kdo prekliče
    if (cancelledBy === 'host' || cancelledBy === 'system') {
      // Host ali system preklic = popoln refund
      refundPercent = 100
    }

    // Izračunaj zneske
    const refundAmount = reservation.totalPrice.applyDiscount(100 - refundPercent)
    const cancellationFee = reservation.totalPrice.subtract(refundAmount)

    return { refundAmount, cancellationFee }
  }

  /**
   * Dobi cancellation policy za property
   */
  private getPropertyCancellationPolicy(property: Property): CancellationPolicy {
    // TODO: Preberi iz property policies
    // Za zdaj uporabi default moderate policy
    return {
      type: 'moderate',
      fullRefundDays: 7,    // 7 dni pred check-in
      partialRefundDays: 3, // 3 dni pred check-in
      partialRefundPercent: 50 // 50% refund
    }
  }

  /**
   * Kdo prekliče (private property za tracking)
   */
  private cancelledBy: 'guest' | 'host' | 'system' = 'guest'
}
