/**
 * AgentFlow Pro - Next.js Middleware
 * Temporarily disabled for testing
 */

import { NextResponse } from 'next/server';

export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
