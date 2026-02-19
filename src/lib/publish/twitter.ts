/**
 * AgentFlow Pro - Twitter/X publish via API v2
 * Supports OAuth 2.0 Bearer (from PKCE flow) or OAuth 1.0a User Context.
 */

import crypto from "crypto";

export interface TwitterCredentialsOAuth1 {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessTokenSecret: string;
}

export interface TwitterCredentialsOAuth2 {
  accessToken: string;
}

export type TwitterCredentials = TwitterCredentialsOAuth1 | TwitterCredentialsOAuth2;

export interface PublishResult {
  success: boolean;
  postUrl?: string;
  postId?: string;
  error?: string;
}

function isOAuth2(cred: TwitterCredentials): cred is TwitterCredentialsOAuth2 {
  return "accessToken" in cred && !("accessTokenSecret" in cred);
}

async function publishWithBearer(
  accessToken: string,
  tweetText: string
): Promise<PublishResult> {
  const res = await fetch("https://api.twitter.com/2/tweets", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ text: tweetText }),
  });

  if (!res.ok) {
    const textRes = await res.text();
    let errMsg = `Twitter API error: ${res.status}`;
    try {
      const json = JSON.parse(textRes) as { detail?: string; title?: string };
      if (json.detail) errMsg = json.detail;
      else if (json.title) errMsg = json.title;
    } catch {
      if (textRes) errMsg = textRes.slice(0, 200);
    }
    return { success: false, error: errMsg };
  }

  const data = (await res.json()) as { data?: { id?: string } };
  const tweetId = data.data?.id;
  return {
    success: true,
    postId: tweetId,
    postUrl: tweetId ? `https://twitter.com/i/status/${tweetId}` : undefined,
  };
}

/**
 * OAuth 1.0a HMAC-SHA1 signature for Twitter API
 */
function oauthSign(
  method: string,
  url: string,
  params: Record<string, string>,
  consumerSecret: string,
  tokenSecret: string
): string {
  const sortedKeys = Object.keys(params).sort();
  const base = sortedKeys
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
    .join("&");
  const baseString = [
    method,
    encodeURIComponent(url),
    encodeURIComponent(base),
  ].join("&");
  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;
  const signature = crypto
    .createHmac("sha1", signingKey)
    .update(baseString)
    .digest("base64");
  return signature;
}

function nonce(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export async function publishToTwitter(
  credentials: TwitterCredentials,
  text: string,
  _title?: string
): Promise<PublishResult> {
  const maxLength = 280;
  const tweetText = text
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);

  if (!tweetText) {
    return { success: false, error: "Content is empty" };
  }

  if (isOAuth2(credentials)) {
    return publishWithBearer(credentials.accessToken, tweetText);
  }

  const creds = credentials as TwitterCredentialsOAuth1;
  const method = "POST";
  const url = "https://api.twitter.com/2/tweets";
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const oauthNonce = nonce();

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: creds.apiKey,
    oauth_nonce: oauthNonce,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: timestamp,
    oauth_token: creds.accessToken,
    oauth_version: "1.0",
  };

  const signature = oauthSign(
    method,
    url,
    oauthParams,
    creds.apiSecret,
    creds.accessTokenSecret
  );
  oauthParams.oauth_signature = signature;

  const authHeader =
    "OAuth " +
    Object.entries(oauthParams)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(v)}"`)
      .join(", ");

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
    },
    body: JSON.stringify({ text: tweetText }),
  });

  if (!res.ok) {
    const textRes = await res.text();
    let errMsg = `Twitter API error: ${res.status}`;
    try {
      const json = JSON.parse(textRes) as { detail?: string; title?: string };
      if (json.detail) errMsg = json.detail;
      else if (json.title) errMsg = json.title;
    } catch {
      if (textRes) errMsg = textRes.slice(0, 200);
    }
    return { success: false, error: errMsg };
  }

  const data = (await res.json()) as { data?: { id?: string } };
  const tweetId = data.data?.id;
  const postUrl = tweetId
    ? `https://twitter.com/i/status/${tweetId}`
    : undefined;

  return {
    success: true,
    postId: tweetId,
    postUrl,
  };
}
