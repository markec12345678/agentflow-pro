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
}

export async function recordAgentRun(
  userId: string,
  agentType: string,
  options?: RecordAgentRunOptions
): Promise<void> {
  await prisma.agentRun.create({
    data: {
      userId,
      agentType,
      workflowId: options?.workflowId ?? null,
      status: "completed",
      input: (options?.input ?? undefined) as Prisma.InputJsonValue | undefined,
      output: (options?.output ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });
}

export async function getUsage(
  userId: string,
  periodStart?: Date
): Promise<{ agentRuns: number; limit: number; planId: PlanId }> {
  const sub = await prisma.subscription.findUnique({
    where: { userId },
  });

  const planId: PlanId = (sub?.planId as PlanId) ?? "starter";
  const limits = getPlanLimits(planId);

  const since = periodStart ?? getCurrentPeriodStart(sub?.currentPeriodEnd ?? null);
  const agentRuns = await prisma.agentRun.count({
    where: {
      userId,
      createdAt: { gte: since },
    },
  });

  return {
    agentRuns,
    limit: limits.agentRunsLimit,
    planId,
  };
}

export async function canRunAgent(userId: string): Promise<boolean> {
  const usage = await getUsage(userId);
  return usage.agentRuns < usage.limit;
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
