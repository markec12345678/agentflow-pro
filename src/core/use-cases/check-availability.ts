/**
 * Use Case: Check Availability
 * 
 * Preveri razpoložljivost sobe za določene datume.
 */

import { DateRange } from '../shared/value-objects/date-range'
import { Availability } from '../domain/tourism/entities/availability'

// ============================================================================
// Input/Output DTOs
// ============================================================================

export interface CheckAvailabilityInput {
  roomId: string
  checkIn: Date
  checkOut: Date
  guests: number
}

export interface AvailabilityResult {
  available: boolean
  dateRange: DateRange
  nightlyRates: Array<{
    date: Date
    rate: number
    status: string
  }>
  totalPrice: number
  minStay: number
  maxStay: number
  restrictions: {
    closedToArrival: boolean
    closedToDeparture: boolean
  }
  message?: string
}

// ============================================================================
// Use Case Class
// ============================================================================

export class CheckAvailability {
  constructor(
    private availabilityRepository: AvailabilityRepository
  ) {}

  /**
   * Preveri razpoložljivost za obdobje
   */
  async execute(input: CheckAvailabilityInput): Promise<AvailabilityResult> {
    const { roomId, checkIn, checkOut, guests } = input
    const dateRange = new DateRange(checkIn, checkOut)
    const nights = dateRange.nights()

    // 1. Pridobi vse availability zapise za obdobje
    const availabilities = await this.availabilityRepository.findByRoomAndDateRange(
      roomId,
      checkIn,
      checkOut
    )

    // 2. Preveri ali so vsi dnevi na voljo
    const isAvailable = this.checkAllDatesAvailable(availabilities, dateRange)

    // 3. Preveri omejitve bivanja
    const meetsStayRequirements = this.checkStayRequirements(availabilities, nights)

    // 4. Preveri check-in/check-out omejitve
    const checkInAllowed = this.checkCheckInAllowed(availabilities, checkIn)
    const checkOutAllowed = this.checkCheckOutAllowed(availabilities, checkOut)

    // 5. Izračunaj skupno ceno
    const totalPrice = this.calculateTotalPrice(availabilities)

    // 6. Pripravi nightly rates
    const nightlyRates = availabilities.map(avail => ({
      date: avail.date,
      rate: avail.baseRate.amount,
      status: avail.status
    }))

    // 7. Pridobi omejitve
    const restrictions = this.getRestrictions(availabilities)

    // 8. Sestavi rezultat
    if (!isAvailable) {
      return {
        available: false,
        dateRange,
        nightlyRates,
        totalPrice: 0,
        minStay: this.getMinStay(availabilities),
        maxStay: this.getMaxStay(availabilities),
        restrictions,
        message: 'Soba ni na voljo za izbrane datume'
      }
    }

    if (!meetsStayRequirements) {
      const minStay = this.getMinStay(availabilities)
      return {
        available: false,
        dateRange,
        nightlyRates,
        totalPrice: 0,
        minStay,
        maxStay: this.getMaxStay(availabilities),
        restrictions,
        message: `Minimalno bivanje je ${minStay} noči`
      }
    }

    if (!checkInAllowed) {
      return {
        available: false,
        dateRange,
        nightlyRates,
        totalPrice: 0,
        minStay: this.getMinStay(availabilities),
        maxStay: this.getMaxStay(availabilities),
        restrictions,
        message: 'Check-in ni dovoljen na ta dan'
      }
    }

    if (!checkOutAllowed) {
      return {
        available: false,
        dateRange,
        nightlyRates,
        totalPrice: 0,
        minStay: this.getMinStay(availabilities),
        maxStay: this.getMaxStay(availabilities),
        restrictions,
        message: 'Check-out ni dovoljen na ta dan'
      }
    }

    return {
      available: true,
      dateRange,
      nightlyRates,
      totalPrice,
      minStay: this.getMinStay(availabilities),
      maxStay: this.getMaxStay(availabilities),
      restrictions,
      message: 'Soba je na voljo'
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Preveri ali so vsi datumi na voljo
   */
  private checkAllDatesAvailable(
    availabilities: Availability[],
    dateRange: DateRange
  ): boolean {
    // Generiraj vse datume v obdobju
    const allDates = this.generateDates(dateRange)

    // Preveri ali imamo zapis za vsak datum in ali je available
    return allDates.every(date => {
      const avail = availabilities.find(
        a => a.date.toDateString() === date.toDateString()
      )
      return avail && avail.isAvailable()
    })
  }

  /**
   * Preveri omejitve bivanja
   */
  private checkStayRequirements(
    availabilities: Availability[],
    nights: number
  ): boolean {
    const minStay = this.getMinStay(availabilities)
    return nights >= minStay
  }

  /**
   * Preveri ali je check-in dovoljen
   */
  private checkCheckInAllowed(availabilities: Availability[], checkIn: Date): boolean {
    const checkInAvail = availabilities.find(
      a => a.date.toDateString() === checkIn.toDateString()
    )
    return !checkInAvail?.closedToArrival
  }

  /**
   * Preveri ali je check-out dovoljen
   */
  private checkCheckOutAllowed(availabilities: Availability[], checkOut: Date): boolean {
    const checkOutAvail = availabilities.find(
      a => a.date.toDateString() === checkOut.toDateString()
    )
    return !checkOutAvail?.closedToDeparture
  }

  /**
   * Izračunaj skupno ceno
   */
  private calculateTotalPrice(availabilities: Availability[]): number {
    return availabilities.reduce((total, avail) => {
      return total + avail.baseRate.amount
    }, 0)
  }

  /**
   * Pridobi minimalno bivanje
   */
  private getMinStay(availabilities: Availability[]): number {
    return Math.max(...availabilities.map(a => a.minStay))
  }

  /**
   * Pridobi maksimalno bivanje
   */
  private getMaxStay(availabilities: Availability[]): number {
    return Math.min(...availabilities.map(a => a.maxStay))
  }

  /**
   * Pridobi omejitve
   */
  private getRestrictions(availabilities: Availability[]): {
    closedToArrival: boolean
    closedToDeparture: boolean
  } {
    return {
      closedToArrival: availabilities.some(a => a.closedToArrival),
      closedToDeparture: availabilities.some(a => a.closedToDeparture)
    }
  }

  /**
   * Generiraj vse datume v obdobju
   */
  private generateDates(dateRange: DateRange): Date[] {
    const dates: Date[] = []
    const current = new Date(dateRange.start)

    while (current <= dateRange.end) {
      dates.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }

    return dates
  }
}

// ============================================================================
// Repository Interface
// ============================================================================

export interface AvailabilityRepository {
  findByRoomAndDateRange(
    roomId: string,
    checkIn: Date,
    checkOut: Date
  ): Promise<Availability[]>

  findByDate(roomId: string, date: Date): Promise<Availability | null>

  save(availability: Availability): Promise<void>

  saveBatch(availabilities: Availability[]): Promise<void>
}
