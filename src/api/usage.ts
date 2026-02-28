/**
 * AgentFlow Pro - Usage tracking
 */

import { Prisma } from "@prisma/client";
import { prisma } from "@/database/schema";
import { getPlanLimits, type PlanId } from "@/stripe/plans";

export interface RecordAgentRunOptions {
  workflowId?: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  creditsConsumed?: number;
  status?: "completed" | "failed";
}

export async function recordAgentRun(
  userId: string,
  agentType: string,
  options?: RecordAgentRunOptions
): Promise<void> {
  const credits = options?.creditsConsumed ?? (options?.workflowId ? 4 : 1);
  const status = options?.status ?? "completed";
  await prisma.agentRun.create({
    data: {
      userId,
      agentType,
      workflowId: options?.workflowId ?? null,
      status,
      input: (options?.input ?? undefined) as Prisma.InputJsonValue | undefined,
      output: (options?.output ?? undefined) as Prisma.InputJsonValue | undefined,
      creditsConsumed: status === "completed" ? credits : 0,
    },
  });
}

export async function getUsage(
  userId: string,
  periodStart?: Date
): Promise<{
  agentRuns: number;
  limit: number;
  planId: PlanId;
  creditsUsed: number;
  creditsLimit: number;
}> {
  const sub = await prisma.subscription.findUnique({
    where: { userId },
  });

  const planId: PlanId = (sub?.planId as PlanId) ?? "free";
  const limits = getPlanLimits(planId);

  const since = periodStart ?? getCurrentPeriodStart(sub?.currentPeriodEnd ?? null);

  const [agentRuns, creditsAgg] = await Promise.all([
    prisma.agentRun.count({
      where: { userId, createdAt: { gte: since } },
    }),
    prisma.agentRun.aggregate({
      where: { userId, createdAt: { gte: since } },
      _sum: { creditsConsumed: true },
    }),
  ]);

  return {
    agentRuns,
    limit: limits.agentRunsLimit,
    planId,
    creditsUsed: creditsAgg._sum.creditsConsumed ?? 0,
    creditsLimit: limits.creditsPerMonth,
  };
}

export async function canRunAgent(userId: string): Promise<boolean> {
  const usage = await getUsage(userId);
  return (
    usage.agentRuns < usage.limit && usage.creditsUsed < usage.creditsLimit
  );
}

function getCurrentPeriodStart(currentPeriodEnd: Date | null): Date {
  if (currentPeriodEnd) {
    const end = new Date(currentPeriodEnd);
    const start = new Date(end);
    start.setMonth(start.getMonth() - 1);
    return start;
  }
  const now = new Date();
  now.setDate(1);
  now.setHours(0, 0, 0, 0);
  return now;
}
