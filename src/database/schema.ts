/**
 * AgentFlow Pro - Database schema & Prisma client
 * Single shared instance to avoid connection pool exhaustion.
 * Prisma 7: uses PrismaPg adapter for direct Postgres connection.
 */

import { PrismaClient } from "../../prisma/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { getPlanLimits, type PlanId } from "@/stripe/plans";

declare global {
  var prisma: PrismaClient | undefined;
}

function createPrisma() {
  const url = process.env.DATABASE_URL ?? "postgresql://localhost:5432/placeholder";
  const sep = url.includes("?") ? "&" : "?";
  const withPool = url.includes("connection_limit=") ? url : `${url}${sep}connection_limit=5&connect_timeout=15`;
  const adapter = new PrismaPg({ connectionString: withPool });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV !== "production" ? ["error", "warn"] : undefined,
  });
}

export const prisma =
  process.env.NODE_ENV !== "production"
    ? global.prisma ?? createPrisma()
    : global.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

export type { PlanId };

export const PLAN_LIMITS = {
  starter: getPlanLimits("starter"),
  pro: getPlanLimits("pro"),
  enterprise: getPlanLimits("enterprise"),
} as const;
