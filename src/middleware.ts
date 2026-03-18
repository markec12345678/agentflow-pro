/**
 * AgentFlow Pro - Unified Middleware
 * 
 * Combines all middleware functionality:
 * - Security Headers (OWASP recommendations)
 * - Rate Limiting (Upstash Redis)
 * - CORS (Cross-Origin Resource Sharing)
 * - Authentication (NextAuth)
 * - CSRF Protection
 * - Request logging
 * 
 * Architecture:
 * 1. Rate Limiting (first, to reject abuse early)
 * 2. Security Headers (all responses)
 * 3. CORS (API routes only)
 * 4. Authentication (protected routes)
 * 5. CSRF (state-changing requests)
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { addSecurityHeaders } from '@/lib/security-headers';
import {
  checkRateLimitByIp,
  checkRateLimitAuth,
  checkRateLimitAI,
  getRateLimitHeaders,
  type RateLimitResult,
} from '@/lib/rate-limit';

// ============================================
// CONFIGURATION
// ============================================

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  process.env.NEXT_PUBLIC_APP_URL,
].filter(Boolean);

const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];

const ALLOWED_HEADERS = [
  'Content-Type',
  'Authorization',
  'X-API-Key',
  'X-Requested-With',
  'Accept',
  'Origin',
  'X-CSRF-Token',
];

// Custom CORS rules for specific routes
const CUSTOM_CORS_RULES: Record<string, { origins: string[]; methods: string[]; headers?: string[] }> = {
  '/api/public': {
    origins: ['*'],
    methods: ['GET', 'POST'],
    headers: ['Content-Type', 'X-API-Key'],
  },
  '/api/webhooks': {
    origins: ['*'],
    methods: ['POST'],
    headers: ['Content-Type'],
  },
  '/api/v1': {
    origins: ['*'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    headers: ['Content-Type', 'Authorization', 'X-API-Key'],
  },
};

// Routes with stricter rate limits
const RATE_LIMIT_ROUTES: Record<string, { check: (ip: string) => Promise<RateLimitResult> }> = {
  '/api/auth': {
    check: (ip: string) => checkRateLimitAuth(ip),
  },
  '/api/ai': {
    check: (ip: string) => checkRateLimitByIp(ip), // Will be overridden by user-based in future
  },
  '/api/export': {
    check: (ip: string) => checkRateLimitByIp(ip), // Will be overridden by user-based in future
  },
};

// Protected routes (require authentication)
const PROTECTED_ROUTES = [
  '/dashboard',
  '/settings',
  '/admin',
  '/api/v1',
  '/api/agents',
  '/api/workflows',
  '/api/properties',
  '/api/reservations',
  '/api/guests',
];

// Public routes (no auth required)
const PUBLIC_ROUTES = [
  '/api/auth',
  '/api/webhooks',
  '/api/health',
  '/api/public',
  '/login',
  '/register',
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get CORS rules for specific route
 */
function getCorsRules(pathname: string) {
  for (const [prefix, rules] of Object.entries(CUSTOM_CORS_RULES)) {
    if (pathname.startsWith(prefix)) {
      return rules;
    }
  }
  return null;
}

/**
 * Check if route is protected
 */
function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Check if route is public
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Get client IP from request
 */
function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

/**
 * Apply CORS headers for API routes
 */
function applyCorsHeaders(request: NextRequest, response: NextResponse): NextResponse {
  const { pathname } = request.nextUrl;
  const origin = request.headers.get('origin') || '';

  if (!pathname.startsWith('/api/')) {
    return response;
  }

  // Check for custom CORS rules
  const customRules = getCorsRules(pathname);

  if (customRules) {
    // Apply custom CORS rules
    const allowedOrigin = customRules.origins.includes('*')
      ? '*'
      : customRules.origins.find(o => o === origin) || customRules.origins[0];

    response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
    response.headers.set('Access-Control-Allow-Methods', customRules.methods.join(', '));
    response.headers.set('Access-Control-Allow-Headers', (customRules.headers || ALLOWED_HEADERS).join(', '));

    if (allowedOrigin !== '*') {
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }
  } else {
    // Apply default CORS rules
    if (ALLOWED_ORIGINS.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    } else if (process.env.NODE_ENV === 'development') {
      response.headers.set('Access-Control-Allow-Origin', origin || '*');
    }

    response.headers.set('Access-Control-Allow-Methods', ALLOWED_METHODS.join(', '));
    response.headers.set('Access-Control-Allow-Headers', ALLOWED_HEADERS.join(', '));
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin') || '*',
        'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods') || '',
        'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers') || '',
        'Access-Control-Allow-Credentials': response.headers.get('Access-Control-Allow-Credentials') || '',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  return response;
}

/**
 * Check authentication for protected routes
 */
