/**
 * Use Case: Confirm Reservation
 * 
 * Potrdi rezervacijo.
 * Pošlje confirmation email in posodobi koledar.
 */

import { Reservation } from '../tourism/entities/reservation'
import { Property } from '../tourism/entities/property'
import { Guest } from '../guest/entities/guest'
import { ReservationConfirmed } from '../tourism/events/reservation-events'

// ============================================================================
// Input/Output DTOs
// ============================================================================

export interface ConfirmReservationInput {
  reservation: Reservation
  property: Property
  guest: Guest
}

export interface ConfirmReservationOutput {
  reservation: Reservation
  confirmationCode: string
  event: ReservationConfirmed
}

// ============================================================================
// Use Case Class
// ============================================================================

export class ConfirmReservation {
  /**
   * Potrdi rezervacijo
   */
  async execute(input: ConfirmReservationInput): Promise<ConfirmReservationOutput> {
    const { reservation, property, guest } = input

    // 1. Validacija
    this.validateConfirmation(reservation)

    // 2. Posodobi status rezervacije
    reservation.confirm()

    // 3. Generiraj confirmation code (če še ni)
    const confirmationCode = this.generateConfirmationCode()

    // 4. Ustvari dogodek
    const event = new ReservationConfirmed(
      reservation.id,
      new Date()
    )

    // 5. Pripravi podatke za notification
    const notificationData = {
      guest,
      property,
      reservation,
      confirmationCode
    }

    // TODO: Pošlji confirmation email
    // await sendConfirmationEmail(notificationData)

    // TODO: Posodobi koledar
    // await updateCalendar({ propertyId: property.id, dates: reservation.dateRange, status: 'booked' })

    return {
      reservation,
      confirmationCode,
      event
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Validiraj ali se rezervacija lahko potrdi
   */
  private validateConfirmation(reservation: Reservation): void {
    if (reservation.status !== 'pending') {
      throw new Error('Only pending reservations can be confirmed')
    }

    if (!reservation.isPaid() && reservation.paymentStatus !== 'partially_paid') {
      throw new Error('Reservation must be at least partially paid before confirmation')
    }
  }

  /**
   * Generiraj confirmation code
   */
  private generateConfirmationCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Brez I, O, 1, 0
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }
}
