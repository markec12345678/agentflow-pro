import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getUserId } from '@/lib/auth-users';
import { prisma } from '@/database/schema';

export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * PUT /api/alerts/[id]
 * Update alert status (acknowledge/dismiss)
 */
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { status } = body;

    // Validate status
    const validStatuses = ['acknowledged', 'dismissed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_STATUS', message: 'Invalid status' } },
        { status: 400 }
      );
    }

    // Update alert
    const alert = await prisma.alertEvent.update({
      where: { id },
      data: {
        status,
        acknowledgedBy: status === 'acknowledged' ? userId : null,
        acknowledgedAt: status === 'acknowledged' ? new Date() : null,
        dismissedBy: status === 'dismissed' ? userId : null,
        dismissedAt: status === 'dismissed' ? new Date() : null
      }
    });

    return NextResponse.json({
      success: true,
      data: { alert }
    });
  } catch (error) {
    console.error('Update alert error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/alerts/[id]
 * Delete an alert
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Check if alert exists and belongs to user
    const alert = await prisma.alertEvent.findFirst({
      where: { id, userId }
    });

    if (!alert) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Alert not found' } },
        { status: 404 }
      );
    }

    // Delete alert
    await prisma.alertEvent.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      data: { message: 'Alert deleted successfully' }
    });
  } catch (error) {
    console.error('Delete alert error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
