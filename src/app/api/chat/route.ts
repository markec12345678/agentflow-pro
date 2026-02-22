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
import { getLlmApiKey } from "@/config/env";
import { getUserApiKeys, getUserApiKeysForExecution } from "@/lib/user-keys";
import { getCachedContext, setCachedContext } from "@/lib/redis";
import { plan } from "@/planner/PlannerService";
import { getOrchestrator } from "@/lib/orchestrator-factory";
import { search as vectorSearch } from "@/vector/QdrantService";

export const maxDuration = 90; // Plan-execute can run multiple agents

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
  const userOpenai = userKeys.openai?.trim();
  const llm = userOpenai
    ? { apiKey: userOpenai, baseURL: undefined as string | undefined, model: "gpt-4o-mini" }
    : getLlmApiKey();
  const apiKey = llm.apiKey;

  if (!apiKey && !MOCK_MODE) {
    return NextResponse.json(
      { error: "Add your OpenAI API key in Settings, or contact support." },
      { status: 503 }
    );
  }

  try {
    const body = (await req.json()) as {
      messages: UIMessage[];
      planExecute?: boolean;
    };
    const { messages, planExecute } = body;

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

    const cacheKey = `conv:${userId}:system`;
    let onboarding = await getCachedContext<{
      brandVoiceSummary?: string;
      styleGuide?: string;
    }>(cacheKey);

    if (!onboarding) {
      const row = await prisma.onboarding.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });
      onboarding = row
        ? {
            brandVoiceSummary: row.brandVoiceSummary ?? undefined,
            styleGuide: row.styleGuide ?? undefined,
          }
        : null;
      if (onboarding) {
        await setCachedContext(cacheKey, onboarding, 300);
      }
    }

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

    let vectorContext = "";
    if (process.env.QDRANT_URL?.trim() && messages.length > 0) {
      const lastUser = [...messages].reverse().find((m) => m.role === "user") as { content?: string; parts?: { text?: string }[] } | undefined;
      const query =
        typeof lastUser?.content === "string"
          ? lastUser.content
          : Array.isArray(lastUser?.parts)
            ? (lastUser.parts as { text?: string }[])
                .map((p) => p.text ?? "")
                .join("")
            : "";
      if (query.trim()) {
        try {
          const results = await vectorSearch(query.trim(), apiKey, 3);
          if (results.length > 0) {
            vectorContext =
              "\n\nRelevant content from user's documents (reference when helpful):\n" +
              results.map((r) => `---\n${r.text.slice(0, 600)}`).join("\n");
          }
        } catch {
          /* Qdrant not available or search failed */
        }
      }
    }

    if (vectorContext) systemParts.push(vectorContext);

    let agentContext = "";
    if (planExecute && messages.length > 0) {
      const lastUser = [...messages].reverse().find((m) => m.role === "user") as { content?: string; parts?: { text?: string }[] } | undefined;
      const query =
        typeof lastUser?.content === "string"
          ? lastUser.content
          : Array.isArray(lastUser?.parts)
            ? (lastUser.parts as { text?: string }[])
                .map((p) => p.text ?? "")
                .join("")
            : "";
      if (query.trim()) {
        try {
          const planResult = await plan(query.trim(), llm);
          if (
            planResult.subGoals &&
            planResult.subGoals.length > 0
          ) {
            const userKeys = await getUserApiKeysForExecution(userId);
            const orch = getOrchestrator({ userApiKeys: userKeys });
            const parts: string[] = [];
            for (const sg of planResult.subGoals) {
              try {
                const taskId = await orch.queueTask(
                  sg.agentType,
                  { query: sg.description, input: sg.description }
                );
                const maxWait = 45000;
                const start = Date.now();
                while (Date.now() - start < maxWait) {
                  const t = orch.getTask(taskId);
                  if (t?.status === "completed" && t.result != null) {
                    const out =
                      typeof t.result === "string"
                        ? t.result
                        : JSON.stringify(t.result);
                    parts.push(
                      `[${sg.agentType}] ${sg.description}:\n${out.slice(0, 2000)}`
                    );
                    break;
                  }
                  if (t?.status === "failed") {
                    parts.push(`[${sg.agentType}] Error: ${t.error ?? "Failed"}`);
                    break;
                  }
                  await new Promise((r) => setTimeout(r, 200));
                }
              } catch (e) {
                parts.push(
                  `[${sg.agentType}] Error: ${e instanceof Error ? e.message : String(e)}`
                );
              }
            }
            if (parts.length > 0) {
              agentContext =
                "\n\n--- Context from multi-agent execution (use to inform your response) ---\n\n" +
                parts.join("\n\n---\n\n");
            }
          }
        } catch (e) {
          console.error("Plan-execute error:", e);
        }
      }
    }

    if (agentContext) systemParts.push(agentContext);
    const system = systemParts.join("\n\n");

    const openai = createOpenAI({
      apiKey,
      ...(llm.baseURL && { baseURL: llm.baseURL }),
    });
    const result = streamText({
      model: openai(llm.model),
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
