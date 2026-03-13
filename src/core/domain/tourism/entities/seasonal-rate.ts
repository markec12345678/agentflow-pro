/**
 * Domain Entity: SeasonalRate
 * 
 * Sezonske cene za property ali room type.
 * Omogoča dinamično prilagajanje cen glede na sezono, dogodke, povpraševanje.
 */

import { Money } from '../shared/value-objects/money'

export type SeasonType = 'low' | 'mid' | 'high' | 'peak' | 'event'
export type PricingStrategy = 'fixed' | 'percentage' | 'dynamic'

export interface SeasonalRateData {
  id: string
  propertyId: string
  roomTypeId?: string
  name: string
  type: SeasonType
  strategy: PricingStrategy
  startDate: Date
  endDate: Date
  baseRate: Money
  adjustment: number // percentage or fixed amount
  minStay?: number
  maxStay?: number
  advancePurchase?: number // days before check-in
  isActive: boolean
  rules?: {
    weekendSurcharge?: number
    holidaySurcharge?: number
    lastMinuteDiscount?: number
    earlyBirdDiscount?: number
  }
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt?: Date
}

export class SeasonalRate {
  public readonly id: string
  public readonly propertyId: string
  public readonly roomTypeId?: string
  public name: string
  public readonly type: SeasonType
  public readonly strategy: PricingStrategy
  public readonly startDate: Date
  public readonly endDate: Date
  public baseRate: Money
  public adjustment: number
  public minStay?: number
  public maxStay?: number
  public advancePurchase?: number
  public isActive: boolean
  public rules?: {
    weekendSurcharge?: number
    holidaySurcharge?: number
    lastMinuteDiscount?: number
    earlyBirdDiscount?: number
  }
  public metadata?: Record<string, any>
  public readonly createdAt: Date
  public updatedAt?: Date

  constructor(data: SeasonalRateData) {
    this.id = data.id
    this.propertyId = data.propertyId
    this.roomTypeId = data.roomTypeId
    this.name = data.name
    this.type = data.type
    this.strategy = data.strategy
    this.startDate = data.startDate
    this.endDate = data.endDate
    this.baseRate = data.baseRate
    this.adjustment = data.adjustment
    this.minStay = data.minStay
    this.maxStay = data.maxStay
    this.advancePurchase = data.advancePurchase
    this.isActive = data.isActive ?? true
    this.rules = data.rules
    this.metadata = data.metadata
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
  }

  /**
   * Preveri ali je datum v sezoni
   */
  includesDate(date: Date): boolean {
    return date >= this.startDate && date <= this.endDate
  }

  /**
   * Izračunaj ceno za datum
   */
  calculatePrice(date: Date, nights: number = 1): Money {
    if (!this.includesDate(date)) {
      return this.baseRate.multiply(nights)
    }

    let finalRate = this.baseRate.amount

    // Apply adjustment based on strategy
    if (this.strategy === 'percentage') {
      finalRate = finalRate * (1 + this.adjustment / 100)
    } else if (this.strategy === 'fixed') {
      finalRate = finalRate + this.adjustment
    }

    // Apply weekend surcharge
    if (this.rules?.weekendSurcharge) {
      const dayOfWeek = date.getDay()
      if (dayOfWeek === 5 || dayOfWeek === 6) { // Friday or Saturday
        finalRate = finalRate * (1 + this.rules.weekendSurcharge / 100)
      }
    }

    // Apply holiday surcharge
    if (this.rules?.holidaySurcharge && this.isHoliday(date)) {
      finalRate = finalRate * (1 + this.rules.holidaySurcharge / 100)
    }

    // Apply last minute discount
    if (this.rules?.lastMinuteDiscount) {
      const daysUntilCheckIn = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      if (daysUntilCheckIn <= 7) {
        finalRate = finalRate * (1 - this.rules.lastMinuteDiscount / 100)
      }
    }

    // Apply early bird discount
    if (this.rules?.earlyBirdDiscount && this.advancePurchase) {
      const daysUntilCheckIn = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      if (daysUntilCheckIn >= this.advancePurchase) {
        finalRate = finalRate * (1 - this.rules.earlyBirdDiscount / 100)
      }
    }

    return new Money(finalRate * nights, this.baseRate.currency)
  }

