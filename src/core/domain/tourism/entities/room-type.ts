/**
 * Domain Entity: RoomType
 * 
 * Tip sobe (npr. Standard, Deluxe, Suite).
 * Definira lastnosti in kapacitete tipa sobe.
 */

import { Money } from '../shared/value-objects/money'

export type RoomTypeCategory = 'standard' | 'deluxe' | 'suite' | 'studio' | 'penthouse'
export type BedType = 'single' | 'double' | 'queen' | 'king' | 'twin' | 'sofa_bed'

export interface RoomTypeData {
  id: string
  name: string
  description: string
  category: RoomTypeCategory
  baseRate: Money
  maxOccupancy: number
  bedTypes: BedType[]
  numberOfBeds: number
  size: number // m²
  amenities: string[]
  photos: string[]
  active: boolean
}

export class RoomType {
  public readonly id: string
  public name: string
  public description: string
  public readonly category: RoomTypeCategory
  public baseRate: Money
  public readonly maxOccupancy: number
  public readonly bedTypes: BedType[]
  public readonly numberOfBeds: number
  public readonly size: number
  public readonly amenities: string[]
  public photos: string[]
  public active: boolean

  constructor(data: RoomTypeData) {
    this.id = data.id
    this.name = data.name
    this.description = data.description
    this.category = data.category
    this.baseRate = data.baseRate
    this.maxOccupancy = data.maxOccupancy
    this.bedTypes = data.bedTypes
    this.numberOfBeds = data.numberOfBeds
    this.size = data.size
    this.amenities = data.amenities
    this.photos = data.photos
    this.active = data.active ?? true
  }

  /**
   * Preveri ali tip sobe lahko accommodira določeno število gostov
   */
  canAccommodate(guests: number): boolean {
    return guests <= this.maxOccupancy
  }

  /**
   * Preveri ali ima tip sobe določen amenity
   */
  hasAmenity(amenity: string): boolean {
    return this.amenities.includes(amenity)
  }

  /**
   * Izračunaj ceno za obdobje z dinamičnim prilagajanjem
   */
  calculatePrice(nights: number, occupancy: number): Money {
    let total = this.baseRate.multiply(nights)

    // Dodatek za dodatne goste (če je več kot 2)
    if (occupancy > 2) {
      const extraGuests = occupancy - 2
      const extraGuestRate = new Money(extraGuests * 15, 'EUR') // €15 na ekstra gosta/noč
      total = total.add(extraGuestRate.multiply(nights))
    }

    return total
  }

  /**
   * Aktiviraj tip sobe
   */
  activate(): void {
    this.active = true
  }

  /**
   * Deaktiviraj tip sobe
   */
  deactivate(): void {
    this.active = false
  }

  /**
   * Posodobi base rate
   */
  updateBaseRate(newRate: Money): void {
    this.baseRate = newRate
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
   * Odstrani amenity
   */
  removeAmenity(amenity: string): boolean {
    const index = this.amenities.indexOf(amenity)
    if (index !== -1) {
      this.amenities.splice(index, 1)
      return true
    }
    return false
  }

  /**
   * Pretvori v Plain Object
   */
  toObject(): RoomTypeData {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      category: this.category,
      baseRate: this.baseRate,
      maxOccupancy: this.maxOccupancy,
      bedTypes: this.bedTypes,
      numberOfBeds: this.numberOfBeds,
      size: this.size,
      amenities: this.amenities,
      photos: this.photos,
      active: this.active
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
   * Ustvari iz JSON
   */
  static fromJSON(json: any): RoomType {
    return new RoomType({
      ...json,
      baseRate: Money.fromJSON(json.baseRate)
    })
  }

  /**
   * Ustvari nov RoomType
   */
  static create(data: Omit<RoomTypeData, 'id'>): RoomType {
    return new RoomType({
      ...data,
      id: `rt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    })
  }
}
