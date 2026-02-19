/**
 * Tourism Email Generator API
 * POST: generates guest emails from prompt (variables substituted on frontend)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { authOptions } from "@/lib/auth-options";
import { getOpenAiApiKey } from "@/config/env";
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
      prompt?: string;
      variables?: Record<string, string>;
    };

    let prompt = body.prompt?.trim();
    if (!prompt) {
      return NextResponse.json(
        { error: "Missing required field: prompt" },
        { status: 400 }
      );
    }

    if (body.variables && typeof body.variables === "object") {
      prompt = prompt.replace(/\{(\w+)\}/g, (_, k) => String(body.variables![k] ?? ""));
    }

    const userKeys = await getUserApiKeys(userId, { masked: false });
    const apiKey = userKeys.openai?.trim() || getOpenAiApiKey();

    if (mockMode) {
      const mockContent = `Subject: Dobrodošlica – ${prompt.slice(0, 30)}...

[MOCK] Pošiljatelj: AgentFlow Pro
Sporočilo generirano v testnem načinu. Nastavi OPENAI_API_KEY za prave emaile.

---
${prompt.slice(0, 200)}...`;
      return NextResponse.json({ content: mockContent });
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: "Add your OpenAI API key in Settings for email generation." },
        { status: 503 }
      );
    }

    const openai = createOpenAI({ apiKey });
    const result = await generateText({
      model: openai("gpt-4o-mini"),
      prompt: `You are a tourism hospitality email writer. Write a professional guest email based on these instructions.

Output format: Subject line first (Predmet: ...), then body. Use line breaks between paragraphs. No meta commentary or explanations.

Instructions:
${prompt}`,
      temperature: 0.5,
    });

    const content = result.text?.trim() ?? "";
    return NextResponse.json({ content });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Email generation failed" },
      { status: 500 }
    );
  }
}
