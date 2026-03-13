/**
 * Value Object: DateRange
 * 
 * Neizmenljiv objekt za časovna obdobja.
 * Uporablja se za rezervacije, razpoložljivost, sezone cen.
 */

export class DateRange {
  constructor(
    public readonly start: Date,
    public readonly end: Date
  ) {
    // Normaliziraj na začetek/konec dneva
    this.start = new Date(start.getFullYear(), start.getMonth(), start.getDate())
    this.end = new Date(end.getFullYear(), end.getMonth(), end.getDate())
    
    if (this.start >= this.end) {
      throw new Error('Start date must be before end date')
    }
  }

  /**
   * Preveri če se obdobja prekrivata
   */
  overlaps(other: DateRange): boolean {
    return this.start < other.end && this.end > other.start
  }

  /**
   * Preveri če je datum znotraj obdobja
   */
  contains(date: Date): boolean {
    const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    return checkDate >= this.start && checkDate <= this.end
  }

  /**
   * Preveri če je drugo obdobje popolnoma znotraj tega
   */
  containsRange(other: DateRange): boolean {
    return other.start >= this.start && other.end <= this.end
  }

  /**
   * Izračuna trajanje v dnevih
   */
  durationInDays(): number {
    const ms = this.end.getTime() - this.start.getTime()
    return Math.ceil(ms / (1000 * 60 * 60 * 24))
  }

  /**
   * Izračuna trajanje v nočitvah
   */
  nights(): number {
    return this.durationInDays()
  }

  /**
   * Združi sosednji obdobji (če se dotikata)
   */
  merge(other: DateRange): DateRange | null {
    // Preveri če se dotikata ali prekrivata
    if (this.overlaps(other) || this.isAdjacent(other)) {
      const newStart = this.start < other.start ? this.start : other.start
      const newEnd = this.end > other.end ? this.end : other.end
      return new DateRange(newStart, newEnd)
    }
    return null
  }

  /**
   * Preveri če sta obdobji sosednji (se dotikata)
   */
  isAdjacent(other: DateRange): boolean {
    const oneDay = 24 * 60 * 60 * 1000
    const diffToStart = Math.abs(this.end.getTime() - other.start.getTime())
    const diffToEnd = Math.abs(this.start.getTime() - other.end.getTime())
    return diffToStart <= oneDay || diffToEnd <= oneDay
  }

  /**
   * Razdeli obdobje na več manjših
   */
  split(days: number): DateRange[] {
    if (days <= 0) {
      throw new Error('Days must be positive')
    }

    const result: DateRange[] = []
    let current = this.start

    while (current < this.end) {
      const nextEnd = new Date(current)
      nextEnd.setDate(nextEnd.getDate() + days)
      
      const end = nextEnd > this.end ? this.end : nextEnd
      result.push(new DateRange(current, end))
      current = end
    }

    return result
  }

  /**
   * Primerja z drugim obdobjem
   */
  equals(other: DateRange): boolean {
    return this.start.getTime() === other.start.getTime() &&
           this.end.getTime() === other.end.getTime()
  }

  /**
   * Pretvori v string (ISO format)
   */
  toString(): string {
    return `${this.start.toISOString()} - ${this.end.toISOString()}`
  }

  /**
   * Pretvori v JSON
   */
  toJSON(): { start: string; end: string } {
    return {
      start: this.start.toISOString(),
      end: this.end.toISOString()
    }
  }

  /**
   * Ustvari iz JSON
   */
  static fromJSON(json: { start: string; end: string }): DateRange {
    return new DateRange(new Date(json.start), new Date(json.end))
  }

  /**
   * Ustvari iz dveh datumov
   */
  static fromDates(start: Date, end: Date): DateRange {
    return new DateRange(start, end)
  }

  /**
   * Ustvari za danes
   */
  static today(): DateRange {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const end = new Date()
    end.setHours(23, 59, 59, 999)
    return new DateRange(start, end)
  }
}
