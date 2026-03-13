/**
 * Use Case: Get Tourism Analytics
 * 
 * Get analytics data for tourism property.
 */

// ============================================================================
// Input/Output DTOs
// ============================================================================

export interface GetTourismAnalyticsInput {
  propertyId: string
  userId: string
  startDate: Date
  endDate: Date
  metrics?: string[]
}

export interface GetTourismAnalyticsOutput {
  occupancy: OccupancyMetrics
  revenue: RevenueMetrics
  bookings: BookingMetrics
  guests: GuestMetrics
  period: {
    startDate: Date
    endDate: Date
    totalDays: number
  }
}

export interface OccupancyMetrics {
  averageRate: number
  totalNights: number
  occupiedNights: number
  trend: 'increasing' | 'decreasing' | 'stable'
}

export interface RevenueMetrics {
  total: number
  averageDaily: number
  trend: 'increasing' | 'decreasing' | 'stable'
}

export interface BookingMetrics {
  total: number
  confirmed: number
  cancelled: number
  cancellationRate: number
}

export interface GuestMetrics {
  totalGuests: number
  repeatGuests: number
  averageSpend: number
}

// ============================================================================
// Use Case Class
// ============================================================================

export class GetTourismAnalytics {
  constructor(
    private analyticsRepository: AnalyticsRepository,
    private propertyRepository: PropertyRepository
  ) {}

  /**
   * Get tourism analytics
   */
  async execute(input: GetTourismAnalyticsInput): Promise<GetTourismAnalyticsOutput> {
    const { propertyId, userId, startDate, endDate, metrics } = input

    // 1. Verify user has access
    const hasAccess = await this.propertyRepository.hasAccess(userId, propertyId)
    if (!hasAccess) {
      throw new Error('Access denied')
    }

    // 2. Get metrics
    const [occupancy, revenue, bookings, guests] = await Promise.all([
      this.analyticsRepository.getOccupancy(propertyId, startDate, endDate),
      this.analyticsRepository.getRevenue(propertyId, startDate, endDate),
      this.analyticsRepository.getBookings(propertyId, startDate, endDate),
      this.analyticsRepository.getGuests(propertyId, startDate, endDate)
    ])

    // 3. Calculate total days
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

    return {
      occupancy,
      revenue,
      bookings,
      guests,
      period: {
        startDate,
        endDate,
        totalDays
      }
    }
  }
}

// ============================================================================
// Repository Interfaces
// ============================================================================

export interface AnalyticsRepository {
  getOccupancy(propertyId: string, startDate: Date, endDate: Date): Promise<OccupancyMetrics>
  getRevenue(propertyId: string, startDate: Date, endDate: Date): Promise<RevenueMetrics>
  getBookings(propertyId: string, startDate: Date, endDate: Date): Promise<BookingMetrics>
  getGuests(propertyId: string, startDate: Date, endDate: Date): Promise<GuestMetrics>
}

export interface PropertyRepository {
  hasAccess(userId: string, propertyId: string): Promise<boolean>
}
