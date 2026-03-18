/**
 * Auth Providers API
 * 
 * Returns list of configured authentication providers
 * Used by login page to show available sign-in options
 */

import { NextResponse } from 'next/server';

/**
 * GET /api/v1/auth/providers
 * 
 * Returns configured auth providers
 */
export async function GET() {
  try {
    const providers = {
      credentials: {
        id: 'credentials',
        name: 'Credentials',
        type: 'credentials',
        enabled: true,
        fields: ['email', 'password'],
      },
      google: {
        id: 'google',
        name: 'Google',
        type: 'oauth',
        enabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      },
    };

    return NextResponse.json({
      success: true,
      data: providers,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[ProvidersAPI] Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch providers',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
