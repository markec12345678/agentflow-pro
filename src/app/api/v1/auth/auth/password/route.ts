import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/infrastructure/observability/logger';
import { getServerSession } from 'next-auth';
import { UserService } from '@/services/user.service';
import { AuthService, AuthError } from '@/services/auth.service';
import { changePassword as changePasswordAuthUsers, getUserId } from '@/lib/auth-users';
import { authOptions } from '@/lib/auth-options';

const userService = new UserService();

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/password/change
 * Change user password.
 * Accepts: NextAuth session (cookies, for web) OR Bearer token (for API clients).
 */
export async function POST(request: NextRequest) {
  try {
    let userId: string | null = null;

    const bearerToken = request.headers.get('authorization')?.replace('Bearer ', '');
    if (bearerToken) {
      try {
        const decoded = AuthService.validateSession(bearerToken);
        userId = decoded.userId;
      } catch {
        // Bearer invalid, try session
      }
    }
    if (!userId) {
      const session = await getServerSession(authOptions);
      userId = getUserId(session);
    }
    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Sign in or provide Authorization token' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_FIELDS', message: 'currentPassword and newPassword required' } },
        { status: 400 }
      );
    }

    await changePasswordAuthUsers(userId, currentPassword, newPassword);

    return NextResponse.json({ success: true, data: { message: 'Password changed successfully' } });
  } catch (error) {
    logger.error('Change password error:', error);
    const msg = error instanceof Error ? error.message : 'Internal server error';
    const isAuthErr = msg.includes('password') || msg.includes('User not found');
    return NextResponse.json(
      { success: false, error: { code: isAuthErr ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR', message: msg } },
      { status: isAuthErr ? 400 : 500 }
    );
  }
}

/**
 * POST /api/auth/password/reset
 * Request password reset
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    await userService.requestPasswordReset(email);

    return NextResponse.json({
      success: true,
      data: { message: 'Password reset email sent' },
    });
  } catch (error) {
    logger.error('Request password reset error:', error);

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
 * POST /api/auth/password/confirm
 * Confirm password reset
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, newPassword } = body;

    await userService.resetPassword(token, newPassword);

    return NextResponse.json({
      success: true,
      data: { message: 'Password reset successfully' },
    });
  } catch (error) {
    logger.error('Confirm password reset error:', error);

    if (error instanceof AuthError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        },
        { status: 400 }
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
