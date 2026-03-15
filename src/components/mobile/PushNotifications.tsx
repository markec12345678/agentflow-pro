"use client";

import { useState, useEffect } from "react";
import { logger } from '@/infrastructure/observability/logger';
import { 
  Bell, 
  BellOff, 
  Settings, 
  Check, 
  X, 
  AlertCircle, 
  Info, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  MessageSquare,
  User,
  CreditCard,
  FileText,
  Hotel,
  Phone,
  Mail,
  MapPin,
  Star,
  ThumbsUp,
  ThumbsDown,
  Heart,
  Share2,
  Download,
  RefreshCw,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  Battery,
  BatteryLow,
  Zap,
  TrendingUp,
  TrendingDown,
  Users,
  Bed,
  DollarSign,
  Euro,
  Package,
  Truck,
  Shield,
  Lock,
  Unlock,
  Key,
  Camera,
  Image as ImageIcon,
  Video,
  Mic,
  MicOff,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Shuffle,
  Home,
  Grid,
  List,
  MoreVertical,
  MoreHorizontal,
  Search,
  Filter,
  Edit,
  Trash2,
  Plus,
  Minus,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown
} from "lucide-react";

interface Notification {
  id: string;
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
  actions?: NotificationAction[];
  timestamp: number;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error' | 'booking' | 'payment' | 'message' | 'system';
}

interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

interface PushNotificationProps {
  children: React.ReactNode;
  enableNotifications?: boolean;
  onNotificationClick?: (notification: Notification) => void;
  onNotificationClose?: (notificationId: string) => void;
}

