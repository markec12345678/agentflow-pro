import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createContentAgent } from "@/agents/content/ContentAgent";
import { validateAgainstBrandVoice } from "@/agents/content/brand-guardrails";
import { recordAgentRun } from "@/api/usage";
import { prisma } from "@/database/schema";
import { canGenerateBlogPosts } from "@/lib/blog-limits";
import { indexBlogPost } from "@/lib/vector-indexer";
import { authOptions } from "@/lib/auth-options";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user
      ? (session.user as { userId?: string }).userId ?? session.user.email ?? null
      : null;

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = (await request.json()) as {
      topic?: string;
      topics?: string[];
      count?: number;
      useMock?: boolean;
      audienceId?: string;
      audienceContext?: string;
    };

    const { topic = "", topics: topicsArray, count = 10, useMock = false, audienceId, audienceContext } = body;

    const useTopicsArray = topicsArray?.length && Array.isArray(topicsArray);
    const topicCount = Math.min(
      Math.max(Number(count) ?? 10, 1),
      useTopicsArray ? 50 : 20
    );
    const topicsToUse = useTopicsArray
      ? (topicsArray as string[])
        .filter((t) => typeof t === "string" && String(t).trim())
        .slice(0, 50)
      : topic?.trim()
        ? Array.from({ length: topicCount }, (_, i) => `${topic.trim()} - Angle ${i + 1}`)
        : [];

    if (topicsToUse.length === 0) {
      return NextResponse.json(
        { error: "Topic or topics array is required" },
        { status: 400 }
      );
    }

    const num = topicsToUse.length;

    const sub = await prisma.subscription.findUnique({
      where: { userId },
    });
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { trialEndsAt: true },
    });

    const limit = Math.min(num, 50);
    const limitCheck = await canGenerateBlogPosts(userId, limit, {
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

    const onboarding = await prisma.onboarding.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    let resolvedAudienceContext = audienceContext?.trim() ?? null;
    if (!resolvedAudienceContext && audienceId && onboarding?.audiences) {
      const audiences = onboarding.audiences as { id: string; messaging: string }[] | null;
      const aud = audiences?.find((a) => a.id === audienceId);
      if (aud?.messaging) resolvedAudienceContext = aud.messaging;
    }

    if (useMock) {
      const posts = Array.from({ length: limit }, (_, i) => {
        const t = topicsToUse[i] ?? topic;
        return {
          title: `Post ${i + 1}: ${t}`,
          excerpt: `Mock excerpt for ${t} - Angle ${i + 1}. Lorem ipsum...`,
          fullContent: `# Post ${i + 1}: ${t}\n\nMock content for development.`,
          metaTitle: `Post ${i + 1}: ${t}`,
          metaDescription: `Mock excerpt for ${t} - Angle ${i + 1}. Lorem ipsum...`,
          keywords: ["mock", "development", "test"],
          seoScore: Math.floor(Math.random() * 20) + 80,
        };
      });
      await prisma.blogPost.createMany({
        data: posts.map((p, i) => ({
          userId,
          title: p.title,
          topic: topicsToUse[i] ?? topic,
          fullContent: p.fullContent,
          metaTitle: p.metaTitle,
          metaDescription: p.metaDescription,
        })),
      });
      return NextResponse.json({ success: true, posts });
    }

    const agent = createContentAgent();

    const companyKnowledge = onboarding?.companyKnowledge as
      | { products?: string[]; competitors?: string[]; keyFacts?: string[] }
      | null
      | undefined;

    const results = await Promise.all(
      topicsToUse.map((t) =>
        agent.execute({
          topic: t,
          format: "blog",
          brandVoiceSummary: onboarding?.brandVoiceSummary ?? null,
          styleGuide: onboarding?.styleGuide ?? null,
          visualGuidelines: onboarding?.visualGuidelines ?? null,
          audienceContext: resolvedAudienceContext,
          companyKnowledge: companyKnowledge ?? null,
        })
      )
    );

    const posts = results.map((r, i) => {
      const output = r as { blog?: string; keywords?: string[] };
      const blog = output.blog ?? "";
      const titleMatch = blog.match(/^#\s+(.+)/m);
      const title = titleMatch?.[1] ?? `Post ${i + 1}`;
      const body = blog.replace(/^#\s+.+\n*/m, "").trim();
      const excerpt = body.substring(0, 200) + (body.length > 200 ? "..." : "");
      const metaTitle = title;
      const metaDescription = excerpt.length > 160 ? excerpt.slice(0, 157) + "..." : excerpt;
      return {
        title,
        excerpt,
        fullContent: blog,
        metaTitle,
        metaDescription,
        keywords: output.keywords ?? [],
        seoScore: Math.floor(Math.random() * 20) + 80,
      };
    });

    const created = await Promise.all(
      posts.map((p, i) => {
        const guardrail = validateAgainstBrandVoice(
          p.fullContent ?? "",
          onboarding?.brandVoiceSummary ?? null,
          onboarding?.styleGuide ?? null
        );
        return prisma.blogPost.create({
          data: {
            userId,
            title: p.title,
            topic: topicsToUse[i] ?? topic,
            fullContent: p.fullContent,
            metaTitle: p.metaTitle,
            metaDescription: p.metaDescription,
            guardrailIssues: guardrail.issues.length ? guardrail.issues : undefined,
          },
        });
      })
    );

    for (const r of created) indexBlogPost(r.id, r);

    const postsWithId = created.map((r) => ({
      id: r.id,
      title: r.title,
      excerpt: r.fullContent ? r.fullContent.slice(0, 200) + (r.fullContent.length > 200 ? "..." : "") : "",
      fullContent: r.fullContent,
    }));

    await recordAgentRun(userId, "content", {
      input: { topic, topics: topicsToUse, count: created.length },
      output: { postIds: created.map((r) => r.id) },
    });

    return NextResponse.json({
      success: true,
      posts: postsWithId,
      usage: { used: limitCheck.used + limit, limit: limitCheck.limit },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    );
  }
}
