/**
 * AgentFlow Pro - Database schema & Prisma client
 */

import { PrismaClient } from "@prisma/client";
import { getPlanLimits, type PlanId } from "@/stripe/plans";

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma =
  process.env.NODE_ENV !== "production"
    ? global.prisma ?? new PrismaClient({
        log: ["error", "warn"],
      })
    : global.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

export type { PlanId };

export const PLAN_LIMITS = {
  starter: getPlanLimits("starter"),
  pro: getPlanLimits("pro"),
  enterprise: getPlanLimits("enterprise"),
} as const;