export function PushNotifications({ 
  children, 
  enableNotifications = true,
  onNotificationClick,
  onNotificationClose 
}: PushNotificationProps) {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [settings, setSettings] = useState({
    enabled: true,
    sound: true,
    vibration: true,
    desktop: true,
    bookingReminders: true,
    paymentAlerts: true,
    messageNotifications: true,
    systemAlerts: true,
    quietHours: false,
    quietStart: '22:00',
    quietEnd: '08:00'
  });

  useEffect(() => {
    if (!enableNotifications) return;

    // Check notification permission
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }

    // Load saved notifications
    loadNotifications();

    // Load settings
    loadSettings();

    // Set up service worker for push notifications
    setupServiceWorker();

    // Request permission on first visit
    if (permission === 'default') {
      requestPermission();
    }
  }, [enableNotifications, permission]);

  const requestPermission = async () => {
    if (!('Notification' in window)) return;

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      
      if (permission === 'granted') {
        logger.info('Notification permission granted');
        subscribeToPushNotifications();
      }
    } catch (error) {
      logger.error('Error requesting notification permission:', error);
    }
  };

  const subscribeToPushNotifications = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '')
      });

      logger.info('Push notification subscription:', subscription);
      
      // Send subscription to server
      await sendSubscriptionToServer(subscription);
    } catch (error) {
      logger.error('Error subscribing to push notifications:', error);
    }
  };

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  };

  const sendSubscriptionToServer = async (subscription: PushSubscription) => {
    // In real implementation, this would send to your server
    logger.info('Sending subscription to server:', subscription);
  };

  const setupServiceWorker = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'PUSH_NOTIFICATION') {
          handlePushNotification(event.data.notification);
        }
      });
    }
  };

  const handlePushNotification = (notificationData: any) => {
    const notification: Notification = {
      id: `push_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
      title: notificationData.title,
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      image: notificationData.image,
      tag: notificationData.tag,
      data: notificationData.data,
      requireInteraction: notificationData.requireInteraction,
      actions: notificationData.actions,
      timestamp: Date.now(),
      read: false,
      type: notificationData.type || 'info'
    };

    addNotification(notification);
    
    // Show browser notification if enabled
    if (settings.desktop && permission === 'granted') {
      showBrowserNotification(notification);
    }
  };

  const showBrowserNotification = (notification: Notification) => {
    if (!('Notification' in window) || permission !== 'granted') return;

    const browserNotification = new Notification(notification.title, {
      body: notification.body,
      icon: notification.icon || '/favicon.ico',
      badge: notification.badge || '/favicon.ico',
      image: notification.image,
      tag: notification.tag,
      requireInteraction: notification.requireInteraction,
      data: notification.data,
      actions: notification.actions
    });

    browserNotification.onclick = () => {
      handleNotificationClick(notification);
      browserNotification.close();
    };

    // Auto-close after 5 seconds if not required interaction
    if (!notification.requireInteraction) {
      setTimeout(() => {
        browserNotification.close();
      }, 5000);
    }
  };

  const addNotification = (notification: Notification) => {
    // Check quiet hours
    if (settings.quietHours && isQuietHours()) {
      return;
    }

    // Check notification type settings
    if (!shouldShowNotification(notification)) {
      return;
    }

    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);

    // Trigger haptic feedback if enabled
    if (settings.vibration && 'vibrate' in navigator) {
      navigator.vibrate(200);
    }

    // Play sound if enabled
    if (settings.sound) {
      playNotificationSound();
    }
  };

  const shouldShowNotification = (notification: Notification) => {
    switch (notification.type) {
      case 'booking':
        return settings.bookingReminders;
      case 'payment':
        return settings.paymentAlerts;
      case 'message':
        return settings.messageNotifications;
      case 'system':
        return settings.systemAlerts;
      default:
        return true;
    }
  };

  const isQuietHours = () => {
    if (!settings.quietHours) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMinute] = settings.quietStart.split(':').map(Number);
    const [endHour, endMinute] = settings.quietEnd.split(':').map(Number);
    
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Overnight quiet hours
      return currentTime >= startTime || currentTime <= endTime;
    }
  };

  const playNotificationSound = () => {
    const audio = new Audio('/sounds/notification.mp3');
    audio.volume = 0.3;
    audio.play().catch(error => {
      logger.info('Error playing notification sound:', error);
    });
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
    
    setUnreadCount(prev => Math.max(0, prev - 1));
    
    if (onNotificationClose) {
      onNotificationClose(notificationId);
    }
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => 
      prev.filter(notification => notification.id !== notificationId)
    );
    
    const notification = notifications.find(n => n.id === notificationId);
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    
    if (onNotificationClose) {
      onNotificationClose(notificationId);
    }
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
  };

  const loadNotifications = () => {
    try {
      const saved = localStorage.getItem('notifications');
      if (saved) {
        const notifications: Notification[] = JSON.parse(saved);
        setNotifications(notifications);
        setUnreadCount(notifications.filter(n => !n.read).length);
      }
    } catch (error) {
      logger.error('Error loading notifications:', error);
    }
  };

  const loadSettings = () => {
    try {
      const saved = localStorage.getItem('notification-settings');
      if (saved) {
        const settings = JSON.parse(saved);
        setSettings(settings);
      }
    } catch (error) {
      logger.error('Error loading notification settings:', error);
    }
  };

  const saveSettings = (newSettings: typeof settings) => {
    setSettings(newSettings);
    localStorage.setItem('notification-settings', JSON.stringify(newSettings));
  };

  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'booking':
        return <Calendar className="w-5 h-5 text-purple-500" />;
      case 'payment':
        return <CreditCard className="w-5 h-5 text-green-500" />;
      case 'message':
        return <MessageSquare className="w-5 h-5 text-blue-500" />;
      case 'system':
        return <Settings className="w-5 h-5 text-gray-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const NotificationButton = () => (
    <button
      onClick={() => setShowNotificationPanel(!showNotificationPanel)}
      className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
    >
      {permission === 'granted' ? (
        <Bell className="w-5 h-5 text-gray-600" />
      ) : (
        <BellOff className="w-5 h-5 text-gray-400" />
      )}
      
      {unreadCount > 0 && (
        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
      )}
      
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );

  const NotificationPanel = () => {
    if (!showNotificationPanel) return null;

    return (
      <div className="fixed inset-0 z-50">
        <div 
          className="fixed inset-0 bg-black bg-opacity-50" 
          onClick={() => setShowNotificationPanel(false)}
        />
        <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out overflow-hidden">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Notifications</h2>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setShowNotificationPanel(false)}
                  aria-label="Close notifications"
                  title="Close notification panel"
                  className="p-1 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Settings */}
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Push Notifications</span>
                <button
                  onClick={() => saveSettings({ ...settings, enabled: !settings.enabled })}
                  aria-label={settings.enabled ? "Disable push notifications" : "Enable push notifications"}
                  title={settings.enabled ? "Disable push notifications" : "Enable push notifications"}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.enabled ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              {permission === 'default' && (
                <button
                  onClick={requestPermission}
                  className="w-full px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                >
                  Enable Notifications
                </button>
              )}
              
              {permission === 'denied' && (
                <p className="text-xs text-red-600">
                  Notifications are blocked in your browser settings
                </p>
              )}
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <Bell className="w-12 h-12 mb-2" />
                  <p className="text-sm">No notifications</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {notification.title}
                            </p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                              aria-label="Delete notification"
                              title="Delete this notification"
                              className="p-1 rounded hover:bg-gray-200"
                            >
                              <X className="w-3 h-3 text-gray-400" />
                            </button>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.body}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(notification.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-4 border-t">
                <button
                  onClick={clearAllNotifications}
                  className="w-full px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative">
      {children}
      
      {/* Notification Button */}
      <div className="fixed top-4 right-4 z-40">
        <NotificationButton />
      </div>
      
      {/* Notification Panel */}
      <NotificationPanel />
    </div>
  );
}

// Utility functions for notifications
export function createNotification(
  title: string,
  body: string,
  type: Notification['type'] = 'info',
  data?: any
): Notification {
  return {
    id: `notification_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
    title,
    body,
    type,
    data,
    timestamp: Date.now(),
    read: false
  };
}

