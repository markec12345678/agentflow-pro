import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth-options";
import { getUserApiKeys } from "@/lib/user-keys";

function getUserId(session: unknown): string | null {
  const s = session as { user?: { userId?: string; email?: string | null } } | null;
  if (!s?.user) return null;
  return s.user.userId ?? (typeof s.user.email === "string" ? s.user.email : null);
}

function parseMetaToken(value: string): { access_token: string } | null {
  try {
    const o = JSON.parse(value) as { access_token?: string };
    return o.access_token ? { access_token: o.access_token } : null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const keys = await getUserApiKeys(userId, { masked: false });
    const raw = keys.meta;
    const token = raw ? parseMetaToken(raw) : null;
    if (!token?.access_token) {
      return NextResponse.json(
        { error: "Connect Meta (Facebook/Instagram) first in Settings" },
        { status: 401 }
      );
    }

    const body = (await request.json()) as {
      caption?: string;
      imageUrl?: string;
      platform?: "facebook" | "instagram";
      pageId?: string;
      instagramAccountId?: string;
    };

    const { caption, imageUrl, platform = "facebook", pageId, instagramAccountId } = body;

    if (!caption?.trim()) {
      return NextResponse.json({ error: "caption required" }, { status: 400 });
    }

    const accessToken = token.access_token;

    if (platform === "instagram" && imageUrl) {
      if (!instagramAccountId) {
        return NextResponse.json(
          { error: "instagramAccountId required for Instagram" },
          { status: 400 }
        );
      }
      const createRes = await fetch(
        `https://graph.facebook.com/v18.0/${instagramAccountId}/media`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image_url: imageUrl,
            caption: caption.trim(),
            access_token: accessToken,
          }),
        }
      );
      const createData = (await createRes.json()) as { id?: string; error?: { message?: string } };
      if (!createRes.ok || createData.error) {
        return NextResponse.json(
          { error: createData.error?.message ?? "Instagram media creation failed" },
          { status: 400 }
        );
      }
      const containerId = createData.id;
      const publishRes = await fetch(
        `https://graph.facebook.com/v18.0/${instagramAccountId}/media_publish`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            creation_id: containerId,
            access_token: accessToken,
          }),
        }
      );
      const publishData = (await publishRes.json()) as { id?: string; error?: { message?: string } };
      if (!publishRes.ok || publishData.error) {
        return NextResponse.json(
          { error: publishData.error?.message ?? "Instagram publish failed" },
          { status: 400 }
        );
      }
      return NextResponse.json({
        platform: "instagram",
        postId: publishData.id,
        message: "Objavljeno na Instagram",
      });
    }

    if (platform === "facebook" && pageId) {
      const postRes = await fetch(
        `https://graph.facebook.com/v18.0/${pageId}/feed`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: caption.trim(),
            link: imageUrl || undefined,
            access_token: accessToken,
          }),
        }
      );
      const postData = (await postRes.json()) as { id?: string; error?: { message?: string } };
      if (!postRes.ok || postData.error) {
        return NextResponse.json(
          { error: postData.error?.message ?? "Facebook publish failed" },
          { status: 400 }
        );
      }
      return NextResponse.json({
        platform: "facebook",
        postId: postData.id,
        message: "Objavljeno na Facebook",
      });
    }

    return NextResponse.json(
      {
        error:
          platform === "instagram"
            ? "imageUrl and instagramAccountId required"
            : "pageId required for Facebook",
      },
      { status: 400 }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Publish failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
