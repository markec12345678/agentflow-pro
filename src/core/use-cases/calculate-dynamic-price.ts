/**
 * Use Case: Calculate Dynamic Price
 * 
 * Dinamični izračun cene na podlagi:
 * - Base rate
 * - Sezonske cene
 * - Povpraševanje (occupancy rate)
 * - Konkurenčne cene
 * - Dogodki v okolici
 * - Lead time (days before check-in)
 */

import { Money } from '../shared/value-objects/money'
import { SeasonalRate } from '../domain/tourism/entities/seasonal-rate'

// ============================================================================
// Input/Output DTOs
// ============================================================================

export interface CalculateDynamicPriceInput {
  propertyId: string
  roomTypeId?: string
  checkIn: Date
  checkOut: Date
  guests: number
  baseRate: Money
  seasonalRates?: SeasonalRate[]
  competitorRates?: CompetitorRate[]
  occupancyRate?: number
  demandLevel?: 'low' | 'medium' | 'high' | 'very_high'
  events?: LocalEvent[]
  leadTime?: number // days before check-in
}

export interface CalculateDynamicPriceOutput {
  baseTotal: Money
  seasonalAdjustment: Money
  demandAdjustment: Money
  competitorAdjustment: Money
  eventAdjustment: Money
  leadTimeAdjustment: Money
  discounts: Money
  taxes: Money
  finalTotal: Money
  averageNightlyRate: Money
  breakdown: PriceBreakdown[]
  currency: string
  confidence: number
  recommendations: PricingRecommendation[]
}

export interface PriceBreakdown {
  date: Date
  baseRate: Money
  seasonalRate: Money
  adjustments: Money
  finalRate: Money
}

export interface CompetitorRate {
  propertyId: string
  date: Date
  rate: Money
  occupancy?: number
}

export interface LocalEvent {
  name: string
  startDate: Date
  endDate: Date
  impact: 'low' | 'medium' | 'high'
  expectedGuests?: number
}

export interface PricingRecommendation {
  type: 'increase' | 'decrease' | 'maintain'
  amount: number
  reason: string
  confidence: number
}

// ============================================================================
// Use Case Class
// ============================================================================

export class CalculateDynamicPrice {
  constructor(
    private seasonalRateRepository: SeasonalRateRepository,
    private competitorRepository: CompetitorRepository,
    private occupancyRepository: OccupancyRepository
  ) {}

  /**
   * Izračunaj dinamično ceno
   */
  async execute(input: CalculateDynamicPriceInput): Promise<CalculateDynamicPriceOutput> {
    const {
      propertyId,
      roomTypeId,
      checkIn,
      checkOut,
      guests,
      baseRate,
      seasonalRates,
      competitorRates,
      occupancyRate,
      demandLevel,
      events,
      leadTime
    } = input

    const nights = this.calculateNights(checkIn, checkOut)
    const breakdown: PriceBreakdown[] = []

    let totalBase = 0
    let totalSeasonal = 0
    let totalDemand = 0
    let totalCompetitor = 0
    let totalEvent = 0
    let totalLeadTime = 0
    let totalDiscounts = 0

    // Izračunaj ceno za vsako noč
    for (let i = 0; i < nights; i++) {
      const date = new Date(checkIn)
      date.setDate(date.getDate() + i)

      // 1. Base rate
      const nightlyBase = baseRate.amount

      // 2. Seasonal adjustment
      const seasonalRate = this.findSeasonalRate(seasonalRates, date)
      const seasonalPrice = seasonalRate 
        ? seasonalRate.calculatePrice(date).amount
        : nightlyBase
      const seasonalAdjustment = seasonalPrice - nightlyBase

      // 3. Demand adjustment
      const demandAdjustment = this.calculateDemandAdjustment(
        nightlyBase,
        demandLevel,
        occupancyRate
      )

      // 4. Competitor adjustment
      const competitorAdjustment = this.calculateCompetitorAdjustment(
        nightlyBase,
        competitorRates,
        date
      )

      // 5. Event adjustment
      const eventAdjustment = this.calculateEventAdjustment(nightlyBase, events, date)

      // 6. Lead time adjustment
      const leadTimeAdjustment = this.calculateLeadTimeAdjustment(
        nightlyBase,
        leadTime || this.daysUntil(checkIn)
      )

      // 7. Calculate final rate for this night
      const finalRate = 
        nightlyBase +
        seasonalAdjustment +
        demandAdjustment +
        competitorAdjustment +
        eventAdjustment +
        leadTimeAdjustment

      // Accumulate totals
      totalBase += nightlyBase
      totalSeasonal += seasonalAdjustment
      totalDemand += demandAdjustment
      totalCompetitor += competitorAdjustment
      totalEvent += eventAdjustment
      totalLeadTime += leadTimeAdjustment

      breakdown.push({
        date,
        baseRate: new Money(nightlyBase, baseRate.currency),
        seasonalRate: new Money(seasonalAdjustment, baseRate.currency),
        adjustments: new Money(
          demandAdjustment + competitorAdjustment + eventAdjustment + leadTimeAdjustment,
          baseRate.currency
        ),
        finalRate: new Money(finalRate, baseRate.currency)
      })
    }

    // Apply discounts
    const discounts = this.calculateDiscounts(totalBase + totalSeasonal + totalDemand)

    // Calculate taxes (22% VAT)
    const subtotal = totalBase + totalSeasonal + totalDemand + totalCompetitor + totalEvent + totalLeadTime
    const taxes = new Money(subtotal * 0.22, baseRate.currency)

    // Calculate final total
    const finalTotal = new Money(
      subtotal - discounts.amount + taxes.amount,
      baseRate.currency
    )

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      baseRate,
      demandLevel,
      occupancyRate,
      competitorRates,
      events
    )

