/**
 * Domain Entity: MaintenanceTicket
 * 
 * Zahtevek za vzdrževanje ali popravilo.
 * Sledi življenjskemu ciklu od prijave do rešitve.
 */

import { Money } from '../shared/value-objects/money'

export type MaintenanceType = 'repair' | 'replacement' | 'inspection' | 'emergency' | 'preventive'
export type MaintenanceCategory = 'plumbing' | 'electrical' | 'hvac' | 'appliance' | 'furniture' | 'structural' | 'other'
export type MaintenanceStatus = 'reported' | 'acknowledged' | 'in_progress' | 'waiting_parts' | 'completed' | 'cancelled'
export type MaintenancePriority = 'low' | 'medium' | 'high' | 'emergency'

export interface MaintenanceTicketData {
  id: string
  propertyId: string
  roomId?: string
  reportedBy: string // Guest or Staff ID
  reportedByType: 'guest' | 'staff'
  type: MaintenanceType
  category: MaintenanceCategory
  priority: MaintenancePriority
  status: MaintenanceStatus
  title: string
  description: string
  assignedTo?: string // Staff ID
  assignedBy?: string // Manager ID
  reportedAt: Date
  acknowledgedAt?: Date
  inProgressAt?: Date
  resolvedAt?: Date
  resolution?: string
  cost?: Money
  partsNeeded?: string[]
  photos?: string[]
  guestCompensation?: Money
  metadata?: Record<string, any>
}

export class MaintenanceTicket {
  public readonly id: string
  public readonly propertyId: string
  public readonly roomId?: string
  public readonly reportedBy: string
  public readonly reportedByType: 'guest' | 'staff'
  public readonly type: MaintenanceType
  public readonly category: MaintenanceCategory
  public priority: MaintenancePriority
  public status: MaintenanceStatus
  public title: string
  public description: string
  public assignedTo?: string
  public assignedBy?: string
  public readonly reportedAt: Date
  public acknowledgedAt?: Date
  public inProgressAt?: Date
  public resolvedAt?: Date
  public resolution?: string
  public cost?: Money
  public partsNeeded?: string[]
  public photos?: string[]
  public guestCompensation?: Money
  public metadata?: Record<string, any>

  constructor(data: MaintenanceTicketData) {
    this.id = data.id
    this.propertyId = data.propertyId
    this.roomId = data.roomId
    this.reportedBy = data.reportedBy
    this.reportedByType = data.reportedByType
    this.type = data.type
    this.category = data.category
    this.priority = data.priority
    this.status = data.status
    this.title = data.title
    this.description = data.description
    this.assignedTo = data.assignedTo
    this.assignedBy = data.assignedBy
    this.reportedAt = data.reportedAt
    this.acknowledgedAt = data.acknowledgedAt
    this.inProgressAt = data.inProgressAt
    this.resolvedAt = data.resolvedAt
    this.resolution = data.resolution
    this.cost = data.cost
    this.partsNeeded = data.partsNeeded
    this.photos = data.photos
    this.guestCompensation = data.guestCompensation
    this.metadata = data.metadata
  }

  /**
   * Acknowledge ticket (potrdi prejema)
   */
  acknowledge(assignedBy: string, assignedTo?: string): void {
    if (this.status !== 'reported') {
      throw new Error(`Cannot acknowledge ticket with status: ${this.status}`)
    }
    this.status = 'acknowledged'
    this.assignedBy = assignedBy
    this.assignedTo = assignedTo
    this.acknowledgedAt = new Date()
  }

  /**
   * Začni delo na zahtevku
   */
  startWork(): void {
    if (this.status !== 'acknowledged') {
      throw new Error(`Cannot start work on ticket with status: ${this.status}`)
    }
    this.status = 'in_progress'
    this.inProgressAt = new Date()
  }

  /**
   * Posodobi status - čakanje na dele
   */
  waitingForParts(parts: string[]): void {
    this.status = 'waiting_parts'
    this.partsNeeded = parts
  }

  /**
   * Reši zahtevek
   */
  resolve(resolution: string, cost?: Money): void {
    if (this.status !== 'in_progress' && this.status !== 'waiting_parts') {
      throw new Error(`Cannot resolve ticket with status: ${this.status}`)
    }
    this.status = 'completed'
    this.resolvedAt = new Date()
    this.resolution = resolution
    this.cost = cost
  }

