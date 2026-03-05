import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getUserId } from '@/lib/auth-users';
import { prisma } from '@/database/schema';

export const dynamic = "force-dynamic";

/**
 * GET /api/alerts/rules
 * Get all alert rules
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

    const rules = await prisma.alertRule.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: { rules }
    });
  } catch (error) {
    console.error('Get alert rules error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/alerts/rules
 * Create a new alert rule
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
    const { 
      name, 
      eventType, 
      threshold, 
      severity, 
      enabled = true,
      channels,
      cooldownMinutes = 60,
      escalateAfterMinutes,
      escalateTo 
    } = body;

    // Validate required fields
    if (!name || !eventType || !severity || !channels || !Array.isArray(channels)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Missing required fields' } },
        { status: 400 }
      );
    }

    // Validate severity
    const validSeverities = ['low', 'medium', 'high', 'critical'];
    if (!validSeverities.includes(severity)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_SEVERITY', message: 'Invalid severity level' } },
        { status: 400 }
      );
    }

    // Validate channels
    const validChannels = ['email', 'sms', 'slack'];
    const invalidChannels = channels.filter((c: string) => !validChannels.includes(c));
    if (invalidChannels.length > 0) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_CHANNELS', message: 'Invalid channels' } },
        { status: 400 }
      );
    }

    // Create rule
    const rule = await prisma.alertRule.create({
      data: {
        name,
        eventType,
        threshold,
        severity,
        enabled,
        channels,
        cooldownMinutes,
        escalateAfterMinutes,
        escalateTo,
        createdBy: userId
      }
    });

    return NextResponse.json({
      success: true,
      data: { rule }
    });
  } catch (error) {
    console.error('Create alert rule error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
