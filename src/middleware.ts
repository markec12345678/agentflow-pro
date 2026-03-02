import { NextResponse } from "next/server";

// Disabled authentication for production
export default function middleware(req) {
  // Allow all access for production
  return NextResponse.next();
}

export const config = {
  matcher: [
    // No protected paths for now
  ],
};
