/**
 * AgentFlow Pro - Plan definitions
 */

export type PlanId = "starter" | "pro" | "enterprise";

export interface Plan {
  id: PlanId;
  name: string;
  priceMonthly: number;
  agentRunsLimit: number;
}

const PRICE_ENV_KEYS: Record<PlanId, string> = {
  starter: "STRIPE_PRICE_STARTER",
  pro: "STRIPE_PRICE_PRO",
  enterprise: "STRIPE_PRICE_ENTERPRISE",
};

export const PLANS: Record<PlanId, Plan> = {
  starter: {
    id: "starter",
    name: "Starter",
    priceMonthly: 29,
    agentRunsLimit: 100,
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceMonthly: 99,
    agentRunsLimit: 500,
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    priceMonthly: 499,
    agentRunsLimit: 5000,
  },
};

export function getPlanLimits(planId: PlanId): { agentRunsLimit: number } {
  const plan = PLANS[planId];
  return plan
    ? { agentRunsLimit: plan.agentRunsLimit }
    : { agentRunsLimit: 100 };
}

export function getStripePriceId(planId: PlanId): string | undefined {
  const key = PRICE_ENV_KEYS[planId];
  return key ? process.env[key] : undefined;
}
