/**
 * Tourism Content Generator API
 * POST: generates tourism content (Booking, Airbnb, Destination, Seasonal, Instagram)
 * Uses LLM with full prompt – same pattern as generate-email
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { authOptions } from "@/lib/auth-options";
import { getLlmApiKey } from "@/config/env";
import { getUserApiKeys } from "@/lib/user-keys";
import { mockMode } from "@/lib/mock-mode";

function getUserId(session: { user?: { userId?: string; email?: string | null } } | null): string | null {
  if (!session?.user) return null;
  return (session.user as { userId?: string }).userId ?? session.user.email ?? null;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as {
      topic?: string;
      prompt?: string;
    };

    const prompt = (body.topic ?? body.prompt ?? "").trim();
    if (!prompt) {
      return NextResponse.json(
        { error: "Missing required field: topic or prompt" },
        { status: 400 }
      );
    }

    const userKeys = await getUserApiKeys(userId, { masked: false });
    const userOpenai = userKeys.openai?.trim();
    const llm = userOpenai
      ? { apiKey: userOpenai, baseURL: undefined as string | undefined, model: "gpt-4o-mini" }
      : getLlmApiKey();
    const apiKey = llm.apiKey;

    if (mockMode) {
      const mockContent = `[MOCK] Generirana turistična vsebina – ${prompt.slice(0, 80)}...

Nastavi OPENAI_API_KEY v Settings za pravo AI generacijo.
AgentFlow Pro Tourism Content Generator.`;
      const excerpt = mockContent.slice(0, 200) + (mockContent.length > 200 ? "..." : "");
      return NextResponse.json({
        success: true,
        posts: [{ title: "Mock Tourism Content", excerpt, fullContent: mockContent }],
      });
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: "Add your OpenAI API key in Settings for content generation." },
        { status: 503 }
      );
    }

    const openai = createOpenAI({
      apiKey,
      ...(llm.baseURL && { baseURL: llm.baseURL }),
    });
    const result = await generateText({
      model: openai(llm.model),
      prompt: `You are a tourism hospitality content writer. Follow the instructions exactly. Output only the requested content – no meta commentary, no explanations, no headers like "Here is your..." or "I have generated...".

Instructions:
${prompt}`,
      temperature: 0.6,
    });

    const fullContent = result.text?.trim() ?? "";
    const titleMatch = fullContent.match(/^#\s+(.+)/m);
    const title = titleMatch?.[1] ?? "Tourism Content";
    const bodyText = fullContent.replace(/^#\s+.+\n*/m, "").trim();
    const excerpt = bodyText.slice(0, 200) + (bodyText.length > 200 ? "..." : "");

    return NextResponse.json({
      success: true,
      posts: [{ title, excerpt, fullContent }],
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    );
  }
}
