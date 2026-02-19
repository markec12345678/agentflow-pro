import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authOptions } from "@/lib/auth-options";
import { getMetaAppId, getMetaAppSecret } from "@/config/env";
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
      new URL(`/dashboard/settings?error=meta_${errorParam}`, request.url)
    );
  }

  const cookieStore = await cookies();
  const storedState = cookieStore.get("meta_oauth_state")?.value;
  cookieStore.delete("meta_oauth_state");

  if (!storedState || state !== storedState || !code) {
    return NextResponse.redirect(
      new URL("/dashboard/settings?error=meta_invalid_state", request.url)
    );
  }

  const appId = getMetaAppId();
  const appSecret = getMetaAppSecret();
  if (!appId || !appSecret) {
    return NextResponse.redirect(
      new URL("/dashboard/settings?error=meta_not_configured", request.url)
    );
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? request.nextUrl.origin;
  const redirectUri = `${baseUrl.replace(/\/$/, "")}/api/auth/meta/callback`;

  const tokenRes = await fetch(
    `https://graph.facebook.com/v18.0/oauth/access_token?` +
      new URLSearchParams({
        client_id: appId,
        client_secret: appSecret,
        redirect_uri: redirectUri,
        code,
      })
  );

  if (!tokenRes.ok) {
    await tokenRes.text();
    return NextResponse.redirect(
      new URL("/dashboard/settings?error=meta_token_exchange", request.url)
    );
  }

  const tokenData = (await tokenRes.json()) as {
    access_token?: string;
    token_type?: string;
    expires_in?: number;
  };
  const accessToken = tokenData.access_token;
  if (!accessToken) {
    return NextResponse.redirect(
      new URL("/dashboard/settings?error=meta_no_token", request.url)
    );
  }

  const expiresAt = Date.now() + (tokenData.expires_in ?? 5184000) * 1000;
  await setUserApiKey(
    userId,
    "meta",
    JSON.stringify({
      access_token: accessToken,
      expires_at: expiresAt,
    })
  );

  return NextResponse.redirect(new URL("/dashboard/settings?meta=ok", request.url));
}
