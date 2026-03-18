/**
 * GenerateContent UseCase
 * 
 * Generate content (blog posts, tourism content) using AI
 */

import { prisma } from "@/infrastructure/database/prisma";
import { createContentAgent } from "@/agents/content/ContentAgent";
import { validateAgainstBrandVoice } from "@/agents/content/brand-guardrails";
import { indexBlogPost } from "@/lib/vector-indexer";
import { canGenerateBlogPosts } from "@/lib/blog-limits";
import { recordAgentRun } from "@/app/api/v1/reports/usage";

// ============================================================================
// INPUT/OUTPUT DTOs
// ============================================================================

export interface GenerateContentInput {
  userId: string;
  
  // Standard blog mode
  topic?: string;
  topics?: string[];
  count?: number;
  
  // Tourism template mode
  template?: string;
  fields?: Record<string, string>;
  language?: string;
  
  // Options
  useMock?: boolean;
  audienceId?: string;
  audienceContext?: string;
}

export interface GenerateContentOutput {
  success: boolean;
  posts: Array<{
    id?: string;
    title: string;
    excerpt: string;
    fullContent: string;
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
    seoScore?: number;
  }>;
  usage?: {
    used: number;
    limit: number;
  };
  error?: string;
}

// ============================================================================
// USE CASE CLASS
// ============================================================================

export class GenerateContentUseCase {
  async execute(input: GenerateContentInput): Promise<GenerateContentOutput> {
    try {
      const {
        userId,
        topic = "",
        topics: topicsArray,
        count = 1,
        useMock = false,
        audienceId,
        audienceContext,
        template,
        fields = {},
        language = "sl",
      } = input;

      // Tourism template mode
      if (template && Object.keys(fields).length > 0) {
        return await this.generateTourismContent({
          userId,
          template,
          fields,
          language,
          useMock,
        });
      }

      // Standard blog generation mode
      return await this.generateBlogContent({
        userId,
        topic,
        topics: topicsArray,
        count,
        useMock,
        audienceId,
        audienceContext,
      });
    } catch (error) {
      console.error("GenerateContent error:", error);
      return {
        success: false,
        posts: [],
        error: error instanceof Error ? error.message : "Generation failed",
      };
    }
  }

  // ============================================================================
  // TOURISM CONTENT GENERATION
  // ============================================================================

  private async generateTourismContent(input: {
    userId: string;
    template: string;
    fields: Record<string, string>;
    language: string;
    useMock: boolean;
  }): Promise<GenerateContentOutput> {
    const { userId, template, fields, language, useMock } = input;
    const prompt = this.buildTourismPrompt(template, fields, language);

    // Mock mode
    if (useMock) {
      const mockContent = `# ${fields.name ?? "Nastanitev"} – ${fields.location ?? "Slovenija"}\n\n[Demo vsebina za template: ${template}]\n\n${prompt.slice(0, 100)}...\n\nV produkciji bo AI ustvaril profesionalno vsebino prilagojeno vašim podatkom.`;
      
      return {
        success: true,
        posts: [{
          title: fields.name ?? template,
          excerpt: mockContent.slice(0, 200),
          fullContent: mockContent,
        }],
      };
    }

    // Check limits
    const limitCheck = await this.checkGenerationLimits(userId, 1);
    if (!limitCheck.allowed) {
      return {
        success: false,
        posts: [],
        error: limitCheck.message ?? "Limit dosežen",
      };
    }

    // Get onboarding data
    const onboarding = await this.getOnboarding(userId);

    // Generate content with agent
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
    const title = this.extractTitle(blog) ?? (fields.name ?? template);
    const body = this.extractBody(blog);
    const excerpt = body.substring(0, 200) + (body.length > 200 ? "..." : "");

    // Validate against brand voice
    const guardrail = validateAgainstBrandVoice(blog, onboarding?.brandVoiceSummary ?? null, null);

    // Save to database
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

    // Index for vector search
    indexBlogPost(created.id, created);

    // Record agent run
    await recordAgentRun(userId, "content", {
      input: { template, fields },
      output: { postId: created.id },
    });

    return {
      success: true,
      posts: [{
        id: created.id,
        title,
        excerpt,
        fullContent: blog,
      }],
      usage: limitCheck,
    };
  }

