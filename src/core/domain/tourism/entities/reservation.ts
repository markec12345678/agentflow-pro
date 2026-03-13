/**
 * Domain Entity: Reservation
 * 
 * Predstavlja rezervacijo nastanitve.
 * Vsebuje informacije o gostu, datumih, ceni in statusu.
 */

import { Money } from '../shared/value-objects/money'
import { DateRange } from '../shared/value-objects/date-range'

export type ReservationStatus = 
  | 'pending'      // Čaka na potrditev
  | 'confirmed'    // Potrjena
  | 'checked_in'   // Gost je prijavljen
  | 'checked_out'  // Gost je odjavljen
  | 'cancelled'    // Preklicana
  | 'no_show'      // Gost se ni pojavil
  | 'completed'    // Zaključena

export type PaymentStatus =
  | 'unpaid'
  | 'partially_paid'
  | 'paid'
  | 'refunded'

export interface ReservationData {
  id: string
  propertyId: string
  guestId: string
  dateRange: DateRange
  guests: number
  status: ReservationStatus
  paymentStatus: PaymentStatus
  totalPrice: Money
  paidAmount: Money
  createdAt: Date
  updatedAt: Date
  notes?: string
  cancellationReason?: string
}

export class Reservation {
  public readonly id: string
  public readonly propertyId: string
  public readonly guestId: string
  public readonly dateRange: DateRange
  public readonly guests: number
  public status: ReservationStatus
  public paymentStatus: PaymentStatus
  public readonly totalPrice: Money
  public paidAmount: Money
  public readonly createdAt: Date
  public updatedAt: Date
  public notes?: string
  public cancellationReason?: string

  constructor(data: ReservationData) {
    this.id = data.id
    this.propertyId = data.propertyId
    this.guestId = data.guestId
    this.dateRange = data.dateRange
    this.guests = data.guests
    this.status = data.status
    this.paymentStatus = data.paymentStatus
    this.totalPrice = data.totalPrice
    this.paidAmount = data.paidAmount
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
    this.notes = data.notes
    this.cancellationReason = data.cancellationReason
  }

  /**
   * Preveri ali je rezervacija aktivna
   */
  isActive(): boolean {
    return ['pending', 'confirmed', 'checked_in'].includes(this.status)
  }

  /**
   * Preveri ali je rezervacija plačana
   */
  isPaid(): boolean {
    return this.paymentStatus === 'paid'
  }

  /**
   * Preveri ali je mogoče rezervacijo preklicati
   */
  canBeCancelled(): boolean {
    return ['pending', 'confirmed'].includes(this.status)
  }

  /**
   * Preveri ali je mogoče gostu check-in
   */
  canCheckIn(): boolean {
    return this.status === 'confirmed' && this.isPaid()
  }

  /**
   * Preveri ali je mogoče gostu check-out
   */
  canCheckOut(): boolean {
    return this.status === 'checked_in'
  }

  /**
   * Potrdi rezervacijo
   */
  confirm(): void {
    if (this.status !== 'pending') {
      throw new Error('Can only confirm pending reservations')
    }
    this.status = 'confirmed'
    this.updatedAt = new Date()
  }

  /**
   * Prekliči rezervacijo
   */
  cancel(reason: string): void {
    if (!this.canBeCancelled()) {
      throw new Error('This reservation cannot be cancelled')
    }
    this.status = 'cancelled'
    this.cancellationReason = reason
    this.updatedAt = new Date()
  }

  /**
   * Opravi check-in gosta
   */
  checkIn(): void {
    if (!this.canCheckIn()) {
      throw new Error('Cannot check in: reservation not ready')
    }
    this.status = 'checked_in'
    this.updatedAt = new Date()
  }

  /**
   * Opravi check-out gosta
   */
  checkOut(): void {
    if (!this.canCheckOut()) {
      throw new Error('Cannot check out: guest not checked in')
    }
    this.status = 'checked_out'
    this.updatedAt = new Date()
  }

