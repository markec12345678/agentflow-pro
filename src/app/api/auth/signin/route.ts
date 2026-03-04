import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  
  // Preusmerimo na našo custom login stran
  return NextResponse.redirect(new URL(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`, request.url));
}
