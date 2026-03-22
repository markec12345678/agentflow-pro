import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { getLinkedInClientId } from "@/config/env";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = getUserId(session);
  if (!userId) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const clientId = getLinkedInClientId();
  if (!clientId) {
    return NextResponse.redirect(
      new URL("/settings?error=linkedin_not_configured", request.url)
    );
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? request.nextUrl.origin;
  const redirectUri = `${baseUrl.replace(/\/$/, "")}/api/auth/linkedin/callback`;

  const state = crypto.randomUUID();
  const cookieStore = await cookies();
  cookieStore.set("linkedin_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10,
    path: "/",
  });

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "w_member_social",
    state,
  });

  return NextResponse.redirect(
    `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`
  );
}
