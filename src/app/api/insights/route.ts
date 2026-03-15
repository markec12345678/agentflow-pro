import { NextRequest, NextResponse } from "next/server";
import { logger } from '@/infrastructure/observability/logger';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { prisma } from "@/database/schema";

/**
 * Estimated hours saved per successful run by agent type (configurable).
 * Workflow = 2x content (multi-step), image/personalize/optimize = 0.5h each.
 */
const HOURS_PER_RUN: Record<string, number> = {
  workflow: 1,
  content: 0.5,
  chat: 0.25,
  image: 0.5,
  personalize: 0.5,
  optimize: 0.5,
  default: 0.5,
};

function getHoursPerRun(agentType: string): number {
  return HOURS_PER_RUN[agentType] ?? HOURS_PER_RUN.default;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") ?? "30d";

    const now = new Date();
    const periodStart = new Date(now);
    if (period === "7d") {
      periodStart.setDate(periodStart.getDate() - 7);
    } else {
      periodStart.setDate(periodStart.getDate() - 30);
    }
    periodStart.setHours(0, 0, 0, 0);

    const [totalCount, successCount, failureCount, byAgentType] = await Promise.all([
      prisma.agentRun.count({
        where: { userId, createdAt: { gte: periodStart } },
      }),
      prisma.agentRun.count({
        where: { userId, status: "completed", createdAt: { gte: periodStart } },
      }),
      prisma.agentRun.count({
        where: { userId, status: "failed", createdAt: { gte: periodStart } },
      }),
      prisma.agentRun.groupBy({
        by: ["agentType", "status"],
        where: { userId, createdAt: { gte: periodStart } },
        _count: { id: true },
      }),
    ]);

    const failureRate = totalCount > 0 ? (failureCount / totalCount) * 100 : 0;

    const byType: Record<string, { runs: number; success: number; failed: number }> = {};
    for (const g of byAgentType) {
      if (!byType[g.agentType]) {
        byType[g.agentType] = { runs: 0, success: 0, failed: 0 };
      }
      byType[g.agentType].runs += g._count.id;
      if (g.status === "completed") byType[g.agentType].success += g._count.id;
      else if (g.status === "failed") byType[g.agentType].failed += g._count.id;
    }

    const completedRuns = await prisma.agentRun.findMany({
      where: { userId, status: "completed", createdAt: { gte: periodStart } },
      select: { agentType: true },
    });

    let estimatedTimeSavedHours = 0;
    for (const r of completedRuns) {
      estimatedTimeSavedHours += getHoursPerRun(r.agentType);
    }

    return NextResponse.json({
      period: { from: periodStart.toISOString(), to: now.toISOString() },
      totalExecutions: totalCount,
      successCount,
      failureCount,
      failureRate: Math.round(failureRate * 10) / 10,
      byAgentType: byType,
      estimatedTimeSavedHours: Math.round(estimatedTimeSavedHours * 10) / 10,
    });
  } catch (err) {
    logger.error("Error in insights API:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
}
