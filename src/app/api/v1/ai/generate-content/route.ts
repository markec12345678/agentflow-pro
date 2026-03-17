import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createContentAgent } from "@/agents/content/ContentAgent";
import { validateAgainstBrandVoice } from "@/agents/content/brand-guardrails";
import { recordAgentRun } from '@/app/api/v1/reports/usage';
import { prisma } from "@/database/schema";
import { canGenerateBlogPosts } from "@/lib/blog-limits";
import { indexBlogPost } from "@/lib/vector-indexer";
import { authOptions } from "@/lib/auth-options";

// ─── Tourism template prompts ────────────────────────────────────────────────
function buildTourismPrompt(
  template: string,
  fields: Record<string, string>,
  language: string
): string {
  const name     = fields.name     ?? "nastanitev";
  const location = fields.location ?? "Slovenija";
  const highlights = fields.highlights ?? "";
  const langLabel: Record<string, string> = {
    sl: "slovenščini", en: "English", de: "Deutsch", it: "italiano", hr: "hrvatskom",
  };
  const lang = langLabel[language] ?? "slovenščini";

  switch (template) {
    case "booking-description":
      return `Napiši profesionalni opis nastanitve "${name}" v ${location} za Booking.com / Airbnb v ${lang}.
Poudarki: ${highlights || "prijazno osebje, odlična lokacija, čiste sobe"}.
Sobe: ${fields.rooms || "moderne, udobne sobe"}.
Vsebina naj bo privlačna, SEO optimizirana, 200-300 besed.`;

    case "guest-welcome-email":
      return `Napiši email dobrodošlice za goste nastanitve "${name}" v ${location} v ${lang}.
Check-in: ${fields.checkin || "14:00"}. 
Lokalni nasveti: ${fields.tips || "obiščite lokalne restavracije in znamenitosti"}.
Email naj bo topel, informativen, 150-200 besed.`;

    case "destination-guide":
      return `Napiši SEO vodič destinacije ${location} v ${lang}.
Aktivnosti: ${fields.activities || "pohodništvo, kolesarjenje, lokalna kultura"}.
Poudarki: ${highlights || "narava, kultura, gastro"}.
Vsebina 400-500 besed, SEO optimizirana za turiste.`;

    case "instagram-travel":
      return `Napiši Instagram caption za nastanitev "${name}" v ${location} v ${lang}.
Poudarki: ${highlights || "čudovita narava, mir, odlična lokacija"}.
Dodaj 10-15 relevantnih hashtagov. Ton: navdušen, pritegljiv, 80-120 besed.`;

    case "landing-page":
      return `Napiši besedilo za landing stran nastanitve "${name}" v ${location} v ${lang}.
Poudarki: ${highlights || "idealna lokacija, udobje, posebna doživetja"}.
Cena: ${fields.price || "ugodne cene"}.
Vključi: naslov, podnaslov, 3-4 USP točke, CTA gumb besedilo. 300-400 besed.`;

    case "seasonal-campaign":
      return `Napiši besedilo sezonske kampanje za "${name}" v ${location} v ${lang}.
Sezona/akcija: ${fields.season || "sezonska ponudba"}.
Posebna ponudba: ${fields.offer || "posebni popusti"}.
Poudarki: ${highlights || "posebna doživetja, edinstvena ponudba"}.
250-350 besed, persuazivno, z nujnostjo (omejen čas).`;

    default:
      return `Napiši profesionalno vsebino za nastanitev "${name}" v ${location} v ${lang}. 
Poudarki: ${highlights}. Vsebina 200-300 besed.`;
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user
      ? (session.user as { userId?: string }).userId ?? session.user.email ?? null
      : null;

    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = (await request.json()) as {
      topic?: string;
      topics?: string[];
      count?: number;
      useMock?: boolean;
      audienceId?: string;
      audienceContext?: string;
      // Tourism wizard params
      template?: string;
      fields?: Record<string, string>;
      language?: string;
    };

    const {
      topic = "",
      topics: topicsArray,
      count = 1,
      useMock = false,
      audienceId,
      audienceContext,
      template,
      fields = {},
      language = "sl",
    } = body;

    // ─── Tourism template mode ────────────────────────────────────────────────
    if (template && Object.keys(fields).length > 0) {
      const prompt = buildTourismPrompt(template, fields, language);

      if (useMock) {
        const mockContent = `# ${fields.name ?? "Nastanitev"} – ${fields.location ?? "Slovenija"}\n\n[Demo vsebina za template: ${template}]\n\n${prompt.slice(0, 100)}...\n\nV produkciji bo AI ustvaril profesionalno vsebino prilagojeno vašim podatkom.`;
        return NextResponse.json({
          success: true,
          posts: [{ title: fields.name ?? template, excerpt: mockContent.slice(0, 200), fullContent: mockContent }],
        });
      }

      const sub = await prisma.subscription.findUnique({ where: { userId } });
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { trialEndsAt: true } });

      const limitCheck = await canGenerateBlogPosts(userId, 1, {
        planId: sub?.planId as "starter" | "pro" | "enterprise" | undefined,
        trialEndsAt: user?.trialEndsAt ?? (session?.user as { trialEndsAt?: string | null } | undefined)?.trialEndsAt,
        currentPeriodEnd: sub?.currentPeriodEnd ?? null,
      });

      if (!limitCheck.allowed) {
        return NextResponse.json({ error: limitCheck.message ?? "Limit dosežen" }, { status: 403 });
      }

      const onboarding = await prisma.onboarding.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });

      const agent = createContentAgent();
      const result = await agent.execute({
        topic: prompt,
        format: "blog",
        brandVoiceSummary: onboarding?.brandVoiceSummary ?? null,
        styleGuide: null,
        visualGuidelines: null,
        audienceContext: null,
        companyKnowledge: null,
      });

      const output = result as { blog?: string; keywords?: string[] };
      const blog = output.blog ?? "";
      const titleMatch = blog.match(/^#\s+(.+)/m);
      const title = titleMatch?.[1] ?? (fields.name ?? template);
      const body2 = blog.replace(/^#\s+.+\n*/m, "").trim();
      const excerpt = body2.substring(0, 200) + (body2.length > 200 ? "..." : "");

      const guardrail = validateAgainstBrandVoice(blog, onboarding?.brandVoiceSummary ?? null, null);
      const created = await prisma.blogPost.create({
        data: {
          userId,
          title,
          topic: prompt.slice(0, 200),
          fullContent: blog,
          metaTitle: title,
          metaDescription: excerpt.slice(0, 160),
          guardrailIssues: guardrail.issues.length ? guardrail.issues : undefined,
        },
      });

      indexBlogPost(created.id, created);
      await recordAgentRun(userId, "content", { input: { template, fields }, output: { postId: created.id } });

      return NextResponse.json({
        success: true,
        posts: [{ id: created.id, title, excerpt, fullContent: blog }],
      });
    }

    // ─── Standard blog generation mode ───────────────────────────────────────
    const useTopicsArray = topicsArray?.length && Array.isArray(topicsArray);
    const topicCount = Math.min(Math.max(Number(count) ?? 1, 1), useTopicsArray ? 50 : 20);
    const topicsToUse = useTopicsArray
      ? (topicsArray as string[]).filter(t => typeof t === "string" && t.trim()).slice(0, 50)
      : topic?.trim()
        ? Array.from({ length: topicCount }, (_, i) => topicCount > 1 ? `${topic.trim()} - Angle ${i + 1}` : topic.trim())
        : [];

    if (topicsToUse.length === 0) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    const sub = await prisma.subscription.findUnique({ where: { userId } });
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { trialEndsAt: true } });
    const limit = Math.min(topicsToUse.length, 50);
    const limitCheck = await canGenerateBlogPosts(userId, limit, {
      planId: sub?.planId as "starter" | "pro" | "enterprise" | undefined,
      trialEndsAt: user?.trialEndsAt ?? (session?.user as { trialEndsAt?: string | null } | undefined)?.trialEndsAt,
      currentPeriodEnd: sub?.currentPeriodEnd ?? null,
    });

    if (!limitCheck.allowed) {
      return NextResponse.json({ error: limitCheck.message ?? "Blog post limit exceeded" }, { status: 403 });
    }

    const onboarding = await prisma.onboarding.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } });

    let resolvedAudienceContext = audienceContext?.trim() ?? null;
    if (!resolvedAudienceContext && audienceId && onboarding?.audiences) {
      const audiences = onboarding.audiences as { id: string; messaging: string }[] | null;
      const aud = audiences?.find(a => a.id === audienceId);
      if (aud?.messaging) resolvedAudienceContext = aud.messaging;
    }

    if (useMock) {
      const posts = topicsToUse.slice(0, limit).map((t, i) => ({
        title: `Post ${i + 1}: ${t}`,
        excerpt: `Mock excerpt for ${t}. Lorem ipsum...`,
        fullContent: `# Post ${i + 1}: ${t}\n\nMock content for development.`,
        metaTitle: `Post ${i + 1}: ${t}`,
        metaDescription: `Mock excerpt for ${t}. Lorem ipsum...`,
        keywords: ["mock", "development"],
        seoScore: Math.floor(Math.random() * 20) + 80,
      }));
      await prisma.blogPost.createMany({
        data: posts.map((p, i) => ({
          userId, title: p.title, topic: topicsToUse[i] ?? topic,
          fullContent: p.fullContent, metaTitle: p.metaTitle, metaDescription: p.metaDescription,
        })),
      });
      return NextResponse.json({ success: true, posts });
    }

    const agent = createContentAgent();
    const companyKnowledge = onboarding?.companyKnowledge as { products?: string[]; competitors?: string[]; keyFacts?: string[] } | null | undefined;

    const results = await Promise.all(
      topicsToUse.map(t => agent.execute({
        topic: t, format: "blog",
        brandVoiceSummary: onboarding?.brandVoiceSummary ?? null,
        styleGuide: onboarding?.styleGuide ?? null,
        visualGuidelines: onboarding?.visualGuidelines ?? null,
        audienceContext: resolvedAudienceContext,
        companyKnowledge: companyKnowledge ?? null,
      }))
    );

    const posts = results.map((r, i) => {
      const output = r as { blog?: string; keywords?: string[] };
      const blog = output.blog ?? "";
      const titleMatch = blog.match(/^#\s+(.+)/m);
      const title = titleMatch?.[1] ?? `Post ${i + 1}`;
      const body2 = blog.replace(/^#\s+.+\n*/m, "").trim();
      const excerpt = body2.substring(0, 200) + (body2.length > 200 ? "..." : "");
      return { title, excerpt, fullContent: blog, metaTitle: title, metaDescription: excerpt.slice(0, 160), keywords: output.keywords ?? [], seoScore: Math.floor(Math.random() * 20) + 80 };
    });

    const created = await Promise.all(
      posts.map((p, i) => {
        const guardrail = validateAgainstBrandVoice(p.fullContent ?? "", onboarding?.brandVoiceSummary ?? null, onboarding?.styleGuide ?? null);
        return prisma.blogPost.create({
          data: { userId, title: p.title, topic: topicsToUse[i] ?? topic, fullContent: p.fullContent, metaTitle: p.metaTitle, metaDescription: p.metaDescription, guardrailIssues: guardrail.issues.length ? guardrail.issues : undefined },
        });
      })
    );

    for (const r of created) indexBlogPost(r.id, r);

    const postsWithId = created.map(r => ({
      id: r.id, title: r.title,
      excerpt: r.fullContent ? r.fullContent.slice(0, 200) + (r.fullContent.length > 200 ? "..." : "") : "",
      fullContent: r.fullContent,
    }));

    await recordAgentRun(userId, "content", { input: { topic, topics: topicsToUse, count: created.length }, output: { postIds: created.map(r => r.id) } });

    return NextResponse.json({ success: true, posts: postsWithId, usage: { used: limitCheck.used + limit, limit: limitCheck.limit } });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Generation failed" }, { status: 500 });
  }
}