  /**
   * Zaključi rezervacijo
   */
  complete(): void {
    if (this.status !== 'checked_out') {
      throw new Error('Can only complete after check-out')
    }
    this.status = 'completed'
    this.paymentStatus = 'paid'
    this.updatedAt = new Date()
  }

  /**
   * Posodobi plačilo
   */
  updatePayment(amount: Money): void {
    this.paidAmount = this.paidAmount.add(amount)
    
    if (this.paidAmount.equals(this.totalPrice)) {
      this.paymentStatus = 'paid'
    } else if (this.paidAmount.amount > 0) {
      this.paymentStatus = 'partially_paid'
    }
    
    this.updatedAt = new Date()
  }

  /**
   * Vrni znesek ki ga je še treba plačati
   */
  amountDue(): Money {
    return this.totalPrice.subtract(this.paidAmount)
  }

  /**
   * Preveri ali je rezervacija v prihodnosti
   */
  isUpcoming(): boolean {
    return this.dateRange.start > new Date()
  }

  /**
   * Preveri ali je rezervacija trenutno aktivna (gost je prijavljen)
   */
  isCurrent(): boolean {
    const now = new Date()
    return this.dateRange.contains(now) && this.status === 'checked_in'
  }

  /**
   * Preveri ali je rezervacija v preteklosti
   */
  isPast(): boolean {
    return this.dateRange.end < new Date()
  }

  /**
   * Izračuna število nočitev
   */
  nights(): number {
    return this.dateRange.nights()
  }

  /**
   * Izračuna ceno na noč
   */
  pricePerNight(): Money {
    const nights = this.nights()
    if (nights === 0) return Money.zero('EUR')
    return new Money(this.totalPrice.amount / nights, 'EUR')
  }

  /**
   * Dodaj opombo
   */
  addNote(note: string): void {
    this.notes = this.notes ? `${this.notes}\n${note}` : note
    this.updatedAt = new Date()
  }

  /**
   * Pretvori v Plain Object
   */
  toObject(): ReservationData {
    return {
      id: this.id,
      propertyId: this.propertyId,
      guestId: this.guestId,
      dateRange: this.dateRange,
      guests: this.guests,
      status: this.status,
      paymentStatus: this.paymentStatus,
      totalPrice: this.totalPrice,
      paidAmount: this.paidAmount,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      notes: this.notes,
      cancellationReason: this.cancellationReason
    }
  }

  /**
   * Pretvori v JSON
   */
  toJSON(): any {
    return {
      ...this.toObject(),
      dateRange: this.dateRange.toJSON(),
      totalPrice: this.totalPrice.toJSON(),
      paidAmount: this.paidAmount.toJSON()
    }
  }

  /**
   * Ustvari iz JSON
   */
  static fromJSON(json: any): Reservation {
    return new Reservation({
      ...json,
      dateRange: DateRange.fromJSON(json.dateRange),
      totalPrice: Money.fromJSON(json.totalPrice),
      paidAmount: Money.fromJSON(json.paidAmount),
      createdAt: new Date(json.createdAt),
      updatedAt: new Date(json.updatedAt)
    })
  }

  /**
   * Ustvari novo rezervacijo
   */
  static create(data: {
    id: string
    propertyId: string
    guestId: string
    checkIn: Date
    checkOut: Date
    guests: number
    totalPrice: Money
  }): Reservation {
    return new Reservation({
      id: data.id,
      propertyId: data.propertyId,
      guestId: data.guestId,
      dateRange: new DateRange(data.checkIn, data.checkOut),
      guests: data.guests,
      status: 'pending',
      paymentStatus: 'unpaid',
      totalPrice: data.totalPrice,
      paidAmount: Money.zero('EUR'),
      createdAt: new Date(),
      updatedAt: new Date()
    })
  }
}
