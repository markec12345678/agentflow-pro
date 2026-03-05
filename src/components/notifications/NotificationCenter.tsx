/**
 * Notification Center Component
 * Central hub for managing push notifications and preferences
 */

"use client";

import { useState, useEffect } from 'react';
import { useNotifications } from '@/hooks/use-notifications';
import { NotificationPreferences, NotificationCategory, NotificationPriority } from '@/types/notifications';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface NotificationCenterProps {
  userId: string;
  propertyId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationCenter({ userId, propertyId, isOpen, onClose }: NotificationCenterProps) {
  const [activeTab, setActiveTab] = useState<'notifications' | 'preferences' | 'stats'>('notifications');
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const {
    isSubscribed,
    isSupported,
    subscription,
    stats,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    updatePreferences,
    getStats,
    requestPermission,
    createHousekeepingMessage,
    createMaintenanceMessage,
    createCheckInMessage,
    createCheckOutMessage,
  } = useNotifications({ userId, propertyId });

  useEffect(() => {
    if (subscription) {
      setPreferences(subscription.preferences);
    }
  }, [subscription]);

  useEffect(() => {
    if (isOpen && isSubscribed) {
      getStats();
    }
  }, [isOpen, isSubscribed, getStats]);

  const handleSubscribe = async () => {
    await subscribe();
  };

  const handleUnsubscribe = async () => {
    await unsubscribe();
  };

  const handlePreferenceChange = async (category: keyof NotificationPreferences, value: any) => {
    if (!preferences) return;

    const updatedPreferences = { ...preferences, [category]: value };
    setPreferences(updatedPreferences);

    if (subscription) {
      setIsSaving(true);
      try {
        await updatePreferences(updatedPreferences);
        toast.success('Preferences updated successfully');
      } catch (err) {
        toast.error('Failed to update preferences');
        // Revert on error
        setPreferences(preferences);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleCategoryToggle = (category: NotificationCategory) => {
    if (!preferences) return;
    
    const newCategories = { ...preferences.categories, [category]: !preferences.categories[category] };
    handlePreferenceChange('categories', newCategories);
  };

  const handlePriorityToggle = (priority: NotificationPriority) => {
    if (!preferences) return;
    
    const newPriorities = { ...preferences.priorities, [priority]: !preferences.priorities[priority] };
    handlePreferenceChange('priorities', newPriorities);
  };

  const handleQuietHoursToggle = () => {
    if (!preferences) return;
    
    const newQuietHours = { ...preferences.quietHours, enabled: !preferences.quietHours.enabled };
    handlePreferenceChange('quietHours', newQuietHours);
  };

  const sendTestNotification = async (type: 'housekeeping' | 'maintenance' | 'checkin' | 'checkout') => {
    let message;
    
    switch (type) {
      case 'housekeeping':
        message = createHousekeepingMessage('101', 'Room cleaning requested');
        break;
      case 'maintenance':
        message = createMaintenanceMessage('101', 'Air conditioning not working');
        break;
      case 'checkin':
        message = createCheckInMessage('John Doe', '101');
        break;
      case 'checkout':
        message = createCheckOutMessage('John Doe', '101');
        break;
    }

    if (message) {
      // Send to current user
      const { sendToUser } = useNotifications({ userId, propertyId });
      await sendToUser(userId, message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Notification Center</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('notifications')}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'notifications'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Notifications
            </button>
            <button
              onClick={() => setActiveTab('preferences')}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'preferences'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Preferences
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'stats'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Statistics
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              {/* Subscription Status */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Subscription Status</h3>
                
                {!isSupported && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex">
                      <svg className="w-5 h-5 text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <span className="text-yellow-700">
                        Push notifications are not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari.
                      </span>
                    </div>
                  </div>
                )}

                {isSupported && !isSubscribed && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-blue-900">Enable Push Notifications</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          Get real-time updates for room status, guest check-ins, and important alerts.
                        </p>
                      </div>
                      <button
                        onClick={handleSubscribe}
                        disabled={isLoading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {isLoading ? 'Subscribing...' : 'Subscribe'}
                      </button>
                    </div>
                  </div>
                )}

                {isSubscribed && subscription && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-green-900">Notifications Active</h4>
                        <p className="text-sm text-green-700 mt-1">
                          You're subscribed to notifications for {subscription.propertyId}
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                          Device: {subscription.deviceInfo.platform} • Subscribed: {format(subscription.createdAt, 'MMM d, yyyy')}
                        </p>
                      </div>
                      <button
                        onClick={handleUnsubscribe}
                        disabled={isLoading}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                      >
                        {isLoading ? 'Unsubscribing...' : 'Unsubscribe'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Test Notifications */}
              {isSubscribed && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Test Notifications</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <button
                      onClick={() => sendTestNotification('housekeeping')}
                      className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm"
                    >
                      🧹 Housekeeping
                    </button>
                    <button
                      onClick={() => sendTestNotification('maintenance')}
                      className="px-3 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 text-sm"
                    >
                      🔧 Maintenance
                    </button>
                    <button
                      onClick={() => sendTestNotification('checkin')}
                      className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm"
                    >
                      ✅ Check-in
                    </button>
                    <button
                      onClick={() => sendTestNotification('checkout')}
                      className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 text-sm"
                    >
                      🚪 Check-out
                    </button>
                  </div>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex">
                    <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-red-700">{error}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="space-y-6">
              {!preferences && (
                <div className="text-center py-8">
                  <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <p className="text-gray-500">Subscribe to notifications to manage preferences</p>
                </div>
              )}

              {preferences && (
                <>
                  {/* General Settings */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">General Settings</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Enable Notifications</label>
                          <p className="text-sm text-gray-500">Turn all notifications on or off</p>
                        </div>
                        <button
                          onClick={() => handlePreferenceChange('enabled', !preferences.enabled)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                            preferences.enabled ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                              preferences.enabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Sound</label>
                          <p className="text-sm text-gray-500">Play sound for notifications</p>
                        </div>
                        <button
                          onClick={() => handlePreferenceChange('sound', !preferences.sound)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                            preferences.sound ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                              preferences.sound ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Vibration</label>
                          <p className="text-sm text-gray-500">Vibrate for notifications</p>
                        </div>
                        <button
                          onClick={() => handlePreferenceChange('vibration', !preferences.vibration)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                            preferences.vibration ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                              preferences.vibration ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Quiet Hours</label>
                          <p className="text-sm text-gray-500">
                            {preferences.quietHours.enabled 
                              ? `Silent from ${preferences.quietHours.start} to ${preferences.quietHours.end}`
                              : 'Always allow notifications'
                            }
                          </p>
                        </div>
                        <button
                          onClick={handleQuietHoursToggle}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                            preferences.quietHours.enabled ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                              preferences.quietHours.enabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Category Preferences */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Categories</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(preferences.categories).map(([category, enabled]) => (
                        <div key={category} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div>
                            <label className="text-sm font-medium text-gray-700 capitalize">
                              {category.replace('_', ' ')}
                            </label>
                            <p className="text-xs text-gray-500">
                              {enabled ? 'Enabled' : 'Disabled'}
                            </p>
                          </div>
                          <button
                            onClick={() => handleCategoryToggle(category as NotificationCategory)}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full ${
                              enabled ? 'bg-blue-600' : 'bg-gray-200'
                            }`}
                          >
                            <span
                              className={`inline-block h-3 w-3 transform rounded-full bg-white transition ${
                                enabled ? 'translate-x-5' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Priority Preferences */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Priority Levels</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(preferences.priorities).map(([priority, enabled]) => (
                        <div key={priority} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div>
                            <label className="text-sm font-medium text-gray-700 capitalize">
                              {priority}
                            </label>
                            <p className="text-xs text-gray-500">
                              {enabled ? 'Enabled' : 'Disabled'}
                            </p>
                          </div>
                          <button
                            onClick={() => handlePriorityToggle(priority as NotificationPriority)}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full ${
                              enabled ? 'bg-blue-600' : 'bg-gray-200'
                            }`}
                          >
                            <span
                              className={`inline-block h-3 w-3 transform rounded-full bg-white transition ${
                                enabled ? 'translate-x-5' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Statistics Tab */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              {stats ? (
                <>
                  {/* Overview Stats */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Overview</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{stats.totalSent}</div>
                        <div className="text-sm text-blue-700">Total Sent</div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{stats.totalDelivered}</div>
                        <div className="text-sm text-green-700">Delivered</div>
                      </div>
                      <div className="bg-red-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">{stats.totalFailed}</div>
                        <div className="text-sm text-red-700">Failed</div>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {(stats.deliveryRate * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-purple-700">Delivery Rate</div>
                      </div>
                    </div>
                  </div>

                  {/* Device Stats */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Devices</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-gray-600">{stats.deviceStats.totalDevices}</div>
                        <div className="text-sm text-gray-700">Total Devices</div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-green-600">{stats.deviceStats.activeDevices}</div>
                        <div className="text-sm text-green-700">Active</div>
                      </div>
                      <div className="bg-red-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-red-600">{stats.deviceStats.inactiveDevices}</div>
                        <div className="text-sm text-red-700">Inactive</div>
                      </div>
                    </div>
                  </div>

                  {/* Category Performance */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Category Performance</h3>
                    <div className="space-y-3">
                      {Object.entries(stats.categoryStats).map(([category, categoryStats]) => (
                        <div key={category} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900 capitalize">
                              {category.replace('_', ' ')}
                            </div>
                            <div className="text-xs text-gray-500">
                              {categoryStats.sent} sent • {categoryStats.delivered} delivered • {categoryStats.failed} failed
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">
                              {(categoryStats.deliveryRate * 100).toFixed(1)}%
                            </div>
                            <div className="text-xs text-gray-500">Delivery Rate</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p className="text-gray-500">No statistics available yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
