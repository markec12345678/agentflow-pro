/**
 * AgentFlow Pro - RLS context helper
 * Set app.user_id before queries to enforce team-based RLS on campaign_boards.
 * Usage: withRlsContext(prisma, userId, async (tx) => tx.campaignBoard.findMany(...))
 */

import type { PrismaClient } from "@prisma/client";

const cleanUserId = (id: string) => id.replace(/'/g, "''");

export async function withRlsContext<T>(
  prisma: PrismaClient,
  userId: string,
  fn: (tx: PrismaClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await (tx as unknown as { $executeRawUnsafe: (q: string) => Promise<unknown> }).$executeRawUnsafe(
      `SELECT set_config('app.user_id', '${cleanUserId(userId)}', true)`
    );
    return fn(tx as PrismaClient);
  });
}
