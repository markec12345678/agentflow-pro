import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/infrastructure/observability/logger';
import { prisma } from '@/database/schema';
import { registerUser } from '@/lib/auth-users';

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/register
 * Register a new user (uses Prisma schema, compatible with NextAuth credentials)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const name = typeof body.name === 'string' ? body.name : undefined;

    if (!email) {
      return NextResponse.json(
        { success: false, error: { code: 'EMAIL_REQUIRED', message: 'Email is required' } },
        { status: 400 }
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: { code: 'EMAIL_INVALID', message: 'Invalid email format' } },
        { status: 400 }
      );
    }
    if (!password || password.length < 8) {
      return NextResponse.json(
        { success: false, error: { code: 'PASSWORD_TOO_SHORT', message: 'Password must be at least 8 characters' } },
        { status: 400 }
      );
    }

    const result = await registerUser(email, password, name);

    if (!result) {
      return NextResponse.json(
        { success: false, error: { code: 'USER_EXISTS', message: 'User with this email already exists' } },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { id: result.id },
    });
  } catch (error) {
    logger.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
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
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        available: !existingUser,
      },
    });
  } catch (error) {
    logger.error('Email availability check error:', error);

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
