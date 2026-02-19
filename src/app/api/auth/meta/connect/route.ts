import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authOptions } from "@/lib/auth-options";
import { getMetaAppId } from "@/config/env";

function getUserId(session: unknown): string | null {
  const s = session as { user?: { userId?: string; email?: string | null } } | null;
  if (!s?.user) return null;
  return s.user.userId ?? (typeof s.user.email === "string" ? s.user.email : null);
}

const META_SCOPES = [
  "instagram_basic",
  "instagram_content_publish",
  "pages_show_list",
  "pages_read_engagement",
  "publish_to_groups",
].join(",");

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = getUserId(session);
  if (!userId) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const appId = getMetaAppId();
  if (!appId) {
    return NextResponse.redirect(
      new URL("/dashboard/settings?error=meta_not_configured", request.url)
    );
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? request.nextUrl.origin;
  const redirectUri = `${baseUrl.replace(/\/$/, "")}/api/auth/meta/callback`;

  const state = crypto.randomUUID();
  const cookieStore = await cookies();
  cookieStore.set("meta_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10,
    path: "/",
  });

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: META_SCOPES,
    response_type: "code",
    state,
  });

  return NextResponse.redirect(
    `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`
  );
}
