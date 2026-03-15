/**
 * Use Case: Assign Housekeeping Task
 * 
 * Dodeli nalogo osebju in obvesti.
 */

import { HousekeepingTask } from '../domain/tourism/entities/housekeeping-task'
import { logger } from '@/infrastructure/observability/logger';

// ============================================================================
// Input/Output DTOs
// ============================================================================

export interface AssignTaskInput {
  taskId: string
  staffId: string
  assignedBy: string
  notifyStaff?: boolean
}

export interface AssignTaskOutput {
  task: HousekeepingTask
  assignedTo: string
  assignedBy: string
  notified: boolean
}

// ============================================================================
// Use Case Class
// ============================================================================

export class AssignTask {
  constructor(
    private taskRepository: HousekeepingTaskRepository,
    private notificationService: NotificationService
  ) {}

  /**
   * Dodeli nalogo osebju
   */
  async execute(input: AssignTaskInput): Promise<AssignTaskOutput> {
    const { taskId, staffId, assignedBy, notifyStaff } = input

    // 1. Pridobi task
    const task = await this.taskRepository.findById(taskId)
    
    if (!task) {
      throw new Error(`Task ${taskId} not found`)
    }

    // 2. Validiraj status
    if (task.status !== 'pending' && task.status !== 'assigned') {
      throw new Error(`Cannot assign task with status: ${task.status}`)
    }

    // 3. Dodeli osebju
    task.assignTo(staffId)

    // 4. Shrani
    await this.taskRepository.save(task)

    // 5. Obvesti osebje
    let notified = false
    if (notifyStaff !== false) {
      notified = await this.notifyStaff(task, staffId, assignedBy)
    }

    // 6. Vrni rezultat
    return {
      task,
      assignedTo: staffId,
      assignedBy,
      notified
    }
  }

  /**
   * Obvesti osebje o dodelitvi
   */
  private async notifyStaff(
    task: HousekeepingTask,
    staffId: string,
    assignedBy: string
  ): Promise<boolean> {
    try {
      // TODO: Get staff contact info from repository
      // const staff = await staffRepository.findById(staffId)
      
      const message = {
        to: staffId,
        type: 'task_assignment',
        title: 'Nova naloga',
        body: `Dodeljena vam je naloga: ${task.title}`,
        data: {
          taskId: task.id,
          propertyId: task.propertyId,
          roomId: task.roomId,
          priority: task.priority,
          dueDate: task.dueDate
        }
      }

      // Send notification (SMS, push, in-app)
      // await this.notificationService.send(message)
      
      logger.info('Notifying staff:', message)
      return true
    } catch (error) {
      logger.error('Failed to notify staff:', error)
      return false
    }
  }
}

// ============================================================================
// Service Interfaces
// ============================================================================

export interface NotificationService {
  send(message: NotificationMessage): Promise<boolean>
}

export interface NotificationMessage {
  to: string
  type: string
  title: string
  body: string
  data?: Record<string, any>
}

// Re-export repository interface
export { HousekeepingTaskRepository } from './create-cleaning-task'
