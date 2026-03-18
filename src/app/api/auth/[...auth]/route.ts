/**
 * NextAuth v5 - Auth Route Handler
 *
 * This is the main auth endpoint for NextAuth v5
 * All auth requests go through /api/auth/*
 *
 * Routes:
 * - GET /api/auth/signin - Sign in page
 * - POST /api/auth/signin - Sign in action
 * - GET /api/auth/signout - Sign out page
 * - POST /api/auth/signout - Sign out action
 * - GET /api/auth/session - Get session
 * - GET /api/auth/providers - Get providers
 * - GET /api/auth/callback/:provider - OAuth callback
 */

// Import from src/auth.ts (NextAuth v5 configuration)
import { handlers } from '@/auth';

// Export GET and POST handlers from NextAuth v5
export const { GET, POST } = handlers;

// Force dynamic rendering to avoid static generation errors
export const dynamic = 'force-dynamic';

// Optional: Add runtime config
export const runtime = 'nodejs';

// Optional: Add max duration for serverless functions
export const maxDuration = 60; // 60 seconds
