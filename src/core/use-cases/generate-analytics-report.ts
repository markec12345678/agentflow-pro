/**
 * Use Case: Generate Analytics Report
 * 
 * Generiraj comprehensive analytics report za property.
 */

import { OccupancyRecord } from '../domain/tourism/entities/occupancy-record'
import { RevenueRecord } from '../domain/tourism/entities/revenue-record'
import { Money } from '../shared/value-objects/money'

// ============================================================================
// Input/Output DTOs
// ============================================================================

export interface GenerateAnalyticsReportInput {
  propertyId: string
  startDate: Date
  endDate: Date
  includeComparisons?: boolean
  previousPeriod?: {
    startDate: Date
    endDate: Date
  }
}

export interface AnalyticsReport {
  propertyId: string
  reportPeriod: {
    startDate: Date
    endDate: Date
    totalDays: number
  }
  occupancy: {
    averageOccupancyRate: number
    totalNights: number
    availableNights: number
    occupiedNights: number
    peakOccupancyDate: Date
    lowestOccupancyDate: Date
    trend: 'increasing' | 'decreasing' | 'stable'
  }
  revenue: {
    totalRevenue: Money
    totalNetRevenue: Money
    totalTax: Money
    totalRefunds: Money
    averageDailyRevenue: Money
    revenueByCategory: Record<string, Money>
    revenueBySource: Record<string, Money>
    trend: 'increasing' | 'decreasing' | 'stable'
  }
  rates: {
    averageDailyRate: Money
    revPAR: Money
    highestADR: Money
    lowestADR: Money
  }
  bookings: {
    totalReservations: number
    totalCheckIns: number
    totalCheckOuts: number
    averageStayLength: number
    cancellationRate: number
  }
  guests: {
    totalGuests: number
    repeatGuests: number
    averageGuestSpend: Money
    topNationalities?: Array<{ country: string; count: number }>
  }
  comparisons?: {
    occupancyChange: number // percentage points
    revenueChange: number // percentage
    adrChange: number // percentage
  }
  generatedAt: Date
}

// ============================================================================
// Use Case Class
// ============================================================================

export class GenerateAnalyticsReport {
  constructor(
    private occupancyRepository: OccupancyRepository,
    private revenueRepository: RevenueRepository,
    private reservationRepository: ReservationRepository
  ) {}

