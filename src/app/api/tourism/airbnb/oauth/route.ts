/**
 * AgentFlow Pro - Airbnb OAuth2 Handler
 * OAuth2 authorization flow for Airbnb API
 */

import { prisma } from "@/database/schema";
import { NextRequest, NextResponse } from "next/server";

const AIRBNB_CLIENT_ID = process.env.AIRBNB_CLIENT_ID;
const AIRBNB_CLIENT_SECRET = process.env.AIRBNB_CLIENT_SECRET;
const AIRBNB_REDIRECT_URI = process.env.AIRBNB_REDIRECT_URI || "http://localhost:3002/api/tourism/airbnb/oauth/callback";
const AIRBNB_AUTH_URL = "https://www.airbnb.com/oauth2/authorize";
const AIRBNB_TOKEN_URL = "https://www.airbnb.com/oauth2/token";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  if (action === "connect") {
    return initiateOAuth2(request);
  } else if (action === "callback") {
    return handleCallback(request);
  } else if (action === "refresh") {
    return refreshToken(request);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

/**
 * Initiate OAuth2 flow
 */
async function initiateOAuth2(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const propertyId = searchParams.get("propertyId");

  if (!propertyId) {
    return NextResponse.json({ error: "Missing propertyId" }, { status: 400 });
  }

  const state = Buffer.from(JSON.stringify({
    propertyId,
    timestamp: Date.now(),
  })).toString("base64");

  const params = new URLSearchParams({
    client_id: AIRBNB_CLIENT_ID || "",
    redirect_uri: AIRBNB_REDIRECT_URI,
    response_type: "code",
    scope: "reservations:read reservations:write listings:read",
    state,
  });

  const authUrl = `${AIRBNB_AUTH_URL}?${params.toString()}`;

  return NextResponse.redirect(authUrl);
}

/**
 * Handle OAuth2 callback
 */
async function handleCallback(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.json({ error: `OAuth2 error: ${error}` }, { status: 400 });
  }

  if (!code || !state) {
    return NextResponse.json({ error: "Missing code or state" }, { status: 400 });
  }

  try {
    // Decode state to get propertyId
    const stateData = JSON.parse(Buffer.from(state, "base64").toString());
    const propertyId = stateData.propertyId;

    // Exchange code for token
    const tokenResponse = await fetch(AIRBNB_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: AIRBNB_CLIENT_ID || "",
        client_secret: AIRBNB_CLIENT_SECRET || "",
        redirect_uri: AIRBNB_REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Token exchange failed: ${errorText}`);
    }

    const tokens = await tokenResponse.json();

    // Store credentials in database
    await prisma.pmsConnection.upsert({
      where: {
        propertyId_provider: {
          propertyId,
          provider: "airbnb",
        },
      },
      update: {
        credentials: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
          scope: tokens.scope,
        },
        connectedAt: new Date(),
      },
      create: {
        propertyId,
        provider: "airbnb",
        credentials: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
          scope: tokens.scope,
        },
        connectedAt: new Date(),
      },
    });

    // Redirect to success page
    return NextResponse.redirect(
      new URL(`/dashboard/tourism/airbnb?connected=true`, request.url)
    );
  } catch (error) {
    logger.error("[Airbnb OAuth2] Error:", error);
    return NextResponse.redirect(
      new URL(`/dashboard/tourism/airbnb?error=${error instanceof Error ? error.message : "Unknown error"}`, request.url)
    );
  }
}

/**
 * Refresh access token
 */
async function refreshToken(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const propertyId = searchParams.get("propertyId");

  if (!propertyId) {
    return NextResponse.json({ error: "Missing propertyId" }, { status: 400 });
  }

  try {
    // Get current credentials
    const connection = await prisma.pmsConnection.findUnique({
      where: {
        propertyId_provider: {
          propertyId,
          provider: "airbnb",
        },
      },
    });

    if (!connection || !connection.credentials) {
      return NextResponse.json({ error: "No credentials found" }, { status: 404 });
    }

    const credentials = connection.credentials as any;
    if (!credentials.refreshToken) {
      return NextResponse.json({ error: "No refresh token" }, { status: 404 });
    }

    // Refresh token
    const tokenResponse = await fetch(AIRBNB_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: credentials.refreshToken,
        client_id: AIRBNB_CLIENT_ID || "",
        client_secret: AIRBNB_CLIENT_SECRET || "",
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Token refresh failed: ${errorText}`);
    }

    const tokens = await tokenResponse.json();

    // Update credentials
    await prisma.pmsConnection.update({
      where: {
        propertyId_provider: {
          propertyId,
          provider: "airbnb",
        },
      },
      data: {
        credentials: {
          ...credentials,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || credentials.refreshToken,
          expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        },
      },
    });

    return NextResponse.json({
      success: true,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
    });
  } catch (error) {
    logger.error("[Airbnb Token Refresh] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Token refresh failed" },
      { status: 500 }
    );
  }
}

/**
 * Disconnect Airbnb
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { propertyId } = body;

    if (!propertyId) {
      return NextResponse.json({ error: "Missing propertyId" }, { status: 400 });
    }

    // Revoke token (optional)
    const connection = await prisma.pmsConnection.findUnique({
      where: {
        propertyId_provider: {
          propertyId,
          provider: "airbnb",
        },
      },
    });

    if (connection && connection.credentials) {
      const credentials = connection.credentials as any;
      if (credentials.accessToken) {
        // Revoke token
        await fetch("https://www.airbnb.com/oauth2/revoke", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            token: credentials.accessToken,
            client_id: AIRBNB_CLIENT_ID || "",
          }),
        });
      }
    }

    // Delete connection
    await prisma.pmsConnection.delete({
      where: {
        propertyId_provider: {
          propertyId,
          provider: "airbnb",
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("[Airbnb Disconnect] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Disconnect failed" },
      { status: 500 }
    );
  }
}
