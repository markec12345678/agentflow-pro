import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/services/user.service';
import { AuthService, AuthError } from '@/services/auth.service';

const userService = new UserService();

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/register
 * Register a new user
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, planId, teamName } = body;

    const result = await userService.register({
      email,
      password,
      name,
      planId,
      teamName,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Registration error:', error);

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
 * GET /api/auth/register
 * Check if email is available
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'EMAIL_REQUIRED',
            message: 'Email is required',
          },
        },
        { status: 400 }
      );
    }

    // Check if email is available
    const existingUser = await userService.getUserByEmail(email);

    return NextResponse.json({
      success: true,
      data: {
        available: !existingUser,
      },
    });
  } catch (error) {
    console.error('Email availability check error:', error);

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
