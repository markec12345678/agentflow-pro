/**
 * Domain Entity: Property
 * 
 * Predstavlja nastanitev (hotel, apartma, hišo) v sistemu.
 * Vsebuje osnovne informacije, cene, in pravila.
 */

import { Money } from '../shared/value-objects/money'
import { Address } from '../shared/value-objects/address'

export type PropertyType = 'hotel' | 'apartment' | 'house' | 'room' | 'resort'
export type PropertyStatus = 'active' | 'inactive' | 'archived' | 'draft'

export interface PropertyData {
  id: string
  name: string
  type: PropertyType
  status: PropertyStatus
  address: Address
  description: string
  baseRate: Money
  amenities: string[]
  rooms: Room[]
  policies: PropertyPolicy[]
}

export interface Room {
  id: string
  name: string
  type: string
  maxOccupancy: number
  baseRate: Money
  amenities: string[]
}

export interface PropertyPolicy {
  id: string
  type: 'cancellation' | 'check_in' | 'check_out' | 'pets' | 'smoking'
  description: string
  active: boolean
}

export class Property {
  public readonly id: string
  public name: string
  public readonly type: PropertyType
  public status: PropertyStatus
  public readonly address: Address
  public description: string
  public baseRate: Money
  public readonly amenities: string[]
  public rooms: Room[]
  public policies: PropertyPolicy[]

  constructor(data: PropertyData) {
    this.id = data.id
    this.name = data.name
    this.type = data.type
    this.status = data.status
    this.address = data.address
    this.description = data.description
    this.baseRate = data.baseRate
    this.amenities = data.amenities
    this.rooms = data.rooms
    this.policies = data.policies
  }

  /**
   * Preveri ali je property na voljo za določene datume
   */
  isAvailable(checkIn: Date, checkOut: Date, guests: number): boolean {
    // TODO: Implement availability check
    // Preveri ali ima vsaj ena soba kapaciteto in je na voljo
    return this.rooms.some(room => 
      room.maxOccupancy >= guests
      // TODO: Check room availability for dates
    )
  }

  /**
   * Izračuna ceno za obdobje
   */
  calculatePrice(checkIn: Date, checkOut: Date, guests: number): Money {
    // TODO: Use CalculatePrice use case
    const nights = Math.ceil(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
    )
    return this.baseRate.multiply(nights)
  }

  /**
   * Dobi base rate
   */
  getBaseRate(): Money {
    return this.baseRate
  }

  /**
   * Posodobi base rate
   */
  updateBaseRate(newRate: Money): void {
    this.baseRate = newRate
  }

  /**
   * Dodaj sobo
   */
  addRoom(room: Room): void {
    this.rooms.push(room)
  }

  /**
   * Odstrani sobo
   */
  removeRoom(roomId: string): boolean {
    const index = this.rooms.findIndex(r => r.id === roomId)
    if (index !== -1) {
      this.rooms.splice(index, 1)
      return true
    }
    return false
  }

  /**
   * Najdi sobo po ID-ju
   */
  findRoom(roomId: string): Room | null {
    return this.rooms.find(r => r.id === roomId) || null
  }

  /**
   * Dobi sobe s kapaciteto za določeno število gostov
   */
  getRoomsForGuests(guests: number): Room[] {
    return this.rooms.filter(room => room.maxOccupancy >= guests)
  }

  /**
   * Preveri ali ima property določen amenity
   */
  hasAmenity(amenity: string): boolean {
    return this.amenities.includes(amenity)
  }

  /**
   * Dodaj amenity
   */
  addAmenity(amenity: string): void {
    if (!this.amenities.includes(amenity)) {
      this.amenities.push(amenity)
    }
  }

  /**
   * Aktiviraj property
   */
  activate(): void {
    this.status = 'active'
  }

  /**
   * Deaktiviraj property
   */
  deactivate(): void {
    this.status = 'inactive'
  }

  /**
   * Arhiviraj property
   */
  archive(): void {
    this.status = 'archived'
  }

  /**
   * Pretvori v Plain Object (za serializacijo)
   */
  toObject(): PropertyData {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      status: this.status,
      address: this.address,
      description: this.description,
      baseRate: this.baseRate,
      amenities: this.amenities,
      rooms: this.rooms,
      policies: this.policies
    }
  }

  /**
   * Pretvori v JSON
   */
  toJSON(): any {
    return {
      ...this.toObject(),
      baseRate: this.baseRate.toJSON()
    }
  }

  /**
   * Ustavi iz JSON
   */
  static fromJSON(json: any): Property {
    return new Property({
      ...json,
      baseRate: Money.fromJSON(json.baseRate)
    })
  }
}
