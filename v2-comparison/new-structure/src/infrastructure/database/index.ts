/**
 * Database Infrastructure
 * 
 * Prisma client setup and configuration.
 * Singleton pattern for development hot-reloading.
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Database client singleton
 */
export const db = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}

/**
 * Transaction helper
 * 
 * Usage:
 * await db.transaction(async (tx) => {
 *   await tx.property.create({...});
 *   await tx.reservation.create({...});
 * });
 */
export async function transaction<T>(
  fn: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>
): Promise<T> {
  return db.$transaction(fn);
}

/**
 * Health check
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await db.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
