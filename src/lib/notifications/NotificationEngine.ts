/**
 * Notification Engine
 * Comprehensive push notification system for hotel operations
 */

import webpush from 'web-push';
import {
  NotificationMessage,
  NotificationSubscription,
  NotificationPreferences,
  NotificationQueue,
  NotificationDelivery,
  NotificationStats,
  NotificationEngine,
  NotificationConfig,
  PushNotificationPayload,
  NotificationResponse,
  NotificationType,
  NotificationPriority,
  NotificationCategory,
} from '@/types/notifications';

export class NotificationEngineImpl implements NotificationEngine {
  private config: NotificationConfig;
  private queue: Map<string, NotificationQueue> = new Map();
  private deliveries: Map<string, NotificationDelivery[]> = new Map();
  private subscriptions: Map<string, NotificationSubscription> = new Map();
  private processingQueue: boolean = false;

  constructor(config: NotificationConfig) {
    this.config = config;
    this.initializeWebPush();
    this.startQueueProcessor();
  }

  private initializeWebPush(): void {
    webpush.setVapidDetails(
      this.config.vapidKeys.subject,
      this.config.vapidKeys.publicKey,
      this.config.vapidKeys.privateKey
    );
  }

  /**
   * Subscribe a user to push notifications
   */
  async subscribe(subscriptionData: Omit<NotificationSubscription, 'id' | 'createdAt' | 'updatedAt' | 'lastActiveAt'>): Promise<NotificationSubscription> {
    const subscription: NotificationSubscription = {
      ...subscriptionData,
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastActiveAt: new Date(),
    };

    // Validate subscription
    this.validateSubscription(subscription);

    // Store subscription
    this.subscriptions.set(subscription.id, subscription);

    console.log(`📱 User ${subscription.userId} subscribed to notifications for property ${subscription.propertyId}`);
    return subscription;
  }

