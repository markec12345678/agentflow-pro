"use client";

import { useState, useEffect } from "react";
import { logger } from '@/infrastructure/observability/logger';
import { 
  Wifi, 
  WifiOff, 
  AlertCircle, 
  RefreshCw, 
  Download, 
  Upload, 
  Check, 
  X, 
  Info,
  Clock,
  Database,
  Cloud,
  CloudOff,
  Smartphone,
  Monitor,
  Settings
} from "lucide-react";
import "../../styles/progress-bars.css";

interface OfflineModeProps {
  children: React.ReactNode;
  enableOfflineMode?: boolean;
  cacheKey?: string;
}

interface CachedData {
  key: string;
  data: any;
  timestamp: number;
  expiresAt: number;
}

interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  endpoint: string;
  data: any;
  timestamp: number;
  status: 'pending' | 'syncing' | 'completed' | 'failed';
  retryCount: number;
}

export function OfflineMode({ 
  children, 
  enableOfflineMode = true, 
  cacheKey = 'agentflow-cache' 
}: OfflineModeProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [cachedData, setCachedData] = useState<CachedData[]>([]);
  const [syncOperations, setSyncOperations] = useState<SyncOperation[]>([]);
  const [showOfflineIndicator, setShowOfflineIndicator] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  useEffect(() => {
    if (!enableOfflineMode) return;

    // Check online status
    const checkOnlineStatus = () => {
      setIsOnline(navigator.onLine);
      setShowOfflineIndicator(!navigator.onLine);
    };

    // Load cached data
    loadCachedData();
    loadSyncOperations();

    // Set up event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic sync check
    const syncInterval = setInterval(() => {
      if (navigator.onLine && syncOperations.length > 0) {
        syncPendingOperations();
      }
    }, 30000); // Check every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(syncInterval);
    };
  }, [enableOfflineMode]);

  const handleOnline = () => {
    setIsOnline(true);
    setShowOfflineIndicator(false);
    setIsOfflineMode(false);
    
    // Sync pending operations when coming back online
    if (syncOperations.length > 0) {
      syncPendingOperations();
    }
  };

  const handleOffline = () => {
    setIsOnline(false);
    setShowOfflineIndicator(true);
    setIsOfflineMode(true);
  };

  const loadCachedData = async () => {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const data: CachedData[] = JSON.parse(cached);
        // Filter out expired data
        const validData = data.filter(item => item.expiresAt > Date.now());
        setCachedData(validData);
        
        // Update localStorage with filtered data
        localStorage.setItem(cacheKey, JSON.stringify(validData));
      }
    } catch (error) {
      logger.error('Error loading cached data:', error);
    }
  };

  const loadSyncOperations = async () => {
    try {
      const operations = localStorage.getItem(`${cacheKey}-sync`);
      if (operations) {
        setSyncOperations(JSON.parse(operations));
      }
    } catch (error) {
      logger.error('Error loading sync operations:', error);
    }
  };

  const cacheData = (key: string, data: any, ttlMinutes = 60) => {
    if (!enableOfflineMode) return;

    try {
      const cacheItem: CachedData = {
        key,
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + (ttlMinutes * 60 * 1000)
      };

      const existingData = cachedData.filter(item => item.key !== key);
      const updatedData = [...existingData, cacheItem];
      
      setCachedData(updatedData);
      localStorage.setItem(cacheKey, JSON.stringify(updatedData));
    } catch (error) {
      logger.error('Error caching data:', error);
    }
  };

  const getCachedData = (key: string) => {
    if (!enableOfflineMode) return null;

    const item = cachedData.find(item => item.key === key);
    if (item && item.expiresAt > Date.now()) {
      return item.data;
    }
    return null;
  };

  const addSyncOperation = (type: 'create' | 'update' | 'delete', endpoint: string, data: any) => {
    if (!enableOfflineMode) return;

    const operation: SyncOperation = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
      type,
      endpoint,
      data,
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0
    };

    const updatedOperations = [...syncOperations, operation];
    setSyncOperations(updatedOperations);
    localStorage.setItem(`${cacheKey}-sync`, JSON.stringify(updatedOperations));
  };

  const syncPendingOperations = async () => {
    if (!isOnline || syncOperations.length === 0) return;

    const pendingOperations = syncOperations.filter(op => op.status === 'pending');
    if (pendingOperations.length === 0) return;

    setSyncProgress(0);
    
    for (let i = 0; i < pendingOperations.length; i++) {
      const operation = pendingOperations[i];
      
      try {
        // Update operation status to syncing
        updateOperationStatus(operation.id, 'syncing');
        
        // Simulate API call (in real implementation, this would be actual fetch)
        await simulateApiCall(operation);
        
        // Update operation status to completed
        updateOperationStatus(operation.id, 'completed');
        
        // Remove completed operation from list
        setSyncOperations(prev => prev.filter(op => op.id !== operation.id));
        
      } catch (error) {
        logger.error('Error syncing operation:', error);
        
        // Update operation status to failed
        updateOperationStatus(operation.id, 'failed');
        
        // Increment retry count
        incrementRetryCount(operation.id);
      }
      
      setSyncProgress(Math.round(((i + 1) / pendingOperations.length) * 100));
    }

    // Update last sync time
    setLastSyncTime(new Date());
    
    // Clean up localStorage
    localStorage.setItem(`${cacheKey}-sync`, JSON.stringify(syncOperations.filter(op => op.status !== 'completed')));
  };

  const simulateApiCall = async (operation: SyncOperation): Promise<void> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Simulate occasional failure (10% failure rate)
    if (Math.random() < 0.1) {
      throw new Error('Network error');
    }
  };

  const updateOperationStatus = (operationId: string, status: 'pending' | 'syncing' | 'completed' | 'failed') => {
    setSyncOperations(prev => 
      prev.map(op => 
        op.id === operationId ? { ...op, status } : op
      )
    );
  };

  const incrementRetryCount = (operationId: string) => {
    setSyncOperations(prev => 
      prev.map(op => 
        op.id === operationId ? { ...op, retryCount: op.retryCount + 1 } : op
      )
    );
  };

  const clearCache = () => {
    setCachedData([]);
    localStorage.removeItem(cacheKey);
  };

  const clearSyncOperations = () => {
    setSyncOperations([]);
    localStorage.removeItem(`${cacheKey}-sync`);
  };

  const getStorageUsage = () => {
    try {
      const cacheData = localStorage.getItem(cacheKey) || '[]';
      const syncData = localStorage.getItem(`${cacheKey}-sync`) || '[]';
      
      const cacheSize = new Blob([cacheData]).size;
      const syncSize = new Blob([syncData]).size;
      
      return {
        cache: formatBytes(cacheSize),
        sync: formatBytes(syncSize),
        total: formatBytes(cacheSize + syncSize)
      };
    } catch (error) {
      return { cache: '0 B', sync: '0 B', total: '0 B' };
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const OfflineIndicator = () => {
    if (!showOfflineIndicator) return null;

    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-50 border-b border-yellow-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center space-x-3">
              <WifiOff className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  You're offline
                </p>
                <p className="text-xs text-yellow-600">
                  Some features may be limited. Data will sync when you're back online.
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setShowOfflineIndicator(false)}
              aria-label="Dismiss offline indicator"
              title="Dismiss offline indicator"
              className="text-yellow-600 hover:text-yellow-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const SyncStatusIndicator = () => {
    const pendingCount = syncOperations.filter(op => op.status === 'pending').length;
    const failedCount = syncOperations.filter(op => op.status === 'failed').length;

    if (pendingCount === 0 && failedCount === 0) return null;

    return (
      <div className="fixed bottom-4 left-4 z-50 bg-white rounded-lg shadow-lg p-3 max-w-sm">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            {pendingCount > 0 ? (
              <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">
              {pendingCount > 0 ? 'Syncing data...' : 'Sync failed'}
            </p>
            <p className="text-xs text-gray-500">
              {pendingCount > 0 ? `${pendingCount} items pending` : `${failedCount} items failed`}
            </p>
          </div>
        </div>
        
        {syncProgress > 0 && (
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div 
                className={`bg-blue-500 h-1 rounded-full transition-all duration-300 progress-width-${Math.round(syncProgress / 5) * 5}`}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  const OfflineSettings = () => {
    if (!enableOfflineMode) return null;

    const storageUsage = getStorageUsage();

    return (
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Offline Settings</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Offline Mode</p>
              <p className="text-xs text-gray-500">
                {isOfflineMode ? 'Enabled' : 'Disabled'}
              </p>
            </div>
            <div className={`w-12 h-6 rounded-full transition-colors ${
              isOfflineMode ? 'bg-blue-500' : 'bg-gray-300'
            }`}>
              <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                isOfflineMode ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </div>
          </div>
          
          <div className="border-t pt-4">
            <p className="text-sm font-medium text-gray-900 mb-2">Storage Usage</p>
            <div className="space-y-1 text-xs text-gray-500">
              <div className="flex justify-between">
                <span>Cache:</span>
                <span>{storageUsage.cache}</span>
              </div>
              <div className="flex justify-between">
                <span>Sync Queue:</span>
                <span>{storageUsage.sync}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Total:</span>
                <span>{storageUsage.total}</span>
              </div>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <p className="text-sm font-medium text-gray-900 mb-2">Actions</p>
            <div className="space-y-2">
              <button
                onClick={syncPendingOperations}
                disabled={!isOnline || syncOperations.length === 0}
                className="w-full px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Sync Now
              </button>
              <button
                onClick={clearCache}
                className="w-full px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
              >
                Clear Cache
              </button>
              <button
                onClick={clearSyncOperations}
                className="w-full px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm"
              >
                Clear Sync Queue
              </button>
            </div>
          </div>
          
          {lastSyncTime && (
            <div className="border-t pt-4">
              <p className="text-xs text-gray-500">
                Last sync: {lastSyncTime.toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="relative">
      {/* Offline Indicator */}
      <OfflineIndicator />
      
      {/* Sync Status */}
      <SyncStatusIndicator />
      
      {/* Main Content */}
      {children}
      
      {/* Offline Settings (for admin pages) */}
      {enableOfflineMode && (
        <div className="hidden lg:block">
          <OfflineSettings />
        </div>
      )}
    </div>
  );
}

// Hook for using offline mode in components
export function useOfflineMode() {
  const [isOnline, setIsOnline] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setIsOfflineMode(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsOfflineMode(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    setIsOnline(navigator.onLine);
    setIsOfflineMode(!navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    isOfflineMode,
    cacheData: (key: string, data: any, ttlMinutes?: number) => {
      // Implementation would be similar to the one in OfflineMode component
    },
    getCachedData: (key: string) => {
      // Implementation would be similar to the one in OfflineMode component
      return null;
    }
  };
}

// Service Worker registration for offline support
export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          logger.info('SW registered: ', registration);
        })
        .catch((registrationError) => {
          logger.info('SW registration failed: ', registrationError);
        });
    });
  }
}

// Push notification support
export function requestNotificationPermission() {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        logger.info('Notification permission granted');
      }
    });
  }
}

export function sendPushNotification(title: string, body: string, options?: NotificationOptions) {
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'agentflow-notification',
      requireInteraction: false,
      ...options
    });
  }
}
