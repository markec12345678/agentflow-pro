import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getUserId } from '@/lib/auth-users';
import { UserService } from '@/services/user.service';
import { AuthService, AuthError } from '@/services/auth.service';

const userService = new UserService();

export const dynamic = "force-dynamic";

/**
 * Resolve userId from Bearer token or session cookie
 */
async function getAuthUserId(request: NextRequest): Promise<string> {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (token) {
    const { userId } = AuthService.validateSession(token);
    return userId;
  }
  const session = await getServerSession(authOptions);
  const userId = getUserId(session);
  if (!userId) {
    throw new AuthError('TOKEN_REQUIRED', 'Authentication required');
  }
  return userId;
}

/**
 * GET /api/usage/alerts
 * Get user's usage alerts (session or Bearer)
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request);
    const alerts = await userService.getUsageAlerts(userId);

    return NextResponse.json({
      success: true,
      data: { alerts },
    });
  } catch (error) {
    console.error('Get usage alerts error:', error);

    if (error instanceof AuthError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        },
        { status: error.code === 'TOKEN_REQUIRED' ? 401 : 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/usage/alerts
 * Create usage alert
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request);

    const body = await request.json();
    const { type, threshold } = body;

    // Validate alert type
    const validTypes = ['agent_runs', 'api_calls', 'storage', 'cost'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_ALERT_TYPE',
            message: 'Invalid alert type',
          },
        },
        { status: 400 }
      );
    }

    // Create alert
    const alert = await userService.createUsageAlert(userId, {
      type,
      threshold,
    });

    return NextResponse.json({
      success: true,
      data: { alert },
    });
  } catch (error) {
    console.error('Create usage alert error:', error);

    if (error instanceof AuthError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        },
        { status: error.code === 'TOKEN_REQUIRED' ? 401 : 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
      },
      { status: 500 }
    );
  }
}
