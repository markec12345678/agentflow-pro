/**
 * HubSpot OAuth token helpers - refresh when expired
 */

import { getUserApiKeys, setUserApiKey } from "./user-keys";
import { getHubSpotClientId, getHubSpotClientSecret } from "@/config/env";

const BUFFER_MS = 60 * 1000; // refresh 1 min before expiry

export type HubSpotTokenData = {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
};

export async function getValidHubSpotToken(userId: string): Promise<string | null> {
  const keys = await getUserApiKeys(userId, { masked: false });
  const hubspotRaw = keys.hubspot;
  if (!hubspotRaw?.trim()) return null;

  let data: HubSpotTokenData;
  try {
    data = JSON.parse(hubspotRaw) as HubSpotTokenData;
  } catch {
    return hubspotRaw; // legacy: plain token
  }

  const now = Date.now();
  const expiresAt = data.expires_at ?? 0;
  const needsRefresh = data.refresh_token && (expiresAt === 0 || now >= expiresAt - BUFFER_MS);
  if (needsRefresh) {
    const refreshed = await refreshHubSpotToken(data.refresh_token!);
    if (refreshed) {
      const toStore: HubSpotTokenData = {
        access_token: refreshed.access_token,
        refresh_token: refreshed.refresh_token ?? data.refresh_token,
        expires_at: refreshed.expires_at,
      };
      await setUserApiKey(userId, "hubspot", JSON.stringify(toStore));
      return refreshed.access_token;
    }
  }

  return data.access_token;
}

async function refreshHubSpotToken(refreshToken: string): Promise<HubSpotTokenData | null> {
  const clientId = getHubSpotClientId();
  const clientSecret = getHubSpotClientSecret();
  if (!clientId || !clientSecret) return null;

  const res = await fetch("https://api.hubapi.com/oauth/v1/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!res.ok) return null;

  const data = (await res.json()) as { access_token?: string; refresh_token?: string; expires_in?: number };
  const accessToken = data.access_token;
  if (!accessToken) return null;

  const expiresIn = data.expires_in ?? 21600; // HubSpot default ~6h
  const expiresAt = Date.now() + expiresIn * 1000;

  return {
    access_token: accessToken,
    refresh_token: data.refresh_token ?? refreshToken,
    expires_at: expiresAt,
  };
}

export function parseHubSpotStoredToken(raw: string): HubSpotTokenData & { access_token: string } {
  try {
    const parsed = JSON.parse(raw) as HubSpotTokenData;
    return {
      access_token: parsed.access_token ?? raw,
      refresh_token: parsed.refresh_token,
      expires_at: parsed.expires_at,
    };
  } catch {
    return { access_token: raw };
  }
}
