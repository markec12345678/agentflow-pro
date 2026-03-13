/**
 * Domain Entity: OccupancyRecord
 * 
 * Dnevni zapis zasedenosti sob in property-ja.
 * Uporablja se za analytics in forecasting.
 */

import { Money } from '../shared/value-objects/money'

export type OccupancyStatus = 'available' | 'occupied' | 'out_of_order' | 'blocked'

export interface OccupancyRecordData {
  id: string
  propertyId: string
  roomId?: string
  date: Date
  status: OccupancyStatus
  occupiedRooms: number
  availableRooms: number
  totalRooms: number
  occupancyRate: number // percentage 0-100
  revenue: Money
  averageDailyRate: Money
  revPAR: Money // Revenue Per Available Room
  checkIns: number
  checkOuts: number
  metadata?: Record<string, any>
}

export class OccupancyRecord {
  public readonly id: string
  public readonly propertyId: string
  public readonly roomId?: string
  public readonly date: Date
  public status: OccupancyStatus
  public occupiedRooms: number
  public availableRooms: number
  public readonly totalRooms: number
  public occupancyRate: number
  public revenue: Money
  public averageDailyRate: Money
  public revPAR: Money
  public checkIns: number
  public checkOuts: number
  public metadata?: Record<string, any>

  constructor(data: OccupancyRecordData) {
    this.id = data.id
    this.propertyId = data.propertyId
    this.roomId = data.roomId
    this.date = data.date
    this.status = data.status
    this.occupiedRooms = data.occupiedRooms
    this.availableRooms = data.availableRooms
    this.totalRooms = data.totalRooms
    this.occupancyRate = data.occupancyRate
    this.revenue = data.revenue
    this.averageDailyRate = data.averageDailyRate
    this.revPAR = data.revPAR
    this.checkIns = data.checkIns
    this.checkOuts = data.checkOuts
    this.metadata = data.metadata
  }

  /**
   * Izračunaj occupancy rate
   */
  calculateOccupancyRate(): number {
    if (this.totalRooms === 0) return 0
    return (this.occupiedRooms / this.totalRooms) * 100
  }

  /**
   * Izračunaj RevPAR (Revenue Per Available Room)
   */
  calculateRevPAR(): Money {
    if (this.totalRooms === 0) return Money.zero('EUR')
    return new Money(this.revenue.amount / this.totalRooms, 'EUR')
  }

  /**
   * Izračunaj ADR (Average Daily Rate)
   */
  calculateADR(): Money {
    if (this.occupiedRooms === 0) return Money.zero('EUR')
    return new Money(this.revenue.amount / this.occupiedRooms, 'EUR')
  }

  /**
   * Posodobi record z novimi podatki
   */
  update(occupiedRooms: number, revenue: Money): void {
    this.occupiedRooms = occupiedRooms
    this.availableRooms = this.totalRooms - occupiedRooms
    this.revenue = revenue
    this.occupancyRate = this.calculateOccupancyRate()
    this.revPAR = this.calculateRevPAR()
    this.averageDailyRate = this.calculateADR()
  }

  /**
   * Dodaj check-in
   */
  addCheckIn(): void {
    this.checkIns += 1
  }

  /**
   * Dodaj check-out
   */
  addCheckOut(): void {
    this.checkOuts += 1
  }

  /**
   * Preveri ali je danes visoka zasedenost
   */
  isHighOccupancy(threshold: number = 80): boolean {
    return this.occupancyRate >= threshold
  }

  /**
   * Preveri ali je danes nizka zasedenost
   */
  isLowOccupancy(threshold: number = 50): boolean {
    return this.occupancyRate < threshold
  }

  /**
   * Pretvori v Plain Object
   */
  toObject(): OccupancyRecordData {
    return {
      id: this.id,
      propertyId: this.propertyId,
      roomId: this.roomId,
      date: this.date,
      status: this.status,
      occupiedRooms: this.occupiedRooms,
      availableRooms: this.availableRooms,
      totalRooms: this.totalRooms,
      occupancyRate: this.occupancyRate,
      revenue: this.revenue,
      averageDailyRate: this.averageDailyRate,
      revPAR: this.revPAR,
      checkIns: this.checkIns,
      checkOuts: this.checkOuts,
      metadata: this.metadata
    }
  }

  /**
   * Pretvori v JSON
   */
  toJSON(): any {
    return {
      ...this.toObject(),
      date: this.date.toISOString(),
      revenue: this.revenue.toJSON(),
      averageDailyRate: this.averageDailyRate.toJSON(),
      revPAR: this.revPAR.toJSON()
    }
  }

  /**
   * Ustvari iz JSON
   */
  static fromJSON(json: any): OccupancyRecord {
    return new OccupancyRecord({
      ...json,
      date: new Date(json.date),
      revenue: Money.fromJSON(json.revenue),
      averageDailyRate: Money.fromJSON(json.averageDailyRate),
      revPAR: Money.fromJSON(json.revPAR)
    })
  }

  /**
   * Ustvari nov record za dan
   */
  static createForDate(
    propertyId: string,
    date: Date,
    totalRooms: number
  ): OccupancyRecord {
    const record = new OccupancyRecord({
      id: `occ_${date.toISOString().split('T')[0]}_${propertyId}`,
      propertyId,
      date,
      status: 'available',
      occupiedRooms: 0,
      availableRooms: totalRooms,
      totalRooms,
      occupancyRate: 0,
      revenue: Money.zero('EUR'),
      averageDailyRate: Money.zero('EUR'),
      revPAR: Money.zero('EUR'),
      checkIns: 0,
      checkOuts: 0
    })

    // Calculate initial metrics
    record.occupancyRate = record.calculateOccupancyRate()
    record.revPAR = record.calculateRevPAR()

    return record
  }
}
