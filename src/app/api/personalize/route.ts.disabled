import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { createPersonalizationAgent } from "@/agents/personalization/PersonalizationAgent";
import { recordAgentRun } from "@/api/usage";
import { authOptions } from "@/lib/auth-options";

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

    const body = (await request.json()) as {
      template: string;
      data: Record<string, string>[];
    };

    const { template, data } = body;

    if (!template?.trim()) {
      return NextResponse.json(
        { error: "Template is required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { error: "Data array is required and must not be empty" },
        { status: 400 }
      );
    }

    const agent = createPersonalizationAgent();
    const output = await agent.execute({
      template: template.trim(),
      data: data.slice(0, 500),
    });

    const results = (output as { results?: string[] }).results ?? [];
    await recordAgentRun(userId, "personalize", {
      input: { template: template.trim(), rowCount: data.length },
      output: { resultCount: results.length },
    });

    return NextResponse.json({
      results,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Personalization failed",
      },
      { status: 500 }
    );
  }
}
