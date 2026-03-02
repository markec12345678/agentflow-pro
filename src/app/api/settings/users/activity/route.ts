import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getUserId } from '@/lib/auth-users';
import { prisma } from '@/database/schema';

export const dynamic = "force-dynamic";

interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
  ipAddress: string;
}

/**
 * GET /api/settings/users/activity
 * Get activity log for all users
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

    // Get activity logs (in real implementation, this would fetch from database)
    const mockActivityLogs: ActivityLog[] = [
      {
        id: "1",
        userId: "1",
        userName: "Janez Novak",
        action: "User Created",
        details: "Created new user: Peter Kovačič",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        ipAddress: "192.168.1.100"
      },
      {
        id: "2",
        userId: "2",
        userName: "Maja Horvat",
        action: "Role Changed",
        details: "Changed role from receptor to director",
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        ipAddress: "192.168.1.101"
      },
      {
        id: "3",
        userId: "3",
        userName: "Peter Kovačič",
        action: "2FA Enabled",
        details: "Two-factor authentication enabled",
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        ipAddress: "192.168.1.102"
      },
      {
        id: "4",
        userId: "1",
        userName: "Janez Novak",
        action: "Password Reset",
        details: "Password reset link sent to: Ana Zupan",
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        ipAddress: "192.168.1.100"
      },
      {
        id: "5",
        userId: "4",
        userName: "Ana Zupan",
        action: "User Deactivated",
        details: "User account deactivated",
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        ipAddress: "192.168.1.103"
      },
      {
        id: "6",
        userId: "1",
        userName: "Janez Novak",
        action: "Settings Updated",
        details: "Business settings updated",
        timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        ipAddress: "192.168.1.100"
      },
      {
        id: "7",
        userId: "2",
        userName: "Maja Horvat",
        action: "Report Generated",
        details: "Monthly report generated",
        timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
        ipAddress: "192.168.1.101"
      },
      {
        id: "8",
        userId: "3",
        userName: "Peter Kovačič",
        action: "Reservation Created",
        details: "New reservation created: #12345",
        timestamp: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(),
        ipAddress: "192.168.1.102"
      }
    ];

    // Apply filters
    let filteredLogs = mockActivityLogs;
    
    if (userIdFilter) {
      filteredLogs = filteredLogs.filter(log => log.userId === userIdFilter);
    }
    
    if (actionFilter) {
      filteredLogs = filteredLogs.filter(log => log.action.toLowerCase().includes(actionFilter.toLowerCase()));
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
        offset
      }
    });

  } catch (error) {
    console.error('Get activity logs error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/settings/users/activity
 * Log a new activity
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
    const { action, details } = body;

    if (!action || !details) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Action and details are required' } },
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

    // Create activity log (in real implementation)
    const activityLog: ActivityLog = {
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      userName: user.name,
      action,
      details,
      timestamp: new Date().toISOString(),
      ipAddress: request.ip || "unknown"
    };

    console.log('Activity logged:', activityLog);

    return NextResponse.json({
      success: true,
      data: { 
        message: 'Activity logged successfully',
        log: activityLog
      }
    });

  } catch (error) {
    console.error('Log activity error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
