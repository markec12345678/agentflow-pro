/**
 * AgentFlow Pro - Plan definitions
 */

export type PlanId = "free" | "starter" | "pro" | "enterprise";

export interface Plan {
  id: PlanId;
  name: string;
  priceMonthly: number;
  agentRunsLimit: number;
  blogPostsLimit: number;
  creditsPerMonth: number;
}

const PRICE_ENV_KEYS: Record<PlanId, string> = {
  free: "",
  starter: "STRIPE_PRICE_STARTER",
  pro: "STRIPE_PRICE_PRO",
  enterprise: "STRIPE_PRICE_ENTERPRISE",
};

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    agentRunsLimit: 20,
    blogPostsLimit: 1,
    creditsPerMonth: 60,
  },
  starter: {
    id: "starter",
    name: "Starter",
    priceMonthly: 29,
    agentRunsLimit: 100,
    blogPostsLimit: 3,
    creditsPerMonth: 300,
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceMonthly: 59,
    agentRunsLimit: 2000,
    blogPostsLimit: 10,
    creditsPerMonth: 1500,
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    priceMonthly: 199,
    agentRunsLimit: 10000,
    blogPostsLimit: 999,
    creditsPerMonth: 10000,
  },
};

export function getPlanLimits(planId: PlanId): {
  agentRunsLimit: number;
  blogPostsLimit: number;
  creditsPerMonth: number;
} {
  const plan = PLANS[planId];
  return plan
    ? {
        agentRunsLimit: plan.agentRunsLimit,
        blogPostsLimit: plan.blogPostsLimit,
        creditsPerMonth: plan.creditsPerMonth,
      }
    : { agentRunsLimit: 20, blogPostsLimit: 1, creditsPerMonth: 60 };
}

export function getStripePriceId(planId: PlanId): string | undefined {
  const key = PRICE_ENV_KEYS[planId];
  return key ? process.env[key] : undefined;
}
