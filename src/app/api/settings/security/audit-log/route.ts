import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getUserId } from '@/lib/auth-users';
import { prisma } from '@/database/schema';

export const dynamic = "force-dynamic";

interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  details: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
}

/**
 * GET /api/settings/security/audit-log
 * Get audit logs with filtering and pagination
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

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const userIdFilter = searchParams.get('userId');
    const actionFilter = searchParams.get('action');
    const resourceFilter = searchParams.get('resource');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Get audit logs (in real implementation, this would fetch from database)
    const mockAuditLogs: AuditLog[] = [
      {
        id: "1",
        userId: "admin_1",
        userName: "Admin User",
        action: "Data Export",
        resource: "Guest Data",
        details: "Exported data for guest: Janez Novak",
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        ipAddress: "192.168.1.100",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      },
      {
        id: "2",
        userId: "admin_1",
        userName: "Admin User",
        action: "Settings Updated",
        resource: "Privacy Policy",
        details: "Updated privacy policy version to 1.1",
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        ipAddress: "192.168.1.100",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      },
      {
        id: "3",
        userId: "admin_1",
        userName: "Admin User",
        action: "User Created",
        resource: "User Management",
        details: "Created new user: Peter Kovačič",
        timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        ipAddress: "192.168.1.100",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      },
      {
        id: "4",
        userId: "director_1",
        userName: "Maja Horvat",
        action: "Report Generated",
        resource: "Analytics",
        details: "Generated monthly revenue report",
        timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
        ipAddress: "192.168.1.101",
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
      },
      {
        id: "5",
        userId: "receptor_1",
        userName: "Peter Kovačič",
        action: "Reservation Created",
        resource: "Reservations",
        details: "Created reservation #12345 for Janez Novak",
        timestamp: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(),
        ipAddress: "192.168.1.102",
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15"
      },
      {
        id: "6",
        userId: "admin_1",
        userName: "Admin User",
        action: "GDPR Consent Updated",
        resource: "GDPR",
        details: "Updated consent for guest: Ana Zupan",
        timestamp: new Date(Date.now() - 120 * 60 * 60 * 1000).toISOString(),
        ipAddress: "192.168.1.100",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      },
      {
        id: "7",
        userId: "admin_1",
        userName: "Admin User",
        action: "API Key Generated",
        resource: "Security",
        details: "Generated new API key for production",
        timestamp: new Date(Date.now() - 144 * 60 * 60 * 1000).toISOString(),
        ipAddress: "192.168.1.100",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      },
      {
        id: "8",
        userId: "admin_1",
        userName: "Admin User",
        action: "Data Request Processed",
        resource: "Data Requests",
        details: "Completed data export for guest: Janez Novak",
        timestamp: new Date(Date.now() - 168 * 60 * 60 * 1000).toISOString(),
        ipAddress: "192.168.1.100",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      }
    ];

    // Apply filters
    let filteredLogs = mockAuditLogs;
    
    if (userIdFilter) {
      filteredLogs = filteredLogs.filter(log => log.userId === userIdFilter);
    }
    
    if (actionFilter) {
      filteredLogs = filteredLogs.filter(log => 
        log.action.toLowerCase().includes(actionFilter.toLowerCase())
      );
    }
    
    if (resourceFilter) {
      filteredLogs = filteredLogs.filter(log => 
        log.resource.toLowerCase().includes(resourceFilter.toLowerCase())
      );
    }
    
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= fromDate);
    }
    
    if (dateTo) {
      const toDate = new Date(dateTo);
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= toDate);
    }

    // Sort by timestamp (newest first)
    filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply pagination
    const paginatedLogs = filteredLogs.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: {
        logs: paginatedLogs,
        total: filteredLogs.length,
        limit,
        offset,
        filters: {
          userId: userIdFilter,
          action: actionFilter,
          resource: resourceFilter,
          dateFrom,
          dateTo
        }
      }
    });

  } catch (error) {
    console.error('Get audit logs error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/settings/security/audit-log
 * Add new audit log entry
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

    const body = await request.json();
    const { action, resource, details } = body;

    if (!action || !resource || !details) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Action, resource, and details are required' } },
        { status: 400 }
      );
    }

    // Get user name
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      );
    }

    // Create audit log entry (in real implementation)
    const auditLog: AuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      userName: user.name,
      action,
      resource,
      details,
      timestamp: new Date().toISOString(),
      ipAddress: request.ip || "unknown",
      userAgent: request.headers.get('user-agent') || "unknown"
    };

    console.log('Audit log created:', auditLog);

    return NextResponse.json({
      success: true,
      data: { 
        message: 'Audit log entry created successfully',
        log: auditLog
      }
    });

  } catch (error) {
    console.error('Create audit log error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
