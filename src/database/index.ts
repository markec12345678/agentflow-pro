/**
 * Database barrel export
 * Re-export schema for backwards compatibility
 */
export { prisma } from './schema';
export type { PrismaClient } from '../prisma/generated/prisma/client';
