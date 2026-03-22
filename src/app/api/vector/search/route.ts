import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { getUserApiKeys } from "@/lib/user-keys";
import { getOpenAiApiKey } from "@/config/env";
import { search } from "@/vector/QdrantService";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      query?: string;
      limit?: number;
    };
    const query = body.query?.trim();
    if (!query) {
      return NextResponse.json(
        { error: "query is required" },
        { status: 400 }
      );
    }

    const keys = await getUserApiKeys(userId, { masked: false });
    const apiKey = keys.openai?.trim() || getOpenAiApiKey();
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API key required for embedding" },
        { status: 503 }
      );
    }

    const results = await search(query, apiKey, body.limit ?? 5);
    return NextResponse.json({ results });
  } catch (err) {
    console.error("Error in vector search API:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Search failed" },
      { status: 500 }
    );
  }
}
