import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/infrastructure/observability/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getUserId } from '@/lib/auth-users';
import { prisma } from '@/database/schema';

export const dynamic = "force-dynamic";

interface HealthAlert {
  id: string;
  type: "critical" | "warning" | "info";
  title: string;
  message: string;
  component: string;
  severity: "low" | "medium" | "high" | "critical";
  timestamp: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  metadata: {
    [key: string]: any;
  };
}

/**
 * GET /api/admin/health/alerts
 * Get health alerts
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Check if user is admin
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // active, acknowledged, resolved, all
    const severity = searchParams.get('severity');
    const component = searchParams.get('component');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get alerts (in real implementation, this would fetch from database)
    const mockAlerts: HealthAlert[] = [
      {
        id: "alert_1",
        type: "critical",
        title: "Storage Space Critical",
        message: "File storage is at 85% capacity. Immediate attention required.",
        component: "storage",
        severity: "critical",
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        acknowledged: false,
        resolved: false,
        metadata: {
          usedSpace: "850GB",
          totalSpace: "1TB",
          availableSpace: "150GB",
          threshold: 80
        }
      },
      {
        id: "alert_2",
        type: "warning",
        title: "AI Agent Performance Degraded",
        message: "AI agents showing increased response times and failure rates.",
        component: "agents",
        severity: "medium",
        timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
        acknowledged: false,
        resolved: false,
        metadata: {
          averageResponseTime: 850,
          normalResponseTime: 500,
          failureRate: 1.5,
          normalFailureRate: 0.5
        }
      },
      {
        id: "alert_3",
        type: "warning",
        title: "Database Connection Pool Near Limit",
        message: "Database connection pool is using 90% of available connections.",
        component: "database",
        severity: "high",
        timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        acknowledged: true,
        acknowledgedBy: "admin_user",
        acknowledgedAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
        resolved: false,
        metadata: {
          activeConnections: 90,
          maxConnections: 100,
          threshold: 85
        }
      },
      {
        id: "alert_4",
        type: "info",
        title: "Database Backup Completed",
        message: "Daily database backup completed successfully.",
        component: "database",
        severity: "low",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        acknowledged: true,
        acknowledgedBy: "system",
        acknowledgedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        resolved: true,
        resolvedBy: "system",
        resolvedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        metadata: {
          backupSize: "2.4GB",
          duration: "5 minutes",
          type: "daily"
        }
      },
      {
        id: "alert_5",
        type: "critical",
        title: "API Server Response Time Critical",
        message: "API server response times exceeded 5 seconds threshold.",
        component: "api",
        severity: "critical",
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        acknowledged: true,
        acknowledgedBy: "admin_user",
        acknowledgedAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString(),
        resolved: true,
        resolvedBy: "admin_user",
        resolvedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        metadata: {
          responseTime: 5200,
          threshold: 5000,
          affectedEndpoints: 12
        }
      }
    ];

    // Apply filters
    let filteredAlerts = mockAlerts;
    
    if (status && status !== 'all') {
      if (status === 'active') {
        filteredAlerts = filteredAlerts.filter(alert => !alert.resolved);
      } else if (status === 'acknowledged') {
        filteredAlerts = filteredAlerts.filter(alert => alert.acknowledged && !alert.resolved);
      } else if (status === 'resolved') {
        filteredAlerts = filteredAlerts.filter(alert => alert.resolved);
      }
    }
    
    if (severity) {
      filteredAlerts = filteredAlerts.filter(alert => alert.severity === severity);
    }
    
    if (component) {
      filteredAlerts = filteredAlerts.filter(alert => alert.component === component);
    }

    // Sort by timestamp (newest first)
    filteredAlerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply pagination
    const paginatedAlerts = filteredAlerts.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: {
        alerts: paginatedAlerts,
        total: filteredAlerts.length,
        limit,
        offset,
        filters: {
          status,
          severity,
          component
        },
        summary: {
          critical: mockAlerts.filter(a => a.type === 'critical' && !a.resolved).length,
          warning: mockAlerts.filter(a => a.type === 'warning' && !a.resolved).length,
          info: mockAlerts.filter(a => a.type === 'info' && !a.resolved).length,
          total: mockAlerts.filter(a => !a.resolved).length,
          acknowledged: mockAlerts.filter(a => a.acknowledged && !a.resolved).length
        }
      }
    });

  } catch (error) {
    logger.error('Get alerts error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/health/alerts
 * Create a new health alert
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Check if user is admin
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { type, title, message, component, severity = 'medium', metadata } = body;

    if (!type || !title || !message || !component) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Type, title, message, and component are required' } },
        { status: 400 }
      );
    }

    // Validate alert type
    const validTypes = ["critical", "warning", "info"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_TYPE', message: 'Invalid alert type' } },
        { status: 400 }
      );
    }

    // Validate severity
    const validSeverities = ["low", "medium", "high", "critical"];
    if (!validSeverities.includes(severity)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_SEVERITY', message: 'Invalid severity level' } },
        { status: 400 }
      );
    }

    // Create alert (in real implementation)
    const newAlert: HealthAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
      type,
      title,
      message,
      component,
      severity,
      timestamp: new Date().toISOString(),
      acknowledged: false,
      resolved: false,
      metadata: metadata || {}
    };

    logger.info('Created health alert:', newAlert);

    // Log activity
    await logActivity(userId, "Health Alert Created", `Created alert: ${title}`, request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || "unknown");

    return NextResponse.json({
      success: true,
      data: {
        message: 'Health alert created successfully',
        alert: newAlert
      }
    });

  } catch (error) {
    logger.error('Create alert error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }

async function logActivity(userId: string, action: string, details: string, ipAddress: string) {
  // In real implementation, this would be stored in database
  logger.info('Activity log:', {
    userId,
    action,
    details,
    ipAddress,
    timestamp: new Date().toISOString()
  });
}
}
