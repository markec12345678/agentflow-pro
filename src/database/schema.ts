/**
 * AgentFlow Pro - Database schema & Prisma client
 */

import { PrismaClient } from "@prisma/client";
import { getPlanLimits, type PlanId } from "@/stripe/plans";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export type { PlanId };

export const PLAN_LIMITS = {
  starter: getPlanLimits("starter"),
  pro: getPlanLimits("pro"),
  enterprise: getPlanLimits("enterprise"),
} as const;
