import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { recordAgentRun } from '@/app/api/v1/reports/usage';
import { runOptimization } from "@/agents/optimization/OptimizationAgent";
import { getSerpApiKey } from "@/config/env";
import { getUserApiKeysForExecution } from "@/lib/user-keys";
import { authOptions } from "@/lib/auth-options";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user
      ? (session.user as { userId?: string }).userId ?? session.user.email ?? null
      : null;

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = (await request.json()) as {
      topic?: string;
      content?: string;
      url?: string;
      postId?: string;
    };

    const topic = body.topic?.trim();
    if (!topic) {
      return NextResponse.json(
        { error: "Topic is required" },
        { status: 400 }
      );
    }

    const keys = await getUserApiKeysForExecution(userId);
    const serpApiKey = keys.serpapi ?? getSerpApiKey();

    const result = await runOptimization(
      {
        topic,
        content: body.content ?? undefined,
        url: body.url ?? undefined,
      },
      serpApiKey
    );

    await recordAgentRun(userId, "optimize", {
      input: { topic, content: body.content, url: body.url, postId: body.postId },
      output: {
        keywordsCount: result.keywords?.length ?? 0,
        metaTitle: result.metaTitle,
        metaDescription: result.metaDescription,
      },
    });

    return NextResponse.json({
      ...result,
      postId: body.postId,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Optimization failed" },
      { status: 500 }
    );
  }
}
