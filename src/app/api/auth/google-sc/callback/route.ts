import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authOptions } from "@/lib/auth-options";
import { getGoogleClientId, getGoogleClientSecret } from "@/config/env";
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
      new URL(`/dashboard/tourism/seo?error=gsc_${errorParam}`, request.url)
    );
  }

  const cookieStore = await cookies();
  const storedState = cookieStore.get("google_sc_oauth_state")?.value;
  cookieStore.delete("google_sc_oauth_state");

  if (!storedState || state !== storedState || !code) {
    return NextResponse.redirect(
      new URL("/dashboard/tourism/seo?error=gsc_invalid_state", request.url)
    );
  }

  const clientId = getGoogleClientId();
  const clientSecret = getGoogleClientSecret();
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL("/dashboard/tourism/seo?error=gsc_not_configured", request.url)
    );
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? request.nextUrl.origin;
  const redirectUri = `${baseUrl.replace(/\/$/, "")}/api/auth/google-sc/callback`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
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
      new URL("/dashboard/tourism/seo?error=gsc_token_exchange", request.url)
    );
  }

  const tokenData = (await tokenRes.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  };
  const accessToken = tokenData.access_token;
  const refreshToken = tokenData.refresh_token ?? "";
  const expiresIn = tokenData.expires_in ?? 3600;
  if (!accessToken) {
    return NextResponse.redirect(
      new URL("/dashboard/tourism/seo?error=gsc_no_token", request.url)
    );
  }

  const expiresAt = Date.now() + expiresIn * 1000;
  await setUserApiKey(
    userId,
    "google_search_console",
    JSON.stringify({
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: expiresAt,
    })
  );

  return NextResponse.redirect(new URL("/dashboard/tourism/seo?gsc=ok", request.url));
}