function checkAuthentication(request: NextRequest): { authenticated: boolean; userId?: string } {
  const sessionToken = request.cookies.get('next-auth.session-token')?.value;
  
  // In development, allow access without auth
  if (process.env.NODE_ENV === 'development' && !process.env.REQUIRE_AUTH_DEV) {
    return { authenticated: true };
  }
  
  return {
    authenticated: !!sessionToken,
    userId: sessionToken, // In real implementation, decode token to get userId
  };
}

/**
 * Check CSRF token for state-changing requests
 */
function checkCsrf(request: NextRequest): { valid: boolean; error?: string } {
  const { pathname } = request.nextUrl;
  
  // Skip CSRF for auth endpoints (they have their own protection)
  if (pathname.includes('/auth/')) {
    return { valid: true };
  }
  
  const csrfToken = request.headers.get('x-csrf-token');
  const originHeader = request.headers.get('origin');
  const hostHeader = request.headers.get('host');
  
  // Check if origin matches host (basic CSRF protection)
  if (originHeader && hostHeader) {
    try {
      const originUrl = new URL(originHeader);
      const host = originUrl.host;
      
      // In production, origin should match host
      if (
        process.env.NODE_ENV === 'production' &&
        host !== hostHeader &&
        !ALLOWED_ORIGINS.includes(originHeader)
      ) {
        return { valid: false, error: 'Invalid origin' };
      }
    } catch {
      // Invalid origin URL
      return { valid: false, error: 'Invalid origin format' };
    }
  }
  
  // Require CSRF token for authenticated requests
  const sessionToken = request.cookies.get('next-auth.session-token')?.value;
  if (sessionToken && !csrfToken) {
    return { valid: false, error: 'CSRF token required' };
  }
  
  return { valid: true };
}

// ============================================
// MAIN MIDDLEWARE
// ============================================

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = getClientIp(request);
  
  // Skip middleware for static files
  const isStaticFile = /\.(png|jpg|jpeg|gif|svg|ico|css|js|woff|woff2|ttf|eot|otf|mp4|webm|ogg|mp3|wav|pdf|doc|docx|txt|zip|json|xml|yaml|yml|map|wasm|data)$/.test(pathname);
  const isHealthCheck = pathname.startsWith('/api/health') || pathname === '/api/health';
  const isFavicon = pathname === '/favicon.ico' || pathname === '/favicon.svg';
  
  if (isStaticFile || isHealthCheck || isFavicon) {
    return NextResponse.next();
  }
  
  // ─── 1. RATE LIMITING (all requests) ────────────────────────────────────────
  let rateLimitResult: RateLimitResult;
  
  // Check for route-specific rate limits
  const routeLimit = Object.entries(RATE_LIMIT_ROUTES).find(([prefix]) =>
    pathname.startsWith(prefix)
  );
  
  if (routeLimit) {
    rateLimitResult = await routeLimit[1].check(ip);
  } else {
    rateLimitResult = await checkRateLimitByIp(ip);
  }
  
  if (!rateLimitResult.allowed) {
    const errorResponse = NextResponse.json(
      {
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: rateLimitResult.retryAfter,
      },
      {
        status: 429,
      }
    );
    
    // Add rate limit headers
    Object.entries(getRateLimitHeaders(rateLimitResult)).forEach(([key, value]) => {
      errorResponse.headers.set(key, value);
    });
    
    return errorResponse;
  }
  
  // ─── 2. CREATE RESPONSE & ADD SECURITY HEADERS ─────────────────────────────
  let response = NextResponse.next();
  response = addSecurityHeaders(response);
  
  // ─── 3. CORS (API routes only) ─────────────────────────────────────────────
  response = applyCorsHeaders(request, response);
  
  // ─── 4. AUTHENTICATION (protected routes) ──────────────────────────────────
  if (isProtectedRoute(pathname) && !isPublicRoute(pathname)) {
    const { authenticated } = checkAuthentication(request);
    
    if (!authenticated) {
      // For API routes, return JSON error
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Authentication required' },
          {
            status: 401,
            headers: {
              'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin') || '*',
            },
          }
        );
      }
      
      // For page routes, redirect to login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }
  
  // ─── 5. CSRF PROTECTION (state-changing requests) ──────────────────────────
  const isStateChangingMethod = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method);
  
  if (pathname.startsWith('/api/') && isStateChangingMethod) {
    const csrfCheck = checkCsrf(request);
    
    if (!csrfCheck.valid) {
      return NextResponse.json(
        { error: 'Forbidden', message: csrfCheck.error },
        {
          status: 403,
          headers: {
            'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin') || '*',
          },
        }
      );
    }
  }
  
  // ─── 6. ADD RATE LIMIT HEADERS (success responses) ─────────────────────────
  Object.entries(getRateLimitHeaders(rateLimitResult)).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}

// ============================================
// CONFIG
// ============================================

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico
     * - public files (robots.txt, sitemap.xml, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
