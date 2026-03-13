/**
 * Use Case: Create Reservation
 *
 * Ustvari novo rezervacijo za gosta.
 * Preveri razpoložljivost, izračuna ceno, ustvari rezervacijo.
 */

import { Property } from '../tourism/entities/property'
import { Reservation } from '../tourism/entities/reservation'
import { Guest } from '../guest/entities/guest'
import { DateRange } from '../shared/value-objects/date-range'
import { Money } from '../shared/value-objects/money'
import { CalculatePrice } from './calculate-price'
import { ReservationCreated } from '../domain/tourism/events/reservation-events'
import type { EventBus } from '../domain/shared/events/domain-event'

// ============================================================================
// Input/Output DTOs
// ============================================================================

export interface CreateReservationInput {
  propertyId: string
  property: Property
  guestId: string
  guest: Guest
  checkIn: Date
  checkOut: Date
  guests: number
  notes?: string
  specialRequests?: string[]
}

export interface CreateReservationOutput {
  reservation: Reservation
  confirmationCode: string
  totalPrice: Money
  amountDue: Money
}

// ============================================================================
// Use Case Class
// ============================================================================

export class CreateReservation {
  constructor(
    private eventBus?: EventBus  // Optional for backward compatibility
  ) {}

  /**
   * Ustvari novo rezervacijo
   */
  async execute(input: CreateReservationInput): Promise<CreateReservationOutput> {
    const {
      property,
      guest,
      checkIn,
      checkOut,
      guests,
      notes,
      specialRequests
    } = input

    // 1. Validacija input-a
    this.validateInput(input)

    // 2. Preveri razpoložljivost
    const isAvailable = property.isAvailable(checkIn, checkOut, guests)
    if (!isAvailable) {
      throw new Error('Property not available for selected dates')
    }

    // 3. Izračunaj ceno
    const priceCalculation = new CalculatePrice()
    const priceResult = priceCalculation.execute({
      property,
      checkIn,
      checkOut,
      guests
    })

    // 4. Ustvari rezervacijo
    const reservation = Reservation.create({
      id: this.generateReservationId(),
      propertyId: property.id,
      guestId: guest.id,
      checkIn,
      checkOut,
      guests,
      totalPrice: priceResult.totalPrice
    })

    // 5. Dodaj opombe in posebne zahteve
    if (notes) {
      reservation.addNote(notes)
    }

    if (specialRequests) {
      specialRequests.forEach(request => {
        guest.addSpecialRequest(request)
      })
    }

    // 6. Generiraj confirmation code
    const confirmationCode = this.generateConfirmationCode()

    // 7. Zabeleži v guest zgodovino (če bi imeli repository)
    // guest.recordStay(priceResult.totalPrice)

    // 8. Objavi dogodek
    if (this.eventBus) {
      const event = new ReservationCreated(
        reservation.id,
        property.id,
        guest.id,
        checkIn,
        checkOut,
        guests,
        priceResult.totalPrice
      )
      await this.eventBus.publish(event)
    }

    return {
      reservation,
      confirmationCode,
      totalPrice: priceResult.totalPrice,
      amountDue: reservation.amountDue()
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Validiraj input podatke
   */
  private validateInput(input: CreateReservationInput): void {
    const { checkIn, checkOut, guests } = input

    if (checkIn >= checkOut) {
      throw new Error('Check-in date must be before check-out date')
    }

    if (guests <= 0) {
      throw new Error('Number of guests must be positive')
    }

    if (checkIn < new Date()) {
      throw new Error('Check-in date cannot be in the past')
    }

    // Preveri minimalno dolžino bivanja (npr. 2 noči)
    const dateRange = new DateRange(checkIn, checkOut)
    if (dateRange.nights() < 2) {
      throw new Error('Minimum stay is 2 nights')
    }

    // Preveri maksimalno dolžino bivanja (npr. 30 noči)
    if (dateRange.nights() > 30) {
      throw new Error('Maximum stay is 30 nights')
    }
  }

  /**
   * Generiraj unikaten ID za rezervacijo
   */
  private generateReservationId(): string {
    return `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Generiraj confirmation code za gosta
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
