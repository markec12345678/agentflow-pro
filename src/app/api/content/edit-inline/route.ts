import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/database/schema";
import { authOptions } from "@/lib/auth-options";
import { getLlmApiKey } from "@/config/env";
import { getUserApiKeys } from "@/lib/user-keys";

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

    const userKeys = await getUserApiKeys(userId, { masked: false });
    const userOpenai = userKeys.openai?.trim();
    const llm = userOpenai
      ? { apiKey: userOpenai, baseURL: undefined as string | undefined, model: "gpt-4o-mini" }
      : getLlmApiKey();

    if (!llm.apiKey) {
      return NextResponse.json(
        { error: "Add your OpenAI API key in Settings for inline editing." },
        { status: 503 }
      );
    }

    const body = (await request.json()) as {
      text: string;
      action: "improve" | "expand" | "shorten";
    };

    const { text, action } = body;
    if (!text?.trim()) {
      return NextResponse.json(
        { error: "text is required" },
        { status: 400 }
      );
    }

    const prompts: Record<string, string> = {
      improve:
        "Improve this text. Fix grammar, clarity, and flow. Keep the same length and tone. Output only the improved text, no explanation.",
      expand:
        "Expand this text. Add more detail, examples, or elaboration. Keep the same tone and style. Output only the expanded text, no explanation.",
      shorten:
        "Shorten this text. Make it more concise while keeping the key message. Output only the shortened text, no explanation.",
    };
    const prompt = prompts[action] ?? prompts.improve;

    const onboarding = await prisma.onboarding.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    const systemParts: string[] = [
      "You are a content editor. Output ONLY the requested edited text, nothing else. No preamble, no quotes around it.",
    ];
    if (onboarding?.brandVoiceSummary?.trim()) {
      systemParts.push(
        `Brand voice:\n${onboarding.brandVoiceSummary.trim()}`
      );
    }
    if (onboarding?.styleGuide?.trim()) {
      systemParts.push(
        `Style guide:\n${onboarding.styleGuide.trim()}`
      );
    }

    const openai = createOpenAI({
      apiKey: llm.apiKey,
      ...(llm.baseURL && { baseURL: llm.baseURL }),
    });
    const result = await generateText({
      model: openai(llm.model),
      system: systemParts.join("\n\n"),
      prompt: `${prompt}\n\n---\n\n${text.trim()}`,
    });

    return NextResponse.json({
      text: result.text?.trim() ?? text,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Edit failed" },
      { status: 500 }
    );
  }
}
