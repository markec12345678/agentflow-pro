/**
 * API Route: AI Recommendations
 *
 * GET /api/ai/recommendations - Get AI-powered recommendations
 * POST /api/ai/recommendations/generate - Generate custom recommendations
 *
 * Uses AI service for intelligent business recommendations
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { prisma } from "@/database/schema";
import { AiService } from "@/services/ai.service";
import { OpenAIAdapter } from "@/infrastructure/ai";
import { handleApiError, withRequestLogging } from "@/app/api/middleware";

export const dynamic = "force-dynamic";

// AI context templates
const RECOMMENDATION_PROMPTS = {
  pricing: `Analyze the following property data and provide pricing recommendations:
- Current occupancy rate: {occupancyRate}%
- Average daily rate: €{avgDailyRate}
- Competitor average rate: €{competitorRate}
- Season: {season}
- Upcoming events: {events}

Provide 3 specific pricing recommendations with expected impact.`,

  occupancy: `Analyze occupancy patterns and provide recommendations:
- Current occupancy: {occupancyRate}%
- Historical average: {historicalAvg}%
- Booking lead time: {leadTime} days
- Season trend: {trend}

Provide actionable recommendations to improve occupancy.`,

  revenue: `Analyze revenue metrics and provide optimization strategies:
- Total revenue (MTD): €{revenueMtd}
- Revenue per available room: €{revPAR}
- Average length of stay: {avgStay} nights
- Direct booking %: {directBookingPct}%

Provide 3 strategies to increase revenue.`,

  guest_experience: `Analyze guest data and provide experience improvements:
- Average rating: {avgRating}/5
- Common complaints: {complaints}
- Repeat guest rate: {repeatRate}%
- VIP guests: {vipCount}

Provide specific improvements to enhance guest experience.`,
};

/**
 * GET /api/ai/recommendations
 * Get AI-powered recommendations for property
 */
export async function GET(request: NextRequest): Promise<NextResponse<any>> {
  return withRequestLogging(
    request,
    async () => {
      try {
        // 1. Authenticate user
        const session = await getServerSession(authOptions);
        const userId = getUserId(session);

        if (!userId) {
          return NextResponse.json(
            { error: "Authentication required" },
            { status: 401 },
          );
        }

        // 2. Parse query params
        const { searchParams } = new URL(request.url);
        const propertyId = searchParams.get("propertyId");
        const category = searchParams.get("category") || "pricing";

        if (!propertyId) {
          return NextResponse.json(
            { error: "Missing required parameter: propertyId" },
            { status: 400 },
          );
        }

        // 3. Verify user has access
        const hasAccess = await prisma.property.findFirst({
          where: {
            id: propertyId,
            OR: [{ userId }, { users: { some: { id: userId } } }],
          },
        });

        if (!hasAccess) {
          return NextResponse.json(
            { error: "Access denied to this property" },
            { status: 403 },
          );
        }

        // 4. Gather property data
        const property = await prisma.property.findUnique({
          where: { id: propertyId },
          include: {
            rooms: true,
            reservations: {
              where: {
                checkIn: {
                  gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                },
              },
              select: {
                totalAmount: true,
                checkIn: true,
                checkOut: true,
                status: true,
              },
            },
          },
        });

        if (!property) {
          return NextResponse.json(
            { error: "Property not found" },
            { status: 404 },
          );
        }

        // 5. Calculate metrics
        const metrics = calculatePropertyMetrics(
          property,
          property.reservations,
        );

        // 6. Build AI context
        const prompt = buildRecommendationPrompt(
          category as any,
          metrics,
          property,
        );

        // 7. Initialize AI service
        const apiKey =
          process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
        if (!apiKey) {
          return NextResponse.json(
            { error: "AI service not configured" },
            { status: 503 },
          );
        }

        const aiService = new AiService({
          llm: new OpenAIAdapter({
            apiKey,
            model: "anthropic/claude-3-haiku",
            maxTokens: 1000,
          }),
          usageLogger: {
            log: async (usage: any) => {
              await prisma.agentRun.create({
                data: {
                  userId,
                  agentType: "recommendation",
                  model: "claude-3-haiku",
                  inputTokens: usage.inputTokens,
                  outputTokens: usage.outputTokens,
                  status: "completed",
                  latencyMs: usage.latencyMs,
                },
              });
            },
          },
        });

        // 8. Generate recommendations
        const result = await aiService.generateWithLogging(
          {
            prompt,
            systemPrompt:
              "You are an expert hospitality consultant. Provide specific, actionable recommendations based on data. Format as JSON array with: recommendation, impact, confidence, implementationSteps.",
          },
          {
            userId,
            agentType: "recommendation",
            model: "claude-3-haiku",
          },
        );

        // 9. Parse and return recommendations
        try {
          const recommendations = JSON.parse(result.text);
          return NextResponse.json({
            success: true,
            data: {
              propertyId,
              category,
              recommendations,
              metrics,
              generatedAt: new Date().toISOString(),
            },
          });
        } catch (parseError) {
          // Fallback: return structured text
          return NextResponse.json({
            success: true,
            data: {
              propertyId,
              category,
              recommendations: [
                {
                  recommendation: result.text,
                  impact: "medium",
                  confidence: 0.75,
                  implementationSteps: [
                    "Review recommendation",
                    "Implement changes",
                    "Monitor results",
                  ],
                },
              ],
              metrics,
              generatedAt: new Date().toISOString(),
            },
          });
        }
      } catch (error) {
        return handleApiError(error, {
          route: "/api/v1/ai/recommendations",
          method: "GET",
        });
      }
    },
    "/api/v1/ai/recommendations",
  );
}

