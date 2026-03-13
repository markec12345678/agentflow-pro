/**
 * Use Case: Create Cleaning Task
 * 
 * Avtomatsko ustvari nalogo za čiščenje ob checkout-u gosta.
 */

import { HousekeepingTask } from '../domain/tourism/entities/housekeeping-task'
import { Reservation } from '../domain/tourism/entities/reservation'

// ============================================================================
// Input/Output DTOs
// ============================================================================

export interface CreateCleaningTaskInput {
  reservation: Reservation
  propertyId: string
  roomId: string
  checkoutTime: Date
  assignedBy: string // Manager who assigns
  autoAssign?: boolean
  staffId?: string
}

export interface CreateCleaningTaskOutput {
  task: HousekeepingTask
  taskId: string
  assignedTo?: string
  dueDate: Date
}

// ============================================================================
// Use Case Class
// ============================================================================

export class CreateCleaningTask {
  constructor(
    private taskRepository: HousekeepingTaskRepository
  ) {}

  /**
   * Ustvari nalogo za čiščenje
   */
  async execute(input: CreateCleaningTaskInput): Promise<CreateCleaningTaskOutput> {
    const { reservation, propertyId, roomId, checkoutTime, assignedBy, autoAssign, staffId } = input

    // 1. Validacija
    this.validateCheckout(reservation, checkoutTime)

    // 2. Ustvari task
    const task = HousekeepingTask.createFromCheckout(
      propertyId,
      roomId,
      reservation.id,
      checkoutTime,
      assignedBy
    )

    // 3. Prilagodi prioriteto glede na occupancy
    this.adjustPriorityBasedOnOccupancy(task, reservation)

    // 4. Avtomatska dodelitev (če je omogočeno)
    if (autoAssign && staffId) {
      task.assignTo(staffId)
    }

    // 5. Shrani task
    await this.taskRepository.save(task)

    // 6. Vrni rezultat
    return {
      task,
      taskId: task.id,
      assignedTo: task.assignedTo,
      dueDate: task.dueDate
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Validiraj checkout
   */
  private validateCheckout(reservation: Reservation, checkoutTime: Date): void {
    if (reservation.status !== 'checked_out') {
      throw new Error('Can only create cleaning task for checked-out reservations')
    }

    if (checkoutTime > new Date()) {
      throw new Error('Checkout time cannot be in the future')
    }
  }

  /**
   * Prilagodi prioriteto glede na zasedenost
   */
  private adjustPriorityBasedOnOccupancy(
    task: HousekeepingTask,
    reservation: Reservation
  ): void {
    const today = new Date()
    const nextCheckIn = this.getNextCheckInDate() // TODO: Get from reservations

    // Če je naslednji check-in danes, povečaj prioriteto
    if (nextCheckIn && nextCheckIn.toDateString() === today.toDateString()) {
      task.updatePriority('urgent')
      // Due date within 1 hour
      task.updateDueDate(new Date(today.getTime() + 60 * 60 * 1000))
    }
    // Če je naslednji check-in jutri, srednja prioriteta
    else if (nextCheckIn) {
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      if (nextCheckIn.toDateString() === tomorrow.toDateString()) {
        task.updatePriority('high')
      }
    }
  }

  /**
   * Pridobi datum naslednjega check-in-a za sobo
   */
  private getNextCheckInDate(): Date | null {
    // TODO: Query next reservation for the room
    // This is a placeholder
    return null
  }
}

// ============================================================================
// Repository Interface
// ============================================================================

export interface HousekeepingTaskRepository {
  findById(id: string): Promise<HousekeepingTask | null>
  findByProperty(propertyId: string): Promise<HousekeepingTask[]>
  findByRoom(roomId: string): Promise<HousekeepingTask[]>
  findByStaff(staffId: string): Promise<HousekeepingTask[]>
  findByStatus(status: string): Promise<HousekeepingTask[]>
  findByReservation(reservationId: string): Promise<HousekeepingTask | null>
  save(task: HousekeepingTask): Promise<void>
  delete(id: string): Promise<void>
}
