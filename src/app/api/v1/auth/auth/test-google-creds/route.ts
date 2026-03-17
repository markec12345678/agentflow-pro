/**
 * Google OAuth Credentials Test Endpoint
 * 
 * This endpoint validates your Google OAuth credentials without
 * requiring a full OAuth flow. Useful for debugging setup issues.
 * 
 * Usage:
 *   GET /api/auth/test-google-creds
 * 
 * Response includes:
 *   - Environment variable status
 *   - Credential format validation
 *   - OAuth discovery document check
 */

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Validate Google OAuth credential format
 */
function validateCredentialFormat(
  clientId: string | undefined,
  clientSecret: string | undefined
) {
  const issues: { type: "error" | "warning" | "success"; message: string }[] = [];

  if (!clientId) {
    issues.push({
      type: "error",
      message: "GOOGLE_CLIENT_ID is not set in environment variables",
    });
  } else {
    if (!clientId.endsWith(".apps.googleusercontent.com")) {
      issues.push({
        type: "warning",
        message: `GOOGLE_CLIENT_ID format looks suspicious (should end with .apps.googleusercontent.com): ${clientId.substring(0, 20)}...`,
      });
    } else {
      issues.push({
        type: "success",
        message: "GOOGLE_CLIENT_ID format is valid",
      });
    }
  }

  if (!clientSecret) {
    issues.push({
      type: "error",
      message: "GOOGLE_CLIENT_SECRET is not set in environment variables",
    });
  } else {
    if (!clientSecret.startsWith("GOCSPX-")) {
      issues.push({
        type: "warning",
        message: `GOOGLE_CLIENT_SECRET format looks suspicious (should start with GOCSPX-): ${clientSecret.substring(0, 10)}...`,
      });
    } else {
      issues.push({
        type: "success",
        message: "GOOGLE_CLIENT_SECRET format is valid",
      });
    }
  }

  return issues;
}

/**
 * Check if Google OAuth discovery document is accessible
 */
async function checkGoogleOAuthDiscovery() {
  try {
    const response = await fetch(
      "https://accounts.google.com/.well-known/openid-configuration",
      {
        method: "GET",
        headers: { Accept: "application/json" },
      }
    );

    if (!response.ok) {
      return {
        accessible: false,
        status: response.status,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const config = await response.json();

    return {
      accessible: true,
      status: response.status,
      issuer: config.issuer,
      authorizationEndpoint: config.authorization_endpoint,
      tokenEndpoint: config.token_endpoint,
      userinfoEndpoint: config.userinfo_endpoint,
      jwksUri: config.jwks_uri,
    };
  } catch (error) {
    return {
      accessible: false,
      status: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Verify redirect URIs are properly configured
 */
function checkRedirectURIs(nextAuthUrl: string | undefined) {
  const issues: { type: "error" | "warning" | "info"; message: string }[] = [];
  const requiredRedirectUris: string[] = [];

  if (!nextAuthUrl) {
    issues.push({
      type: "error",
      message:
        "NEXTAUTH_URL is not set - OAuth redirect will fail",
    });
    return { issues, requiredRedirectUris };
  }

  // Construct the callback URL
  const callbackUrl = `${nextAuthUrl.replace(/\/$/, "")}/api/auth/callback/google`;
  requiredRedirectUris.push(callbackUrl);

  issues.push({
    type: "info",
    message: `You must add this redirect URI to Google Cloud Console: ${callbackUrl}`,
  });

  // Check for common issues
  if (
    nextAuthUrl.includes("localhost") &&
    !nextAuthUrl.includes("3000") &&
    !nextAuthUrl.includes("3001") &&
    !nextAuthUrl.includes("3002")
  ) {
    issues.push({
      type: "warning",
      message:
        "NEXTAUTH_URL uses localhost without a port - ensure it matches your dev server",
    });
  }

  return { issues, requiredRedirectUris };
}

export async function GET(request: NextRequest) {
  logger.info("[TEST] Google OAuth credentials test endpoint called");

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const nextAuthSecret = process.env.NEXTAUTH_SECRET;
  const nextAuthUrl = process.env.NEXTAUTH_URL;

  // Validate credential format
  const formatIssues = validateCredentialFormat(clientId, clientSecret);

  // Check Google OAuth discovery
  const discoveryCheck = await checkGoogleOAuthDiscovery();

  // Check redirect URIs
  const redirectCheck = checkRedirectURIs(nextAuthUrl);

  // Check NEXTAUTH_SECRET
  if (!nextAuthSecret) {
    formatIssues.push({
      type: "error",
      message: "NEXTAUTH_SECRET is not set - required for session signing",
    });
  } else if (nextAuthSecret.length < 32) {
    formatIssues.push({
      type: "warning",
      message: `NEXTAUTH_SECRET is only ${nextAuthSecret.length} characters (should be 32+)`,
    });
  } else {
    formatIssues.push({
      type: "success",
      message: "NEXTAUTH_SECRET length is valid",
    });
  }

  // Calculate overall status
  const hasErrors = formatIssues.some((issue) => issue.type === "error");
  const hasWarnings = formatIssues.some((issue) => issue.type === "warning");

  const statusCode = hasErrors ? 500 : hasWarnings ? 206 : 200;

  const response = NextResponse.json(
    {
      ok: !hasErrors,
      summary: {
        googleEnabled: !!(clientId && clientSecret),
        hasErrors,
        hasWarnings,
        errorCount: formatIssues.filter((i) => i.type === "error").length,
        warningCount: formatIssues.filter((i) => i.type === "warning").length,
        successCount: formatIssues.filter((i) => i.type === "success").length,
      },
      environment: {
        googleClientId: clientId
          ? `${clientId.substring(0, 20)}...${clientId.slice(-10)}`
          : "MISSING",
        googleClientSecret: clientSecret
          ? `${clientSecret.substring(0, 10)}...${clientSecret.slice(-5)}`
          : "MISSING",
        nextAuthSecret: nextAuthSecret ? "SET" : "MISSING",
        nextAuthUrl: nextAuthUrl || "MISSING",
      },
      validation: {
        format: formatIssues,
        discovery: discoveryCheck,
        redirectUris: redirectCheck.issues,
        requiredRedirectUris: redirectCheck.requiredRedirectUris,
      },
      nextSteps: hasErrors
        ? [
            "Fix the errors above before testing Google OAuth",
            "Check your .env.local file has correct values",
            "Restart the dev server after changing .env.local",
          ]
        : [
            "Add the required redirect URIs to Google Cloud Console",
            "Test the full OAuth flow at /login",
            "Check browser console for any OAuth errors",
          ],
    },
    { status: statusCode }
  );

  // Add cache control to prevent caching
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  response.headers.set("Pragma", "no-cache");

  return response;
}
