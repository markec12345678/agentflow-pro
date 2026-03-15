import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/infrastructure/observability/logger';
import { UserService } from '@/services/user.service';
import { AuthService, AuthError } from '@/services/auth.service';

const userService = new UserService();

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('refreshToken')?.value;

    if (!refreshToken) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'REFRESH_TOKEN_REQUIRED',
            message: 'Refresh token is required',
          },
        },
        { status: 401 }
      );
    }

    const result = await userService.refreshToken(refreshToken);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Token refresh error:', error);

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
