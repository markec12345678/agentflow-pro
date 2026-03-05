/**
 * Tourism Email Generator API
 * POST: generates guest emails from prompt (variables substituted on frontend)
 * Uses centralized AI service (OpenAIAdapter + AiService)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { getLlmFromUserKeys } from "@/config/env";
import { getUserApiKeys } from "@/lib/user-keys";
import { isMockMode } from "@/lib/mock-mode";
import { OpenAIAdapter, DataSanitizer, PrismaAiUsageLogger } from "@/infrastructure/ai";
import { AiService } from "@/services/ai.service";

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
    const llm = getLlmFromUserKeys(userKeys);
    const apiKey = llm.apiKey;

    if (isMockMode()) {
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

    const aiService = new AiService({
      llm: new OpenAIAdapter({ apiKey, model: llm.model, baseURL: llm.baseURL }),
      usageLogger: new PrismaAiUsageLogger(),
      sanitizer: new DataSanitizer(),
    });

    const systemPrompt =
      "You are a tourism hospitality email writer. Write a professional guest email based on these instructions.\n\nOutput format: Subject line first (Predmet: ...), then body. Use line breaks between paragraphs. No meta commentary or explanations.";

    const result = await aiService.generateWithLogging(
      {
        systemPrompt,
        prompt: `Instructions:\n${prompt}`,
        temperature: 0.5,
      },
      { userId, agentType: "email", model: llm.model }
    );

    const content = result.text.trim();
    return NextResponse.json({ content });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Email generation failed" },
      { status: 500 }
    );
  }
}
