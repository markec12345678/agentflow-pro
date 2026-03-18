/**
 * API Route: AI Recommendations
 * 
 * GET /api/v1/ai/recommendations
 * Get AI-powered property recommendations
 * 
 * POST /api/v1/ai/recommendations/generate
 * Generate custom recommendations
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getRecommendationsUseCase } from "@/core/use-cases/get-recommendations";
import type { RecommendationCategory } from "@/core/use-cases/get-recommendations";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/ai/recommendations
 * Get AI-powered recommendations for property
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Authenticate user
    const session = await getServerSession(authOptions);
    const userId = session?.user
      ? (session.user as { userId?: string }).userId ?? session.user.email ?? null
      : null;

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // 2. Parse query params
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");
    const category = (searchParams.get("category") as RecommendationCategory) || "pricing";

    if (!propertyId) {
      return NextResponse.json(
        { error: "Missing required parameter: propertyId" },
        { status: 400 },
      );
    }

    // 3. Execute use case
    const result = await getRecommendationsUseCase.execute({
      userId,
      propertyId,
      category,
    });

    // 4. Return response
    if (result.success && result.data) {
      return NextResponse.json(result.data);
    } else {
      return NextResponse.json(
        { error: result.error ?? "Failed to generate recommendations" },
        { status: result.error?.includes("Access") ? 403 : 500 },
      );
    }
  } catch (error) {
    console.error("Recommendations API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate recommendations" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/v1/ai/recommendations/generate
 * Generate custom recommendations
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Authenticate user
    const session = await getServerSession(authOptions);
    const userId = session?.user
      ? (session.user as { userId?: string }).userId ?? session.user.email ?? null
      : null;

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // 2. Parse request body
    const body = await request.json();
    const { propertyId, context, question } = body;

    if (!question) {
      return NextResponse.json(
        { error: "Missing required field: question" },
        { status: 400 },
      );
    }

    // 3. Execute use case
    const result = await getRecommendationsUseCase.execute({
      userId,
      propertyId: propertyId || null,
      category: "custom",
      customQuestion: question,
      customContext: context,
    });

    // 4. Return response
    if (result.success && result.data) {
      return NextResponse.json({
        success: true,
        data: {
          answer: result.data.recommendations[0]?.recommendation,
          generatedAt: result.data.generatedAt,
        },
      });
    } else {
      return NextResponse.json(
        { error: result.error ?? "Failed to generate recommendations" },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Generate Recommendations API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate recommendations" },
      { status: 500 },
    );
  }
}
