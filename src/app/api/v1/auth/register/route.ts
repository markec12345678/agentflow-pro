/**
 * User Registration API
 * 
 * Handles user registration with email/password
 * 
 * Routes:
 * - POST /api/v1/auth/register - Create new user
 * - GET /api/v1/auth/register - Get registration info (prevents 404)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// ============================================
// ZOD SCHEMAS
// ============================================

const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').optional(),
  teamId: z.string().uuid().optional(),
});

const RegisterInfoSchema = z.object({
  allowRegistration: z.boolean().optional(),
  requireEmailVerification: z.boolean().optional(),
  minPasswordLength: z.number().optional(),
});

// ============================================
// TYPES
// ============================================

type RegisterInput = z.infer<typeof RegisterSchema>;

// ============================================
// ERROR HANDLING
// ============================================

interface ApiError {
  error: string;
  message: string;
  details?: any;
  code: string;
}

function createErrorResponse(
  error: string,
  message: string,
  code: string,
  details?: any,
  status: number = 400
): NextResponse<ApiError> {
  console.error(`[RegisterAPI] ${error}:`, message, details);
  
  return NextResponse.json(
    {
      error,
      message,
      code,
      details,
    },
    { status }
  );
}

// ============================================
// GET HANDLER - Registration Info
// ============================================

export async function GET(request: NextRequest) {
  try {
    // Return registration configuration
    const info = {
      allowRegistration: process.env.ALLOW_REGISTRATION !== 'false',
      requireEmailVerification: process.env.REQUIRE_EMAIL_VERIFICATION === 'true',
      minPasswordLength: 8,
      maxPasswordLength: 128,
      supportedProviders: ['credentials', 'google'],
      features: {
        emailVerification: true,
        passwordReset: true,
        teamInvitation: true,
      },
    };

    return NextResponse.json({
      success: true,
      data: info,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[RegisterAPI] GET error:', error);
    
    return createErrorResponse(
      'Internal Server Error',
      'Failed to fetch registration info',
      'INTERNAL_ERROR',
      process.env.NODE_ENV === 'development' ? error : undefined,
      500
    );
  }
}

// ============================================
// POST HANDLER - Create User
// ============================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Check if registration is allowed
    if (process.env.ALLOW_REGISTRATION === 'false') {
      return createErrorResponse(
        'Registration Disabled',
        'User registration is currently disabled',
        'REGISTRATION_DISABLED',
        undefined,
        403
      );
    }

    // Parse request body
    const body = await request.json();
    const bodyResult = RegisterSchema.safeParse(body);

    if (!bodyResult.success) {
      return createErrorResponse(
        'Validation Error',
        'Invalid registration data',
        'INVALID_BODY',
        bodyResult.error.flatten()
      );
    }

    const { email, password, name, teamId } = bodyResult.data;

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true, emailVerified: true },
    });

    if (existingUser) {
      return createErrorResponse(
        'Conflict',
        'User with this email already exists',
        'USER_EXISTS',
        { email: normalizedEmail },
        409
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Set trial period (7 days from now)
    const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        name: name || null,
        trialEndsAt,
        emailVerified: null, // Require email verification
        activeTeamId: teamId || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        trialEndsAt: true,
        createdAt: true,
      },
    });

    // TODO: Send verification email
    // await sendVerificationEmail(user.email);

    console.log('[RegisterAPI] User created:', {
      userId: user.id,
      email: user.email,
      trialEndsAt: user.trialEndsAt,
    });

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          trialEndsAt: user.trialEndsAt.toISOString(),
        },
        message: 'Registration successful. Please check your email for verification.',
        requiresVerification: true,
      },
      meta: {
        executionTimeMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      },
    }, { status: 201 });
  } catch (error) {
    console.error('[RegisterAPI] POST error:', error);
    
    // Handle Prisma-specific errors
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return createErrorResponse(
          'Conflict',
          'User already exists',
          'DUPLICATE_EMAIL',
          undefined,
          409
        );
      }
    }
    
    return createErrorResponse(
      'Internal Server Error',
      'Failed to create user',
      'INTERNAL_ERROR',
      process.env.NODE_ENV === 'development' ? error : undefined,
      500
    );
  }
}
