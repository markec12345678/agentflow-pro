/**
 * Blog post limits per plan
 */

import { prisma } from "@/database/schema";
import { getPlanLimits, type PlanId } from "@/stripe/plans";
import { isTrialActive } from "./trial";

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

function getBlogPostsLimitFromPlan(
  opts?: {
    planId?: PlanId;
    trialEndsAt?: Date | string | null;
  }
): number {
  if (opts?.trialEndsAt && isTrialActive({ trialEndsAt: opts.trialEndsAt })) {
    return getPlanLimits("pro").blogPostsLimit;
  }
  const planId: PlanId = (opts?.planId as PlanId) ?? "starter";
  return getPlanLimits(planId).blogPostsLimit;
}

export async function getBlogPostsUsed(
  userId: string,
  periodStart: Date
): Promise<number> {
  return prisma.blogPost.count({
    where: {
      userId,
      createdAt: { gte: periodStart },
    },
  });
}

export async function canGenerateBlogPosts(
  userId: string,
  requestedCount: number,
  opts?: {
    planId?: PlanId;
    trialEndsAt?: Date | string | null;
    currentPeriodEnd?: Date | null;
  }
): Promise<{ allowed: boolean; used: number; limit: number; message?: string }> {
  const limit = getBlogPostsLimitFromPlan(opts);
  const periodStart = getCurrentPeriodStart(opts?.currentPeriodEnd ?? null);
  const used = await getBlogPostsUsed(userId, periodStart);

  if (used + requestedCount > limit) {
    return {
      allowed: false,
      used,
      limit,
      message: `You have used ${used}/${limit} blog posts this month. Upgrade your plan to generate more.`,
    };
  }
  return { allowed: true, used, limit };
}
