/**
 * Security Headers Middleware
 * 
 * Adds critical security headers to all responses
 * Based on OWASP Secure Headers Project
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Get the pathname
  const path = request.nextUrl.pathname;
  
  // Skip security headers for static files and API health checks
  const isStaticFile = /\.(png|jpg|jpeg|gif|svg|ico|css|js|woff|woff2|ttf|eot|otf|mp4|webm|ogg|mp3|wav|pdf|doc|docx|txt|zip|json|xml|yaml|yml|map|wasm|data)$/.test(path);
  const isHealthCheck = path.startsWith('/api/health') || path === '/api/health';
  const isFavicon = path === '/favicon.ico' || path === '/favicon.svg';
  
  if (isStaticFile || isHealthCheck || isFavicon) {
    return response;
  }
  
  // ============================================
  // CRITICAL SECURITY HEADERS
  // ============================================
  
  /**
   * Content Security Policy (CSP)
   * Controls which resources can be loaded from which sources
   * Prevents XSS attacks by restricting resource loading
   */
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://www.google-analytics.com https://analytics.google.com",
    "frame-src 'self' https://www.google.com https://www.youtube.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    "upgrade-insecure-requests",
  ];
  
  response.headers.set('Content-Security-Policy', cspDirectives.join('; '));
  
  /**
   * Strict Transport Security (HSTS)
   * Forces HTTPS connections for 1 year (31536000 seconds)
   * Includes subdomains and allows preloading
   */
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );
  
  /**
   * X-Content-Type-Options
   * Prevents MIME type sniffing
   * Forces browser to use declared Content-Type
   */
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  /**
   * X-Frame-Options
   * Prevents clickjacking attacks
   * Only allows framing from same origin
   */
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  
  /**
   * X-XSS-Protection
   * Legacy XSS filter for older browsers
   * Modern browsers use CSP instead
   */
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  /**
   * Referrer-Policy
   * Controls how much referrer information is sent
   * Strict-origin-when-cross-origin is a good balance
   */
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  /**
   * Permissions-Policy (formerly Feature-Policy)
   * Controls which browser features can be used
   * Disables unnecessary features for better security
   */
  const permissionsDirectives = [
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
  ];
  
  response.headers.set('Permissions-Policy', permissionsDirectives.join(', '));
  
  /**
   * X-Permitted-Cross-Domain-Policies
   * Restricts Adobe Flash and PDF cross-domain policies
   */
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
  
  /**
   * Cross-Origin-Opener-Policy
   * Isolates browsing context from cross-origin documents
   */
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  
  /**
   * Cross-Origin-Embedder-Policy
   * Prevents loading cross-origin resources without explicit permission
   */
  response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
  
  /**
   * Cross-Origin-Resource-Policy
   * Restricts which cross-origin resources can be loaded
   */
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  
  /**
   * Cache-Control for sensitive pages
   * Prevents caching of sensitive data
   */
  if (path.startsWith('/dashboard') || path.startsWith('/settings') || path.startsWith('/api')) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }
  
  /**
   * Remove server information
   * Don't leak server technology details
   */
  response.headers.delete('X-Powered-By');
  response.headers.delete('Server');
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (robots.txt, sitemap.xml, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
