import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { getUserApiKeys } from "@/lib/user-keys";
import { getLlmApiKey } from "@/config/env";
import { plan } from "@/planner/PlannerService";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as { query?: string };
    const query = body.query?.trim();
    if (!query) {
      return NextResponse.json(
        { error: "query is required" },
        { status: 400 }
      );
    }

    const keys = await getUserApiKeys(userId, { masked: false });
    const userOpenai = keys.openai?.trim();
    const llm = userOpenai
      ? { apiKey: userOpenai, baseURL: undefined as string | undefined, model: "gpt-4o-mini" }
      : getLlmApiKey();
    if (!llm.apiKey) {
      return NextResponse.json(
        { error: "OpenAI or Qwen API key required. Add in Settings." },
        { status: 503 }
      );
    }

    const result = await plan(query, llm);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Error in planner API:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Planning failed" },
      { status: 500 }
    );
  }
}
