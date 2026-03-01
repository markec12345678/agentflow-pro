/**
 * Mock for Prisma 7 generated client - used in Jest to avoid loading ESM client with import.meta
 */
export const PrismaClient = jest.fn().mockImplementation(() => ({
  user: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), upsert: jest.fn() },
  workflow: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  workflowCheckpoint: { create: jest.fn().mockResolvedValue({ id: "cp1" }) },
  $disconnect: jest.fn(),
  $queryRaw: jest.fn(),
}));
export const Prisma = {};
