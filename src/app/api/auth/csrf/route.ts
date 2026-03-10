import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

/**
 * GET /api/auth/csrf
 * Returns a CSRF token for form submissions.
 * Token is valid for 1 hour.
 */
export async function GET() {
  const csrfToken = randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour
  
  const response = NextResponse.json({
    csrfToken,
    expiresAt,
  });
  
  // Set CSRF token as httpOnly cookie
  response.cookies.set('csrf_token', csrfToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60, // 1 hour
    path: '/',
  });
  
  return response;
}
