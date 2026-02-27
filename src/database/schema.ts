/**
 * AgentFlow Pro - Database schema & Prisma client
 * Single shared instance to avoid connection pool exhaustion.
 */

import { PrismaClient } from "@prisma/client";
import { getPlanLimits, type PlanId } from "@/stripe/plans";

declare global {
  var prisma: PrismaClient | undefined;
}

function getPrismaConfig() {
  const url = process.env.DATABASE_URL ?? "";
  if (!url) return {};
  const sep = url.includes("?") ? "&" : "?";
  const withPool = url.includes("connection_limit=") ? url : `${url}${sep}connection_limit=5&connect_timeout=15`;
  return { datasources: { db: { url: withPool } } as { db: { url: string } } };
}

export const prisma =
  process.env.NODE_ENV !== "production"
    ? global.prisma ?? new PrismaClient({
        log: ["error", "warn"],
        ...getPrismaConfig(),
      } as any)
    : global.prisma ?? new PrismaClient(getPrismaConfig() as any);

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

export type { PlanId };

export const PLAN_LIMITS = {
  starter: getPlanLimits("starter"),
  pro: getPlanLimits("pro"),
  enterprise: getPlanLimits("enterprise"),
} as const;
