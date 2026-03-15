/**
 * GET /api/auth/csrf
 * Get CSRF token for form submissions
 */

import { NextResponse } from 'next/server';
import { logger } from '@/infrastructure/observability/logger';
import { randomBytes } from 'crypto';

export async function GET() {
  try {
    // Generate secure CSRF token
    const csrfToken = randomBytes(32).toString('hex');
    
    // Create response
    const response = NextResponse.json({
      csrfToken,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
    });

    // Set HTTP-only cookie with token
    response.cookies.set('csrf_token', csrfToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60, // 1 hour
      path: '/',
    });

    return response;
  } catch (error) {
    logger.error('CSRF token generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    );
  }
}
