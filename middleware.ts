/**
 * Next.js Middleware for Auth Protection
 *
 * Protects dashboard routes and redirects unauthenticated users.
 */

import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// ============================================================================
// Public Routes (no auth required)
// ============================================================================

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/signin",
  "/api/auth/**",
  "/api/health",
  "/api/tourism/webhooks/**",
  "/settings", // Allow public access to settings for configuration
];

// ============================================================================
// Protected Routes (auth required)
// ============================================================================

const PROTECTED_ROUTES = [
  "/dashboard",
  "/agents",
  "/content",
  "/chat",
  "/book",
  "/canvas",
  "/check-in",
  "/alerts",
  "/analytics",
  "/apps",
];

// ============================================================================
// Middleware
// ============================================================================

export default withAuth(
  function middleware(req) {
    const { nextUrl } = req;

    // Allow public routes
    if (
      PUBLIC_ROUTES.some(
        (route) =>
          nextUrl.pathname === route ||
          nextUrl.pathname.startsWith(route + "/") ||
          (route.includes("**") &&
            nextUrl.pathname.startsWith(route.replace("**", ""))),
      )
    ) {
      return NextResponse.next();
    }

    // Protect dashboard routes
    if (PROTECTED_ROUTES.some((route) => nextUrl.pathname.startsWith(route))) {
      // User is authenticated (withAuth handles this)
      return NextResponse.next();
    }

    // Allow all other routes
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  },
);

// ============================================================================
// Matcher - Which routes should middleware run on
// ============================================================================

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (robots.txt, sitemap.xml, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
