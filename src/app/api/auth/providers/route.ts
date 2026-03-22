import { NextResponse } from "next/server";

/**
 * Returns which OAuth providers are configured (for login UI)
 */
export async function GET() {
  const google =
    !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;
  return NextResponse.json({ google });
}