    // Calculate confidence score
    const confidence = this.calculateConfidence(
      seasonalRates,
      competitorRates,
      occupancyRate,
      demandLevel
    )

    return {
      baseTotal: new Money(totalBase, baseRate.currency),
      seasonalAdjustment: new Money(totalSeasonal, baseRate.currency),
      demandAdjustment: new Money(totalDemand, baseRate.currency),
      competitorAdjustment: new Money(totalCompetitor, baseRate.currency),
      eventAdjustment: new Money(totalEvent, baseRate.currency),
      leadTimeAdjustment: new Money(totalLeadTime, baseRate.currency),
      discounts,
      taxes,
      finalTotal,
      averageNightlyRate: new Money(finalTotal.amount / nights, baseRate.currency),
      breakdown,
      currency: baseRate.currency,
      confidence,
      recommendations
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Najdi sezonsko ceno za datum
   */
  private findSeasonalRate(rates: SeasonalRate[] = [], date: Date): SeasonalRate | null {
    const activeRate = rates.find(rate => rate.isActiveForDate(date))
    return activeRate || null
  }

  /**
   * Izračunaj prilagoditev glede na povpraševanje
   */
  private calculateDemandAdjustment(
    baseRate: number,
    demandLevel?: string,
    occupancyRate?: number
  ): number {
    if (!demandLevel && !occupancyRate) return 0

    let adjustment = 0

    // Based on demand level
    switch (demandLevel) {
      case 'low':
        adjustment = -0.15 // -15%
        break
      case 'medium':
        adjustment = 0
        break
      case 'high':
        adjustment = 0.15 // +15%
        break
      case 'very_high':
        adjustment = 0.30 // +30%
        break
    }

    // Adjust based on occupancy rate
    if (occupancyRate) {
      if (occupancyRate > 90) {
        adjustment = Math.max(adjustment, 0.25) // At least +25%
      } else if (occupancyRate > 75) {
        adjustment = Math.max(adjustment, 0.15) // At least +15%
      } else if (occupancyRate < 30) {
        adjustment = Math.min(adjustment, -0.20) // At least -20%
      }
    }

    return baseRate * adjustment
  }

  /**
   * Izračunaj prilagoditev glede na konkurenco
   */
  private calculateCompetitorAdjustment(
    baseRate: number,
    competitorRates: CompetitorRate[] = [],
    date: Date
  ): number {
    if (competitorRates.length === 0) return 0

    const competitorsForDate = competitorRates.filter(r => 
      r.date.toDateString() === date.toDateString()
    )

    if (competitorsForDate.length === 0) return 0

    // Calculate average competitor rate
    const avgCompetitorRate = competitorsForDate.reduce((sum, r) => {
      return sum + r.rate.amount
    }, 0) / competitorsForDate.length

    // If we're significantly higher than competitors, reduce price
    if (baseRate > avgCompetitorRate * 1.2) {
      return -(baseRate - avgCompetitorRate) * 0.5 // Reduce by 50% of difference
    }

    // If we're significantly lower, increase price
    if (baseRate < avgCompetitorRate * 0.8) {
      return (avgCompetitorRate - baseRate) * 0.3 // Increase by 30% of difference
    }

    return 0
  }

  /**
   * Izračunaj prilagoditev glede na dogodke
   */
  private calculateEventAdjustment(
    baseRate: number,
    events: LocalEvent[] = [],
    date: Date
  ): number {
    const activeEvents = events.filter(event => 
      event.startDate <= date && event.endDate >= date
    )

    if (activeEvents.length === 0) return 0

    let totalAdjustment = 0

    for (const event of activeEvents) {
      switch (event.impact) {
        case 'low':
          totalAdjustment += 0.05 // +5%
          break
        case 'medium':
          totalAdjustment += 0.10 // +10%
          break
        case 'high':
          totalAdjustment += 0.20 // +20%
          break
      }
    }

    // Cap at 30%
    return baseRate * Math.min(totalAdjustment, 0.30)
  }

  /**
   * Izračunaj prilagoditev glede na lead time
   */
  private calculateLeadTimeAdjustment(baseRate: number, leadTime: number): number {
    // Last minute (0-7 days): discount
    if (leadTime <= 7) {
      return baseRate * -0.10 // -10%
    }

    // Early bird (60+ days): discount
    if (leadTime >= 60) {
      return baseRate * -0.15 // -15%
    }

    // Peak booking window (14-60 days): no adjustment
    if (leadTime >= 14 && leadTime <= 60) {
      return 0
    }

    // Very early (90+ days): slight discount
    if (leadTime >= 90) {
      return baseRate * -0.05 // -5%
    }

    return 0
  }

  /**
   * Izračunaj popuste
   */
  private calculateDiscounts(subtotal: number): Money {
    let totalDiscount = 0

    // Long stay discount (7+ nights)
    if (subtotal > 0) {
      totalDiscount += subtotal * 0.05 // 5% discount
    }

    return new Money(totalDiscount, 'EUR')
  }

  /**
   * Generiraj priporočila
   */
  private generateRecommendations(
    baseRate: Money,
    demandLevel?: string,
    occupancyRate?: number,
    competitorRates?: CompetitorRate[],
    events?: LocalEvent[]
  ): PricingRecommendation[] {
    const recommendations: PricingRecommendation[] = []

    // Demand-based recommendation
    if (demandLevel === 'high' || demandLevel === 'very_high') {
      recommendations.push({
        type: 'increase',
        amount: 15,
        reason: 'High demand detected',
        confidence: 0.85
      })
    } else if (demandLevel === 'low') {
      recommendations.push({
        type: 'decrease',
        amount: 10,
        reason: 'Low demand - consider discount',
        confidence: 0.75
      })
    }

    // Occupancy-based recommendation
    if (occupancyRate && occupancyRate > 85) {
      recommendations.push({
        type: 'increase',
        amount: 20,
        reason: 'High occupancy - maximize revenue',
        confidence: 0.90
      })
    }

    // Event-based recommendation
    if (events && events.length > 0) {
      recommendations.push({
        type: 'increase',
        amount: 15,
        reason: `${events.length} local event(s) during dates`,
        confidence: 0.80
      })
    }

    return recommendations
  }

  /**
   * Izračunaj confidence score
   */
  private calculateConfidence(
    seasonalRates?: SeasonalRate[],
    competitorRates?: CompetitorRate[],
    occupancyRate?: number,
    demandLevel?: string
  ): number {
    let confidence = 0.5 // Base confidence

    // More data = higher confidence
    if (seasonalRates && seasonalRates.length > 0) confidence += 0.15
    if (competitorRates && competitorRates.length > 0) confidence += 0.15
    if (occupancyRate) confidence += 0.10
    if (demandLevel) confidence += 0.10

    return Math.min(confidence, 1.0)
  }

  /**
   * Izračunaj število nočitev
   */
  private calculateNights(checkIn: Date, checkOut: Date): number {
    const diffTime = checkOut.getTime() - checkIn.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  /**
   * Dnevi do check-in
   */
  private daysUntil(date: Date): number {
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }
}

// ============================================================================
// Repository Interfaces
// ============================================================================

export interface SeasonalRateRepository {
  findByProperty(propertyId: string): Promise<SeasonalRate[]>
  findByPropertyAndDate(propertyId: string, date: Date): Promise<SeasonalRate | null>
}

export interface CompetitorRepository {
  getRates(propertyId: string, startDate: Date, endDate: Date): Promise<CompetitorRate[]>
}

export interface OccupancyRepository {
  getRate(propertyId: string, date: Date): Promise<number>
}
