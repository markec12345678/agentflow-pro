/**
 * Domain Entity: DateBlock
 * 
 * Blokada datumov za sobo ali property.
 * Uporablja se za preprečevanje booking-ov (maintenance, rezervirano za druge kanale, itd.)
 */

export type BlockType = 'maintenance' | 'booked_external' | 'closed' | 'staff_use' | 'renovation'
export type BlockScope = 'room' | 'property' | 'room_type'

export interface DateBlockData {
  id: string
  propertyId: string
  roomId?: string
  roomTypeId?: string
  type: BlockType
  scope: BlockScope
  startDate: Date
  endDate: Date
  reason?: string
  notes?: string
  createdBy: string
  createdAt: Date
  updatedAt?: Date
  allDay?: boolean
  recurring?: {
    pattern: 'daily' | 'weekly' | 'monthly'
    interval: number
    endDate?: Date
  }
}

export class DateBlock {
  public readonly id: string
  public readonly propertyId: string
  public readonly roomId?: string
  public readonly roomTypeId?: string
  public readonly type: BlockType
  public readonly scope: BlockScope
  public readonly startDate: Date
  public readonly endDate: Date
  public reason?: string
  public notes?: string
  public readonly createdBy: string
  public readonly createdAt: Date
  public updatedAt?: Date
  public readonly allDay?: boolean
  public readonly recurring?: {
    pattern: 'daily' | 'weekly' | 'monthly'
    interval: number
    endDate?: Date
  }

  constructor(data: DateBlockData) {
    this.id = data.id
    this.propertyId = data.propertyId
    this.roomId = data.roomId
    this.roomTypeId = data.roomTypeId
    this.type = data.type
    this.scope = data.scope
    this.startDate = data.startDate
    this.endDate = data.endDate
    this.reason = data.reason
    this.notes = data.notes
    this.createdBy = data.createdBy
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
    this.allDay = data.allDay
    this.recurring = data.recurring
  }

  /**
   * Preveri ali datum spada v blok
   */
  includesDate(date: Date): boolean {
    if (this.recurring) {
      return this.isRecurringDate(date)
    }
    
    return date >= this.startDate && date <= this.endDate
  }

  /**
   * Preveri ali se blok prekriva z drugim blokom
   */
  overlapsWith(other: DateBlock): boolean {
    // Check if recurring blocks overlap
    if (this.recurring || other.recurring) {
      return this.isRecurringOverlap(other)
    }

    return !(this.endDate < other.startDate || this.startDate > other.endDate)
  }

  /**
   * Preveri ali je blok aktiven
   */
  isActive(): boolean {
    if (this.recurring?.endDate) {
      return new Date() <= this.recurring.endDate
    }
    return new Date() <= this.endDate
  }

  /**
   * Podaljšaj blok
   */
  extend(days: number): void {
    const newEndDate = new Date(this.endDate)
    newEndDate.setDate(newEndDate.getDate() + days)
    this.endDate = newEndDate
    this.updatedAt = new Date()
  }

  /**
   * Skrajšaj blok
   */
  shorten(days: number): void {
    const newEndDate = new Date(this.endDate)
    newEndDate.setDate(newEndDate.getDate() - days)
    
    if (newEndDate < this.startDate) {
      throw new Error('Cannot shorten block before start date')
    }
    
    this.endDate = newEndDate
    this.updatedAt = new Date()
  }

  /**
   * Dodaj note
   */
  addNote(note: string): void {
    this.notes = this.notes ? `${this.notes}\n${note}` : note
    this.updatedAt = new Date()
  }

  /**
   * Izračunaj trajanje v dnevih
   */
  durationInDays(): number {
    const diffTime = this.endDate.getTime() - this.startDate.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  }

  /**
   * Generiraj opis bloka
   */
  generateDescription(): string {
    const parts: string[] = []

    // Type
    parts.push(this.getTypeLabel())

    // Scope
    if (this.scope === 'room' && this.roomId) {
      parts.push(`Room ${this.roomId}`)
    } else if (this.scope === 'room_type' && this.roomTypeId) {
      parts.push(`Room Type ${this.roomTypeId}`)
    } else {
      parts.push('Entire Property')
    }

    // Duration
    const days = this.durationInDays()
    parts.push(`${days} day${days > 1 ? 's' : ''}`)

    // Reason
    if (this.reason) {
      parts.push(this.reason)
    }

    return parts.join(' • ')
  }

  /**
   * Pretvori v Plain Object
   */
  toObject(): DateBlockData {
    return {
      id: this.id,
      propertyId: this.propertyId,
      roomId: this.roomId,
      roomTypeId: this.roomTypeId,
      type: this.type,
      scope: this.scope,
      startDate: this.startDate,
      endDate: this.endDate,
      reason: this.reason,
      notes: this.notes,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      allDay: this.allDay,
      recurring: this.recurring
    }
  }

  /**
   * Pretvori v JSON
   */
  toJSON(): any {
    return {
      ...this.toObject(),
      startDate: this.startDate.toISOString(),
      endDate: this.endDate.toISOString(),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt?.toISOString(),
      recurring: this.recurring ? {
        ...this.recurring,
        endDate: this.recurring.endDate?.toISOString()
      } : undefined
    }
  }

  /**
   * Ustvari iz JSON
   */
  static fromJSON(json: any): DateBlock {
    return new DateBlock({
      ...json,
      startDate: new Date(json.startDate),
      endDate: new Date(json.endDate),
      createdAt: new Date(json.createdAt),
      updatedAt: json.updatedAt ? new Date(json.updatedAt) : undefined,
      recurring: json.recurring ? {
        ...json.recurring,
        endDate: json.recurring.endDate ? new Date(json.recurring.endDate) : undefined
      } : undefined
    })
  }

  /**
   * Ustvari nov blok
   */
  static create(data: Omit<DateBlockData, 'id' | 'createdAt'>): DateBlock {
    return new DateBlock({
      ...data,
      id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date()
    })
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private getTypeLabel(): string {
    const labels: Record<BlockType, string> = {
      maintenance: 'Maintenance',
      booked_external: 'Booked (External)',
      closed: 'Closed',
      staff_use: 'Staff Use',
      renovation: 'Renovation'
    }
    return labels[this.type] || this.type
  }

  private isRecurringDate(date: Date): boolean {
    if (!this.recurring) return false

    const { pattern, interval } = this.recurring
    
    // Check if date is within range
    if (date < this.startDate) return false
    if (this.recurring.endDate && date > this.recurring.endDate) return false

    // Check recurring pattern
    const daysDiff = Math.floor((date.getTime() - this.startDate.getTime()) / (1000 * 60 * 60 * 24))

    switch (pattern) {
      case 'daily':
        return daysDiff % interval === 0
      case 'weekly':
        return daysDiff % (7 * interval) === 0
      case 'monthly':
        const monthsDiff = (date.getFullYear() - this.startDate.getFullYear()) * 12 +
                          (date.getMonth() - this.startDate.getMonth())
        return monthsDiff % interval === 0
      default:
        return false
    }
  }

  private isRecurringOverlap(other: DateBlock): boolean {
    // Simplified check for recurring blocks
    if (!this.recurring && !other.recurring) return false
    
    // If both have same pattern and interval, check date ranges
    if (this.recurring?.pattern === other.recurring?.pattern &&
        this.recurring?.interval === other.recurring?.interval) {
      return this.overlapsWithSimple(other)
    }

    return false
  }

  private overlapsWithSimple(other: DateBlock): boolean {
    return !(this.endDate < other.startDate || this.startDate > other.endDate)
  }
}
