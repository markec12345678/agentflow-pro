/**
 * Use Case: Get Calendar
 * 
 * Get availability calendar for property.
 */

// ============================================================================
// Input/Output DTOs
// ============================================================================

export interface GetCalendarInput {
  propertyId: string
  userId: string
  startDate: Date
  endDate: Date
  roomId?: string
}

export interface GetCalendarOutput {
  calendar: CalendarDay[]
  propertyId: string
  totalDays: number
}

export interface CalendarDay {
  date: Date
  available: boolean
  occupiedRooms: number
  totalRooms: number
  occupancyRate: number
  baseRate: number
  minStay?: number
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
    const { propertyId, userId, startDate, endDate, roomId } = input

    // 1. Verify user has access
    const hasAccess = await this.propertyRepository.hasAccess(userId, propertyId)
    if (!hasAccess) {
      throw new Error('Access denied')
    }

    // 2. Get calendar data
    const calendar = await this.calendarRepository.getCalendar(propertyId, startDate, endDate, roomId)

    // 3. Calculate total days
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

    return {
      calendar,
      propertyId,
      totalDays
    }
  }
}

// ============================================================================
// Repository Interfaces
// ============================================================================

export interface CalendarRepository {
  getCalendar(
    propertyId: string,
    startDate: Date,
    endDate: Date,
    roomId?: string
  ): Promise<CalendarDay[]>
}

export interface PropertyRepository {
  hasAccess(userId: string, propertyId: string): Promise<boolean>
}
