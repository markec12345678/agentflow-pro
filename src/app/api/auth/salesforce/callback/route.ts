import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { prisma } from "@/database/schema";
import { cookies } from "next/headers";

function getSalesforceClientId(): string {
  return process.env.SALESFORCE_CLIENT_ID ?? "";
}

function getSalesforceClientSecret(): string {
  return process.env.SALESFORCE_CLIENT_SECRET ?? "";
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

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/settings?error=salesforce_${error}`, request.url)
    );
  }

  const cookieStore = await cookies();
  const savedState = cookieStore.get("salesforce_oauth_state")?.value;
  if (!state || state !== savedState) {
    return NextResponse.redirect(
      new URL("/settings?error=salesforce_state_mismatch", request.url)
    );
  }

  cookieStore.delete("salesforce_oauth_state");

  if (!code) {
    return NextResponse.redirect(
      new URL("/settings?error=salesforce_no_code", request.url)
    );
  }

  const clientId = getSalesforceClientId();
  const clientSecret = getSalesforceClientSecret();
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL("/settings?error=salesforce_not_configured", request.url)
    );
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? request.nextUrl.origin;
  const redirectUri = `${baseUrl.replace(/\/$/, "")}/api/auth/salesforce/callback`;

  const tokenRes = await fetch("https://login.salesforce.com/services/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(
      new URL("/settings?error=salesforce_token_failed", request.url)
    );
  }

  const token = (await tokenRes.json()) as {
    access_token?: string;
    refresh_token?: string;
  };

  await prisma.integration.upsert({
    where: {
      userId_provider: { userId, provider: "salesforce" },
    },
    create: {
      userId,
      provider: "salesforce",
      accessToken: token.access_token ?? null,
      refreshToken: token.refresh_token ?? null,
    },
    update: {
      accessToken: token.access_token ?? undefined,
      refreshToken: token.refresh_token ?? undefined,
    },
  });

  return NextResponse.redirect(new URL("/settings?salesforce=connected", request.url));
}
