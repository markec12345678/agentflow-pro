/**
 * GET /api/test/config - Diagnostic config (MOCK_MODE, etc.)
 * For /test page only - no auth required.
 */
import { NextResponse } from "next/server";
import { isMockMode } from "@/lib/mock-mode";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    mockMode: isMockMode(),
    hasOpenAi: !!(process.env.OPENAI_API_KEY?.trim()),
    hasQwen: !!(process.env.ALIBABA_QWEN_API_KEY?.trim()),
    hasContext7: !!(process.env.CONTEXT7_API_KEY?.trim()),
  });
}