  /**
   * Unsubscribe a user from push notifications
   */
  async unsubscribe(subscriptionId: string): Promise<void> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      this.subscriptions.delete(subscriptionId);
      console.log(`📱 User ${subscription.userId} unsubscribed from notifications`);
    }
  }

  /**
   * Send notification to specific users
   */
  async send(
    message: Omit<NotificationMessage, 'id' | 'timestamp'>,
    targetUsers?: string[],
    targetProperties?: string[]
  ): Promise<NotificationQueue> {
    const notificationMessage: NotificationMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    // Find target subscriptions
    const targetSubscriptions = this.findTargetSubscriptions(targetUsers, targetProperties);
    
    if (targetSubscriptions.length === 0) {
      throw new Error('No active subscriptions found for target audience');
    }

    // Create queue entry
    const queueEntry: NotificationQueue = {
      id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      message: notificationMessage,
      subscriptions: targetSubscriptions,
      status: 'pending',
      attempts: 0,
      maxAttempts: this.config.maxRetries,
      nextAttemptAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.queue.set(queueEntry.id, queueEntry);

    // Trigger queue processing
    this.processQueue();

    console.log(`📤 Notification queued for ${targetSubscriptions.length} subscribers`);
    return queueEntry;
  }

  /**
   * Send notification to a specific user
   */
  async sendToUser(userId: string, message: Omit<NotificationMessage, 'id' | 'timestamp'>): Promise<NotificationQueue> {
    return this.send(message, [userId]);
  }

  /**
   * Send notification to all users in a property
   */
  async sendToProperty(propertyId: string, message: Omit<NotificationMessage, 'id' | 'timestamp'>): Promise<NotificationQueue> {
    return this.send(message, undefined, [propertyId]);
  }

  /**
   * Send notification to users by category
   */
  async sendToCategory(category: NotificationCategory, message: Omit<NotificationMessage, 'id' | 'timestamp'>): Promise<NotificationQueue> {
    const targetSubscriptions = Array.from(this.subscriptions.values()).filter(
      sub => sub.isActive && sub.preferences.categories[category]
    );

    if (targetSubscriptions.length === 0) {
      throw new Error(`No active subscriptions found for category: ${category}`);
    }

    const notificationMessage: NotificationMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    const queueEntry: NotificationQueue = {
      id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      message: notificationMessage,
      subscriptions: targetSubscriptions,
      status: 'pending',
      attempts: 0,
      maxAttempts: this.config.maxRetries,
      nextAttemptAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.queue.set(queueEntry.id, queueEntry);
    this.processQueue();

    return queueEntry;
  }

  /**
   * Update user notification preferences
   */
  async updatePreferences(subscriptionId: string, preferences: Partial<NotificationPreferences>): Promise<void> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    subscription.preferences = { ...subscription.preferences, ...preferences };
    subscription.updatedAt = new Date();

    console.log(`⚙️ Updated preferences for user ${subscription.userId}`);
  }

  /**
   * Get notification statistics
   */
  async getStats(propertyId?: string, startDate?: Date, endDate?: Date): Promise<NotificationStats> {
    const allQueues = Array.from(this.queue.values());
    const allDeliveries = Array.from(this.deliveries.values()).flat();

    // Filter by property and date range if specified
    const filteredQueues = allQueues.filter(queue => {
      if (propertyId && queue.message.data?.propertyId !== propertyId) return false;
      if (startDate && queue.createdAt < startDate) return false;
      if (endDate && queue.createdAt > endDate) return false;
      return true;
    });

    const filteredDeliveries = allDeliveries.filter(delivery => {
      const queue = this.queue.get(delivery.queueId);
      if (!queue) return false;
      if (propertyId && queue.message.data?.propertyId !== propertyId) return false;
      if (startDate && delivery.createdAt < startDate) return false;
      if (endDate && delivery.createdAt > endDate) return false;
      return true;
    });

    // Calculate stats
    const totalSent = filteredQueues.reduce((sum, queue) => sum + queue.subscriptions.length, 0);
    const totalDelivered = filteredDeliveries.filter(d => d.status === 'delivered').length;
    const totalFailed = filteredDeliveries.filter(d => d.status === 'failed').length;
    const totalExpired = filteredDeliveries.filter(d => d.status === 'expired').length;
    const deliveryRate = totalSent > 0 ? totalDelivered / totalSent : 0;

    // Calculate category stats
    const categoryStats: Record<NotificationCategory, any> = {} as any;
    const priorityStats: Record<NotificationPriority, any> = {} as any;

    filteredQueues.forEach(queue => {
      const category = queue.message.data?.category || 'administrative';
      const priority = queue.message.data?.priority || 'medium';

      if (!categoryStats[category]) {
        categoryStats[category] = { sent: 0, delivered: 0, failed: 0, deliveryRate: 0 };
      }
      if (!priorityStats[priority]) {
        priorityStats[priority] = { sent: 0, delivered: 0, failed: 0, deliveryRate: 0 };
      }

      categoryStats[category].sent += queue.subscriptions.length;
      priorityStats[priority].sent += queue.subscriptions.length;
    });

    filteredDeliveries.forEach(delivery => {
      const queue = this.queue.get(delivery.queueId);
      if (!queue) return;

      const category = queue.message.data?.category || 'administrative';
      const priority = queue.message.data?.priority || 'medium';

      if (delivery.status === 'delivered') {
        categoryStats[category]?.delivered++;
        priorityStats[priority]?.delivered++;
      } else if (delivery.status === 'failed') {
        categoryStats[category]?.failed++;
        priorityStats[priority]?.failed++;
      }
    });

    // Calculate delivery rates
    Object.keys(categoryStats).forEach(category => {
      const stats = categoryStats[category as NotificationCategory];
      stats.deliveryRate = stats.sent > 0 ? stats.delivered / stats.sent : 0;
    });

    Object.keys(priorityStats).forEach(priority => {
      const stats = priorityStats[priority as NotificationPriority];
      stats.deliveryRate = stats.sent > 0 ? stats.delivered / stats.sent : 0;
    });

    // Device stats
    const activeDevices = Array.from(this.subscriptions.values()).filter(sub => sub.isActive).length;
    const inactiveDevices = this.subscriptions.size - activeDevices;

    return {
      totalSent,
      totalDelivered,
      totalFailed,
      totalExpired,
      deliveryRate,
      averageDeliveryTime: this.calculateAverageDeliveryTime(filteredDeliveries),
      categoryStats,
      priorityStats,
      deviceStats: {
        totalDevices: this.subscriptions.size,
        activeDevices,
        inactiveDevices,
      },
    };
  }

  /**
   * Get delivery status for a specific notification
   */
  async getDeliveryStatus(queueId: string): Promise<NotificationDelivery[]> {
    return this.deliveries.get(queueId) || [];
  }

  /**
   * Mark notification as read
   */
  async markAsRead(messageId: string, userId: string): Promise<void> {
    // This would typically update a database record
    // For now, we'll just log it
    console.log(`📖 Message ${messageId} marked as read by user ${userId}`);
  }

  /**
   * Schedule notification for future delivery
   */
  async scheduleNotification(
    message: Omit<NotificationMessage, 'id' | 'timestamp'>,
    scheduledAt: Date,
    targetUsers?: string[]
  ): Promise<NotificationQueue> {
    const notificationMessage: NotificationMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    // Find target subscriptions
    const targetSubscriptions = this.findTargetSubscriptions(targetUsers);
    
    if (targetSubscriptions.length === 0) {
      throw new Error('No active subscriptions found for target audience');
    }

    // Create queue entry with scheduled time
    const queueEntry: NotificationQueue = {
      id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      message: notificationMessage,
      subscriptions: targetSubscriptions,
      status: 'pending',
      attempts: 0,
      maxAttempts: this.config.maxRetries,
      nextAttemptAt: scheduledAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.queue.set(queueEntry.id, queueEntry);

    console.log(`⏰ Notification scheduled for ${scheduledAt.toISOString()}`);
    return queueEntry;
  }

  /**
   * Private methods
   */
  private validateSubscription(subscription: NotificationSubscription): void {
    if (!subscription.endpoint) {
      throw new Error('Subscription endpoint is required');
    }

    if (!subscription.keys?.p256dh || !subscription.keys?.auth) {
      throw new Error('Subscription keys are required');
    }

    if (!subscription.userId || !subscription.propertyId) {
      throw new Error('User ID and Property ID are required');
    }
  }

  private findTargetSubscriptions(targetUsers?: string[], targetProperties?: string[]): NotificationSubscription[] {
    return Array.from(this.subscriptions.values()).filter(subscription => {
      if (!subscription.isActive) return false;

      // Check user filter
      if (targetUsers && !targetUsers.includes(subscription.userId)) return false;

      // Check property filter
      if (targetProperties && !targetProperties.includes(subscription.propertyId)) return false;

      return true;
    });
  }

  private async processQueue(): Promise<void> {
    if (this.processingQueue) return;

    this.processingQueue = true;

    try {
      const now = new Date();
      const pendingQueues = Array.from(this.queue.values()).filter(
        queue => queue.status === 'pending' && queue.nextAttemptAt <= now
      );

      // Process in batches
      for (let i = 0; i < pendingQueues.length; i += this.config.batchSize) {
        const batch = pendingQueues.slice(i, i + this.config.batchSize);
        await Promise.all(batch.map(queue => this.processQueueEntry(queue)));
      }
    } finally {
      this.processingQueue = false;
    }
  }

  private async processQueueEntry(queue: NotificationQueue): Promise<void> {
    try {
      queue.status = 'processing';
      queue.updatedAt = new Date();

      const deliveries: NotificationDelivery[] = [];

      // Process each subscription
      for (const subscription of queue.subscriptions) {
        const delivery = await this.sendToSubscription(queue.message, subscription);
        deliveries.push(delivery);
      }

      // Store deliveries
      this.deliveries.set(queue.id, deliveries);

      // Update queue status
      const successfulDeliveries = deliveries.filter(d => d.status === 'delivered');
      const failedDeliveries = deliveries.filter(d => d.status === 'failed');

      if (successfulDeliveries.length === queue.subscriptions.length) {
        queue.status = 'sent';
        queue.sentAt = new Date();
      } else if (failedDeliveries.length === queue.subscriptions.length) {
        queue.status = 'failed';
        queue.failedAt = new Date();
      } else {
        // Partial success - retry failed ones
        queue.status = 'pending';
        queue.attempts++;
        queue.nextAttemptAt = new Date(Date.now() + this.config.retryDelay * 1000);
      }

      queue.updatedAt = new Date();

      console.log(`📤 Processed queue ${queue.id}: ${successfulDeliveries.length}/${queue.subscriptions.length} delivered`);

    } catch (error) {
      console.error(`❌ Error processing queue ${queue.id}:`, error);
      queue.status = 'failed';
      queue.failedAt = new Date();
      queue.error = error instanceof Error ? error.message : 'Unknown error';
      queue.updatedAt = new Date();
    }
  }

  private async sendToSubscription(message: NotificationMessage, subscription: NotificationSubscription): Promise<NotificationDelivery> {
    const delivery: NotificationDelivery = {
      id: `del_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      queueId: '', // Will be set by caller
      subscriptionId: subscription.id,
      status: 'delivered',
      createdAt: new Date(),
    };

    try {
      // Check quiet hours
      if (this.isQuietHours(subscription.preferences)) {
        delivery.status = 'expired';
        delivery.failedAt = new Date();
        delivery.error = 'Quiet hours - notification not delivered';
        return delivery;
      }

      // Check preferences
      if (!subscription.preferences.enabled) {
        delivery.status = 'expired';
        delivery.failedAt = new Date();
        delivery.error = 'Notifications disabled';
        return delivery;
      }

      const category = message.data?.category;
      const priority = message.data?.priority;

      if (category && !subscription.preferences.categories[category]) {
        delivery.status = 'expired';
        delivery.failedAt = new Date();
        delivery.error = `Category ${category} disabled`;
        return delivery;
      }

      if (priority && !subscription.preferences.priorities[priority]) {
        delivery.status = 'expired';
        delivery.failedAt = new Date();
        delivery.error = `Priority ${priority} disabled`;
        return delivery;
      }

      // Prepare push payload
      const payload: PushNotificationPayload = {
        title: message.title,
        body: message.body,
        icon: message.icon,
        image: message.image,
        badge: message.badge,
        tag: message.tag,
        data: message.data,
        actions: message.actions,
        requireInteraction: message.requireInteraction,
        silent: message.silent,
        ttl: this.config.defaultTTL,
        urgency: this.getUrgency(priority),
      };

      // Send push notification
      const response = await this.sendPushNotification(subscription, payload);

      delivery.status = response.success ? 'delivered' : 'failed';
      delivery.deliveredAt = response.success ? new Date() : undefined;
      delivery.failedAt = response.success ? undefined : new Date();
      delivery.error = response.error;
      delivery.response = response;

      return delivery;

    } catch (error) {
      delivery.status = 'failed';
      delivery.failedAt = new Date();
      delivery.error = error instanceof Error ? error.message : 'Unknown error';
      return delivery;
    }
  }

  private async sendPushNotification(subscription: NotificationSubscription, payload: PushNotificationPayload): Promise<NotificationResponse> {
    try {
      const pushSubscription = {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      };

      const result = await webpush.sendNotification(pushSubscription, JSON.stringify(payload), {
        TTL: this.config.defaultTTL,
        urgency: payload.urgency,
      });

      return {
        success: true,
        statusCode: result.statusCode,
        headers: result.headers as Record<string, string>,
      };

    } catch (error: any) {
      if (error.statusCode === 410) {
        // Subscription expired - remove it
        this.subscriptions.delete(subscription.id);
        console.log(`🗑️ Removed expired subscription ${subscription.id}`);
      }

      return {
        success: false,
        error: error.message,
        statusCode: error.statusCode,
      };
    }
  }

  private isQuietHours(preferences: NotificationPreferences): boolean {
    if (!preferences.quietHours.enabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = preferences.quietHours.start.split(':').map(Number);
    const [endHour, endMin] = preferences.quietHours.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Overnight quiet hours (e.g., 22:00 to 06:00)
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  private getUrgency(priority?: NotificationPriority): 'low' | 'normal' | 'high' {
    switch (priority) {
      case 'low':
        return 'low';
      case 'medium':
        return 'normal';
      case 'high':
      case 'urgent':
      case 'critical':
        return 'high';
      default:
        return 'normal';
    }
  }

  private calculateAverageDeliveryTime(deliveries: NotificationDelivery[]): number {
    const successfulDeliveries = deliveries.filter(d => d.status === 'delivered' && d.deliveredAt);
    if (successfulDeliveries.length === 0) return 0;

    const totalTime = successfulDeliveries.reduce((sum, delivery) => {
      const queue = this.queue.get(delivery.queueId);
      if (!queue) return sum;
      return sum + (delivery.deliveredAt!.getTime() - queue.createdAt.getTime());
    }, 0);

    return totalTime / successfulDeliveries.length;
  }

  private startQueueProcessor(): void {
    // Process queue every 30 seconds
    setInterval(() => {
      this.processQueue();
    }, 30000);

    // Clean up old queues and deliveries
    setInterval(() => {
      this.cleanup();
    }, 3600000); // Every hour
  }

  private cleanup(): void {
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

    // Clean up old queues
    for (const [id, queue] of this.queue.entries()) {
      if (queue.createdAt < cutoffDate) {
        this.queue.delete(id);
      }
    }

    // Clean up old deliveries
    for (const [id, deliveries] of this.deliveries.entries()) {
      const filteredDeliveries = deliveries.filter(d => d.createdAt >= cutoffDate);
      if (filteredDeliveries.length === 0) {
        this.deliveries.delete(id);
      } else {
        this.deliveries.set(id, filteredDeliveries);
      }
    }

    console.log('🧹 Cleaned up old notifications');
  }
}
