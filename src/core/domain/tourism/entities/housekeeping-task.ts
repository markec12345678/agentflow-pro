/**
 * Domain Entity: HousekeepingTask
 * 
 * Naloga za hišni red (čiščenje, vzdrževanje).
 * Dodeljena osebju z roki in statusom.
 */

import { Money } from '../shared/value-objects/money'

export type TaskType = 'cleaning' | 'maintenance' | 'inspection' | 'restock' | 'deep_clean'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TaskStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'failed'

export interface HousekeepingTaskData {
  id: string
  propertyId: string
  roomId?: string
  reservationId?: string
  type: TaskType
  priority: TaskPriority
  status: TaskStatus
  title: string
  description: string
  assignedTo?: string // Staff ID
  assignedBy: string // Manager ID
  dueDate: Date
  estimatedDuration: number // minutes
  actualDuration?: number
  completedAt?: Date
  notes?: string
  checklist?: ChecklistItem[]
  cost?: Money
  metadata?: Record<string, any>
}

export interface ChecklistItem {
  id: string
  description: string
  completed: boolean
  notes?: string
}

export class HousekeepingTask {
  public readonly id: string
  public readonly propertyId: string
  public readonly roomId?: string
  public readonly reservationId?: string
  public readonly type: TaskType
  public priority: TaskPriority
  public status: TaskStatus
  public title: string
  public description: string
  public assignedTo?: string
  public readonly assignedBy: string
  public dueDate: Date
  public estimatedDuration: number
  public actualDuration?: number
  public completedAt?: Date
  public notes?: string
  public checklist?: ChecklistItem[]
  public cost?: Money
  public metadata?: Record<string, any>

  constructor(data: HousekeepingTaskData) {
    this.id = data.id
    this.propertyId = data.propertyId
    this.roomId = data.roomId
    this.reservationId = data.reservationId
    this.type = data.type
    this.priority = data.priority
    this.status = data.status
    this.title = data.title
    this.description = data.description
    this.assignedTo = data.assignedTo
    this.assignedBy = data.assignedBy
    this.dueDate = data.dueDate
    this.estimatedDuration = data.estimatedDuration
    this.actualDuration = data.actualDuration
    this.completedAt = data.completedAt
    this.notes = data.notes
    this.checklist = data.checklist
    this.cost = data.cost
    this.metadata = data.metadata
  }

  /**
   * Dodeli nalogo osebju
   */
  assignTo(staffId: string): void {
    if (this.status !== 'pending') {
      throw new Error(`Cannot assign task with status: ${this.status}`)
    }
    this.assignedTo = staffId
    this.status = 'assigned'
  }

  /**
   * Začni izvajanje naloge
   */
  start(): void {
    if (this.status !== 'assigned') {
      throw new Error(`Cannot start task with status: ${this.status}`)
    }
    this.status = 'in_progress'
  }

  /**
   * Označi nalogo kot končano
   */
  complete(duration?: number, notes?: string): void {
    if (this.status !== 'in_progress') {
      throw new Error(`Cannot complete task with status: ${this.status}`)
    }
    this.status = 'completed'
    this.completedAt = new Date()
    this.actualDuration = duration || this.estimatedDuration
    if (notes) {
      this.notes = notes
    }
  }

  /**
   * Označi nalogo kot neuspešno
   */
  fail(reason: string): void {
    this.status = 'failed'
    this.notes = reason
  }

  /**
   * Prekliči nalogo
   */
  cancel(): void {
    if (this.status === 'completed') {
      throw new Error('Cannot complete task')
    }
    this.status = 'cancelled'
  }

  /**
   * Posodobi prioriteto
   */
  updatePriority(priority: TaskPriority): void {
    this.priority = priority
  }

  /**
   * Posodobi rok
   */
  updateDueDate(dueDate: Date): void {
    this.dueDate = dueDate
  }

  /**
   * Dodaj opombo
   */
  addNote(note: string): void {
    this.notes = this.notes ? `${this.notes}\n${note}` : note
  }

  /**
   * Posodobi checklisto
   */
  updateChecklist(checklist: ChecklistItem[]): void {
    this.checklist = checklist
  }

