/**
 * Domain Entity: Availability
 * 
 * Razpoložljivost sobe za določene datume.
 * Upravlja z inventory-om in cenami za specifične datume.
 */

import { DateRange } from '../shared/value-objects/date-range'
import { Money } from '../shared/value-objects/money'

export type AvailabilityStatus = 'available' | 'booked' | 'blocked' | 'maintenance' | 'out_of_order'

export interface AvailabilityData {
  id: string
  roomId: string
  date: Date
  status: AvailabilityStatus
  baseRate: Money
  minStay: number
  maxStay: number
  closedToArrival: boolean
  closedToDeparture: boolean
  notes?: string
}

export class Availability {
  public readonly id: string
  public readonly roomId: string
  public readonly date: Date
  public status: AvailabilityStatus
  public baseRate: Money
  public minStay: number
  public maxStay: number
  public closedToArrival: boolean
  public closedToDeparture: boolean
  public notes?: string

  constructor(data: AvailabilityData) {
    this.id = data.id
    this.roomId = data.roomId
    this.date = data.date
    this.status = data.status
    this.baseRate = data.baseRate
    this.minStay = data.minStay ?? 1
    this.maxStay = data.maxStay ?? 30
    this.closedToArrival = data.closedToArrival ?? false
    this.closedToDeparture = data.closedToDeparture ?? false
    this.notes = data.notes
  }

  /**
   * Preveri ali je soba na voljo za check-in na ta dan
   */
  isAvailableForCheckIn(): boolean {
    return this.status === 'available' && !this.closedToArrival
  }

  /**
   * Preveri ali je soba na voljo za check-out na ta dan
   */
  isAvailableForCheckOut(): boolean {
    return this.status === 'available' && !this.closedToDeparture
  }

  /**
   * Preveri ali je soba na voljo za bivanje
   */
  isAvailable(): boolean {
    return this.status === 'available'
  }

  /**
   * Rezerviraj sobo (spremeni status v booked)
   */
  book(): void {
    if (this.status !== 'available') {
      throw new Error(`Cannot book room with status: ${this.status}`)
    }
    this.status = 'booked'
  }

  /**
   * Sprosti sobo (spremeni status nazaj v available)
   */
  release(): void {
    if (this.status === 'booked') {
      this.status = 'available'
    }
  }

  /**
   * Blokiraj sobo (npr. za maintenance)
   */
  block(reason?: string): void {
    this.status = 'blocked'
    if (reason) {
      this.notes = reason
    }
  }

  /**
   * Posodobi ceno za ta dan
   */
  updateRate(newRate: Money): void {
    this.baseRate = newRate
  }

  /**
   * Nastavi omejitve bivanja
   */
  setStayRestrictions(minStay: number, maxStay: number): void {
    this.minStay = minStay
    this.maxStay = maxStay
  }

  /**
   * Preveri ali datum ustreza omejitvam bivanja
   */
  meetsStayRequirements(nights: number): boolean {
    return nights >= this.minStay && nights <= this.maxStay
  }

  /**
   * Pretvori v Plain Object
   */
  toObject(): AvailabilityData {
    return {
      id: this.id,
      roomId: this.roomId,
      date: this.date,
      status: this.status,
      baseRate: this.baseRate,
      minStay: this.minStay,
      maxStay: this.maxStay,
      closedToArrival: this.closedToArrival,
      closedToDeparture: this.closedToDeparture,
      notes: this.notes
    }
  }

  /**
   * Pretvori v JSON
   */
  toJSON(): any {
    return {
      ...this.toObject(),
      baseRate: this.baseRate.toJSON(),
      date: this.date.toISOString()
    }
  }

  /**
   * Ustvari iz JSON
   */
  static fromJSON(json: any): Availability {
    return new Availability({
      ...json,
      baseRate: Money.fromJSON(json.baseRate),
      date: new Date(json.date)
    })
  }

  /**
   * Ustvari novo Availability za danes
   */
  static createForToday(roomId: string, baseRate: Money): Availability {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return new Availability({
      id: `avail_${roomId}_${today.toISOString().split('T')[0]}`,
      roomId,
      date: today,
      status: 'available',
      baseRate,
      minStay: 1,
      maxStay: 30,
      closedToArrival: false,
      closedToDeparture: false
    })
  }
}
