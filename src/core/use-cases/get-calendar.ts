/**
 * Use Case: Get Calendar
 * 
 * Get availability calendar for property with statistics.
 */

import { DateRange } from '../shared/value-objects/date-range'

// ============================================================================
// Input/Output DTOs
// ============================================================================

export interface GetCalendarInput {
  propertyId: string
  userId: string
  year: number
  month: number
  roomId?: string
}

export interface GetCalendarOutput {
  calendar: CalendarDay[]
  month: string
  stats: CalendarStats
}

export interface CalendarDay {
  date: string
  day: number
  status: 'available' | 'booked' | 'blocked' | 'check-in' | 'check-out'
  reservation?: {
    id: string
    guestName?: string
    guestEmail?: string
    checkIn: string
    checkOut: string
    channel?: string
    totalAmount: number
  } | null
}

export interface CalendarStats {
  totalDays: number
  bookedDays: number
  availableDays: number
  occupancyRate: number
  revenue: number
}

// ============================================================================
// Use Case Class
// ============================================================================

export class GetCalendar {
  constructor(
    private calendarRepository: CalendarRepository,
    private propertyRepository: PropertyRepository
  ) {}

  /**
   * Get calendar for property
   */
  async execute(input: GetCalendarInput): Promise<GetCalendarOutput> {
    const { propertyId, userId, year, month, roomId } = input

    // 1. Verify user has access
    const hasAccess = await this.propertyRepository.hasAccess(userId, propertyId)
    if (!hasAccess) {
      throw new Error('Access denied')
    }

    // 2. Get calendar data
    const calendarData = await this.calendarRepository.getCalendar({
      propertyId,
      year,
      month,
      roomId
    })

    // 3. Build calendar grid
    const calendar = this.buildCalendarGrid(calendarData)

    // 4. Calculate statistics
    const stats = this.calculateStatistics(calendar)

    // 5. Format month name
    const monthName = this.formatMonthName(year, month)

    return {
      calendar,
      month: monthName,
      stats
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private buildCalendarGrid(data: any): CalendarDay[] {
    return data.days.map((day: any) => {
      const dayReservations = data.reservations.filter(
        (r: any) => day >= r.checkIn && day < r.checkOut
      )
      const isBlocked = data.blockedDates.some((b: any) => this.isSameDay(b.date, day))

      let status: CalendarDay['status'] = 'available'

      if (isBlocked) {
        status = 'blocked'
      } else if (dayReservations.length > 0) {
        const reservation = dayReservations[0]
        if (this.isSameDay(day, reservation.checkIn)) {
          status = 'check-in'
        } else if (this.isSameDay(day, reservation.checkOut)) {
          status = 'check-out'
        } else {
          status = 'booked'
        }
      }

      return {
        date: this.formatDate(day),
        day: day.getDate(),
        status,
        reservation: dayReservations.length > 0 ? {
          id: dayReservations[0].id,
          guestName: dayReservations[0].guest?.name,
          guestEmail: dayReservations[0].guest?.email,
          checkIn: this.formatDate(dayReservations[0].checkIn),
          checkOut: this.formatDate(dayReservations[0].checkOut),
          channel: dayReservations[0].channel,
          totalAmount: dayReservations[0].totalPrice
        } : null
      }
    })
  }

  private calculateStatistics(calendar: CalendarDay[]): CalendarStats {
    const totalDays = calendar.length
    const bookedDays = calendar.filter(d => d.status === 'booked').length
    const availableDays = calendar.filter(d => d.status === 'available').length
    const occupancyRate = Math.round((bookedDays / totalDays) * 100)
    const revenue = calendar.reduce((sum, day) => {
      return sum + (day.reservation?.totalAmount || 0)
    }, 0)

    return {
      totalDays,
      bookedDays,
      availableDays,
      occupancyRate,
      revenue
    }
  }

  private formatMonthName(year: number, month: number): string {
    const date = new Date(year, month - 1)
    return date.toLocaleString('default', { month: 'long', year: 'numeric' })
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0]
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate()
  }
}

// ============================================================================
// Repository Interfaces
// ============================================================================

export interface CalendarRepository {
  getCalendar(options: {
    propertyId: string
    year: number
    month: number
    roomId?: string
  }): Promise<{
    days: Date[]
    reservations: any[]
    blockedDates: any[]
  }>
}

export interface PropertyRepository {
  hasAccess(userId: string, propertyId: string): Promise<boolean>
}
