/**
 * Tourism Batch Translator API
 * POST: translates content into multiple target languages via OpenAI
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { prisma } from "@/database/schema";
import { recordAgentRun } from "@/api/usage";
import { authOptions } from "@/lib/auth-options";
import { getOpenAiApiKey } from "@/config/env";
import { getUserApiKeys } from "@/lib/user-keys";
import { mockMode } from "@/lib/mock-mode";

const VALID_LANGS = ["sl", "en", "de", "it", "hr"] as const;

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
      content?: string;
      sourceLang?: string;
      targetLangs?: string[];
      contentType?: string;
    };

    const content = body.content?.trim();
    const sourceLang = VALID_LANGS.includes((body.sourceLang ?? "sl") as (typeof VALID_LANGS)[number])
      ? (body.sourceLang ?? "sl")
      : "sl";
    const rawTargetLangs = Array.isArray(body.targetLangs) ? body.targetLangs : [];
    const targetLangs = rawTargetLangs
      .filter((l) => typeof l === "string" && VALID_LANGS.includes(l as (typeof VALID_LANGS)[number]))
      .filter((l, i, arr) => arr.indexOf(l) === i) as string[];

    if (!content) {
      return NextResponse.json(
        { error: "Missing required field: content" },
        { status: 400 }
      );
    }

    if (targetLangs.length === 0) {
      return NextResponse.json(
        { error: "Missing or invalid targetLangs. Use: sl, en, de, it, hr" },
        { status: 400 }
      );
    }

    const userKeys = await getUserApiKeys(userId, { masked: false });
    const apiKey = userKeys.openai?.trim() || getOpenAiApiKey();

    if (!mockMode && !apiKey) {
      return NextResponse.json(
        { error: "Add your OpenAI API key in Settings for translation." },
        { status: 503 }
      );
    }

    const job = await prisma.translationJob.create({
      data: {
        userId,
        sourceContent: content,
        sourceLang,
        targetLangs,
        status: "processing",
      },
    });

    const results: Record<string, string> = {};

    if (mockMode || !apiKey) {
      for (const lang of targetLangs) {
        const truncated = content.length > 100 ? `${content.slice(0, 100)}...` : content;
        results[lang] = `[MOCK ${lang}] ${truncated}`;
      }
    } else {
      const openai = createOpenAI({ apiKey });
      let totalInputTokens = 0;
      let totalOutputTokens = 0;

      for (const targetLang of targetLangs) {
        try {
          const { text, usage } = await generateText({
            model: openai("gpt-4o-mini"),
            prompt: `Translate the following ${sourceLang} tourism content to ${targetLang}.
Preserve formatting (paragraphs, line breaks). Keep tourism terminology (e.g. Apartma, Bela Krajina) - translate only where appropriate for the target language.
Maintain the tone and style. Do not add explanations, just return the translated text.

Content to translate:
${content}`,
            temperature: 0.3,
          });
          results[targetLang] = text?.trim() ?? `[Translation error]`;
          if (usage) {
            totalInputTokens += usage.inputTokens ?? 0;
            totalOutputTokens += usage.outputTokens ?? 0;
          }
        } catch (err) {
          console.error(`Translation failed for ${targetLang}:`, err);
          results[targetLang] = "[Translation error]";
        }
      }

      if (totalInputTokens > 0 || totalOutputTokens > 0) {
        recordAgentRun(userId, "translation", {
          input: { sourceLang, targetLangs: targetLangs.length, contentLength: content.length },
          output: {
            translationCount: Object.keys(results).length,
            usage: {
              inputTokens: totalInputTokens,
              outputTokens: totalOutputTokens,
              totalTokens: totalInputTokens + totalOutputTokens,
            },
          },
        }).catch(() => { });
      }
    }

    await prisma.translationJob.update({
      where: { id: job.id },
      data: {
        status: "completed",
        results,
        completedAt: new Date(),
      },
    });

    return NextResponse.json({
      jobId: job.id,
      translations: results,
    });
  } catch (error) {
    console.error("Batch translate error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
