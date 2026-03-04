import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getUserId } from '@/lib/auth-users';
import { prisma } from '@/database/schema';

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/health/alerts/[id]/resolve
 * Resolve a health alert
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
      select: { role: true, name: true }
    });

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const alertId = resolvedParams.id;
    const body = await request.json();
    const { resolution, notes } = body;

    // Get alert details (in real implementation)
    const mockAlert = {
      id: alertId,
      type: "critical",
      title: "Storage Space Critical",
      message: "File storage is at 85% capacity. Immediate attention required.",
      component: "storage",
      severity: "critical",
      timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      acknowledged: true,
      acknowledgedBy: "admin_user",
      acknowledgedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      resolved: false
    };

    if (!mockAlert) {
      return NextResponse.json(
        { success: false, error: { code: 'ALERT_NOT_FOUND', message: 'Alert not found' } },
        { status: 404 }
      );
    }

    if (mockAlert.resolved) {
      return NextResponse.json(
        { success: false, error: { code: 'ALREADY_RESOLVED', message: 'Alert is already resolved' } },
        { status: 400 }
      );
    }

    // Resolve alert (in real implementation)
    const resolvedAlert = {
      ...mockAlert,
      resolved: true,
      resolvedBy: currentUser.name,
      resolvedAt: new Date().toISOString(),
      resolution: resolution || "Issue resolved by administrator",
      notes: notes
    };

    console.log('Resolved alert:', resolvedAlert);

    // Log activity
    await logActivity(userId, "Alert Resolved", `Resolved alert: ${mockAlert.title}`, request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || "unknown");

    return NextResponse.json({
      success: true,
      data: {
        message: 'Alert resolved successfully',
        alert: resolvedAlert
      }
    });

  } catch (error) {
    console.error('Resolve alert error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }

async function logActivity(userId: string, action: string, details: string, ipAddress: string) {
  // In real implementation, this would be stored in database
  console.log('Activity log:', {
    userId,
    action,
    details,
    ipAddress,
    timestamp: new Date().toISOString()
  });
}
}
