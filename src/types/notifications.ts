/**
 * Notification Types and Interfaces
 */

export interface NotificationMessage {
  id: string;
  title: string;
  body: string;
  icon?: string;
  image?: string;
  badge?: string;
  tag?: string;
  data?: NotificationData;
  actions?: NotificationAction[];
  requireInteraction?: boolean;
  silent?: boolean;
  timestamp: Date;
  expiresAt?: Date;
}

export interface NotificationData {
  type: NotificationType;
  propertyId: string;
  roomId?: string;
  reservationId?: string;
  guestId?: string;
  taskId?: string;
  userId?: string;
  priority: NotificationPriority;
  category: NotificationCategory;
  metadata?: Record<string, any>;
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
  input?: string;
  placeholder?: string;
}

export type NotificationType = 
  | 'room_status_update'
  | 'housekeeping_request'
  | 'maintenance_request'
  | 'check_in_notification'
  | 'check_out_notification'
  | 'guest_message'
  | 'staff_alert'
  | 'system_notification'
  | 'emergency_alert'
  | 'task_assignment'
  | 'task_completed'
  | 'reservation_update'
  | 'payment_received'
  | 'inventory_alert';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent' | 'critical';

export type NotificationCategory = 
  | 'housekeeping'
  | 'maintenance'
  | 'reception'
  | 'management'
  | 'security'
  | 'guest_services'
  | 'administrative'
  | 'emergency';

export interface NotificationSubscription {
  id: string;
  userId: string;
  propertyId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  deviceInfo: DeviceInfo;
  preferences: NotificationPreferences;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt: Date;
}

export interface DeviceInfo {
  userAgent: string;
  platform: string;
  version: string;
  model?: string;
  manufacturer?: string;
  screenWidth: number;
  screenHeight: number;
  language: string;
  timezone: string;
}

export interface NotificationPreferences {
  enabled: boolean;
  categories: Record<NotificationCategory, boolean>;
  priorities: Record<NotificationPriority, boolean>;
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string;   // HH:mm format
    timezone: string;
  };
  sound: boolean;
  vibration: boolean;
  badge: boolean;
  emailFallback: boolean;
  smsFallback: boolean;
}

export interface NotificationTemplate {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  body: string;
  icon?: string;
  actions?: NotificationAction[];
  variables: TemplateVariable[];
  conditions: TemplateCondition[];
  translations: Record<string, NotificationTemplateTranslation>;
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  required: boolean;
  defaultValue?: any;
  description: string;
}

export interface TemplateCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains';
  value: any;
}

export interface NotificationTemplateTranslation {
  title: string;
  body: string;
  actions?: Array<{
    action: string;
    title: string;
  }>;
}

export interface NotificationQueue {
  id: string;
  message: NotificationMessage;
  subscriptions: NotificationSubscription[];
  status: 'pending' | 'processing' | 'sent' | 'failed' | 'expired';
  attempts: number;
  maxAttempts: number;
  nextAttemptAt: Date;
  sentAt?: Date;
  failedAt?: Date;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationDelivery {
  id: string;
  queueId: string;
  subscriptionId: string;
  status: 'delivered' | 'failed' | 'expired' | 'rejected';
  deliveredAt?: Date;
  failedAt?: Date;
  error?: string;
  response?: any;
  createdAt: Date;
}

export interface NotificationStats {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  totalExpired: number;
  deliveryRate: number;
  averageDeliveryTime: number;
  categoryStats: Record<NotificationCategory, {
    sent: number;
    delivered: number;
    failed: number;
    deliveryRate: number;
  }>;
  priorityStats: Record<NotificationPriority, {
    sent: number;
    delivered: number;
    failed: number;
    deliveryRate: number;
  }>;
  deviceStats: {
    totalDevices: number;
    activeDevices: number;
    inactiveDevices: number;
  };
}

export interface NotificationEngine {
  subscribe: (subscription: Omit<NotificationSubscription, 'id' | 'createdAt' | 'updatedAt' | 'lastActiveAt'>) => Promise<NotificationSubscription>;
  unsubscribe: (subscriptionId: string) => Promise<void>;
  send: (message: Omit<NotificationMessage, 'id' | 'timestamp'>, targetUsers?: string[], targetProperties?: string[]) => Promise<NotificationQueue>;
  sendToUser: (userId: string, message: Omit<NotificationMessage, 'id' | 'timestamp'>) => Promise<NotificationQueue>;
  sendToProperty: (propertyId: string, message: Omit<NotificationMessage, 'id' | 'timestamp'>) => Promise<NotificationQueue>;
  sendToCategory: (category: NotificationCategory, message: Omit<NotificationMessage, 'id' | 'timestamp'>) => Promise<NotificationQueue>;
  updatePreferences: (subscriptionId: string, preferences: Partial<NotificationPreferences>) => Promise<void>;
  getStats: (propertyId?: string, startDate?: Date, endDate?: Date) => Promise<NotificationStats>;
  getDeliveryStatus: (queueId: string) => Promise<NotificationDelivery[]>;
  markAsRead: (messageId: string, userId: string) => Promise<void>;
  scheduleNotification: (message: Omit<NotificationMessage, 'id' | 'timestamp'>, scheduledAt: Date, targetUsers?: string[]) => Promise<NotificationQueue>;
}

export interface NotificationConfig {
  vapidKeys: {
    publicKey: string;
    privateKey: string;
    subject: string;
  };
  defaultTTL: number; // Time to live in seconds
  maxRetries: number;
  retryDelay: number; // in seconds
  batchSize: number;
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
    timezone: string;
  };
  fallbackMethods: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  image?: string;
  badge?: string;
  tag?: string;
  data?: NotificationData;
  actions?: NotificationAction[];
  requireInteraction?: boolean;
  silent?: boolean;
  ttl?: number;
  urgency?: 'low' | 'normal' | 'high';
  topic?: string;
}

export interface NotificationResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  statusCode?: number;
  headers?: Record<string, string>;
}

export interface MobileAppConfig {
  serviceWorkerUrl: string;
  vapidPublicKey: string;
  enableBackgroundSync: boolean;
  enableOfflineSupport: boolean;
  cacheNotifications: boolean;
  maxCachedNotifications: number;
  syncInterval: number; // in seconds
}

export interface NotificationHistory {
  id: string;
  userId: string;
  messageId: string;
  type: NotificationType;
  title: string;
  body: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  deliveredAt?: Date;
  readAt?: Date;
  createdAt: Date;
  metadata?: Record<string, any>;
}

export interface NotificationAnalytics {
  openRate: number;
  clickRate: number;
  conversionRate: number;
  averageReadTime: number;
  deviceBreakdown: Record<string, number>;
  timeOfDayBreakdown: Record<string, number>;
  categoryPerformance: Record<NotificationCategory, {
    sent: number;
    opened: number;
    clicked: number;
    converted: number;
  }>;
}
