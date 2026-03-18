/**
 * Use Case: Get AI Recommendations (Property Analytics)
 * 
 * Generate AI-powered recommendations for property optimization
 * based on metrics, occupancy, pricing, and guest data.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { AiService } from "@/services/ai.service";
import { OpenAIAdapter } from "@/infrastructure/ai";

// ============================================================================
// INPUT/OUTPUT DTOs
// ============================================================================

export interface GetRecommendationsInput {
  userId: string;
  propertyId: string;
  category: RecommendationCategory;
  customQuestion?: string;
  customContext?: string;
}

export interface GetRecommendationsOutput {
  success: boolean;
  data?: {
    propertyId: string;
    category: RecommendationCategory;
    recommendations: Recommendation[];
    metrics: PropertyMetrics;
    generatedAt: string;
  };
  error?: string;
}

export type RecommendationCategory =
  | "pricing"
  | "occupancy"
  | "revenue"
  | "guest_experience"
  | "custom";

export interface Recommendation {
  recommendation: string;
  impact: "high" | "medium" | "low";
  confidence: number;
  implementationSteps: string[];
}

export interface PropertyMetrics {
  occupancyRate: number;
  avgDailyRate: number;
  totalRevenue: number;
  totalReservations: number;
  avgStay: number;
}

// ============================================================================
// USE CASE CLASS
// ============================================================================

export class GetRecommendationsUseCase {
  async execute(input: GetRecommendationsInput): Promise<GetRecommendationsOutput> {
    try {
      const { userId, propertyId, category, customQuestion, customContext } = input;

      // 1. Verify property access
      const hasAccess = await this.verifyPropertyAccess(propertyId, userId);
      if (!hasAccess) {
        return {
          success: false,
          error: "Access denied to this property",
        };
      }

      // 2. Gather property data
      const property = await this.getPropertyData(propertyId);
      if (!property) {
        return {
          success: false,
          error: "Property not found",
        };
      }

      // 3. Calculate metrics
      const metrics = this.calculatePropertyMetrics(property);

      // 4. Handle custom question mode
      if (category === "custom" && customQuestion) {
        return await this.generateCustomRecommendations({
          userId,
          propertyId,
          question: customQuestion,
          context: customContext,
        });
      }

      // 5. Build AI prompt for category-based recommendations
      const prompt = this.buildRecommendationPrompt(category, metrics, property);

      // 6. Initialize AI service
      const aiService = this.createAiService(userId);

      // 7. Generate recommendations
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

      // 8. Parse and return recommendations
      const recommendations = this.parseRecommendations(result.text);

      return {
        success: true,
        data: {
          propertyId,
          category,
          recommendations,
          metrics,
          generatedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error("GetRecommendations error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate recommendations",
      };
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private async verifyPropertyAccess(propertyId: string, userId: string): Promise<boolean> {
    const hasAccess = await prisma.property.findFirst({
      where: {
        id: propertyId,
        OR: [{ userId }, { users: { some: { id: userId } } }],
      },
    });

    return !!hasAccess;
  }

  private async getPropertyData(propertyId: string) {
    return await prisma.property.findUnique({
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
  }

  private calculatePropertyMetrics(property: any): PropertyMetrics {
    const totalRooms = property.rooms?.length || 1;
    const occupiedRooms = property.reservations?.filter(
      (r: any) => r.status === "confirmed",
    ).length || 0;
    
    const occupancyRate = Math.round((occupiedRooms / totalRooms) * 100);
    const totalRevenue = property.reservations?.reduce(
      (sum: number, r: any) => sum + (r.totalAmount || 0),
      0,
    ) || 0;
    
    const avgDailyRate = Math.round(
      totalRevenue / (property.reservations?.length || 1),
    );

    const avgStay = Math.round(
      (property.reservations?.reduce((sum: number, r: any) => {
        const days =
          (new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime()) /
          (1000 * 60 * 60 * 24);
        return sum + days;
      }, 0) || 0) / (property.reservations?.length || 1),
    );

    return {
      occupancyRate,
      avgDailyRate,
      totalRevenue,
      totalReservations: property.reservations?.length || 0,
      avgStay,
    };
  }

  private buildRecommendationPrompt(
    category: RecommendationCategory,
    metrics: PropertyMetrics,
    property: any,
  ): string {
    const prompts: Record<RecommendationCategory, string> = {
      pricing: `Analyze the following property data and provide pricing recommendations:
- Current occupancy rate: {occupancyRate}%
- Average daily rate: €{avgDailyRate}
- Total revenue (MTD): €{totalRevenue}
- Competitor average rate: €150
- Season: current
- Upcoming events: none

Provide 3 specific pricing recommendations with expected impact.`,

      occupancy: `Analyze occupancy patterns and provide recommendations:
- Current occupancy: {occupancyRate}%
- Historical average: 75%
- Booking lead time: 14 days
- Season trend: stable
- Total reservations: {totalReservations}

Provide actionable recommendations to improve occupancy.`,

      revenue: `Analyze revenue metrics and provide optimization strategies:
- Total revenue (MTD): €{totalRevenue}
- Revenue per available room: €{revPAR}
- Average daily rate: €{avgDailyRate}
- Average length of stay: {avgStay} nights
- Direct booking %: 60%

Provide 3 strategies to increase revenue.`,

      guest_experience: `Analyze guest data and provide experience improvements:
- Average rating: 4.5/5
- Common complaints: none
- Repeat guest rate: 25%
- VIP guests: 5
- Total stays: {totalReservations}

Provide specific improvements to enhance guest experience.`,

      custom: "", // Handled separately
    };

    const prompt = prompts[category] || prompts.pricing;

    return prompt
      .replace("{occupancyRate}", String(metrics.occupancyRate))
      .replace("{avgDailyRate}", String(metrics.avgDailyRate))
      .replace("{totalRevenue}", String(metrics.totalRevenue))
      .replace("{totalReservations}", String(metrics.totalReservations))
      .replace("{avgStay}", String(metrics.avgStay))
      .replace("{revPAR}", String(metrics.avgDailyRate * (metrics.occupancyRate / 100)));
  }

  private async generateCustomRecommendations(input: {
    userId: string;
    propertyId: string;
    question: string;
    context?: string;
  }): Promise<GetRecommendationsOutput> {
    const { userId, propertyId, question, context } = input;

    const aiService = this.createAiService(userId, "claude-3-sonnet");

    const fullContext = `
Context: ${context || "General hospitality business"}
Property: ${propertyId}

Question: ${question}

Provide a detailed, actionable answer with specific recommendations.`;

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

    return {
      success: true,
      data: {
        propertyId,
        category: "custom",
        recommendations: [
          {
            recommendation: result.text,
            impact: "medium" as const,
            confidence: 0.75,
            implementationSteps: [
              "Review recommendation",
              "Implement changes",
              "Monitor results",
            ],
          },
        ],
        metrics: {
          occupancyRate: 0,
          avgDailyRate: 0,
          totalRevenue: 0,
          totalReservations: 0,
          avgStay: 0,
        },
        generatedAt: new Date().toISOString(),
      },
    };
  }

  private createAiService(userId: string, model: string = "claude-3-haiku"): AiService {
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error("AI service not configured");
    }

    return new AiService({
      llm: new OpenAIAdapter({
        apiKey,
        model: `anthropic/${model}`,
        maxTokens: model === "claude-3-sonnet" ? 2000 : 1000,
      }),
      usageLogger: {
        log: async (usage: any) => {
          await prisma.agentRun.create({
            data: {
              userId,
              agentType: "recommendation",
              model,
              inputTokens: usage.inputTokens,
              outputTokens: usage.outputTokens,
              status: "completed",
              latencyMs: usage.latencyMs,
            },
          });
        },
      },
    });
  }

  private parseRecommendations(text: string): Recommendation[] {
    try {
      return JSON.parse(text);
    } catch {
      // Fallback: return structured text as single recommendation
      return [
        {
          recommendation: text,
          impact: "medium" as const,
          confidence: 0.75,
          implementationSteps: [
            "Review recommendation",
            "Implement changes",
            "Monitor results",
          ],
        },
      ];
    }
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export const getRecommendationsUseCase = new GetRecommendationsUseCase();