  /**
   * Označi checklist item kot končan
   */
  completeChecklistItem(itemId: string): void {
    if (!this.checklist) {
      throw new Error('No checklist for this task')
    }
    const item = this.checklist.find(i => i.id === itemId)
    if (!item) {
      throw new Error(`Checklist item ${itemId} not found`)
    }
    item.completed = true
  }

  /**
   * Preveri ali so vsi checklist itemi končani
   */
  isChecklistComplete(): boolean {
    if (!this.checklist || this.checklist.length === 0) {
      return true
    }
    return this.checklist.every(item => item.completed)
  }

  /**
   * Izračunaj strošek naloge
   */
  calculateCost(hourlyRate: number): Money {
    const hours = (this.actualDuration || this.estimatedDuration) / 60
    const cost = new Money(hours * hourlyRate, 'EUR')
    this.cost = cost
    return cost
  }

  /**
   * Preveri ali je naloga zapadla
   */
  isOverdue(): boolean {
    return this.status !== 'completed' && this.status !== 'cancelled' && new Date() > this.dueDate
  }

  /**
   * Preveri ali je naloga nujna
   */
  isUrgent(): boolean {
    return this.priority === 'urgent' || (this.isOverdue() && this.priority === 'high')
  }

  /**
   * Pretvori v Plain Object
   */
  toObject(): HousekeepingTaskData {
    return {
      id: this.id,
      propertyId: this.propertyId,
      roomId: this.roomId,
      reservationId: this.reservationId,
      type: this.type,
      priority: this.priority,
      status: this.status,
      title: this.title,
      description: this.description,
      assignedTo: this.assignedTo,
      assignedBy: this.assignedBy,
      dueDate: this.dueDate,
      estimatedDuration: this.estimatedDuration,
      actualDuration: this.actualDuration,
      completedAt: this.completedAt,
      notes: this.notes,
      checklist: this.checklist,
      cost: this.cost,
      metadata: this.metadata
    }
  }

  /**
   * Pretvori v JSON
   */
  toJSON(): any {
    return {
      ...this.toObject(),
      dueDate: this.dueDate.toISOString(),
      completedAt: this.completedAt?.toISOString(),
      cost: this.cost?.toJSON()
    }
  }

  /**
   * Ustvari iz JSON
   */
  static fromJSON(json: any): HousekeepingTask {
    return new HousekeepingTask({
      ...json,
      dueDate: new Date(json.dueDate),
      completedAt: json.completedAt ? new Date(json.completedAt) : undefined,
      cost: json.cost ? Money.fromJSON(json.cost) : undefined
    })
  }

  /**
   * Ustvari novo nalogo
   */
  static create(data: Omit<HousekeepingTaskData, 'id' | 'status'>): HousekeepingTask {
    return new HousekeepingTask({
      ...data,
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending'
    })
  }

  /**
   * Ustvari cleaning task ob checkout-u
   */
  static createFromCheckout(
    propertyId: string,
    roomId: string,
    reservationId: string,
    checkoutTime: Date,
    assignedBy: string
  ): HousekeepingTask {
    const dueDate = new Date(checkoutTime)
    dueDate.setHours(dueDate.getHours() + 2) // Cleaning due within 2 hours of checkout

    return HousekeepingTask.create({
      propertyId,
      roomId,
      reservationId,
      type: 'cleaning',
      priority: 'high',
      status: 'pending',
      title: 'Čiščenje sobe po checkout-u',
      description: 'Popolno čiščenje sobe po odhodu gosta',
      assignedBy,
      dueDate,
      estimatedDuration: 45, // 45 minutes
      checklist: [
        { id: '1', description: 'Zamenjaj posteljnino', completed: false },
        { id: '2', description: 'Počisti kopalnico', completed: false },
        { id: '3', description: 'Pocesi tla', completed: false },
        { id: '4', description: 'Prezrači sobo', completed: false },
        { id: '5', description: 'Dopolni minibar', completed: false },
        { id: '6', description: 'Preveri inventar', completed: false }
      ]
    })
  }
}
