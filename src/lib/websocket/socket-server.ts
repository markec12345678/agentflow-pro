/**
 * AgentFlow Pro - WebSocket Server Configuration
 * Real-time room status updates and notifications
 */

import { Server as HTTPServer } from 'http';
import { logger } from '@/infrastructure/observability/logger';
import { Server as SocketIOServer } from 'socket.io';
import { NextApiRequest, NextApiResponse } from 'next';
import { getUserId } from '@/lib/auth-users';
import { getPropertyForUser } from '@/core/domain/tourism/property-access';

interface AuthenticatedSocket extends Socket {
  userId: string;
  propertyId: string;
  role: string;
}

interface RoomStatusUpdate {
  roomId: string;
  propertyId: string;
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

class SocketManager {
  private io: SocketIOServer | null = null;
  private connectedClients: Map<string, AuthenticatedSocket> = new Map();

  initialize(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? process.env.NEXTAUTH_URL 
          : ['http://localhost:3000', 'http://localhost:3001'],
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.setupMiddleware();
    this.setupEventHandlers();
    
    logger.info('🔌 WebSocket server initialized');
  }

  private setupMiddleware() {
    if (!this.io) return;

    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        const propertyId = socket.handshake.auth.propertyId;

        if (!token || !propertyId) {
          return next(new Error('Authentication required'));
        }

        // Verify user session (this would integrate with NextAuth)
        const userId = await this.verifyToken(token);
        if (!userId) {
          return next(new Error('Invalid token'));
        }

        // Verify property access
        const property = await getPropertyForUser(propertyId, userId);
        if (!property) {
          return next(new Error('Property access denied'));
        }

        // Get user role
        const role = await this.getUserRole(userId);

        // Attach authenticated data to socket
        (socket as AuthenticatedSocket).userId = userId;
        (socket as AuthenticatedSocket).propertyId = propertyId;
        (socket as AuthenticatedSocket).role = role;

        next();
      } catch (error) {
        logger.error('WebSocket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupEventHandlers() {
    if (!this.io) return;

    this.io.on('connection', (socket: AuthenticatedSocket) => {
      logger.info(`🔌 Client connected: ${socket.userId} to property ${socket.propertyId}`);

      // Store connected client
      this.connectedClients.set(socket.id, socket);

      // Join property-specific room
      socket.join(`property:${socket.propertyId}`);

      // Send initial room status
      this.sendInitialRoomStatus(socket);

      // Handle room status updates
      socket.on('room_status_update', async (data: RoomStatusUpdate) => {
        await this.handleRoomStatusUpdate(socket, data);
      });

      // Handle housekeeping requests
      socket.on('housekeeping_request', async (data) => {
        await this.handleHousekeepingRequest(socket, data);
      });

      // Handle maintenance requests
      socket.on('maintenance_request', async (data) => {
        await this.handleMaintenanceRequest(socket, data);
      });

      // Handle check-in notifications
      socket.on('check_in_notification', async (data) => {
        await this.handleCheckInNotification(socket, data);
      });

      // Handle check-out notifications
      socket.on('check_out_notification', async (data) => {
        await this.handleCheckOutNotification(socket, data);
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        logger.info(`🔌 Client disconnected: ${socket.userId} (${reason})`);
        this.connectedClients.delete(socket.id);
      });

      // Handle errors
      socket.on('error', (error) => {
        logger.error(`🔌 Socket error for ${socket.userId}:`, error);
      });
    });
  }

  private async sendInitialRoomStatus(socket: AuthenticatedSocket) {
    try {
      // Fetch current room status from database
      const roomStatus = await this.getCurrentRoomStatus(socket.propertyId);
      
      socket.emit('initial_room_status', {
        propertyId: socket.propertyId,
        rooms: roomStatus,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error sending initial room status:', error);
      socket.emit('error', { message: 'Failed to load room status' });
    }
  }

  private async handleRoomStatusUpdate(socket: AuthenticatedSocket, data: RoomStatusUpdate) {
    try {
      // Validate permissions
      if (!this.canUpdateRoomStatus(socket.role, data.status)) {
        socket.emit('error', { message: 'Permission denied' });
        return;
      }

      // Update room status in database
      await this.updateRoomStatusInDB(data);

      // Broadcast update to all clients in the property
      this.io?.to(`property:${socket.propertyId}`).emit('room_status_update', {
        ...data,
        updatedBy: socket.userId,
        timestamp: new Date().toISOString(),
      });

      // Send notification to relevant staff
      await this.sendRoomStatusNotification(socket, data);

    } catch (error) {
      logger.error('Error handling room status update:', error);
      socket.emit('error', { message: 'Failed to update room status' });
    }
  }

  private async handleHousekeepingRequest(socket: AuthenticatedSocket, data: any) {
    try {
      // Validate permissions
      if (!this.canRequestHousekeeping(socket.role)) {
        socket.emit('error', { message: 'Permission denied' });
        return;
      }

      // Create housekeeping task
      const task = await this.createHousekeepingTask(socket.propertyId, data);

      // Notify housekeeping staff
      await this.notifyHousekeepingStaff(socket.propertyId, {
        type: 'housekeeping_request',
        taskId: task.id,
        roomId: data.roomId,
        priority: data.priority || 'medium',
        message: data.message || 'Housekeeping requested',
      });

      // Confirm to requester
      socket.emit('housekeeping_request_confirmed', {
        taskId: task.id,
        estimatedTime: task.estimatedTime,
      });

    } catch (error) {
      logger.error('Error handling housekeeping request:', error);
      socket.emit('error', { message: 'Failed to create housekeeping request' });
    }
  }

  private async handleMaintenanceRequest(socket: AuthenticatedSocket, data: any) {
    try {
      // Validate permissions
      if (!this.canRequestMaintenance(socket.role)) {
        socket.emit('error', { message: 'Permission denied' });
        return;
      }

      // Create maintenance task
      const task = await this.createMaintenanceTask(socket.propertyId, data);

      // Notify maintenance staff
      await this.notifyMaintenanceStaff(socket.propertyId, {
        type: 'maintenance_request',
        taskId: task.id,
        roomId: data.roomId,
        priority: data.priority || 'medium',
        message: data.message || 'Maintenance requested',
      });

      // Confirm to requester
      socket.emit('maintenance_request_confirmed', {
        taskId: task.id,
        estimatedTime: task.estimatedTime,
      });

    } catch (error) {
      logger.error('Error handling maintenance request:', error);
      socket.emit('error', { message: 'Failed to create maintenance request' });
    }
  }

  private async handleCheckInNotification(socket: AuthenticatedSocket, data: any) {
    try {
      // Validate permissions
      if (!this.canProcessCheckIn(socket.role)) {
        socket.emit('error', { message: 'Permission denied' });
        return;
      }

      // Notify relevant staff about check-in
      await this.notifyStaff(socket.propertyId, {
        type: 'check_in',
        reservationId: data.reservationId,
        roomId: data.roomId,
        guestName: data.guestName,
        timestamp: new Date().toISOString(),
      });

      socket.emit('check_in_notification_sent', {
        reservationId: data.reservationId,
      });

    } catch (error) {
      logger.error('Error handling check-in notification:', error);
      socket.emit('error', { message: 'Failed to send check-in notification' });
    }
  }

  private async handleCheckOutNotification(socket: AuthenticatedSocket, data: any) {
    try {
      // Validate permissions
      if (!this.canProcessCheckOut(socket.role)) {
        socket.emit('error', { message: 'Permission denied' });
        return;
      }

      // Notify housekeeping about check-out
      await this.notifyHousekeepingStaff(socket.propertyId, {
        type: 'check_out',
        reservationId: data.reservationId,
        roomId: data.roomId,
        guestName: data.guestName,
        timestamp: new Date().toISOString(),
      });

      socket.emit('check_out_notification_sent', {
        reservationId: data.reservationId,
      });

    } catch (error) {
      logger.error('Error handling check-out notification:', error);
      socket.emit('error', { message: 'Failed to send check-out notification' });
    }
  }

  // Permission checking methods
  private canUpdateRoomStatus(role: string, status: string): boolean {
    const permissions = {
      'DIRECTOR': ['available', 'occupied', 'cleaning', 'maintenance', 'out_of_order'],
      'RECEPTOR': ['available', 'occupied', 'cleaning'],
      'HOUSEKEEPING': ['cleaning', 'maintenance'],
      'MAINTENANCE': ['maintenance', 'out_of_order'],
      'MANAGER': ['available', 'occupied', 'cleaning', 'maintenance', 'out_of_order'],
      'ADMIN': ['available', 'occupied', 'cleaning', 'maintenance', 'out_of_order'],
    };
    
    return permissions[role as keyof typeof permissions]?.includes(status) || false;
  }

  private canRequestHousekeeping(role: string): boolean {
    return ['DIRECTOR', 'RECEPTOR', 'MANAGER', 'ADMIN'].includes(role);
  }

  private canRequestMaintenance(role: string): boolean {
    return ['DIRECTOR', 'RECEPTOR', 'HOUSEKEEPING', 'MANAGER', 'ADMIN'].includes(role);
  }

  private canProcessCheckIn(role: string): boolean {
    return ['DIRECTOR', 'RECEPTOR', 'MANAGER', 'ADMIN'].includes(role);
  }

  private canProcessCheckOut(role: string): boolean {
    return ['DIRECTOR', 'RECEPTOR', 'MANAGER', 'ADMIN'].includes(role);
  }

  // Database integration methods (these would integrate with your Prisma schema)
  private async verifyToken(token: string): Promise<string | null> {
    // Integrate with NextAuth/JWT verification
    // This is a placeholder - implement proper token verification
    return 'user-123'; // Placeholder
  }

  private async getUserRole(userId: string): Promise<string> {
    // Fetch user role from database
    // This is a placeholder - implement proper role fetching
    return 'RECEPTOR'; // Placeholder
  }

  private async getCurrentRoomStatus(propertyId: string): Promise<any[]> {
    // Fetch current room status from database
    // This is a placeholder - implement proper database query
    return [];
  }

  private async updateRoomStatusInDB(data: RoomStatusUpdate): Promise<void> {
    // Update room status in database
    // This is a placeholder - implement proper database update
    logger.info('Updating room status:', data);
  }

  private async createHousekeepingTask(propertyId: string, data: any): Promise<any> {
    // Create housekeeping task in database
    // This is a placeholder - implement proper task creation
    return { id: 'task-123', estimatedTime: 30 };
  }

  private async createMaintenanceTask(propertyId: string, data: any): Promise<any> {
    // Create maintenance task in database
    // This is a placeholder - implement proper task creation
    return { id: 'task-456', estimatedTime: 60 };
  }

  private async sendRoomStatusNotification(socket: AuthenticatedSocket, data: RoomStatusUpdate): Promise<void> {
    // Send notification to relevant staff based on status change
    const notification: NotificationMessage = {
      type: 'room_update',
      propertyId: socket.propertyId,
      message: `Room ${data.roomId} status changed to ${data.status}`,
      data,
      priority: this.getNotificationPriority(data.status),
      timestamp: new Date().toISOString(),
    };

    this.io?.to(`property:${socket.propertyId}`).emit('notification', notification);
  }

  private async notifyHousekeepingStaff(propertyId: string, data: any): Promise<void> {
    // Notify housekeeping staff
    const notification: NotificationMessage = {
      type: 'housekeeping_request',
      propertyId,
      message: `Housekeeping requested for room ${data.roomId}`,
      data,
      priority: data.priority || 'medium',
      timestamp: new Date().toISOString(),
    };

    // Send to housekeeping staff (would filter by role in real implementation)
    this.io?.to(`property:${propertyId}`).emit('housekeeping_notification', notification);
  }

  private async notifyMaintenanceStaff(propertyId: string, data: any): Promise<void> {
    // Notify maintenance staff
    const notification: NotificationMessage = {
      type: 'maintenance_request',
      propertyId,
      message: `Maintenance requested for room ${data.roomId}`,
      data,
      priority: data.priority || 'medium',
      timestamp: new Date().toISOString(),
    };

    // Send to maintenance staff (would filter by role in real implementation)
    this.io?.to(`property:${propertyId}`).emit('maintenance_notification', notification);
  }

  private async notifyStaff(propertyId: string, data: any): Promise<void> {
    // Notify all relevant staff
    const notification: NotificationMessage = {
      type: data.type,
      propertyId,
      message: `${data.type === 'check_in' ? 'Check-in' : 'Check-out'}: ${data.guestName}`,
      data,
      priority: 'medium',
      timestamp: new Date().toISOString(),
    };

    this.io?.to(`property:${propertyId}`).emit('staff_notification', notification);
  }

  private getNotificationPriority(status: string): 'low' | 'medium' | 'high' | 'urgent' {
    const priorityMap = {
      'available': 'low',
      'occupied': 'low',
      'cleaning': 'medium',
      'maintenance': 'high',
      'out_of_order': 'urgent',
    };
    
    return priorityMap[status as keyof typeof priorityMap] || 'medium';
  }

  // Public methods for external use
  broadcastToProperty(propertyId: string, event: string, data: any) {
    this.io?.to(`property:${propertyId}`).emit(event, data);
  }

  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  getConnectedClientsByProperty(propertyId: string): AuthenticatedSocket[] {
    return Array.from(this.connectedClients.values()).filter(
      client => client.propertyId === propertyId
    );
  }
}

// Singleton instance
export const socketManager = new SocketManager();

// Next.js API route handler
export default function SocketHandler(req: NextApiRequest, res: NextApiResponse) {
  if (res.socket?.server?.io) {
    logger.info('🔌 Socket.io already initialized');
    res.end();
    return;
  }

  const httpServer = res.socket?.server as any;
  socketManager.initialize(httpServer);
  
  res.end();
}
