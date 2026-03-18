/**
 * Security Headers Middleware
 * 
 * Implements OWASP Secure Headers Project recommendations:
 * - Content Security Policy (CSP)
 * - Strict Transport Security (HSTS)
 * - X-Content-Type-Options
 * - X-Frame-Options
 * - X-XSS-Protection
 * - Referrer-Policy
 * - Permissions-Policy
 * - Cross-Origin policies
 * 
 * @see https://owasp.org/www-project-secure-headers/
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export interface SecurityHeadersConfig {
  /** Content Security Policy directives */
  csp?: {
    defaultSrc?: string[];
    scriptSrc?: string[];
    styleSrc?: string[];
    imgSrc?: string[];
    fontSrc?: string[];
    connectSrc?: string[];
    frameSrc?: string[];
    objectSrc?: string[];
    baseUri?: string[];
    formAction?: string[];
    frameAncestors?: string[];
    upgradeInsecureRequests?: boolean;
  };
  /** HSTS max-age in seconds (default: 31536000 = 1 year) */
  hstsMaxAge?: number;
  /** Include subdomains in HSTS */
  hstsIncludeSubDomains?: boolean;
  /** Allow HSTS preload */
  hstsPreload?: boolean;
  /** Environment (production enables stricter headers) */
  isProduction?: boolean;
}

/**
 * Default CSP configuration for Next.js applications
 */
const DEFAULT_CSP: Required<SecurityHeadersConfig['csp']> = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
  styleSrc: ["'self'", "'unsafe-inline'"],
  imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
  fontSrc: ["'self'"],
  connectSrc: ["'self'"],
  frameSrc: ["'none'"],
  objectSrc: ["'none'"],
  baseUri: ["'self'"],
  formAction: ["'self'"],
  frameAncestors: ["'none'"],
  upgradeInsecureRequests: true,
};

/**
 * Build CSP header string from directives
 */
function buildCspHeader(csp: Required<SecurityHeadersConfig['csp']>): string {
  const directives: string[] = [];
  
  if (csp.defaultSrc) directives.push(`default-src ${csp.defaultSrc.join(' ')}`);
  if (csp.scriptSrc) directives.push(`script-src ${csp.scriptSrc.join(' ')}`);
  if (csp.styleSrc) directives.push(`style-src ${csp.styleSrc.join(' ')}`);
  if (csp.imgSrc) directives.push(`img-src ${csp.imgSrc.join(' ')}`);
  if (csp.fontSrc) directives.push(`font-src ${csp.fontSrc.join(' ')}`);
  if (csp.connectSrc) directives.push(`connect-src ${csp.connectSrc.join(' ')}`);
  if (csp.frameSrc) directives.push(`frame-src ${csp.frameSrc.join(' ')}`);
  if (csp.objectSrc) directives.push(`object-src ${csp.objectSrc.join(' ')}`);
  if (csp.baseUri) directives.push(`base-uri ${csp.baseUri.join(' ')}`);
  if (csp.formAction) directives.push(`form-action ${csp.formAction.join(' ')}`);
  if (csp.frameAncestors) directives.push(`frame-ancestors ${csp.frameAncestors.join(' ')}`);
  if (csp.upgradeInsecureRequests) directives.push('upgrade-insecure-requests');
  
  return directives.join('; ');
}

/**
 * Add security headers to response
 */
export function addSecurityHeaders(
  response: NextResponse,
  config: SecurityHeadersConfig = {}
): NextResponse {
  const {
    csp = DEFAULT_CSP,
    hstsMaxAge = 31536000,
    hstsIncludeSubDomains = true,
    hstsPreload = true,
    isProduction = process.env.NODE_ENV === 'production',
  } = config;

  // ============================================
  // CONTENT SECURITY POLICY (CSP)
  // ============================================
  const cspHeader = buildCspHeader(csp as Required<SecurityHeadersConfig['csp']>);
  response.headers.set('Content-Security-Policy', cspHeader);

  // ============================================
  // STRICT TRANSPORT SECURITY (HSTS)
  // ============================================
  if (isProduction) {
    let hstsValue = `max-age=${hstsMaxAge}`;
    if (hstsIncludeSubDomains) hstsValue += '; includeSubDomains';
    if (hstsPreload) hstsValue += '; preload';
    
    response.headers.set('Strict-Transport-Security', hstsValue);
  }

  // ============================================
  // X-CONTENT-TYPE-OPTIONS
  // ============================================
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // ============================================
  // X-FRAME-OPTIONS
  // ============================================
  response.headers.set('X-Frame-Options', 'DENY');

  // ============================================
  // X-XSS-PROTECTION
  // ============================================
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // ============================================
  // REFERRER-POLICY
  // ============================================
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // ============================================
  // PERMISSIONS-POLICY
  // ============================================
  const permissionsPolicy = [
    'accelerometer=()',
    'camera=()',
    'geolocation=()',
    'gyroscope=()',
    'magnetometer=()',
    'microphone=()',
    'payment=()',
    'usb=()',
    'fullscreen=(self)',
    'display-capture=(self)',
  ].join(', ');
  
  response.headers.set('Permissions-Policy', permissionsPolicy);

  // ============================================
  // X-PERMITTED-CROSS-DOMAIN-POLICIES
  // ============================================
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');

  // ============================================
  // CROSS-ORIGIN-OPENER-POLICY
  // ============================================
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');

  // ============================================
  // CROSS-ORIGIN-EMBEDDER-POLICY
  // ============================================
  response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');

  // ============================================
  // CROSS-ORIGIN-RESOURCE-POLICY
  // ============================================
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');

  // ============================================
  // CACHE-CONTROL (for sensitive pages)
  // ============================================
  const request = response.request;
  if (request) {
    const pathname = new URL(request.url).pathname;
    
    if (
      pathname.startsWith('/dashboard') ||
      pathname.startsWith('/settings') ||
      pathname.startsWith('/admin') ||
      pathname.startsWith('/api')
    ) {
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
    }
  }

  // ============================================
  // REMOVE SERVER INFORMATION
  // ============================================
  response.headers.delete('X-Powered-By');
  response.headers.delete('Server');

  return response;
}

/**
 * Security headers middleware for Next.js
 */
export function securityHeadersMiddleware(request: NextRequest): NextResponse {
  const response = NextResponse.next();
  
  // Skip security headers for static files
  const pathname = request.nextUrl.pathname;
  const isStaticFile = /\.(png|jpg|jpeg|gif|svg|ico|css|js|woff|woff2|ttf|eot|otf|mp4|webm|ogg|mp3|wav|pdf|doc|docx|txt|zip|json|xml|yaml|yml|map|wasm|data)$/.test(pathname);
  const isHealthCheck = pathname.startsWith('/api/health') || pathname === '/api/health';
  const isFavicon = pathname === '/favicon.ico' || pathname === '/favicon.svg';
  
  if (isStaticFile || isHealthCheck || isFavicon) {
    return response;
  }
  
  return addSecurityHeaders(response, {
    isProduction: process.env.NODE_ENV === 'production',
  });
}
