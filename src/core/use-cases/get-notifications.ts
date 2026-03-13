/**
 * Use Case: Get Notifications
 * 
 * Get notifications for user.
 */

// ============================================================================
// Input/Output DTOs
// ============================================================================

export interface GetNotificationsInput {
  userId: string
  limit?: number
  offset?: number
  unreadOnly?: boolean
  type?: string
}

export interface GetNotificationsOutput {
  notifications: NotificationDTO[]
  total: number
  unreadCount: number
  hasMore: boolean
}

export interface NotificationDTO {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  createdAt: Date
  metadata?: Record<string, any>
}

// ============================================================================
// Use Case Class
// ============================================================================

export class GetNotifications {
  constructor(
    private notificationRepository: NotificationRepository
  ) {}

  /**
   * Get notifications for user
   */
  async execute(input: GetNotificationsInput): Promise<GetNotificationsOutput> {
    const { userId, limit = 20, offset = 0, unreadOnly = false, type } = input

    // 1. Get notifications
    const notifications = await this.notificationRepository.findByUser(userId, {
      limit,
      offset,
      unreadOnly,
      type
    })

    // 2. Get total count
    const total = await this.notificationRepository.countByUser(userId, {
      unreadOnly,
      type
    })

    // 3. Get unread count
    const unreadCount = await this.notificationRepository.countByUser(userId, {
      unreadOnly: true
    })

    // 4. Map to DTO
    const notificationDTOs = notifications.map(this.mapToDTO)

    return {
      notifications: notificationDTOs,
      total,
      unreadCount,
      hasMore: offset + notifications.length < total
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private mapToDTO(notification: any): NotificationDTO {
    return {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      read: notification.read,
      createdAt: notification.createdAt,
      metadata: notification.metadata
    }
  }
}

// ============================================================================
// Repository Interfaces
// ============================================================================

export interface NotificationRepository {
  findByUser(
    userId: string,
    options?: {
      limit?: number
      offset?: number
      unreadOnly?: boolean
      type?: string
    }
  ): Promise<any[]>

  countByUser(
    userId: string,
    options?: {
      unreadOnly?: boolean
      type?: string
    }
  ): Promise<number>
}
