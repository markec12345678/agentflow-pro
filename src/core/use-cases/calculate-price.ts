/**
 * Use Case: Calculate Price
 * 
 * Izračuna ceno za rezervacijo na podlagi:
 * - Base rate property-ja
 * - Sezonskih cen
 * - Pravil za popuste
 * - Dinamičnih prilagoditev
 */

import { Property } from '../tourism/entities/property'
import { DateRange } from '../shared/value-objects/date-range'
import { Money } from '../shared/value-objects/money'

// ============================================================================
// Input/Output DTOs
// ============================================================================

export interface CalculatePriceInput {
  property: Property
  checkIn: Date
  checkOut: Date
  guests: number
  couponCode?: string
}

export interface CalculatePriceOutput {
  basePrice: Money
  seasonalAdjustment: Money
  discounts: Money
  taxes: Money
  totalPrice: Money
  breakdown: PriceBreakdown
  nights: number
}

export interface PriceBreakdown {
  nightlyRates: Array<{
    date: Date
    rate: Money
    season: 'high' | 'mid' | 'low' | 'base'
  }>
  appliedDiscounts: Array<{
    type: string
    amount: Money
    description: string
  }>
}

// ============================================================================
// Use Case Class
// ============================================================================

export class CalculatePrice {
  /**
   * Izračuna skupno ceno za rezervacijo
   */
  execute(input: CalculatePriceInput): CalculatePriceOutput {
    const { property, checkIn, checkOut, guests } = input
    const dateRange = new DateRange(checkIn, checkOut)
    const nights = dateRange.nights()

    // 1. Izračunaj base ceno
    const basePrice = this.calculateBasePrice(property, dateRange)

    // 2. Uporabi sezonske prilagoditve
    const seasonalAdjustment = this.calculateSeasonalAdjustment(property, dateRange)

    // 3. Izračunaj popuste
    const discounts = this.calculateDiscounts(property, dateRange, guests, basePrice)

    // 4. Izračunaj takse
    const taxes = this.calculateTaxes(property, basePrice, guests, nights)

    // 5. Izračunaj končno ceno
    const totalPrice = basePrice
      .add(seasonalAdjustment)
      .subtract(discounts)
      .add(taxes)

    // 6. Sestavi breakdown
    const breakdown = this.createBreakdown(property, dateRange, basePrice, discounts)

    return {
      basePrice,
      seasonalAdjustment,
      discounts,
      taxes,
      totalPrice,
      breakdown,
      nights
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private calculateBasePrice(property: Property, dateRange: DateRange): Money {
    const baseRate = property.getBaseRate()
    const nights = dateRange.nights()
    return baseRate.multiply(nights)
  }

  private calculateSeasonalAdjustment(
    property: Property,
    dateRange: DateRange
  ): Money {
    // TODO: Implement seasonal pricing logic
    // Za zdaj vrni 0
    return Money.zero('EUR')
  }

  private calculateDiscounts(
    property: Property,
    dateRange: DateRange,
    guests: number,
    basePrice: Money
  ): Money {
    let totalDiscount = Money.zero('EUR')

    // Long stay discount
    const nights = dateRange.nights()
    if (nights >= 7) {
      const discount = basePrice.applyDiscount(15) // 15% popust za 7+ noči
      totalDiscount = totalDiscount.add(discount)
    } else if (nights >= 3) {
      const discount = basePrice.applyDiscount(5) // 5% popust za 3+ noči
      totalDiscount = totalDiscount.add(discount)
    }

    // Early bird discount (če je rezervirano 60+ dni vnaprej)
    const daysUntilCheckIn = Math.ceil(
      (dateRange.start.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    )
    if (daysUntilCheckIn >= 60) {
      const discount = basePrice.applyDiscount(10) // 10% early bird
      totalDiscount = totalDiscount.add(discount)
    }

    return totalDiscount
  }

  private calculateTaxes(
    property: Property,
    basePrice: Money,
    guests: number,
    nights: number
  ): Money {
    // Tourist tax (example: €2 per person per night)
    const touristTaxRate = 2.00
    const touristTax = new Money(touristTaxRate * guests * nights)
    
    // VAT (example: 10%)
    const vatRate = 0.10
    const vat = basePrice.multiply(vatRate)

    return touristTax.add(vat)
  }

  private createBreakdown(
    property: Property,
    dateRange: DateRange,
    basePrice: Money,
    discounts: Money
  ): PriceBreakdown {
    // TODO: Implement detailed breakdown
    return {
      nightlyRates: [],
      appliedDiscounts: []
    }
  }
}