  // ============================================================================
  // BLOG CONTENT GENERATION
  // ============================================================================

  private async generateBlogContent(input: {
    userId: string;
    topic: string;
    topics?: string[];
    count?: number;
    useMock: boolean;
    audienceId?: string;
    audienceContext?: string;
  }): Promise<GenerateContentOutput> {
    const { userId, topic, topics: topicsArray, count, useMock, audienceId, audienceContext } = input;

    // Prepare topics
    const useTopicsArray = topicsArray?.length && Array.isArray(topicsArray);
    const topicCount = Math.min(Math.max(Number(count) ?? 1, 1), useTopicsArray ? 50 : 20);
    const topicsToUse = useTopicsArray
      ? (topicsArray as string[]).filter(t => typeof t === "string" && t.trim()).slice(0, 50)
      : topic?.trim()
        ? Array.from({ length: topicCount }, (_, i) => 
            topicCount > 1 ? `${topic.trim()} - Angle ${i + 1}` : topic.trim()
          )
        : [];

    if (topicsToUse.length === 0) {
      return {
        success: false,
        posts: [],
        error: "Topic is required",
      };
    }

    // Check limits
    const limit = Math.min(topicsToUse.length, 50);
    const limitCheck = await this.checkGenerationLimits(userId, limit);
    if (!limitCheck.allowed) {
      return {
        success: false,
        posts: [],
        error: limitCheck.message ?? "Blog post limit exceeded",
      };
    }

    // Get onboarding data
    const onboarding = await this.getOnboarding(userId);

    // Resolve audience context
    let resolvedAudienceContext = audienceContext?.trim() ?? null;
    if (!resolvedAudienceContext && audienceId && onboarding?.audiences) {
      const audiences = onboarding.audiences as { id: string; messaging: string }[] | null;
      const aud = audiences?.find(a => a.id === audienceId);
      if (aud?.messaging) resolvedAudienceContext = aud.messaging;
    }

    // Mock mode
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
          userId,
          title: p.title,
          topic: topicsToUse[i] ?? topic,
          fullContent: p.fullContent,
          metaTitle: p.metaTitle,
          metaDescription: p.metaDescription,
        })),
      });

      return {
        success: true,
        posts,
        usage: limitCheck,
      };
    }

    // Generate content with agent
    const agent = createContentAgent();
    const companyKnowledge = onboarding?.companyKnowledge as 
      { products?: string[]; competitors?: string[]; keyFacts?: string[] } | null | undefined;

    const results = await Promise.all(
      topicsToUse.map(t =>
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

    // Process results
    const posts = results.map((r, i) => {
      const output = r as { blog?: string; keywords?: string[] };
      const blog = output.blog ?? "";
      const title = this.extractTitle(blog) ?? `Post ${i + 1}`;
      const body = this.extractBody(blog);
      const excerpt = body.substring(0, 200) + (body.length > 200 ? "..." : "");
      
      return {
        title,
        excerpt,
        fullContent: blog,
        metaTitle: title,
        metaDescription: excerpt.slice(0, 160),
        keywords: output.keywords ?? [],
        seoScore: Math.floor(Math.random() * 20) + 80,
      };
    });

    // Save to database with brand voice validation
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

    // Index for vector search
    for (const r of created) {
      indexBlogPost(r.id, r);
    }

    // Format response
    const postsWithId = created.map(r => ({
      id: r.id,
      title: r.title,
      excerpt: r.fullContent ? r.fullContent.slice(0, 200) + (r.fullContent.length > 200 ? "..." : "") : "",
      fullContent: r.fullContent,
    }));

    // Record agent run
    await recordAgentRun(userId, "content", {
      input: { topic, topics: topicsToUse, count: created.length },
      output: { postIds: created.map(r => r.id) },
    });

    return {
      success: true,
      posts: postsWithId,
      usage: {
        used: limitCheck.used + limit,
        limit: limitCheck.limit,
      },
    };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private buildTourismPrompt(
    template: string,
    fields: Record<string, string>,
    language: string
  ): string {
    const name = fields.name ?? "nastanitev";
    const location = fields.location ?? "Slovenija";
    const highlights = fields.highlights ?? "";
    
    const langLabel: Record<string, string> = {
      sl: "slovenščini",
      en: "English",
      de: "Deutsch",
      it: "italiano",
      hr: "hrvatskom",
    };
    
    const lang = langLabel[language] ?? "slovenščini";

    switch (template) {
      case "booking-description":
        return `Napiši profesionalni opis nastanitve "${name}" v ${location} za Booking.com / Airbnb v ${lang}. Poudarki: ${highlights || "prijazno osebje, odlična lokacija, čiste sobe"}. Sobe: ${fields.rooms || "moderne, udobne sobe"}. Vsebina naj bo privlačna, SEO optimizirana, 200-300 besed.`;

      case "guest-welcome-email":
        return `Napiši email dobrodošlice za goste nastanitve "${name}" v ${location} v ${lang}. Check-in: ${fields.checkin || "14:00"}. Lokalni nasveti: ${fields.tips || "obiščite lokalne restavracije in znamenitosti"}. Email naj bo topel, informativen, 150-200 besed.`;

      case "destination-guide":
        return `Napiši SEO vodič destinacije ${location} v ${lang}. Aktivnosti: ${fields.activities || "pohodništvo, kolesarjenje, lokalna kultura"}. Poudarki: ${highlights || "narava, kultura, gastro"}. Vsebina 400-500 besed, SEO optimizirana za turiste.`;

      case "instagram-travel":
        return `Napiši Instagram caption za nastanitev "${name}" v ${location} v ${lang}. Poudarki: ${highlights || "čudovita narava, mir, odlična lokacija"}. Dodaj 10-15 relevantnih hashtagov. Ton: navdušen, pritegljiv, 80-120 besed.`;

      case "landing-page":
        return `Napiši besedilo za landing stran nastanitve "${name}" v ${location} v ${lang}. Poudarki: ${highlights || "idealna lokacija, udobje, posebna doživetja"}. Cena: ${fields.price || "ugodne cene"}. Vključi: naslov, podnaslov, 3-4 USP točke, CTA gumb besedilo. 300-400 besed.`;

      case "seasonal-campaign":
        return `Napiši besedilo sezonske kampanje za "${name}" v ${location} v ${lang}. Sezona/akcija: ${fields.season || "sezonska ponudba"}. Posebna ponudba: ${fields.offer || "posebni popusti"}. Poudarki: ${highlights || "posebna doživetja, edinstvena ponudba"}. 250-350 besed, persuazivno, z nujnostjo (omejen čas).`;

      default:
        return `Napiši profesionalno vsebino za nastanitev "${name}" v ${location} v ${lang}. Poudarki: ${highlights}. Vsebina 200-300 besed.`;
    }
  }

  private extractTitle(blog: string): string | null {
    const titleMatch = blog.match(/^#\s+(.+)/m);
    return titleMatch?.[1] ?? null;
  }

  private extractBody(blog: string): string {
    return blog.replace(/^#\s+.+\n*/m, "").trim();
  }

  private async checkGenerationLimits(userId: string, count: number) {
    const sub = await prisma.subscription.findUnique({
      where: { userId },
    });
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { trialEndsAt: true },
    });

    return await canGenerateBlogPosts(userId, count, {
      planId: sub?.planId as "starter" | "pro" | "enterprise" | undefined,
      trialEndsAt: user?.trialEndsAt ?? null,
      currentPeriodEnd: sub?.currentPeriodEnd ?? null,
    });
  }

  private async getOnboarding(userId: string) {
    return await prisma.onboarding.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export const generateContentUseCase = new GenerateContentUseCase();
