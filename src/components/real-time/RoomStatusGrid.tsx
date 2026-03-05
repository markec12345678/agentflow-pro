/**
 * Real-time Room Status Grid Component
 * Displays room status with WebSocket updates
 */

"use client";

import { useState, useEffect } from 'react';
import { useWebSocket } from '@/hooks/use-websocket';
import { PropertySelector } from '@/web/components/PropertySelector';
import { toast } from 'sonner';

interface Room {
  id: string;
  name: string;
  type: string;
  capacity: number;
  basePrice: number;
  status: 'available' | 'occupied' | 'cleaning' | 'maintenance' | 'out_of_order';
  currentGuest?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    checkIn: string;
    checkOut: string;
  };
  nextGuest?: {
    id: string;
    name: string;
    checkIn: string;
    checkOut: string;
  };
}

interface RoomStatusGridProps {
  propertyId?: string;
  onPropertyChange?: (propertyId: string) => void;
}

export default function RoomStatusGrid({ propertyId: initialPropertyId, onPropertyChange }: RoomStatusGridProps) {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(initialPropertyId || '');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // WebSocket for real-time updates
  const {
    isConnected,
    connectionError,
    roomStatus,
    notifications,
    updateRoomStatus,
    requestHousekeeping,
    requestMaintenance,
  } = useWebSocket({
    propertyId: selectedPropertyId,
    autoConnect: !!selectedPropertyId,
    enableNotifications: true,
  });

  // Fetch initial room data
  useEffect(() => {
    if (selectedPropertyId) {
      fetchRooms();
    }
  }, [selectedPropertyId]);

  // Update rooms when WebSocket status updates
  useEffect(() => {
    if (Object.keys(roomStatus).length > 0) {
      setRooms(prevRooms => 
        prevRooms.map(room => ({
          ...room,
          status: roomStatus[room.id]?.status || room.status,
          currentGuest: roomStatus[room.id]?.currentGuest || room.currentGuest,
          nextGuest: roomStatus[room.id]?.nextGuest || room.nextGuest,
        }))
      );
    }
  }, [roomStatus]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/receptor/rooms/status?propertyId=${selectedPropertyId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch room status');
      }
      
      const data = await response.json();
      if (data.success) {
        setRooms(data.data.rooms || []);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch rooms');
      toast.error('Failed to load room status');
    } finally {
      setLoading(false);
    }
  };

  const handlePropertyChange = (newPropertyId: string) => {
    setSelectedPropertyId(newPropertyId);
    onPropertyChange?.(newPropertyId);
  };

  const handleStatusChange = async (roomId: string, newStatus: string) => {
    try {
      // Update via WebSocket first for immediate UI feedback
      updateRoomStatus(roomId, newStatus);
      
      // Also update via API for persistence
      const response = await fetch('/api/rooms/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId,
          status: newStatus,
          propertyId: selectedPropertyId,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update room status');
      }
      
      toast.success(`Room status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating room status:', error);
      toast.error('Failed to update room status');
      // Revert the change by fetching fresh data
      fetchRooms();
    }
  };

  const handleHousekeepingRequest = (roomId: string) => {
    requestHousekeeping(roomId, 'medium', 'Housekeeping requested from dashboard');
  };

  const handleMaintenanceRequest = (roomId: string) => {
    requestMaintenance(roomId, 'medium', 'Maintenance requested from dashboard');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'occupied':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cleaning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'maintenance':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'out_of_order':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'occupied':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'cleaning':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6" />
          </svg>
        );
      case 'maintenance':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case 'out_of_order':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-700">{error}</span>
          </div>
          <button
            onClick={fetchRooms}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Room Status</h2>
          <p className="text-gray-600">Real-time room status updates</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Connection Status */}
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          
          {/* Property Selector */}
          <PropertySelector
            selectedPropertyId={selectedPropertyId}
            onPropertyChange={handlePropertyChange}
          />
        </div>
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Recent Notifications</h3>
          <div className="space-y-2">
            {notifications.slice(0, 3).map((notification, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  notification.priority === 'urgent' ? 'bg-red-50 border-red-200' :
                  notification.priority === 'high' ? 'bg-orange-50 border-orange-200' :
                  notification.priority === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-blue-50 border-blue-200'
                }`}
              >
                <p className="text-sm text-gray-700">{notification.message}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(notification.timestamp).toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Room Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {rooms.map((room) => (
          <div
            key={room.id}
            className={`border rounded-lg p-4 transition-all duration-200 hover:shadow-lg ${getStatusColor(room.status)}`}
          >
            {/* Room Header */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-lg">{room.name}</h3>
                <p className="text-sm opacity-75">{room.type}</p>
              </div>
              <div className="flex items-center">
                {getStatusIcon(room.status)}
              </div>
            </div>

            {/* Room Details */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span>Capacity:</span>
                <span>{room.capacity} guests</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Price:</span>
                <span>${room.basePrice}/night</span>
              </div>
            </div>

            {/* Guest Information */}
            {room.currentGuest && (
              <div className="mb-4 p-2 bg-white bg-opacity-50 rounded">
                <p className="text-sm font-medium">Current Guest:</p>
                <p className="text-sm">{room.currentGuest.name}</p>
                <p className="text-xs opacity-75">
                  Check-out: {new Date(room.currentGuest.checkOut).toLocaleDateString()}
                </p>
              </div>
            )}

            {room.nextGuest && !room.currentGuest && (
              <div className="mb-4 p-2 bg-white bg-opacity-50 rounded">
                <p className="text-sm font-medium">Next Guest:</p>
                <p className="text-sm">{room.nextGuest.name}</p>
                <p className="text-xs opacity-75">
                  Check-in: {new Date(room.nextGuest.checkIn).toLocaleDateString()}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <select
                value={room.status}
                onChange={(e) => handleStatusChange(room.id, e.target.value)}
                className="px-3 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="cleaning">Cleaning</option>
                <option value="maintenance">Maintenance</option>
                <option value="out_of_order">Out of Order</option>
              </select>

              {room.status !== 'cleaning' && (
                <button
                  onClick={() => handleHousekeepingRequest(room.id)}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  🧹 Housekeeping
                </button>
              )}

              {room.status !== 'maintenance' && (
                <button
                  onClick={() => handleMaintenanceRequest(room.id)}
                  className="px-3 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700"
                >
                  🔧 Maintenance
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {rooms.length === 0 && (
        <div className="text-center py-12">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No rooms found</h3>
          <p className="text-gray-600">No rooms are available for this property.</p>
        </div>
      )}
    </div>
  );
}
