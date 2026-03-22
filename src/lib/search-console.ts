/**
 * Google Search Console API - OAuth client + helpers
 */

import { google } from "googleapis";
import { getGoogleClientId, getGoogleClientSecret } from "@/config/env";

export type GscTokenPayload = {
  access_token: string;
  refresh_token?: string;
  expires_at: number;
};

export function createOAuth2Client(redirectUri: string) {
  return new google.auth.OAuth2(
    getGoogleClientId(),
    getGoogleClientSecret(),
    redirectUri
  );
}

export function createAuthenticatedClient(tokenPayload: GscTokenPayload) {
  const baseUrl = process.env.NEXTAUTH_URL ?? "";
  const redirectUri = `${baseUrl.replace(/\/$/, "")}/api/auth/google-sc/callback`;
  const oauth2 = createOAuth2Client(redirectUri);
  oauth2.setCredentials({
    access_token: tokenPayload.access_token,
    refresh_token: tokenPayload.refresh_token,
  });
  return oauth2;
}

export async function getSearchConsoleClient(tokenPayload: GscTokenPayload) {
  const auth = createAuthenticatedClient(tokenPayload);
  const searchconsole = google.searchconsole({ version: "v1", auth });
  return searchconsole;
}

export function parseGscToken(value: string): GscTokenPayload | null {
  try {
    return JSON.parse(value) as GscTokenPayload;
  } catch {
    return null;
  }
}
