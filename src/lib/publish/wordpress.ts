/**
 * AgentFlow Pro - WordPress publish via REST API
 * Uses Application Password (username:app_password) with Basic auth
 */

export interface WordPressCredentials {
  siteUrl: string;
  username: string;
  appPassword: string;
}

export interface PublishResult {
  success: boolean;
  postUrl?: string;
  postId?: number;
  error?: string;
}

export async function publishToWordPress(
  credentials: WordPressCredentials,
  title: string,
  content: string,
  status: "draft" | "publish" = "draft"
): Promise<PublishResult> {
  const base = credentials.siteUrl.replace(/\/$/, "");
  const url = `${base}/wp-json/wp/v2/posts`;

  const auth = Buffer.from(
    `${credentials.username}:${credentials.appPassword}`,
    "utf8"
  ).toString("base64");

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify({
      title,
      content,
      status,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    let errMsg = `WordPress API error: ${res.status}`;
    try {
      const json = JSON.parse(text) as { message?: string };
      if (json.message) errMsg = json.message;
    } catch {
      if (text) errMsg = text.slice(0, 200);
    }
    return { success: false, error: errMsg };
  }

  const data = (await res.json()) as { id?: number; link?: string };
  return {
    success: true,
    postId: data.id,
    postUrl: data.link,
  };
}
