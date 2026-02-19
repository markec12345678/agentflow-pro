import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/database/schema";
import { canGenerateBlogPosts } from "@/lib/blog-limits";
import { authOptions } from "@/lib/auth-options";

function deriveTitle(content: string, explicitTitle?: string): string {
  if (explicitTitle?.trim()) return explicitTitle.trim();
  const firstLine = content.split("\n")[0]?.trim() ?? "";
  if (firstLine.startsWith("# ")) return firstLine.slice(2).trim();
  if (content.length <= 50) return content.trim() || "Untitled";
  return content.slice(0, 50).trim() + "...";
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user
      ? (session.user as { userId?: string }).userId ?? session.user?.email ?? null
      : null;

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = (await request.json()) as {
      content?: string;
      title?: string;
      topic?: string;
    };
    const content = body.content?.trim() ?? "";

    if (content.length < 10) {
      return NextResponse.json(
        { error: "Content must be at least 10 characters" },
        { status: 400 }
      );
    }

    const sub = await prisma.subscription.findUnique({
      where: { userId },
    });
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { trialEndsAt: true },
    });

    const limitCheck = await canGenerateBlogPosts(userId, 1, {
      planId: sub?.planId as "starter" | "pro" | "enterprise" | undefined,
      trialEndsAt: user?.trialEndsAt ?? (session?.user as { trialEndsAt?: string | null } | undefined)?.trialEndsAt,
      currentPeriodEnd: sub?.currentPeriodEnd ?? null,
    });

    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: limitCheck.message ?? "Blog post limit exceeded" },
        { status: 403 }
      );
    }

    const title = deriveTitle(content, body.title);
    const topic = body.topic?.trim() || null;

    const post = await prisma.blogPost.create({
      data: {
        userId,
        title,
        topic,
        fullContent: content,
        metaTitle: title,
        metaDescription: content.length > 160 ? content.slice(0, 157) + "..." : content,
      },
    });

    return NextResponse.json({
      id: post.id,
      title: post.title,
      topic: post.topic,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Save failed" },
      { status: 500 }
    );
  }
}
