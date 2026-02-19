import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/database/schema";
import { authOptions } from "@/lib/auth-options";
import { setUserApiKey, getUserApiKeys } from "@/lib/user-keys";
import { publishToWordPress } from "@/lib/publish/wordpress";
import { publishToMedium } from "@/lib/publish/medium";
import { publishToLinkedIn } from "@/lib/publish/linkedin";
import { publishToTwitter } from "@/lib/publish/twitter";
import { getTwitterApiKey, getTwitterApiSecret } from "@/config/env";

type Platform = "wordpress" | "medium" | "linkedin" | "twitter";

interface PublishBody {
  postId: string;
  platform: Platform;
  credentials?: {
    wordpress?: { siteUrl: string; username: string; appPassword: string };
    medium?: { token: string };
    linkedin?: { accessToken: string };
    twitter?: { apiKey?: string; apiSecret?: string; accessToken: string; accessTokenSecret: string };
  };
  status?: "draft" | "publish";
}

function getUserId(session: unknown): string | null {
  const s = session as { user?: { userId?: string; email?: string | null } } | null;
  if (!s?.user) return null;
  const email = s.user.email;
  return s.user.userId ?? (typeof email === "string" ? email : null);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = getUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as PublishBody;
    const { postId, platform, credentials: creds, status } = body;

    if (!postId?.trim() || !platform) {
      return NextResponse.json(
        { error: "postId and platform are required" },
        { status: 400 }
      );
    }

    if (platform !== "wordpress" && platform !== "medium" && platform !== "linkedin" && platform !== "twitter") {
      return NextResponse.json(
        { error: "Platform must be wordpress, medium, linkedin, or twitter" },
        { status: 400 }
      );
    }

    const post = await prisma.blogPost.findFirst({
      where: { id: postId, userId },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const title = post.title ?? "Untitled";
    const content = post.fullContent ?? "";

    if (platform === "wordpress") {
      let wpCreds: { siteUrl: string; username: string; appPassword: string } | null = null;

      if (creds?.wordpress?.siteUrl && creds.wordpress.username && creds.wordpress.appPassword) {
        wpCreds = creds.wordpress;
        await setUserApiKey(userId, "wordpress", JSON.stringify(wpCreds));
      } else {
        const keys = await getUserApiKeys(userId, { masked: false });
        const raw = keys.wordpress;
        if (raw) {
          try {
            wpCreds = JSON.parse(raw) as { siteUrl: string; username: string; appPassword: string };
          } catch {
            return NextResponse.json(
              { error: "Invalid saved WordPress credentials" },
              { status: 400 }
            );
          }
        }
      }

      if (!wpCreds) {
        return NextResponse.json(
          { error: "WordPress credentials required. Provide siteUrl, username, and appPassword." },
          { status: 400 }
        );
      }

      const result = await publishToWordPress(
        wpCreds,
        title,
        content,
        status === "publish" ? "publish" : "draft"
      );

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      await prisma.blogPost.update({
        where: { id: postId },
        data: { pipelineStage: "published" },
      });

      return NextResponse.json({
        success: true,
        platform: "wordpress",
        postUrl: result.postUrl,
        postId: result.postId,
      });
    }

    if (platform === "medium") {
      let token: string | null = null;

      if (creds?.medium?.token) {
        token = creds.medium.token;
        await setUserApiKey(userId, "medium", token);
      } else {
        const keys = await getUserApiKeys(userId, { masked: false });
        token = keys.medium ?? null;
      }

      if (!token) {
        return NextResponse.json(
          { error: "Medium integration token required." },
          { status: 400 }
        );
      }

      const result = await publishToMedium(
        token,
        title,
        content,
        status === "publish" ? "public" : "draft"
      );

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      await prisma.blogPost.update({
        where: { id: postId },
        data: { pipelineStage: "published" },
      });

      return NextResponse.json({
        success: true,
        platform: "medium",
        postUrl: result.postUrl,
        postId: result.postId,
      });
    }

    if (platform === "linkedin") {
    let accessToken: string | null = null;

    if (creds?.linkedin?.accessToken) {
      accessToken = creds.linkedin.accessToken;
      await setUserApiKey(userId, "linkedin", accessToken);
    } else {
      const keys = await getUserApiKeys(userId, { masked: false });
      accessToken = keys.linkedin ?? null;
    }

    if (!accessToken) {
      return NextResponse.json(
        { error: "LinkedIn access token required. Complete OAuth or add token in Settings." },
        { status: 400 }
      );
    }

    const result = await publishToLinkedIn(accessToken, title, content);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    await prisma.blogPost.update({
      where: { id: postId },
      data: { pipelineStage: "published" },
    });

    return NextResponse.json({
      success: true,
      platform: "linkedin",
      postUrl: result.postUrl,
      postId: result.postId,
    });
    }

    // platform === "twitter"
    let twCreds: {
    apiKey: string;
    apiSecret: string;
    accessToken: string;
    accessTokenSecret: string;
  } | null = null;

    if (
      creds?.twitter?.accessToken &&
      creds.twitter.accessTokenSecret
    ) {
      const apiKey = creds.twitter.apiKey?.trim() || getTwitterApiKey();
      const apiSecret = creds.twitter.apiSecret?.trim() || getTwitterApiSecret();
      if (apiKey && apiSecret) {
        twCreds = {
          apiKey,
          apiSecret,
          accessToken: creds.twitter.accessToken,
          accessTokenSecret: creds.twitter.accessTokenSecret,
        };
        await setUserApiKey(
          userId,
          "twitter",
          JSON.stringify({ accessToken: creds.twitter.accessToken, accessTokenSecret: creds.twitter.accessTokenSecret })
        );
      }
    }

    if (!twCreds) {
      const keys = await getUserApiKeys(userId, { masked: false });
      const apiKey = getTwitterApiKey();
      const apiSecret = getTwitterApiSecret();
      if (apiKey && apiSecret && keys.twitter) {
        try {
          const parsed = JSON.parse(keys.twitter) as { accessToken?: string; accessTokenSecret?: string };
          if (parsed.accessToken && parsed.accessTokenSecret) {
            twCreds = {
              apiKey,
              apiSecret,
              accessToken: parsed.accessToken,
              accessTokenSecret: parsed.accessTokenSecret,
            };
          }
        } catch {
          // ignore
        }
      }
    }

    if (!twCreds) {
      return NextResponse.json(
        { error: "Twitter credentials required. Connect via OAuth in Settings, or set TWITTER_API_KEY and TWITTER_API_SECRET and add access token/secret." },
        { status: 400 }
      );
    }

    const result = await publishToTwitter(twCreds, content, title);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    await prisma.blogPost.update({
      where: { id: postId },
      data: { pipelineStage: "published" },
    });

    return NextResponse.json({
      success: true,
      platform: "twitter",
      postUrl: result.postUrl,
      postId: result.postId,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Publish failed" },
      { status: 500 }
    );
  }
}
