import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getUserId } from '@/lib/auth-users';
import { prisma } from '@/database/schema';

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/health/alerts/[id]/acknowledge
 * Acknowledge a health alert
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

    // Get alert details (in real implementation)
    const mockAlert = {
      id: alertId,
      type: "critical",
      title: "Storage Space Critical",
      message: "File storage is at 85% capacity. Immediate attention required.",
      component: "storage",
      severity: "critical",
      timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      acknowledged: false,
      resolved: false
    };

    if (!mockAlert) {
      return NextResponse.json(
        { success: false, error: { code: 'ALERT_NOT_FOUND', message: 'Alert not found' } },
        { status: 404 }
      );
    }

    if (mockAlert.acknowledged) {
      return NextResponse.json(
        { success: false, error: { code: 'ALREADY_ACKNOWLEDGED', message: 'Alert is already acknowledged' } },
        { status: 400 }
      );
    }

    if (mockAlert.resolved) {
      return NextResponse.json(
        { success: false, error: { code: 'ALERT_RESOLVED', message: 'Cannot acknowledge resolved alert' } },
        { status: 400 }
      );
    }

    // Acknowledge alert (in real implementation)
    const acknowledgedAlert = {
      ...mockAlert,
      acknowledged: true,
      acknowledgedBy: currentUser.name,
      acknowledgedAt: new Date().toISOString()
    };

    console.log('Acknowledged alert:', acknowledgedAlert);

    // Log activity
    await logActivity(userId, "Alert Acknowledged", `Acknowledged alert: ${mockAlert.title}`, request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || "unknown");

    return NextResponse.json({
      success: true,
      data: {
        message: 'Alert acknowledged successfully',
        alert: acknowledgedAlert
      }
    });

  } catch (error) {
    console.error('Acknowledge alert error:', error);
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
