/**
 * Re-export shared Prisma instance to avoid connection pool exhaustion.
 * Use @/database/schema or @/lib/prisma interchangeably.
 */
export { prisma } from "@/database/schema";
