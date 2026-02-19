import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authOptions } from "@/lib/auth-options";
import { getTwitterApiKey, getTwitterApiSecret } from "@/config/env";
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
      new URL(`/settings?error=twitter_${errorParam}`, request.url)
    );
  }

  const cookieStore = await cookies();
  const storedState = cookieStore.get("twitter_oauth_state")?.value;
  const codeVerifier = cookieStore.get("twitter_oauth_code_verifier")?.value;
  cookieStore.delete("twitter_oauth_state");
  cookieStore.delete("twitter_oauth_code_verifier");

  if (!storedState || state !== storedState || !code || !codeVerifier) {
    return NextResponse.redirect(
      new URL("/settings?error=twitter_invalid_state", request.url)
    );
  }

  const clientId = getTwitterApiKey();
  const clientSecret = getTwitterApiSecret();
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL("/settings?error=twitter_not_configured", request.url)
    );
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? request.nextUrl.origin;
  const redirectUri = `${baseUrl.replace(/\/$/, "")}/api/auth/twitter/callback`;

  const tokenRes = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(
      new URL("/settings?error=twitter_token_exchange", request.url)
    );
  }

  const tokenData = (await tokenRes.json()) as {
    access_token?: string;
    refresh_token?: string;
  };
  const accessToken = tokenData.access_token;
  if (!accessToken) {
    return NextResponse.redirect(
      new URL("/settings?error=twitter_no_token", request.url)
    );
  }

  const toStore = JSON.stringify({
    accessToken,
    refreshToken: tokenData.refresh_token ?? null,
  });
  await setUserApiKey(userId, "twitter", toStore);

  return NextResponse.redirect(new URL("/settings?twitter=ok", request.url));
}