  /**
   * Generiraj analytics report
   */
  async execute(input: GenerateAnalyticsReportInput): Promise<AnalyticsReport> {
    const { propertyId, startDate, endDate, includeComparisons, previousPeriod } = input

    // 1. Pridobi occupancy records
    const occupancyRecords = await this.occupancyRepository.findByPropertyAndDateRange(
      propertyId,
      startDate,
      endDate
    )

    // 2. Pridobi revenue records
    const revenueRecords = await this.revenueRepository.findByPropertyAndDateRange(
      propertyId,
      startDate,
      endDate
    )

    // 3. Pridobi reservation data
    const reservations = await this.reservationRepository.findByPropertyAndDateRange(
      propertyId,
      startDate,
      endDate
    )

    // 4. Izračunaj occupancy metrics
    const occupancyMetrics = this.calculateOccupancyMetrics(occupancyRecords)

    // 5. Izračunaj revenue metrics
    const revenueMetrics = this.calculateRevenueMetrics(revenueRecords)

    // 6. Izračunaj rate metrics
    const rateMetrics = this.calculateRateMetrics(occupancyRecords, revenueRecords)

    // 7. Izračunaj booking metrics
    const bookingMetrics = this.calculateBookingMetrics(reservations)

    // 8. Izračunaj guest metrics
    const guestMetrics = this.calculateGuestMetrics(reservations)

    // 9. Izračunaj comparisons (če so podani)
    const comparisons = includeComparisons && previousPeriod
      ? await this.calculateComparisons(propertyId, previousPeriod, occupancyMetrics, revenueMetrics, rateMetrics)
      : undefined

    // 10. Sestavi report
    const report: AnalyticsReport = {
      propertyId,
      reportPeriod: {
        startDate,
        endDate,
        totalDays: this.calculateDaysBetween(startDate, endDate)
      },
      occupancy: occupancyMetrics,
      revenue: revenueMetrics,
      rates: rateMetrics,
      bookings: bookingMetrics,
      guests: guestMetrics,
      comparisons,
      generatedAt: new Date()
    }

    return report
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Izračunaj occupancy metrics
   */
  private calculateOccupancyMetrics(records: OccupancyRecord[]): any {
    if (records.length === 0) {
      return {
        averageOccupancyRate: 0,
        totalNights: 0,
        availableNights: 0,
        occupiedNights: 0,
        peakOccupancyDate: null,
        lowestOccupancyDate: null,
        trend: 'stable' as const
      }
    }

    const totalOccupancyRate = records.reduce((sum, r) => sum + r.occupancyRate, 0)
    const averageOccupancyRate = totalOccupancyRate / records.length

    const totalNights = records.reduce((sum, r) => sum + r.totalRooms, 0)
    const occupiedNights = records.reduce((sum, r) => sum + r.occupiedRooms, 0)
    const availableNights = totalNights - occupiedNights

    // Find peak and lowest
    const peak = records.reduce((max, r) => r.occupancyRate > max.occupancyRate ? r : max)
    const lowest = records.reduce((min, r) => r.occupancyRate < min.occupancyRate ? r : min)

    // Calculate trend
    const trend = this.calculateTrend(records.map(r => r.occupancyRate))

    return {
      averageOccupancyRate,
      totalNights,
      availableNights,
      occupiedNights,
      peakOccupancyDate: peak.date,
      lowestOccupancyDate: lowest.date,
      trend
    }
  }

  /**
   * Izračunaj revenue metrics
   */
  private calculateRevenueMetrics(records: RevenueRecord[]): any {
    if (records.length === 0) {
      return {
        totalRevenue: Money.zero('EUR'),
        totalNetRevenue: Money.zero('EUR'),
        totalTax: Money.zero('EUR'),
        totalRefunds: Money.zero('EUR'),
        averageDailyRevenue: Money.zero('EUR'),
        revenueByCategory: {},
        revenueBySource: {},
        trend: 'stable' as const
      }
    }

    // Group by category and source
    const byCategory: Record<string, Money> = {}
    const bySource: Record<string, Money> = {}

    for (const record of records) {
      // By category
      if (!byCategory[record.category]) {
        byCategory[record.category] = Money.zero('EUR')
      }
      byCategory[record.category] = byCategory[record.category].add(record.grossAmount)

      // By source
      if (!bySource[record.source]) {
        bySource[record.source] = Money.zero('EUR')
      }
      bySource[record.source] = bySource[record.source].add(record.grossAmount)
    }

    const totalRevenue = records.reduce((sum, r) => sum.add(r.grossAmount), Money.zero('EUR'))
    const totalNetRevenue = records.reduce((sum, r) => sum.add(r.netAmount), Money.zero('EUR'))
    const totalTax = records.reduce((sum, r) => sum.add(r.taxAmount), Money.zero('EUR'))
    const totalRefunds = records.reduce((sum, r) => sum.add(r.refunds), Money.zero('EUR'))
    const averageDailyRevenue = new Money(totalRevenue.amount / records.length, 'EUR')

    const trend = this.calculateTrend(
      records.map(r => r.grossAmount.amount),
      7 // Group by week
    )

    return {
      totalRevenue,
      totalNetRevenue,
      totalTax,
      totalRefunds,
      averageDailyRevenue,
      revenueByCategory: byCategory,
      revenueBySource: bySource,
      trend
    }
  }

  /**
   * Izračunaj rate metrics (ADR, RevPAR)
   */
  private calculateRateMetrics(occupancyRecords: OccupancyRecord[], revenueRecords: RevenueRecord[]): any {
    if (occupancyRecords.length === 0) {
      return {
        averageDailyRate: Money.zero('EUR'),
        revPAR: Money.zero('EUR'),
        highestADR: Money.zero('EUR'),
        lowestADR: Money.zero('EUR')
      }
    }

    const adrs = occupancyRecords.map(r => r.averageDailyRate)
    const revPARs = occupancyRecords.map(r => r.revPAR)

    const averageADR = adrs.reduce((sum, r) => sum.add(r), Money.zero('EUR'))
    const averageRevPAR = revPARs.reduce((sum, r) => sum.add(r), Money.zero('EUR'))

    const highestADR = adrs.reduce((max, r) => r.amount > max.amount ? r : max)
    const lowestADR = adrs.reduce((min, r) => r.amount < min.amount ? r : min)

    return {
      averageDailyRate: new Money(averageADR.amount / adrs.length, 'EUR'),
      revPAR: new Money(averageRevPAR.amount / revPARs.length, 'EUR'),
      highestADR,
      lowestADR
    }
  }

  /**
   * Izračunaj booking metrics
   */
  private calculateBookingMetrics(reservations: any[]): any {
    if (reservations.length === 0) {
      return {
        totalReservations: 0,
        totalCheckIns: 0,
        totalCheckOuts: 0,
        averageStayLength: 0,
        cancellationRate: 0
      }
    }

    const totalReservations = reservations.length
    const totalCheckIns = reservations.filter(r => r.status === 'checked_in' || r.status === 'checked_out').length
    const totalCheckOuts = reservations.filter(r => r.status === 'checked_out').length
    const cancellations = reservations.filter(r => r.status === 'cancelled').length

    const averageStayLength = reservations.reduce((sum, r) => {
      const nights = r.nights || 0
      return sum + nights
    }, 0) / totalReservations

    const cancellationRate = (cancellations / totalReservations) * 100

    return {
      totalReservations,
      totalCheckIns,
      totalCheckOuts,
      averageStayLength,
      cancellationRate
    }
  }

  /**
   * Izračunaj guest metrics
   */
  private calculateGuestMetrics(reservations: any[]): any {
    if (reservations.length === 0) {
      return {
        totalGuests: 0,
        repeatGuests: 0,
        averageGuestSpend: Money.zero('EUR')
      }
    }

    const totalGuests = reservations.reduce((sum, r) => sum + (r.guests || 0), 0)
    const repeatGuests = reservations.filter(r => r.isRepeatGuest).length
    const totalRevenue = reservations.reduce((sum, r) => sum + (r.totalPrice?.amount || 0), 0)

    return {
      totalGuests,
      repeatGuests,
      averageGuestSpend: new Money(totalRevenue / totalGuests, 'EUR')
    }
  }

  /**
   * Izračunaj trend (increasing/decreasing/stable)
   */
  private calculateTrend(values: number[], windowSize: number = 3): 'increasing' | 'decreasing' | 'stable' {
    if (values.length < windowSize * 2) {
      return 'stable'
    }

    const firstHalf = values.slice(0, windowSize)
    const secondHalf = values.slice(-windowSize)

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / windowSize
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / windowSize

    const change = ((secondAvg - firstAvg) / firstAvg) * 100

    if (change > 5) return 'increasing'
    if (change < -5) return 'decreasing'
    return 'stable'
  }

  /**
   * Izračunaj primerjavo s prejšnjim obdobjem
   */
  private async calculateComparisons(
    propertyId: string,
    previousPeriod: { startDate: Date; endDate: Date },
    currentOccupancy: any,
    currentRevenue: any,
    currentRates: any
  ): Promise<any> {
    // TODO: Get previous period data
    // const prevOccupancy = await this.occupancyRepository.findByPropertyAndDateRange(...)
    // const prevRevenue = await this.revenueRepository.findByPropertyAndDateRange(...)
    
    // Mock calculations
    return {
      occupancyChange: 2.5, // percentage points
      revenueChange: 8.3, // percentage
      adrChange: 5.2 // percentage
    }
  }

  /**
   * Izračunaj število dni med datumoma
   */
  private calculateDaysBetween(start: Date, end: Date): number {
    const diffTime = end.getTime() - start.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }
}

// ============================================================================
// Repository Interfaces
// ============================================================================

export interface OccupancyRepository {
  findByPropertyAndDateRange(propertyId: string, start: Date, end: Date): Promise<OccupancyRecord[]>
  save(record: OccupancyRecord): Promise<void>
}

export interface RevenueRepository {
  findByPropertyAndDateRange(propertyId: string, start: Date, end: Date): Promise<RevenueRecord[]>
  save(record: RevenueRecord): Promise<void>
}

export interface ReservationRepository {
  findByPropertyAndDateRange(propertyId: string, start: Date, end: Date): Promise<any[]>
}