export function sendBookingNotification(
  bookingId: string,
  type: 'confirmed' | 'cancelled' | 'modified' | 'reminder',
  details?: any
) {
  const notifications = {
    confirmed: {
      title: 'Booking Confirmed',
      body: `Your booking ${bookingId} has been confirmed`,
      type: 'success' as const
    },
    cancelled: {
      title: 'Booking Cancelled',
      body: `Your booking ${bookingId} has been cancelled`,
      type: 'warning' as const
    },
    modified: {
      title: 'Booking Modified',
      body: `Your booking ${bookingId} has been modified`,
      type: 'info' as const
    },
    reminder: {
      title: 'Booking Reminder',
      body: `Your booking ${bookingId} is coming up soon`,
      type: 'info' as const
    }
  };

  const notification = notifications[type];
  
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'PUSH_NOTIFICATION',
      notification: {
        ...notification,
        tag: `booking_${bookingId}`,
        data: { bookingId, type, ...details }
      }
    });
  }
}

export function sendPaymentNotification(
  paymentId: string,
  type: 'success' | 'failed' | 'pending',
  amount?: number,
  currency?: string
) {
  const notifications = {
    success: {
      title: 'Payment Successful',
      body: `Payment of ${amount} ${currency} has been processed`,
      type: 'success' as const
    },
    failed: {
      title: 'Payment Failed',
      body: `Payment of ${amount} ${currency} could not be processed`,
      type: 'error' as const
    },
    pending: {
      title: 'Payment Pending',
      body: `Payment of ${amount} ${currency} is being processed`,
      type: 'info' as const
    }
  };

  const notification = notifications[type];
  
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'PUSH_NOTIFICATION',
      notification: {
        ...notification,
        tag: `payment_${paymentId}`,
        data: { paymentId, type, amount, currency }
      }
    });
  }
}

export function sendMessageNotification(
  messageId: string,
  sender: string,
  message: string
) {
  const notification = {
    title: `New message from ${sender}`,
    body: message,
    type: 'message' as const,
    tag: `message_${messageId}`,
    data: { messageId, sender, message }
  };

  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'PUSH_NOTIFICATION',
      notification
    });
  }
}
