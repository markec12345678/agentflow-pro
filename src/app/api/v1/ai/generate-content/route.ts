/**
 * Generate Content API Endpoint
 * 
 * POST /api/v1/ai/generate-content
 * 
 * Generates content using AI:
 * - Blog posts
 * - Tourism templates (booking descriptions, welcome emails, etc.)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { generateContentUseCase } from "@/core/use-cases/generate-content";
import type { GenerateContentInput } from "@/core/use-cases/generate-content";

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await getServerSession(authOptions);
    const userId = session?.user
      ? (session.user as { userId?: string }).userId ?? session.user.email ?? null
      : null;

    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // 2. Parse request body
    const body = await request.json();
    
    const input: GenerateContentInput = {
      userId,
      topic: body.topic,
      topics: body.topics,
      count: body.count,
      useMock: body.useMock,
      audienceId: body.audienceId,
      audienceContext: body.audienceContext,
      template: body.template,
      fields: body.fields,
      language: body.language,
    };

    // 3. Execute use case
    const result = await generateContentUseCase.execute(input);

    // 4. Return response
    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { error: result.error ?? "Generation failed" },
        { status: result.error?.includes("Limit") ? 403 : 400 }
      );
    }
  } catch (error) {
    console.error("GenerateContent API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    );
  }
}