  /**
   * Izračunaj povprečno ceno za obdobje
   */
  calculateAveragePrice(startDate: Date, endDate: Date): Money {
    const nights = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    let totalPrice = 0

    for (let i = 0; i < nights; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      totalPrice += this.calculatePrice(date).amount
    }

    return new Money(totalPrice / nights, this.baseRate.currency)
  }

  /**
   * Preveri ali je sezona aktivna
   */
  isActiveForDate(date: Date): boolean {
    return this.isActive && this.includesDate(date)
  }

  /**
   * Posodobi adjustment
   */
  updateAdjustment(adjustment: number, strategy: PricingStrategy): void {
    this.adjustment = adjustment
    this.strategy = strategy
    this.updatedAt = new Date()
  }

  /**
   * Aktiviraj sezono
   */
  activate(): void {
    this.isActive = true
    this.updatedAt = new Date()
  }

  /**
   * Deaktiviraj sezono
   */
  deactivate(): void {
    this.isActive = false
    this.updatedAt = new Date()
  }

  /**
   * Podaljšaj sezono
   */
  extend(days: number): void {
    const newEndDate = new Date(this.endDate)
    newEndDate.setDate(newEndDate.getDate() + days)
    this.endDate = newEndDate
    this.updatedAt = new Date()
  }

  /**
   * Generiraj opis sezone
   */
  generateDescription(): string {
    const parts: string[] = []

    // Name
    parts.push(this.name)

    // Type
    parts.push(this.getTypeLabel())

    // Duration
    const days = this.durationInDays()
    parts.push(`${days} days`)

    // Base rate
    parts.push(`From ${this.baseRate.toString()}`)

    // Strategy
    if (this.strategy === 'percentage') {
      parts.push(`${this.adjustment > 0 ? '+' : ''}${this.adjustment}%`)
    } else if (this.strategy === 'fixed') {
      parts.push(`${this.adjustment > 0 ? '+' : ''}${this.adjustment}`)
    }

    return parts.join(' • ')
  }

  /**
   * Izračunaj trajanje v dnevih
   */
  durationInDays(): number {
    const diffTime = this.endDate.getTime() - this.startDate.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  }

  /**
   * Pretvori v Plain Object
   */
  toObject(): SeasonalRateData {
    return {
      id: this.id,
      propertyId: this.propertyId,
      roomTypeId: this.roomTypeId,
      name: this.name,
      type: this.type,
      strategy: this.strategy,
      startDate: this.startDate,
      endDate: this.endDate,
      baseRate: this.baseRate,
      adjustment: this.adjustment,
      minStay: this.minStay,
      maxStay: this.maxStay,
      advancePurchase: this.advancePurchase,
      isActive: this.isActive,
      rules: this.rules,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }
  }

  /**
   * Pretvori v JSON
   */
  toJSON(): any {
    return {
      ...this.toObject(),
      baseRate: this.baseRate.toJSON(),
      startDate: this.startDate.toISOString(),
      endDate: this.endDate.toISOString(),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt?.toISOString()
    }
  }

  /**
   * Ustvari iz JSON
   */
  static fromJSON(json: any): SeasonalRate {
    return new SeasonalRate({
      ...json,
      baseRate: Money.fromJSON(json.baseRate),
      startDate: new Date(json.startDate),
      endDate: new Date(json.endDate),
      createdAt: new Date(json.createdAt),
      updatedAt: json.updatedAt ? new Date(json.updatedAt) : undefined
    })
  }

  /**
   * Ustvari novo sezonsko ceno
   */
  static create(data: Omit<SeasonalRateData, 'id' | 'createdAt'>): SeasonalRate {
    return new SeasonalRate({
      ...data,
      id: `season_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date()
    })
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private getTypeLabel(): string {
    const labels: Record<SeasonType, string> = {
      low: 'Low Season',
      mid: 'Mid Season',
      high: 'High Season',
      peak: 'Peak Season',
      event: 'Special Event'
    }
    return labels[this.type] || this.type
  }

  private isHoliday(date: Date): boolean {
    // Simplified holiday check
    const month = date.getMonth() + 1
    const day = date.getDate()

    // Common holidays
    const holidays = [
      { month: 1, day: 1 },   // New Year
      { month: 12, day: 25 }, // Christmas
      { month: 12, day: 31 }, // New Year's Eve
    ]

    return holidays.some(h => h.month === month && h.day === day)
  }
}
