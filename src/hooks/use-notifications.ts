/**
 * React Hook for Push Notifications
 */

import { useState, useEffect, useCallback } from 'react';
import {
  NotificationSubscription,
  NotificationPreferences,
  NotificationMessage,
  NotificationStats,
  NotificationEngine,
  NotificationConfig,
  NotificationType,
  NotificationPriority,
  NotificationCategory,
} from '@/types/notifications';
import { toast } from 'sonner';

interface UseNotificationsOptions {
  userId: string;
  propertyId: string;
  config?: Partial<NotificationConfig>;
}

interface UseNotificationsReturn {
  // State
  isSubscribed: boolean;
  isSupported: boolean;
  subscription: NotificationSubscription | null;
  stats: NotificationStats | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
  sendNotification: (message: Omit<NotificationMessage, 'id' | 'timestamp'>) => Promise<void>;
  sendToUser: (userId: string, message: Omit<NotificationMessage, 'id' | 'timestamp'>) => Promise<void>;
  sendToProperty: (message: Omit<NotificationMessage, 'id' | 'timestamp'>) => Promise<void>;
  sendToCategory: (category: NotificationCategory, message: Omit<NotificationMessage, 'id' | 'timestamp'>) => Promise<void>;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => Promise<void>;
  getStats: () => Promise<void>;
  requestPermission: () => Promise<boolean>;
  
  // Utilities
  createMessage: (type: NotificationType, title: string, body: string, data?: any) => Omit<NotificationMessage, 'id' | 'timestamp'>;
  createHousekeepingMessage: (roomId: string, task: string) => Omit<NotificationMessage, 'id' | 'timestamp'>;
  createMaintenanceMessage: (roomId: string, issue: string) => Omit<NotificationMessage, 'id' | 'timestamp'>;
  createCheckInMessage: (guestName: string, roomId: string) => Omit<NotificationMessage, 'id' | 'timestamp'>;
  createCheckOutMessage: (guestName: string, roomId: string) => Omit<NotificationMessage, 'id' | 'timestamp'>;
}

const defaultConfig: NotificationConfig = {
  vapidKeys: {
    publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
    privateKey: process.env.VAPID_PRIVATE_KEY || '',
    subject: 'mailto:notifications@agentflow-pro.com',
  },
  defaultTTL: 3600, // 1 hour
  maxRetries: 3,
  retryDelay: 60, // 1 minute
  batchSize: 100,
  rateLimit: {
    windowMs: 900000, // 15 minutes
    maxRequests: 100,
  },
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '06:00',
    timezone: 'UTC',
  },
  fallbackMethods: {
    email: true,
    sms: false,
    push: true,
  },
};

const defaultPreferences: NotificationPreferences = {
  enabled: true,
  categories: {
    housekeeping: true,
    maintenance: true,
    reception: true,
    management: true,
    security: true,
    guest_services: true,
    administrative: true,
    emergency: true,
  },
  priorities: {
    low: true,
    medium: true,
    high: true,
    urgent: true,
    critical: true,
  },
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '06:00',
    timezone: 'UTC',
  },
  sound: true,
  vibration: true,
  badge: true,
  emailFallback: true,
  smsFallback: false,
};

