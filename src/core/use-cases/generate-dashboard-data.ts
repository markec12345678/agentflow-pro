/**
 * Use Case: Generate Dashboard Data
 * 
 * Generate comprehensive analytics dashboard data.
 */

import { Money } from '../shared/value-objects/money'

// ============================================================================
// Input/Output DTOs
// ============================================================================

export interface GenerateDashboardDataInput {
  userId: string
  propertyId?: string
  dateRange: {
    start: Date
    end: Date
  }
  category?: string
  includeComparisons?: boolean
}

export interface GenerateDashboardDataOutput {
  occupancy: OccupancyMetrics
  revenue: RevenueMetrics
  bookings: BookingMetrics
  guests: GuestMetrics
  tasks: TaskMetrics
  alerts: Alert[]
  timestamp: Date
}

export interface OccupancyMetrics {
  currentRate: number
  averageRate: number
  trend: 'increasing' | 'decreasing' | 'stable'
  availableRooms: number
  occupiedRooms: number
}

export interface RevenueMetrics {
  today: Money
  mtd: Money // Month to date
  ytd: Money // Year to date
  trend: 'increasing' | 'decreasing' | 'stable'
}

export interface BookingMetrics {
  today: {
    checkIns: number
    checkOuts: number
  }
  pending: number
  confirmed: number
}

export interface GuestMetrics {
  totalGuests: number
  vipGuests: number
  repeatGuests: number
}

export interface TaskMetrics {
  housekeeping: {
    pending: number
    inProgress: number
    completed: number
  }
  maintenance: {
    pending: number
    urgent: number
  }
}

export interface Alert {
  id: string
  type: 'occupancy' | 'revenue' | 'maintenance' | 'guest'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  message: string
  createdAt: Date
}

// ============================================================================
// Use Case Class
// ============================================================================

export class GenerateDashboardData {
  constructor(
    private occupancyRepository: OccupancyRepository,
    private revenueRepository: RevenueRepository,
    private bookingRepository: BookingRepository,
    private taskRepository: TaskRepository
  ) {}

  /**
   * Generate dashboard data
   */
  async execute(input: GenerateDashboardDataInput): Promise<GenerateDashboardDataOutput> {
    const { userId, propertyId, dateRange, category, includeComparisons } = input

    // 1. Generate occupancy metrics
    const occupancy = await this.generateOccupancyMetrics(propertyId, dateRange)

    // 2. Generate revenue metrics
    const revenue = await this.generateRevenueMetrics(propertyId, dateRange)

    // 3. Generate booking metrics
    const bookings = await this.generateBookingMetrics(propertyId, dateRange)

    // 4. Generate guest metrics
    const guests = await this.generateGuestMetrics(propertyId, dateRange)

    // 5. Generate task metrics
    const tasks = await this.generateTaskMetrics(propertyId)

    // 6. Generate alerts
    const alerts = await this.generateAlerts(propertyId, occupancy, revenue)

    return {
      occupancy,
      revenue,
      bookings,
      guests,
      tasks,
      alerts,
      timestamp: new Date()
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private async generateOccupancyMetrics(
    propertyId: string | undefined,
    dateRange: { start: Date; end: Date }
  ): Promise<OccupancyMetrics> {
    // TODO: Fetch from occupancy repository
    // Mock data
    return {
      currentRate: 78.5,
      averageRate: 72.3,
      trend: 'increasing',
      availableRooms: 22,
      occupiedRooms: 78
    }
  }

  private async generateRevenueMetrics(
    propertyId: string | undefined,
    dateRange: { start: Date; end: Date }
  ): Promise<RevenueMetrics> {
    // TODO: Fetch from revenue repository
    // Mock data
    return {
      today: new Money(1850, 'EUR'),
      mtd: new Money(28500, 'EUR'),
      ytd: new Money(342000, 'EUR'),
      trend: 'increasing'
    }
  }

  private async generateBookingMetrics(
    propertyId: string | undefined,
    dateRange: { start: Date; end: Date }
  ): Promise<BookingMetrics> {
    // TODO: Fetch from booking repository
    // Mock data
    return {
      today: {
        checkIns: 12,
        checkOuts: 8
      },
      pending: 45,
      confirmed: 123
    }
  }

  private async generateGuestMetrics(
    propertyId: string | undefined,
    dateRange: { start: Date; end: Date }
  ): Promise<GuestMetrics> {
    // TODO: Fetch from guest repository
    // Mock data
    return {
      totalGuests: 312,
      vipGuests: 28,
      repeatGuests: 87
    }
  }

  private async generateTaskMetrics(propertyId: string | undefined): Promise<TaskMetrics> {
    // TODO: Fetch from task repository
    // Mock data
    return {
      housekeeping: {
        pending: 5,
        inProgress: 3,
        completed: 42
      },
      maintenance: {
        pending: 2,
        urgent: 1
      }
    }
  }

  private async generateAlerts(
    propertyId: string | undefined,
    occupancy: OccupancyMetrics,
    revenue: RevenueMetrics
  ): Promise<Alert[]> {
    const alerts: Alert[] = []

    // High occupancy alert
    if (occupancy.currentRate > 90) {
      alerts.push({
        id: 'alert_occupancy_high',
        type: 'occupancy',
        priority: 'high',
        message: 'Visoka zasedenost (>90%)',
        createdAt: new Date()
      })
    }

    // Low revenue alert
    if (revenue.trend === 'decreasing') {
      alerts.push({
        id: 'revenue_decreasing',
        type: 'revenue',
        priority: 'medium',
        message: 'Prihodki padajo',
        createdAt: new Date()
      })
    }

    return alerts
  }
}

// ============================================================================
// Repository Interfaces
// ============================================================================

export interface OccupancyRepository {
  getCurrentRate(propertyId?: string): Promise<number>
  getAverageRate(propertyId?: string, dateRange?: any): Promise<number>
  getRoomCount(propertyId?: string): Promise<{ available: number; occupied: number }>
}

export interface RevenueRepository {
  getToday(propertyId?: string): Promise<Money>
  getMTD(propertyId?: string): Promise<Money>
  getYTD(propertyId?: string): Promise<Money>
  getTrend(propertyId?: string): Promise<'increasing' | 'decreasing' | 'stable'>
}

export interface BookingRepository {
  getTodayCheckIns(propertyId?: string): Promise<number>
  getTodayCheckOuts(propertyId?: string): Promise<number>
  getPendingCount(propertyId?: string): Promise<number>
  getConfirmedCount(propertyId?: string): Promise<number>
}

export interface TaskRepository {
  getHousekeepingTasks(propertyId?: string): Promise<any[]>
  getMaintenanceTasks(propertyId?: string): Promise<any[]>
}
