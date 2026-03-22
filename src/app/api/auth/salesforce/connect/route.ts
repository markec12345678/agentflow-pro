import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";

function getSalesforceClientId(): string {
  return process.env.SALESFORCE_CLIENT_ID ?? "";
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  const userId = getUserId(session);
  if (!userId) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const clientId = getSalesforceClientId();
  if (!clientId) {
    return NextResponse.redirect(
      new URL("/settings?error=salesforce_not_configured", request.url)
    );
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? request.nextUrl.origin;
  const redirectUri = `${baseUrl.replace(/\/$/, "")}/api/auth/salesforce/callback`;

  const state = crypto.randomUUID();
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  cookieStore.set("salesforce_oauth_state", state, {
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
    state,
  });

  return NextResponse.redirect(
    `https://login.salesforce.com/services/oauth2/authorize?${params.toString()}`
  );
}
