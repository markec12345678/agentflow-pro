/**
 * Domain Entity: Room
 * 
 * Predstavlja posamezno sobo v property-ju.
 * Vsebuje informacije o lokaciji, kapaciteti, amenities in statusu.
 */

import { Money } from '../shared/value-objects/money'

export type RoomStatus = 'available' | 'occupied' | 'blocked' | 'maintenance' | 'out_of_order'
export type RoomCategory = 'standard' | 'deluxe' | 'suite' | 'penthouse' | 'studio'

export interface RoomType {
  id: string
  name: string
  category: RoomCategory
  maxOccupancy: number
  bedType: 'single' | 'double' | 'queen' | 'king' | 'twin' | 'sofa_bed'
  numberOfBeds: number
  size: number // m²
  baseRate: Money
  description?: string
  amenities: string[]
}

export interface RoomData {
  id: string
  number: string
  propertyId: string
  floor: string
  typeId: string
  type: RoomType
  status: RoomStatus
  view?: 'sea' | 'mountain' | 'city' | 'garden' | 'pool'
  accessible?: boolean
  smoking?: boolean
  connectingRooms?: string[]
  amenities: string[]
  notes?: string
  lastCleanedAt?: Date
  lastInspectedAt?: Date
}

export class Room {
  public readonly id: string
  public readonly number: string
  public readonly propertyId: string
  public readonly floor: string
  public readonly typeId: string
  public readonly type: RoomType
  public status: RoomStatus
  public readonly view?: 'sea' | 'mountain' | 'city' | 'garden' | 'pool'
  public readonly accessible?: boolean
  public readonly smoking?: boolean
  public readonly connectingRooms?: string[]
  public readonly amenities: string[]
  public notes?: string
  public lastCleanedAt?: Date
  public lastInspectedAt?: Date

  constructor(data: RoomData) {
    this.id = data.id
    this.number = data.number
    this.propertyId = data.propertyId
    this.floor = data.floor
    this.typeId = data.typeId
    this.type = data.type
    this.status = data.status
    this.view = data.view
    this.accessible = data.accessible
    this.smoking = data.smoking
    this.connectingRooms = data.connectingRooms
    this.amenities = data.amenities
    this.notes = data.notes
    this.lastCleanedAt = data.lastCleanedAt
    this.lastInspectedAt = data.lastInspectedAt
  }

  /**
   * Preveri ali je soba na voljo za datume
   */
  isAvailable(checkIn: Date, checkOut: Date): boolean {
    return this.status === 'available'
  }

  /**
   * Označi sobo kot zasedeno
   */
  markAsOccupied(): void {
    if (this.status === 'available') {
      this.status = 'occupied'
    }
  }

  /**
   * Označi sobo kot na voljo
   */
  markAsAvailable(): void {
    if (this.status === 'occupied') {
      this.status = 'available'
    }
  }

  /**
   * Označi sobo kot blokirano
   */
  markAsBlocked(reason?: string): void {
    this.status = 'blocked'
    if (reason) {
      this.notes = reason
    }
  }

  /**
   * Označi sobo za maintenance
   */
  markAsMaintenance(reason: string): void {
    this.status = 'maintenance'
    this.notes = reason
  }

  /**
   * Označi sobo kot out of order
   */
  markAsOutOfOrder(reason: string): void {
    this.status = 'out_of_order'
    this.notes = reason
  }

  /**
   * Posodobi status čiščenja
   */
  markAsCleaned(): void {
    this.lastCleanedAt = new Date()
    if (this.status === 'maintenance') {
      this.status = 'available'
    }
  }

  /**
   * Preveri ali ima soba določen amenity
   */
  hasAmenity(amenity: string): boolean {
    return this.amenities.includes(amenity)
  }

  /**
   * Preveri ali je soba accessible
   */
  isAccessible(): boolean {
    return this.accessible === true
  }

  /**
   * Preveri kapaciteto sobe
   */
  canAccommodate(guests: number): boolean {
    return this.type.maxOccupancy >= guests
  }

  /**
   * Izračunaj ceno za obdobje
   */
  calculatePrice(nights: number): Money {
    return this.type.baseRate.multiply(nights)
  }

  /**
   * Preveri ali ima soba želeni view
   */
  hasView(view: string): boolean {
    return this.view === view
  }

  /**
   * Preveri ali je soba na želenem floor-u
   */
  isOnFloor(floor: 'low' | 'high'): boolean {
    const floorNum = parseInt(this.floor)
    return floor === 'high' ? floorNum > 3 : floorNum <= 3
  }

  /**
   * Generiraj opis sobe
   */
  generateDescription(): string {
    const parts: string[] = []

    // Room type
    parts.push(`${this.type.name}`)

    // View
    if (this.view) {
      parts.push(`${this.view} view`)
    }

    // Floor
    parts.push(`Floor ${this.floor}`)

    // Size
    parts.push(`${this.type.size}m²`)

    // Amenities
    if (this.amenities.length > 0) {
      parts.push(this.amenities.slice(0, 3).join(', '))
    }

    return parts.join(' • ')
  }

  /**
   * Pretvori v Plain Object
   */
  toObject(): RoomData {
    return {
      id: this.id,
      number: this.number,
      propertyId: this.propertyId,
      floor: this.floor,
      typeId: this.typeId,
      type: this.type,
      status: this.status,
      view: this.view,
      accessible: this.accessible,
      smoking: this.smoking,
      connectingRooms: this.connectingRooms,
      amenities: this.amenities,
      notes: this.notes,
      lastCleanedAt: this.lastCleanedAt,
      lastInspectedAt: this.lastInspectedAt
    }
  }

  /**
   * Pretvori v JSON
   */
  toJSON(): any {
    return {
      ...this.toObject(),
      type: {
        ...this.type,
        baseRate: this.type.baseRate.toJSON()
      },
      lastCleanedAt: this.lastCleanedAt?.toISOString(),
      lastInspectedAt: this.lastInspectedAt?.toISOString()
    }
  }

  /**
   * Ustvari iz JSON
   */
  static fromJSON(json: any): Room {
    return new Room({
      ...json,
      type: {
        ...json.type,
        baseRate: Money.fromJSON(json.type.baseRate)
      }
    })
  }

  /**
   * Ustvari novo sobo
   */
  static create(data: Omit<RoomData, 'id'>): Room {
    return new Room({
      ...data,
      id: `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: data.status || 'available'
    })
  }
}
