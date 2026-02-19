import {
  streamText,
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  type UIMessage,
} from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { recordAgentRun } from "@/api/usage";
import { prisma } from "@/database/schema";
import { authOptions } from "@/lib/auth-options";
import { getOpenAiApiKey } from "@/config/env";
import { getUserApiKeys } from "@/lib/user-keys";

export const maxDuration = 30;

const MOCK_MODE = process.env.MOCK_MODE === "true";

export async function POST(req: Request) {
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
  const apiKey = userKeys.openai?.trim() || getOpenAiApiKey();

  if (!apiKey && !MOCK_MODE) {
    return NextResponse.json(
      { error: "Add your OpenAI API key in Settings, or contact support." },
      { status: 503 }
    );
  }

  try {
    const { messages } = (await req.json()) as { messages: UIMessage[] };

    if (MOCK_MODE || !apiKey) {
      const mockText =
        "Mock response for E2E testing. Your message was received.";
      return createUIMessageStreamResponse({
        stream: createUIMessageStream({
          execute: async ({ writer }) => {
            writer.write({ type: "text-start", id: "mock-text" });
            await new Promise((r) => setTimeout(r, 300));
            writer.write({
              type: "text-delta",
              id: "mock-text",
              delta: mockText,
            });
            writer.write({ type: "text-end", id: "mock-text" });
          },
        }),
      });
    }

    const onboarding = await prisma.onboarding.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    const systemParts: string[] = [
      "You are AgentFlow Pro Content Assistant. Help the user create and edit content for blog posts, social copy, and marketing. Be concise. Output markdown when appropriate.",
    ];
    if (onboarding?.brandVoiceSummary?.trim()) {
      systemParts.push(
        `Use this brand voice as reference:\n${onboarding.brandVoiceSummary.trim()}`
      );
    }
    if (onboarding?.styleGuide?.trim()) {
      systemParts.push(
        `Follow this style guide:\n${onboarding.styleGuide.trim()}`
      );
    }
    const system = systemParts.join("\n\n");

    const openai = createOpenAI({ apiKey });
    const result = streamText({
      model: openai("gpt-4o-mini"),
      system,
      messages: await convertToModelMessages(messages),
      onFinish: ({ text, usage }) => {
        recordAgentRun(userId, "chat", {
          input: { messageCount: messages.length },
          output: {
            textLength: text?.length ?? 0,
            usage: usage ? { ...usage } : undefined,
          },
        }).catch(() => { });
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Chat failed" },
      { status: 500 }
    );
  }
}
