import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getUserId } from '@/lib/auth-users';
import { prisma } from '@/database/schema';

export const dynamic = "force-dynamic";

/**
 * GET /api/alerts/preferences
 * Get user notification preferences
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

    // Get user preferences
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        phone: true,
        notificationPreferences: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      );
    }

    // Default preferences if not set
    const defaultPreferences = {
      email: {
        enabled: true,
        address: user.email || '',
        severity: ['medium', 'high', 'critical']
      },
      sms: {
        enabled: false,
        address: user.phone || '',
        severity: ['high', 'critical']
      },
      slack: {
        enabled: false,
        address: '',
        severity: ['critical']
      }
    };

    const preferences = user.notificationPreferences as any || defaultPreferences;

    return NextResponse.json({
      success: true,
      data: { preferences }
    });
  } catch (error) {
    console.error('Get notification preferences error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/alerts/preferences
 * Update user notification preferences
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
    const { preferences } = body;

    // Validate preferences structure
    if (!preferences || typeof preferences !== 'object') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Invalid preferences data' } },
        { status: 400 }
      );
    }

    // Validate each channel
    const validChannels = ['email', 'sms', 'slack'];
    const validSeverities = ['low', 'medium', 'high', 'critical'];

    for (const [channel, config] of Object.entries(preferences)) {
      if (!validChannels.includes(channel)) {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_CHANNEL', message: `Invalid channel: ${channel}` } },
          { status: 400 }
        );
      }

      const channelConfig = config as any;
      if (typeof channelConfig !== 'object' || !('enabled' in channelConfig)) {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_CONFIG', message: `Invalid config for channel: ${channel}` } },
          { status: 400 }
        );
      }

      if (channelConfig.severity && Array.isArray(channelConfig.severity)) {
        const invalidSeverities = channelConfig.severity.filter((s: string) => !validSeverities.includes(s));
        if (invalidSeverities.length > 0) {
          return NextResponse.json(
            { success: false, error: { code: 'INVALID_SEVERITY', message: `Invalid severity levels: ${invalidSeverities.join(', ')}` } },
            { status: 400 }
          );
        }
      }
    }

    // Update user preferences
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        notificationPreferences: preferences
      }
    });

    return NextResponse.json({
      success: true,
      data: { preferences }
    });
  } catch (error) {
    console.error('Update notification preferences error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
