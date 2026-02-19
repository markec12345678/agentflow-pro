import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authOptions } from "@/lib/auth-options";
import { getLinkedInClientId, getLinkedInClientSecret } from "@/config/env";
import { setUserApiKey } from "@/lib/user-keys";

function getUserId(session: unknown): string | null {
  const s = session as { user?: { userId?: string; email?: string | null } } | null;
  if (!s?.user) return null;
  return s.user.userId ?? (typeof s.user.email === "string" ? s.user.email : null);
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = getUserId(session);
  if (!userId) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const errorParam = searchParams.get("error");

  if (errorParam) {
    return NextResponse.redirect(
      new URL(`/settings?error=linkedin_${errorParam}`, request.url)
    );
  }

  const cookieStore = await cookies();
  const storedState = cookieStore.get("linkedin_oauth_state")?.value;
  cookieStore.delete("linkedin_oauth_state");

  if (!storedState || state !== storedState || !code) {
    return NextResponse.redirect(
      new URL("/settings?error=linkedin_invalid_state", request.url)
    );
  }

  const clientId = getLinkedInClientId();
  const clientSecret = getLinkedInClientSecret();
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL("/settings?error=linkedin_not_configured", request.url)
    );
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? request.nextUrl.origin;
  const redirectUri = `${baseUrl.replace(/\/$/, "")}/api/auth/linkedin/callback`;

  const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!tokenRes.ok) {
    await tokenRes.text();
    return NextResponse.redirect(
      new URL("/settings?error=linkedin_token_exchange", request.url)
    );
  }

  const tokenData = (await tokenRes.json()) as { access_token?: string };
  const accessToken = tokenData.access_token;
  if (!accessToken) {
    return NextResponse.redirect(
      new URL("/settings?error=linkedin_no_token", request.url)
    );
  }

  await setUserApiKey(userId, "linkedin", accessToken);

  return NextResponse.redirect(new URL("/settings?linkedin=ok", request.url));
}