  /**
   * Prekliči zahtevek
   */
  cancel(reason: string): void {
    this.status = 'cancelled'
    this.resolution = reason
    this.resolvedAt = new Date()
  }

  /**
   * Dodaj fotografijo
   */
  addPhoto(photoUrl: string): void {
    if (!this.photos) {
      this.photos = []
    }
    this.photos.push(photoUrl)
  }

  /**
   * Dodaj nadomestilo za gosta
   */
  offerGuestCompensation(amount: Money): void {
    this.guestCompensation = amount
  }

  /**
   * Posodobi prioriteto
   */
  updatePriority(priority: MaintenancePriority): void {
    this.priority = priority
  }

  /**
   * Escalate prioriteto (za emergency)
   */
  escalateToEmergency(): void {
    this.priority = 'emergency'
    if (this.status === 'reported' || this.status === 'acknowledged') {
      this.status = 'in_progress'
      this.inProgressAt = new Date()
    }
  }

  /**
   * Preveri ali je zahtevek zaprt
   */
  isClosed(): boolean {
    return this.status === 'completed' || this.status === 'cancelled'
  }

  /**
   * Preveri ali je nujno
   */
  isEmergency(): boolean {
    return this.priority === 'emergency' || this.type === 'emergency'
  }

  /**
   * Izračunaj skupni strošek
   */
  totalCost(): Money {
    const repairCost = this.cost || Money.zero('EUR')
    const compensation = this.guestCompensation || Money.zero('EUR')
    return repairCost.add(compensation)
  }

  /**
   * Pretvori v Plain Object
   */
  toObject(): MaintenanceTicketData {
    return {
      id: this.id,
      propertyId: this.propertyId,
      roomId: this.roomId,
      reportedBy: this.reportedBy,
      reportedByType: this.reportedByType,
      type: this.type,
      category: this.category,
      priority: this.priority,
      status: this.status,
      title: this.title,
      description: this.description,
      assignedTo: this.assignedTo,
      assignedBy: this.assignedBy,
      reportedAt: this.reportedAt,
      acknowledgedAt: this.acknowledgedAt,
      inProgressAt: this.inProgressAt,
      resolvedAt: this.resolvedAt,
      resolution: this.resolution,
      cost: this.cost,
      partsNeeded: this.partsNeeded,
      photos: this.photos,
      guestCompensation: this.guestCompensation,
      metadata: this.metadata
    }
  }

  /**
   * Pretvori v JSON
   */
  toJSON(): any {
    return {
      ...this.toObject(),
      reportedAt: this.reportedAt.toISOString(),
      acknowledgedAt: this.acknowledgedAt?.toISOString(),
      inProgressAt: this.inProgressAt?.toISOString(),
      resolvedAt: this.resolvedAt?.toISOString(),
      cost: this.cost?.toJSON(),
      guestCompensation: this.guestCompensation?.toJSON()
    }
  }

  /**
   * Ustvari iz JSON
   */
  static fromJSON(json: any): MaintenanceTicket {
    return new MaintenanceTicket({
      ...json,
      reportedAt: new Date(json.reportedAt),
      acknowledgedAt: json.acknowledgedAt ? new Date(json.acknowledgedAt) : undefined,
      inProgressAt: json.inProgressAt ? new Date(json.inProgressAt) : undefined,
      resolvedAt: json.resolvedAt ? new Date(json.resolvedAt) : undefined,
      cost: json.cost ? Money.fromJSON(json.cost) : undefined,
      guestCompensation: json.guestCompensation ? Money.fromJSON(json.guestCompensation) : undefined
    })
  }

  /**
   * Ustvari nov zahtevek
   */
  static create(data: Omit<MaintenanceTicketData, 'id' | 'status' | 'reportedAt'>): MaintenanceTicket {
    return new MaintenanceTicket({
      ...data,
      id: `maint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'reported',
      reportedAt: new Date()
    })
  }

  /**
   * Ustvari zahtevek iz guest prijave
   */
  static createFromGuestReport(
    propertyId: string,
    roomId: string,
    guestId: string,
    category: MaintenanceCategory,
    title: string,
    description: string,
    isEmergency: boolean = false
  ): MaintenanceTicket {
    return MaintenanceTicket.create({
      propertyId,
      roomId,
      reportedBy: guestId,
      reportedByType: 'guest',
      type: isEmergency ? 'emergency' : 'repair',
      category,
      priority: isEmergency ? 'emergency' : 'medium',
      status: 'reported',
      title,
      description
    })
  }
}