export function useNotifications({ userId, propertyId, config = {} }: UseNotificationsOptions): UseNotificationsReturn {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<NotificationSubscription | null>(null);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notificationEngine, setNotificationEngine] = useState<NotificationEngine | null>(null);

  const currentConfig = { ...defaultConfig, ...config };

  // Check browser support
  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);
    
    if (supported) {
      // Initialize notification engine
      initializeEngine();
    }
  }, []);

  // Load existing subscription
  useEffect(() => {
    if (isSupported && userId && propertyId) {
      loadExistingSubscription();
    }
  }, [isSupported, userId, propertyId]);

  const initializeEngine = async () => {
    try {
      // This would initialize the actual notification engine
      // For now, we'll create a mock engine
      const engine = new MockNotificationEngine(currentConfig);
      setNotificationEngine(engine);
    } catch (err) {
      console.error('Failed to initialize notification engine:', err);
      setError('Failed to initialize notification system');
    }
  };

  const loadExistingSubscription = async () => {
    try {
      // Check if user has existing subscription
      const registration = await navigator.serviceWorker.ready;
      const pushSubscription = await registration.pushManager.getSubscription();
      
      if (pushSubscription) {
        // Load subscription details from server
        const subscriptionData = await loadSubscriptionFromServer();
        if (subscriptionData) {
          setSubscription(subscriptionData);
          setIsSubscribed(true);
        }
      }
    } catch (err) {
      console.error('Failed to load existing subscription:', err);
    }
  };

  const loadSubscriptionFromServer = async (): Promise<NotificationSubscription | null> => {
    try {
      const response = await fetch(`/api/notifications/subscriptions?userId=${userId}&propertyId=${propertyId}`);
      if (response.ok) {
        const data = await response.json();
        return data.subscription || null;
      }
    } catch (err) {
      console.error('Failed to load subscription from server:', err);
    }
    return null;
  };

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError('Push notifications are not supported in this browser');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        toast.success('Notification permission granted');
        return true;
      } else {
        setError('Notification permission denied');
        toast.error('Notification permission denied');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to request permission';
      setError(errorMessage);
      toast.error('Failed to request notification permission');
      return false;
    }
  }, [isSupported]);

  const subscribe = useCallback(async () => {
    if (!isSupported) {
      setError('Push notifications are not supported in this browser');
      return;
    }

    if (!notificationEngine) {
      setError('Notification engine not initialized');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Request permission first
      const hasPermission = await requestPermission();
      if (!hasPermission) return;

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Get device info
      const deviceInfo = getDeviceInfo();

      // Create push subscription
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(currentConfig.vapidKeys.publicKey),
      });

      // Create subscription data
      const subscriptionData: Omit<NotificationSubscription, 'id' | 'createdAt' | 'updatedAt' | 'lastActiveAt'> = {
        userId,
        propertyId,
        endpoint: pushSubscription.endpoint,
        keys: {
          p256dh: pushSubscription.getKey('p256dh') ? btoa(String.fromCharCode(...new Uint8Array(pushSubscription.getKey('p256dh')!))) : '',
          auth: pushSubscription.getKey('auth') ? btoa(String.fromCharCode(...new Uint8Array(pushSubscription.getKey('auth')!))) : '',
        },
        deviceInfo,
        preferences: defaultPreferences,
        isActive: true,
      };

      // Subscribe to notification engine
      const subscription = await notificationEngine.subscribe(subscriptionData);
      
      setSubscription(subscription);
      setIsSubscribed(true);
      toast.success('Successfully subscribed to notifications');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to subscribe to notifications';
      setError(errorMessage);
      toast.error('Failed to subscribe to notifications');
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, notificationEngine, userId, propertyId, currentConfig, requestPermission]);

  const unsubscribe = useCallback(async () => {
    if (!subscription || !notificationEngine) return;

    setIsLoading(true);
    setError(null);

    try {
      // Unsubscribe from push service
      const registration = await navigator.serviceWorker.ready;
      const pushSubscription = await registration.pushManager.getSubscription();
      
      if (pushSubscription) {
        await pushSubscription.unsubscribe();
      }

      // Unsubscribe from notification engine
      await notificationEngine.unsubscribe(subscription.id);
      
      setSubscription(null);
      setIsSubscribed(false);
      toast.success('Successfully unsubscribed from notifications');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to unsubscribe from notifications';
      setError(errorMessage);
      toast.error('Failed to unsubscribe from notifications');
    } finally {
      setIsLoading(false);
    }
  }, [subscription, notificationEngine]);

  const sendNotification = useCallback(async (message: Omit<NotificationMessage, 'id' | 'timestamp'>) => {
    if (!notificationEngine) {
      setError('Notification engine not initialized');
      return;
    }

    try {
      await notificationEngine.send(message);
      toast.success('Notification sent successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send notification';
      setError(errorMessage);
      toast.error('Failed to send notification');
    }
  }, [notificationEngine]);

  const sendToUser = useCallback(async (targetUserId: string, message: Omit<NotificationMessage, 'id' | 'timestamp'>) => {
    if (!notificationEngine) {
      setError('Notification engine not initialized');
      return;
    }

    try {
      await notificationEngine.sendToUser(targetUserId, message);
      toast.success('Notification sent to user successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send notification to user';
      setError(errorMessage);
      toast.error('Failed to send notification to user');
    }
  }, [notificationEngine]);

  const sendToProperty = useCallback(async (message: Omit<NotificationMessage, 'id' | 'timestamp'>) => {
    if (!notificationEngine) {
      setError('Notification engine not initialized');
      return;
    }

    try {
      await notificationEngine.sendToProperty(propertyId, message);
      toast.success('Notification sent to property successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send notification to property';
      setError(errorMessage);
      toast.error('Failed to send notification to property');
    }
  }, [notificationEngine, propertyId]);

  const sendToCategory = useCallback(async (category: NotificationCategory, message: Omit<NotificationMessage, 'id' | 'timestamp'>) => {
    if (!notificationEngine) {
      setError('Notification engine not initialized');
      return;
    }

    try {
      await notificationEngine.sendToCategory(category, message);
      toast.success(`Notification sent to ${category} successfully`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send notification to category';
      setError(errorMessage);
      toast.error(`Failed to send notification to ${category}`);
    }
  }, [notificationEngine]);

  const updatePreferences = useCallback(async (preferences: Partial<NotificationPreferences>) => {
    if (!subscription || !notificationEngine) return;

    try {
      await notificationEngine.updatePreferences(subscription.id, preferences);
      
      // Update local state
      if (subscription) {
        setSubscription({
          ...subscription,
          preferences: { ...subscription.preferences, ...preferences },
        });
      }
      
      toast.success('Notification preferences updated successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update preferences';
      setError(errorMessage);
      toast.error('Failed to update notification preferences');
    }
  }, [subscription, notificationEngine]);

  const getStats = useCallback(async () => {
    if (!notificationEngine) return;

    try {
      const stats = await notificationEngine.getStats(propertyId);
      setStats(stats);
    } catch (err) {
      console.error('Failed to get notification stats:', err);
    }
  }, [notificationEngine, propertyId]);

  // Utility functions
  const createMessage = useCallback((
    type: NotificationType,
    title: string,
    body: string,
    data?: any
  ): Omit<NotificationMessage, 'id' | 'timestamp'> => {
    return {
      title,
      body,
      data: {
        type,
        propertyId,
        priority: 'medium',
        category: 'administrative',
        ...data,
      },
    };
  }, [propertyId]);

  const createHousekeepingMessage = useCallback((roomId: string, task: string): Omit<NotificationMessage, 'id' | 'timestamp'> => {
    return createMessage('housekeeping_request', `Housekeeping Requested`, `Room ${roomId}: ${task}`, {
      roomId,
      category: 'housekeeping' as NotificationCategory,
      priority: 'medium' as NotificationPriority,
    });
  }, [createMessage]);

  const createMaintenanceMessage = useCallback((roomId: string, issue: string): Omit<NotificationMessage, 'id' | 'timestamp'> => {
    return createMessage('maintenance_request', `Maintenance Requested`, `Room ${roomId}: ${issue}`, {
      roomId,
      category: 'maintenance' as NotificationCategory,
      priority: 'high' as NotificationPriority,
    });
  }, [createMessage]);

  const createCheckInMessage = useCallback((guestName: string, roomId: string): Omit<NotificationMessage, 'id' | 'timestamp'> => {
    return createMessage('check_in_notification', 'Guest Check-in', `${guestName} checked into Room ${roomId}`, {
      roomId,
      category: 'reception' as NotificationCategory,
      priority: 'medium' as NotificationPriority,
    });
  }, [createMessage]);

  const createCheckOutMessage = useCallback((guestName: string, roomId: string): Omit<NotificationMessage, 'id' | 'timestamp'> => {
    return createMessage('check_out_notification', 'Guest Check-out', `${guestName} checked out from Room ${roomId}`, {
      roomId,
      category: 'reception' as NotificationCategory,
      priority: 'medium' as NotificationPriority,
    });
  }, [createMessage]);

  return {
    // State
    isSubscribed,
    isSupported,
    subscription,
    stats,
    isLoading,
    error,
    
    // Actions
    subscribe,
    unsubscribe,
    sendNotification,
    sendToUser,
    sendToProperty,
    sendToCategory,
    updatePreferences,
    getStats,
    requestPermission,
    
    // Utilities
    createMessage,
    createHousekeepingMessage,
    createMaintenanceMessage,
    createCheckInMessage,
    createCheckOutMessage,
  };
}

// Helper functions
function getDeviceInfo() {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    version: navigator.appVersion,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}

// Mock Notification Engine for development
class MockNotificationEngine implements NotificationEngine {
  constructor(private config: NotificationConfig) {}

  async subscribe(subscriptionData: Omit<NotificationSubscription, 'id' | 'createdAt' | 'updatedAt' | 'lastActiveAt'>): Promise<NotificationSubscription> {
    const subscription: NotificationSubscription = {
      ...subscriptionData,
      id: `mock_${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastActiveAt: new Date(),
    };
    
    console.log('📱 Mock subscription created:', subscription.id);
    return subscription;
  }

  async unsubscribe(subscriptionId: string): Promise<void> {
    console.log('📱 Mock unsubscribe:', subscriptionId);
  }

  async send(message: Omit<NotificationMessage, 'id' | 'timestamp'>, targetUsers?: string[], targetProperties?: string[]): Promise<any> {
    console.log('📤 Mock notification sent:', message.title);
    return { id: 'mock_queue_id' };
  }

  async sendToUser(userId: string, message: Omit<NotificationMessage, 'id' | 'timestamp'>): Promise<any> {
    console.log('📤 Mock notification sent to user:', userId, message.title);
    return { id: 'mock_queue_id' };
  }

  async sendToProperty(propertyId: string, message: Omit<NotificationMessage, 'id' | 'timestamp'>): Promise<any> {
    console.log('📤 Mock notification sent to property:', propertyId, message.title);
    return { id: 'mock_queue_id' };
  }

  async sendToCategory(category: NotificationCategory, message: Omit<NotificationMessage, 'id' | 'timestamp'>): Promise<any> {
    console.log('📤 Mock notification sent to category:', category, message.title);
    return { id: 'mock_queue_id' };
  }

  async updatePreferences(subscriptionId: string, preferences: Partial<NotificationPreferences>): Promise<void> {
    console.log('⚙️ Mock preferences updated:', subscriptionId);
  }

  async getStats(propertyId?: string, startDate?: Date, endDate?: Date): Promise<NotificationStats> {
    return {
      totalSent: 0,
      totalDelivered: 0,
      totalFailed: 0,
      totalExpired: 0,
      deliveryRate: 0,
      averageDeliveryTime: 0,
      categoryStats: {} as any,
      priorityStats: {} as any,
      deviceStats: {
        totalDevices: 0,
        activeDevices: 0,
        inactiveDevices: 0,
      },
    };
  }

  async getDeliveryStatus(queueId: string): Promise<any[]> {
    return [];
  }

  async markAsRead(messageId: string, userId: string): Promise<void> {
    console.log('📖 Mock message marked as read:', messageId);
  }

  async scheduleNotification(message: Omit<NotificationMessage, 'id' | 'timestamp'>, scheduledAt: Date, targetUsers?: string[]): Promise<any> {
    console.log('⏰ Mock notification scheduled:', scheduledAt);
    return { id: 'mock_queue_id' };
  }
}
