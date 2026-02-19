/**
 * AgentFlow Pro - Medium publish via Integration Token API
 * GET /v1/me for authorId, then POST /v1/users/{authorId}/posts
 */

export interface PublishResult {
  success: boolean;
  postUrl?: string;
  postId?: string;
  error?: string;
}

export async function publishToMedium(
  integrationToken: string,
  title: string,
  content: string,
  publishStatus: "draft" | "public" = "draft"
): Promise<PublishResult> {
  const meRes = await fetch("https://api.medium.com/v1/me", {
    headers: {
      Authorization: `Bearer ${integrationToken}`,
    },
  });

  if (!meRes.ok) {
    const _text = await meRes.text();
    return {
      success: false,
      error: `Medium auth failed: ${meRes.status}. Check your integration token.`,
    };
  }

  const meData = (await meRes.json()) as { data?: { id?: string } };
  const authorId = meData.data?.id;
  if (!authorId) {
    return { success: false, error: "Could not get Medium user ID" };
  }

  const postsRes = await fetch(
    `https://api.medium.com/v1/users/${authorId}/posts`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${integrationToken}`,
      },
      body: JSON.stringify({
        title,
        contentFormat: "markdown",
        content,
        publishStatus,
        license: "all-rights-reserved",
      }),
    }
  );

  if (!postsRes.ok) {
    const text = await postsRes.text();
    let errMsg = `Medium publish failed: ${postsRes.status}`;
    try {
      const json = JSON.parse(text) as { errors?: Array< { message?: string }> };
      const msg = json.errors?.[0]?.message;
      if (msg) errMsg = msg;
    } catch {
      if (text) errMsg = text.slice(0, 200);
    }
    return { success: false, error: errMsg };
  }

  const postsData = (await postsRes.json()) as {
    data?: { id?: string; url?: string };
  };
  return {
    success: true,
    postId: postsData.data?.id,
    postUrl: postsData.data?.url,
  };
}
