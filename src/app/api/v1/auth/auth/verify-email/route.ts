import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/infrastructure/observability/logger';
import { UserService } from '@/services/user.service';
import { AuthService, AuthError } from '@/services/auth.service';

const userService = new UserService();

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/verify-email
 * Verify email address
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    await userService.verifyEmail(token);

    return NextResponse.json({
      success: true,
      data: { message: 'Email verified successfully' },
    });
  } catch (error) {
    logger.error('Email verification error:', error);

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
 * POST /api/auth/resend-verification
 * Resend email verification
 */
export async function PUT(request: NextRequest) {
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

    const user = await userService.getUserById(userId);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
          },
        },
        { status: 404 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'EMAIL_ALREADY_VERIFIED',
            message: 'Email is already verified',
          },
        },
        { status: 400 }
      );
    }

    // Send new verification email
    await userService.sendEmailVerification(user.email);

    return NextResponse.json({
      success: true,
      data: { message: 'Verification email sent' },
    });
  } catch (error) {
    logger.error('Resend verification error:', error);

    if (error instanceof AuthError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        },
        { status: 401 }
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
