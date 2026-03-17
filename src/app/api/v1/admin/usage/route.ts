import { NextResponse } from "next/server";
import { logger } from '@/infrastructure/observability/logger';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { isAdminEmail } from "@/lib/is-admin";
import { prisma } from "@/database/schema";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;
    if (!session?.user || !isAdminEmail(email)) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const periodStart = new Date();
    periodStart.setMonth(periodStart.getMonth() - 1);

    const [runCount, creditsSum, byPlan] = await Promise.all([
      prisma.agentRun.count({
        where: { createdAt: { gte: periodStart } },
      }),
      prisma.agentRun.aggregate({
        where: { createdAt: { gte: periodStart } },
        _sum: { creditsConsumed: true },
      }),
      prisma.agentRun.groupBy({
        by: ["agentType"],
        where: { createdAt: { gte: periodStart } },
        _count: { id: true },
        _sum: { creditsConsumed: true },
      }),
    ]);

    return NextResponse.json({
      periodStart: periodStart.toISOString(),
      totalAgentRuns: runCount,
      totalCreditsUsed: creditsSum._sum.creditsConsumed ?? 0,
      byAgentType: byPlan.map((g) => ({
        agentType: g.agentType,
        runs: g._count.id,
        credits: g._sum.creditsConsumed ?? 0,
      })),
    });
  } catch (err) {
    logger.error("Error in admin usage API:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
}
