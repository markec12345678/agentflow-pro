/**
 * AgentFlow Pro - Next.js Middleware
 * Handles authentication and route protection
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get session token from cookies
  const sessionToken = request.cookies.get('next-auth.session-token')?.value;
  
  // Protected API routes
  const isProtectedApi = pathname.startsWith('/api/') && 
    !pathname.includes('/auth/') && 
    !pathname.includes('/webhook');
  
  if (isProtectedApi && !sessionToken) {
    return NextResponse.json(
      { error: 'Unauthorized' }, 
      { status: 401 }
    );
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
  ],
};
