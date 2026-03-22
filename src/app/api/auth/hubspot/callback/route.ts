import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { getHubSpotClientId, getHubSpotClientSecret } from "@/config/env";
import { setUserApiKey } from "@/lib/user-keys";

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
      new URL(`/settings?error=hubspot_${errorParam}`, request.url)
    );
  }

  const cookieStore = await cookies();
  const storedState = cookieStore.get("hubspot_oauth_state")?.value;
  cookieStore.delete("hubspot_oauth_state");

  if (!storedState || state !== storedState || !code) {
    return NextResponse.redirect(
      new URL("/settings?error=hubspot_invalid_state", request.url)
    );
  }

  const clientId = getHubSpotClientId();
  const clientSecret = getHubSpotClientSecret();
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL("/settings?error=hubspot_not_configured", request.url)
    );
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? request.nextUrl.origin;
  const redirectUri = `${baseUrl.replace(/\/$/, "")}/api/auth/hubspot/callback`;

  const tokenRes = await fetch("https://api.hubapi.com/oauth/v1/token", {
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
      new URL("/settings?error=hubspot_token_exchange", request.url)
    );
  }

  const tokenData = (await tokenRes.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  };
  const accessToken = tokenData.access_token;
  const refreshToken = tokenData.refresh_token ?? "";
  const expiresIn = tokenData.expires_in ?? 21600;
  if (!accessToken) {
    return NextResponse.redirect(
      new URL("/settings?error=hubspot_no_token", request.url)
    );
  }

  const expiresAt = Date.now() + expiresIn * 1000;
  await setUserApiKey(
    userId,
    "hubspot",
    JSON.stringify({
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: expiresAt,
    })
  );

  return NextResponse.redirect(new URL("/settings?hubspot=ok", request.url));
}
