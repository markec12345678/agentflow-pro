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
 * PUT /api/alerts/rules/[id]
 * Update an alert rule
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
    const { 
      name, 
      eventType, 
      threshold, 
      severity, 
      enabled,
      channels,
      cooldownMinutes,
      escalateAfterMinutes,
      escalateTo 
    } = body;

    // Validate severity if provided
    if (severity) {
      const validSeverities = ['low', 'medium', 'high', 'critical'];
      if (!validSeverities.includes(severity)) {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_SEVERITY', message: 'Invalid severity level' } },
          { status: 400 }
        );
      }
    }

    // Validate channels if provided
    if (channels) {
      const validChannels = ['email', 'sms', 'slack'];
      const invalidChannels = channels.filter((c: string) => !validChannels.includes(c));
      if (invalidChannels.length > 0) {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_CHANNELS', message: 'Invalid channels' } },
          { status: 400 }
        );
      }
    }

    // Update rule
    const rule = await prisma.alertRule.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(eventType && { eventType }),
        ...(threshold !== undefined && { threshold }),
        ...(severity && { severity }),
        ...(enabled !== undefined && { enabled }),
        ...(channels && { channels }),
        ...(cooldownMinutes !== undefined && { cooldownMinutes }),
        ...(escalateAfterMinutes !== undefined && { escalateAfterMinutes }),
        ...(escalateTo !== undefined && { escalateTo })
      }
    });

    return NextResponse.json({
      success: true,
      data: { rule }
    });
  } catch (error) {
    console.error('Update alert rule error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/alerts/rules/[id]
 * Delete an alert rule
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

    // Check if rule exists
    const rule = await prisma.alertRule.findFirst({
      where: { id }
    });

    if (!rule) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Alert rule not found' } },
        { status: 404 }
      );
    }

    // Delete rule
    await prisma.alertRule.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      data: { message: 'Alert rule deleted successfully' }
    });
  } catch (error) {
    console.error('Delete alert rule error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
