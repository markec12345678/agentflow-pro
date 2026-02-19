import { NextRequest, NextResponse } from "next/server";
import { createContentAgent } from "@/agents/content/ContentAgent";
import { prisma } from "@/database/schema";
import { validateApiKey } from "@/lib/api-key-auth";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const validation = await validateApiKey(authHeader);
    if (!validation) {
      return NextResponse.json(
        { error: "Invalid or missing API key. Use Authorization: Bearer <your_api_key>" },
        { status: 401 }
      );
    }
    const { userId, keyId } = validation;

    const rateLimit = checkRateLimit(keyId);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Try again later.",
          retryAfter: rateLimit.retryAfter,
        },
        {
          status: 429,
          headers: rateLimit.retryAfter
            ? { "Retry-After": String(rateLimit.retryAfter) }
            : undefined,
        }
      );
    }

    const body = (await request.json()) as { topic?: string };
    const topic = body.topic?.trim();
    if (!topic) {
      return NextResponse.json(
        { error: "topic is required" },
        { status: 400 }
      );
    }

    const onboarding = await prisma.onboarding.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    const companyKnowledge = onboarding?.companyKnowledge as
      | { products?: string[]; competitors?: string[]; keyFacts?: string[] }
      | null
      | undefined;

    const agent = createContentAgent();
    const result = await agent.execute({
      topic,
      format: "blog",
      brandVoiceSummary: onboarding?.brandVoiceSummary ?? null,
      styleGuide: onboarding?.styleGuide ?? null,
      visualGuidelines: onboarding?.visualGuidelines ?? null,
      companyKnowledge: companyKnowledge ?? null,
    });

    const blog = (result as { blog?: string }).blog ?? "";
    const titleMatch = blog.match(/^#\s+(.+)/m);
    const title = titleMatch?.[1] ?? topic;

    return NextResponse.json({
      topic,
      title,
      content: blog,
      keywords: (result as { keywords?: string[] }).keywords ?? [],
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    );
  }
}
