import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/services/user.service';
import { AuthError } from '@/services/auth.service';

const userService = new UserService();

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/login
 * Login user
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, rememberMe } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Email and password are required',
          },
        },
        { status: 400 }
      );
    }

    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    const result = await userService.login(
      { email, password, rememberMe },
      ipAddress,
      userAgent
    );

    // Set HTTP-only cookie for refresh token
    const response = NextResponse.json({
      success: true,
      data: {
        user: result.user,
        token: result.token,
      },
    });

    if (result.refreshToken) {
      response.cookies.set('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/',
      });
    }

    return response;
  } catch (error) {
    console.error('Login error:', error);

    if (error instanceof AuthError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
            field: error.field,
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
 * DELETE /api/auth/login
 * Logout user
 */
export async function DELETE(request: NextRequest) {
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

    await userService.logout(token);

    // Clear refresh token cookie
    const response = NextResponse.json({
      success: true,
      data: { message: 'Logged out successfully' },
    });

    response.cookies.delete('refreshToken');

    return response;
  } catch (error) {
    console.error('Logout error:', error);

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
