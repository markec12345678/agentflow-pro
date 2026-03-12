/**
 * AgentFlow Pro - Next.js Middleware
 * Handles: Authentication, CORS, Rate Limiting, Security Headers
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkRateLimitByIp } from '@/lib/rate-limit';

// Allowed origins for CORS
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
  '/api/analytics/export': {
    origins: ['*'],
    methods: ['POST'],
    headers: ['Content-Type', 'Authorization'],
  },
};

// Get CORS rules for specific route
function getCorsRules(pathname: string) {
  for (const [prefix, rules] of Object.entries(CUSTOM_CORS_RULES)) {
    if (pathname.startsWith(prefix)) {
      return rules;
    }
  }
  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const origin = request.headers.get('origin') || '';

  // ─── Rate Limiting (all requests) ───────────────────────────────────────────
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
             request.headers.get('x-real-ip') || 
             'unknown';
  
  const rateLimitResult = await checkRateLimitByIp(ip);
  
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      {
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: rateLimitResult.retryAfter,
      },
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
          'X-RateLimit-Limit': rateLimitResult.limit?.toString() || '60',
          'X-RateLimit-Remaining': rateLimitResult.remaining?.toString() || '0',
          'X-RateLimit-Reset': rateLimitResult.reset?.toString() || '',
        },
      }
    );
  }

  // ─── CORS Headers (all API responses) ───────────────────────────────────────
  const isApiRoute = pathname.startsWith('/api/');

  let response = NextResponse.next();

  if (isApiRoute) {
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
  }

  // ─── Security Headers (all responses) ───────────────────────────────────────
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // HSTS (Strict Transport Security) - Production only
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Content Security Policy (CSP)
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.sentry.io",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://*.sentry.io https://*.vercel.app",
    "frame-ancestors 'none'",
  ];
  
  response.headers.set('Content-Security-Policy', cspDirectives.join('; '));

  // ─── Authentication (protected routes) ──────────────────────────────────────
  const sessionToken = request.cookies.get('next-auth.session-token')?.value;
  
  const isProtectedApi = isApiRoute &&
    !pathname.includes('/auth/') &&
    !pathname.includes('/webhook') &&
    !pathname.includes('/health');

  if (isProtectedApi && !sessionToken) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { 
        status: 401,
        headers: {
          'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : '*',
        },
      }
    );
  }

  // ─── CSRF Protection (state-changing requests) ──────────────────────────────
  const isStateChangingMethod = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method);
  
  if (isApiRoute && isStateChangingMethod) {
    // Skip CSRF for auth endpoints (they have their own protection)
    if (!pathname.includes('/auth/')) {
      const csrfToken = request.headers.get('x-csrf-token');
      const originHeader = request.headers.get('origin');
      const hostHeader = request.headers.get('host');
      
      // Check if origin matches host (basic CSRF protection)
      if (originHeader && hostHeader) {
        try {
          const originUrl = new URL(originHeader);
          const host = originUrl.host;
          
          // In production, origin should match host
          if (process.env.NODE_ENV === 'production' && 
              host !== hostHeader && 
              !ALLOWED_ORIGINS.includes(originHeader)) {
            return NextResponse.json(
              { error: 'Forbidden: Invalid origin' },
              { 
                status: 403,
                headers: {
                  'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : '*',
                },
              }
            );
          }
        } catch {
          // Invalid origin URL
          return NextResponse.json(
            { error: 'Forbidden: Invalid origin format' },
            { 
              status: 403,
              headers: {
                'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : '*',
              },
            }
          );
        }
      }
      
      // Require CSRF token for authenticated requests
      if (sessionToken && !csrfToken) {
        return NextResponse.json(
          { error: 'Forbidden: CSRF token required' },
          { 
            status: 403,
            headers: {
              'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : '*',
            },
          }
        );
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
