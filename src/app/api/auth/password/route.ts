import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/services/user.service';
import { AuthService, AuthError } from '@/services/auth.service';

const userService = new UserService();

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/password/change
 * Change user password
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TOKEN_REQUIRED',
            message: 'Authorization token is required',
          },
        },
        { status: 401 }
      );
    }

    // Validate token and get user ID
    const { userId } = AuthService.validateSession(token);

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    await userService.changePassword(userId, {
      currentPassword,
      newPassword,
    });

    return NextResponse.json({
      success: true,
      data: { message: 'Password changed successfully' },
    });
  } catch (error) {
    console.error('Change password error:', error);

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
    console.error('Request password reset error:', error);

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
    console.error('Confirm password reset error:', error);

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