/**
 * POST /api/ai/recommendations/generate
 * Generate custom recommendations
 */
export async function POST(request: NextRequest): Promise<NextResponse<any>> {
  return withRequestLogging(
    request,
    async () => {
      try {
        // 1. Authenticate user
        const session = await getServerSession(authOptions);
        const userId = getUserId(session);

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

        // 3. Verify access if propertyId provided
        if (propertyId) {
          const hasAccess = await prisma.property.findFirst({
            where: {
              id: propertyId,
              OR: [{ userId }, { users: { some: { id: userId } } }],
            },
          });

          if (!hasAccess) {
            return NextResponse.json(
              { error: "Access denied to this property" },
              { status: 403 },
            );
          }
        }

        // 4. Initialize AI service
        const apiKey =
          process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
        if (!apiKey) {
          return NextResponse.json(
            { error: "AI service not configured" },
            { status: 503 },
          );
        }

        const aiService = new AiService({
          llm: new OpenAIAdapter({
            apiKey,
            model: "anthropic/claude-3-sonnet",
            maxTokens: 2000,
          }),
          usageLogger: {
            log: async (usage: any) => {
              await prisma.agentRun.create({
                data: {
                  userId,
                  agentType: "recommendation",
                  model: "claude-3-sonnet",
                  inputTokens: usage.inputTokens,
                  outputTokens: usage.outputTokens,
                  status: "completed",
                  latencyMs: usage.latencyMs,
                },
              });
            },
          },
        });

        // 5. Build context
        const fullContext = `
Context: ${context || "General hospitality business"}
Property: ${propertyId || "Not specified"}

Question: ${question}

Provide a detailed, actionable answer with specific recommendations.`;

        // 6. Generate response
        const result = await aiService.generateWithLogging(
          {
            prompt: fullContext,
            systemPrompt:
              "You are an expert hospitality consultant. Provide detailed, actionable advice based on the question and context.",
          },
          {
            userId,
            agentType: "recommendation",
            model: "claude-3-sonnet",
          },
        );

        return NextResponse.json({
          success: true,
          data: {
            answer: result.text,
            inputTokens: result.inputTokens,
            outputTokens: result.outputTokens,
            generatedAt: new Date().toISOString(),
          },
        });
      } catch (error) {
        return handleApiError(error, {
          route: "/api/v1/ai/recommendations/generate",
          method: "POST",
        });
      }
    },
    "/api/v1/ai/recommendations/generate",
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function calculatePropertyMetrics(property: any, reservations: any[]) {
  const totalRooms = property.rooms?.length || 1;
  const occupiedRooms = reservations.filter(
    (r) => r.status === "confirmed",
  ).length;
  const occupancyRate = Math.round((occupiedRooms / totalRooms) * 100);

  const totalRevenue = reservations.reduce(
    (sum, r) => sum + (r.totalAmount || 0),
    0,
  );
  const avgDailyRate = Math.round(totalRevenue / (reservations.length || 1));

  return {
    occupancyRate,
    avgDailyRate,
    totalRevenue,
    totalReservations: reservations.length,
    avgStay: Math.round(
      reservations.reduce((sum, r) => {
        const days =
          (new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime()) /
          (1000 * 60 * 60 * 24);
        return sum + days;
      }, 0) / (reservations.length || 1),
    ),
  };
}

function buildRecommendationPrompt(
  category: string,
  metrics: any,
  property: any,
): string {
  const prompt =
    RECOMMENDATION_PROMPTS[category as keyof typeof RECOMMENDATION_PROMPTS];

  if (!prompt) {
    return `Analyze this property and provide recommendations: ${JSON.stringify(metrics, null, 2)}`;
  }

  return prompt
    .replace("{occupancyRate}", String(metrics.occupancyRate))
    .replace("{avgDailyRate}", String(metrics.avgDailyRate))
    .replace("{revenueMtd}", String(metrics.totalRevenue))
    .replace("{competitorRate}", "150") // TODO: Get real competitor data
    .replace("{season}", "current")
    .replace("{events}", "none")
    .replace("{historicalAvg}", "75")
    .replace("{leadTime}", "14")
    .replace("{trend}", "stable")
    .replace(
      "{revPAR}",
      String(metrics.avgDailyRate * (metrics.occupancyRate / 100)),
    )
    .replace("{avgStay}", String(metrics.avgStay))
    .replace("{directBookingPct}", "60")
    .replace("{avgRating}", "4.5")
    .replace("{complaints}", "none")
    .replace("{repeatRate}", "25")
    .replace("{vipCount}", "5");
}
