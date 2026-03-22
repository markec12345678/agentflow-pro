/**
 * AgentFlow Pro - LinkedIn publish via UGC Posts API
 * Requires OAuth 2.0 access token with w_member_social scope.
 * User obtains token via LinkedIn OAuth flow (future) or pastes from developer tools.
 */

export interface PublishResult {
  success: boolean;
  postUrl?: string;
  postId?: string;
  error?: string;
}

/** Strip HTML tags for plain text; LinkedIn UGC supports limited markup */
function plainText(content: string, maxLength: number): string {
  const text = content
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
  return text;
}

export async function publishToLinkedIn(
  accessToken: string,
  title: string,
  content: string,
  postUrl?: string
): Promise<PublishResult> {
  // Get person URN
  const meRes = await fetch("https://api.linkedin.com/v2/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!meRes.ok) {
    await meRes.text();
    return {
      success: false,
      error: `LinkedIn auth failed: ${meRes.status}. Check your access token and w_member_social scope.`,
    };
  }

  const meData = (await meRes.json()) as { id?: string };
  const personUrn = meData.id;
  if (!personUrn) {
    return { success: false, error: "Could not get LinkedIn person URN" };
  }

  // UGC text limit ~3000; we'll use ~1250 for share commentary
  const commentary = plainText(content, 3000);
  const shareContent: Record<string, unknown> = {
    shareCommentary: {
      text: commentary,
    },
    shareMediaCategory: "NONE",
  };

  // If we have a URL (e.g. from blog), add as article
  if (postUrl?.trim()) {
    shareContent.shareMediaCategory = "ARTICLE";
    (shareContent as { article?: unknown }).article = {
      title: plainText(title, 100),
      url: postUrl.trim(),
    };
  }

  const body = {
    author: personUrn,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": shareContent,
    },
    visibility: {
      "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
    },
  };

  const postRes = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!postRes.ok) {
    const text = await postRes.text();
    let errMsg = `LinkedIn publish failed: ${postRes.status}`;
    try {
      const json = JSON.parse(text) as { message?: string; status?: number };
      if (json.message) errMsg = json.message;
    } catch {
      if (text) errMsg = text.slice(0, 200);
    }
    return { success: false, error: errMsg };
  }

  const postData = (await postRes.json()) as { id?: string };
  const postId = postData.id;
  // LinkedIn doesn't return the post URL directly; user can view on profile
  const url = postId
    ? `https://www.linkedin.com/feed/update/${postId}`
    : undefined;

  return {
    success: true,
    postId,
    postUrl: url,
  };
}
