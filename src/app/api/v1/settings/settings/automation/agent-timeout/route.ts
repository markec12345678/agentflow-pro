import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/infrastructure/observability/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getUserId } from '@/lib/auth-users';
import { prisma } from '@/database/schema';

export const dynamic = "force-dynamic";

interface AgentTimeoutSettings {
  defaultTimeout: number;
  dryRunMode: boolean;
  maxConcurrentAgents: number;
  timeoutPerAgent: {
    [agentType: string]: number;
  };
}

/**
 * GET /api/settings/automation/agent-timeout
 * Get agent timeout settings
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

    // Check if user is admin or director
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!currentUser || !['admin', 'director'].includes(currentUser.role)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin or Director access required' } },
        { status: 403 }
      );
    }

    // Get timeout settings (in real implementation, this would fetch from database)
    const mockTimeoutSettings: AgentTimeoutSettings = {
      defaultTimeout: 300, // 5 minutes
      dryRunMode: false,
      maxConcurrentAgents: 5,
      timeoutPerAgent: {
        content: 600,      // 10 minutes
        analytics: 180,    // 3 minutes
        research: 300,     // 5 minutes
        code: 240,         // 4 minutes
        deploy: 120        // 2 minutes
      }
    };

    return NextResponse.json({
      success: true,
      data: { settings: mockTimeoutSettings }
    });

  } catch (error) {
    logger.error('Get agent timeout settings error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/settings/automation/agent-timeout
 * Update agent timeout settings
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

    // Check if user is admin or director
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!currentUser || !['admin', 'director'].includes(currentUser.role)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin or Director access required' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { settings } = body;

    if (!settings) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Settings are required' } },
        { status: 400 }
      );
    }

    // Validate settings
    const validationResult = validateTimeoutSettings(settings);
    if (!validationResult.valid) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: validationResult.message } },
        { status: 400 }
      );
    }

    // Update timeout settings (in real implementation)
    logger.info('Updated agent timeout settings:', settings);

    // Log activity
    await logActivity(userId, "Agent Timeout Settings Updated", `Updated agent timeout settings`, request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || "unknown");

    return NextResponse.json({
      success: true,
      data: { 
        message: 'Agent timeout settings updated successfully',
        settings
      }
    });

  } catch (error) {
    logger.error('Update agent timeout settings error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }

function validateTimeoutSettings(settings: any): { valid: boolean; message?: string } {
  if (typeof settings.defaultTimeout !== 'number' || settings.defaultTimeout < 30 || settings.defaultTimeout > 3600) {
    return { valid: false, message: 'Default timeout must be between 30 and 3600 seconds' };
  }

  if (typeof settings.dryRunMode !== 'boolean') {
    return { valid: false, message: 'Dry run mode must be a boolean' };
  }

  if (typeof settings.maxConcurrentAgents !== 'number' || settings.maxConcurrentAgents < 1 || settings.maxConcurrentAgents > 20) {
    return { valid: false, message: 'Max concurrent agents must be between 1 and 20' };
  }

  if (settings.timeoutPerAgent && typeof settings.timeoutPerAgent === 'object') {
    for (const [agentType, timeout] of Object.entries(settings.timeoutPerAgent)) {
      if (typeof timeout !== 'number' || timeout < 30 || timeout > 3600) {
        return { valid: false, message: `Timeout for ${agentType} must be between 30 and 3600 seconds` };
      }
    }
  }

  return { valid: true };
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
