import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getUserId } from '@/lib/auth-users';
import { prisma } from '@/database/schema';

export const dynamic = "force-dynamic";

interface AlertConfiguration {
  occupancyThreshold: number;
  paymentFailedThreshold: number;
  systemErrorThreshold: number;
  autoApproveFailureAlert: boolean;
  eturizemSyncFailureAlert: boolean;
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
    timezone: string;
    emergencyOnly: boolean;
  };
}

/**
 * GET /api/settings/alerts
 * Get alert configuration
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

    // Get user's alert configuration
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        alertConfiguration: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      );
    }

    // Default configuration
    const defaultConfig: AlertConfiguration = {
      occupancyThreshold: 95,
      paymentFailedThreshold: 1,
      systemErrorThreshold: 3,
      autoApproveFailureAlert: true,
      eturizemSyncFailureAlert: true,
      quietHours: {
        enabled: true,
        startTime: "22:00",
        endTime: "07:00",
        timezone: "Europe/Ljubljana",
        emergencyOnly: true
      }
    };

    const config = user.alertConfiguration as any || defaultConfig;

    return NextResponse.json({
      success: true,
      data: { config }
    });
  } catch (error) {
    console.error('Get alert configuration error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/settings/alerts
 * Update alert configuration
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
    const { config } = body;

    // Validate configuration
    if (!config || typeof config !== 'object') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Invalid configuration data' } },
        { status: 400 }
      );
    }

    // Validate thresholds
    if (config.occupancyThreshold !== undefined && (config.occupancyThreshold < 0 || config.occupancyThreshold > 100)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_THRESHOLD', message: 'Occupancy threshold must be between 0 and 100' } },
        { status: 400 }
      );
    }

    if (config.paymentFailedThreshold !== undefined && config.paymentFailedThreshold < 1) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_THRESHOLD', message: 'Payment failed threshold must be at least 1' } },
        { status: 400 }
      );
    }

    if (config.systemErrorThreshold !== undefined && config.systemErrorThreshold < 1) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_THRESHOLD', message: 'System error threshold must be at least 1' } },
        { status: 400 }
      );
    }

    // Validate quiet hours
    if (config.quietHours) {
      const { startTime, endTime } = config.quietHours;
      if (startTime && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(startTime)) {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_TIME', message: 'Invalid start time format' } },
          { status: 400 }
        );
      }
      
      if (endTime && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(endTime)) {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_TIME', message: 'Invalid end time format' } },
          { status: 400 }
        );
      }
    }

    // Update user configuration
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        alertConfiguration: config
      }
    });

    return NextResponse.json({
      success: true,
      data: { config }
    });
  } catch (error) {
    console.error('Update alert configuration error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
