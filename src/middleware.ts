import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const PROTECTED_PATHS = [
  "/dashboard",
  "/workflows",
  "/generate",
  "/profile",
  "/settings",
  "/content",
];

function _isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    if (token) {
      const trialEndsAt = token.trialEndsAt
        ? new Date(token.trialEndsAt as string).getTime()
        : 0;
      const hasActiveTrial = trialEndsAt > Date.now();
      const hasSubscription = !!token.subscriptionActive;

      if (!hasActiveTrial && !hasSubscription) {
        return NextResponse.redirect(new URL("/pricing", req.url));
      }
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: { signIn: "/login" },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/workflows/:path*",
    "/generate/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/content/:path*",
    "/chat/:path*",
  ],
};
