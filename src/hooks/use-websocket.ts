/**
 * React hook for WebSocket real-time updates
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

interface RoomStatusUpdate {
  roomId: string;
  status: 'available' | 'occupied' | 'cleaning' | 'maintenance' | 'out_of_order';
  currentGuest?: {
    id: string;
    name: string;
    checkIn: string;
    checkOut: string;
  };
  nextGuest?: {
    id: string;
    name: string;
    checkIn: string;
    checkOut: string;
  };
  updatedBy: string;
  timestamp: string;
}

interface NotificationMessage {
  type: 'room_update' | 'housekeeping_request' | 'maintenance_request' | 'check_in' | 'check_out';
  propertyId: string;
  message: string;
  data?: any;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timestamp: string;
}

interface UseWebSocketOptions {
  propertyId: string;
  autoConnect?: boolean;
  enableNotifications?: boolean;
}

interface UseWebSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  connectionError: string | null;
  roomStatus: Record<string, RoomStatusUpdate>;
  notifications: NotificationMessage[];
  updateRoomStatus: (roomId: string, status: string) => void;
  requestHousekeeping: (roomId: string, priority?: string, message?: string) => void;
  requestMaintenance: (roomId: string, priority?: string, message?: string) => void;
  disconnect: () => void;
  reconnect: () => void;
}

export function useWebSocket(options: UseWebSocketOptions): UseWebSocketReturn {
  const { propertyId, autoConnect = true, enableNotifications = true } = options;
  const { data: session } = useSession();
  
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [roomStatus, setRoomStatus] = useState<Record<string, RoomStatusUpdate>>({});
  const [notifications, setNotifications] = useState<NotificationMessage[]>([]);
  
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxReconnectAttempts = 5;
  const reconnectAttempts = useRef(0);

  const scheduleReconnect = useCallback(() => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      console.log('🔌 Max reconnect attempts reached');
      toast.error('Failed to reconnect to real-time updates');
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
    reconnectAttempts.current++;
    
    console.log(`🔌 Scheduling reconnect attempt ${reconnectAttempts.current} in ${delay}ms`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, delay);
  }, [connect]);

  const connect = useCallback(() => {
    if (!session?.user || !propertyId) {
      console.log('🔌 Cannot connect: missing session or propertyId');
      return;
    }

    if (socketRef.current?.connected) {
      console.log('🔌 Already connected');
      return;
    }

    console.log('🔌 Connecting to WebSocket...');
    
    const newSocket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000', {
      auth: {
        token: session.user.userId || session.user.id, // This would be a proper JWT token
        propertyId: propertyId,
      },
      transports: ['websocket', 'polling'],
      timeout: 10000,
      forceNew: true,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Connection events
    newSocket.on('connect', () => {
      console.log('🔌 Connected to WebSocket');
      setIsConnected(true);
      setConnectionError(null);
      reconnectAttempts.current = 0;
      
      toast.success('Real-time updates enabled');
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from WebSocket:', reason);
      setIsConnected(false);
      
      if (reason === 'io server disconnect') {
        // Server disconnected, don't reconnect automatically
        toast.error('Disconnected from server');
      } else {
        // Try to reconnect
        scheduleReconnect();
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('🔌 Connection error:', error);
      setConnectionError(error.message);
      setIsConnected(false);
      
      toast.error('Failed to connect to real-time updates');
      scheduleReconnect();
    });

    // Room status events
    newSocket.on('initial_room_status', (data) => {
      console.log('🔌 Received initial room status:', data);
      const statusMap: Record<string, RoomStatusUpdate> = {};
      
      data.rooms.forEach((room: any) => {
        statusMap[room.id] = {
          roomId: room.id,
          status: room.status,
          currentGuest: room.currentGuest,
          nextGuest: room.nextGuest,
          updatedBy: 'system',
          timestamp: data.timestamp,
        };
      });
      
      setRoomStatus(statusMap);
    });

    newSocket.on('room_status_update', (data: RoomStatusUpdate) => {
      console.log('🔌 Room status update:', data);
      
      setRoomStatus(prev => ({
        ...prev,
        [data.roomId]: data,
      }));

      if (enableNotifications) {
        const message = `Room ${data.roomId} status changed to ${data.status}`;
        const toastType = getToastTypeForStatus(data.status);
        toast[toastType](message);
      }
    });

    // Notification events
    newSocket.on('notification', (notification: NotificationMessage) => {
      console.log('🔌 Received notification:', notification);
      
      setNotifications(prev => [notification, ...prev].slice(0, 50)); // Keep last 50
      
      if (enableNotifications) {
        const toastType = getToastTypeForPriority(notification.priority);
        toast[toastType](notification.message);
      }
    });

    newSocket.on('housekeeping_notification', (notification: NotificationMessage) => {
      console.log('🔌 Housekeeping notification:', notification);
      
      setNotifications(prev => [notification, ...prev].slice(0, 50));
      
      if (enableNotifications) {
        toast.info(`🧹 ${notification.message}`);
      }
    });

    newSocket.on('maintenance_notification', (notification: NotificationMessage) => {
      console.log('🔌 Maintenance notification:', notification);
      
      setNotifications(prev => [notification, ...prev].slice(0, 50));
      
      if (enableNotifications) {
        toast.warning(`🔧 ${notification.message}`);
      }
    });

    newSocket.on('staff_notification', (notification: NotificationMessage) => {
      console.log('🔌 Staff notification:', notification);
      
      setNotifications(prev => [notification, ...prev].slice(0, 50));
      
      if (enableNotifications) {
        toast.info(notification.message);
      }
    });

    // Confirmation events
    newSocket.on('housekeeping_request_confirmed', (data) => {
      console.log('🔌 Housekeeping request confirmed:', data);
      toast.success(`Housekeeping request created (Task #${data.taskId})`);
    });

    newSocket.on('maintenance_request_confirmed', (data) => {
      console.log('🔌 Maintenance request confirmed:', data);
      toast.success(`Maintenance request created (Task #${data.taskId})`);
    });

    newSocket.on('check_in_notification_sent', (data) => {
      console.log('🔌 Check-in notification sent:', data);
      toast.success('Check-in notification sent to staff');
    });

    newSocket.on('check_out_notification_sent', (data) => {
      console.log('🔌 Check-out notification sent:', data);
      toast.success('Check-out notification sent to staff');
    });

    // Error events
    newSocket.on('error', (error) => {
      console.error('🔌 Socket error:', error);
      toast.error(error.message || 'Socket error occurred');
    });

  }, [session, propertyId, enableNotifications]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
      console.log('🔌 Disconnected from WebSocket');
    }
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    reconnectAttempts.current = 0;
    connect();
  }, [disconnect, connect]);

  const updateRoomStatus = useCallback((roomId: string, status: string) => {
    if (!socketRef.current?.connected) {
      toast.error('Not connected to real-time updates');
      return;
    }

    const updateData: RoomStatusUpdate = {
      roomId,
      status: status as any,
      updatedBy: session?.user?.id || 'unknown',
      timestamp: new Date().toISOString(),
    };

    socketRef.current.emit('room_status_update', updateData);
    console.log('🔌 Sent room status update:', updateData);
  }, [socket, session]);

  const requestHousekeeping = useCallback((
    roomId: string, 
    priority: string = 'medium', 
    message?: string
  ) => {
    if (!socketRef.current?.connected) {
      toast.error('Not connected to real-time updates');
      return;
    }

    const requestData = {
      roomId,
      priority,
      message: message || 'Housekeeping requested',
    };

    socketRef.current.emit('housekeeping_request', requestData);
    console.log('🔌 Sent housekeeping request:', requestData);
  }, [socket]);

  const requestMaintenance = useCallback((
    roomId: string, 
    priority: string = 'medium', 
    message?: string
  ) => {
    if (!socketRef.current?.connected) {
      toast.error('Not connected to real-time updates');
      return;
    }

    const requestData = {
      roomId,
      priority,
      message: message || 'Maintenance requested',
    };

    socketRef.current.emit('maintenance_request', requestData);
    console.log('🔌 Sent maintenance request:', requestData);
  }, [socket]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && session && propertyId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect, session, propertyId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      disconnect();
    };
  }, [disconnect]);

  return {
    socket,
    isConnected,
    connectionError,
    roomStatus,
    notifications,
    updateRoomStatus,
    requestHousekeeping,
    requestMaintenance,
    disconnect,
    reconnect,
  };
}

// Helper functions
function getToastTypeForStatus(status: string): 'success' | 'error' | 'info' | 'warning' {
  switch (status) {
    case 'available':
      return 'success';
    case 'occupied':
      return 'info';
    case 'cleaning':
      return 'warning';
    case 'maintenance':
      return 'error';
    case 'out_of_order':
      return 'error';
    default:
      return 'info';
  }
}

function getToastTypeForPriority(priority: string): 'success' | 'error' | 'info' | 'warning' {
  switch (priority) {
    case 'low':
      return 'info';
    case 'medium':
      return 'info';
    case 'high':
      return 'warning';
    case 'urgent':
      return 'error';
    default:
      return 'info';
  }
}
