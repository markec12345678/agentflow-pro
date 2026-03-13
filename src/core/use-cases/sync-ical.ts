/**
 * Use Case: Sync iCal
 * 
 * Sync calendar with iCal feeds.
 */

// ============================================================================
// Input/Output DTOs
// ============================================================================

export interface SyncICalInput {
  propertyId: string
  userId: string
  icalUrls: string[]
  direction: 'import' | 'export' | 'bidirectional'
}

export interface SyncICalOutput {
  success: boolean
  imported: number
  exported: number
  errors: string[]
}

// ============================================================================
// Use Case Class
// ============================================================================

export class SyncICal {
  constructor(
    private icalRepository: ICalRepository,
    private calendarRepository: CalendarRepository,
    private propertyRepository: PropertyRepository
  ) {}

  /**
   * Sync iCal
   */
  async execute(input: SyncICalInput): Promise<SyncICalOutput> {
    const { propertyId, userId, icalUrls, direction } = input

    // 1. Verify user has access
    const hasAccess = await this.propertyRepository.hasAccess(userId, propertyId)
    if (!hasAccess) {
      throw new Error('Access denied')
    }

    const errors: string[] = []
    let imported = 0
    let exported = 0

    // 2. Import from iCal feeds
    if (direction === 'import' || direction === 'bidirectional') {
      for (const url of icalUrls) {
        try {
          const events = await this.icalRepository.importFromICal(url)
          
          for (const event of events) {
            await this.calendarRepository.blockDates(propertyId, {
              startDate: event.startDate,
              endDate: event.endDate,
              reason: 'iCal import'
            })
            imported++
          }
        } catch (error: any) {
          errors.push(`Failed to import ${url}: ${error.message}`)
        }
      }
    }

    // 3. Export to iCal feeds
    if (direction === 'export' || direction === 'bidirectional') {
      for (const url of icalUrls) {
        try {
          const calendarData = await this.calendarRepository.getCalendarData(propertyId)
          await this.icalRepository.exportToICal(url, calendarData)
          exported++
        } catch (error: any) {
          errors.push(`Failed to export ${url}: ${error.message}`)
        }
      }
    }

    return {
      success: errors.length === 0,
      imported,
      exported,
      errors
    }
  }
}

// ============================================================================
// Repository Interfaces
// ============================================================================

export interface ICalRepository {
  importFromICal(url: string): Promise<any[]>
  exportToICal(url: string, data: any): Promise<void>
}

export interface CalendarRepository {
  blockDates(propertyId: string, data: any): Promise<void>
  getCalendarData(propertyId: string): Promise<any>
}

export interface PropertyRepository {
  hasAccess(userId: string, propertyId: string): Promise<boolean>
}
