/**
 * AgentFlow Pro - Log system errors to AlertEvent table
 * Used for system_error burst detection in smart-alerts-errors cron.
 * Fire-and-forget; does not throw.
 */

import { prisma } from "@/database/schema";

export async function logSystemError(
  error: Error,
  metadata?: { url?: string; path?: string }
): Promise<void> {
  try {
    await prisma.alertEvent.create({
      data: {
        type: "system_error",
        title: "System Error",
        message: error.message,
        metadata: {
          name: error.name,
          ...metadata,
        },
      },
    });
  } catch (e) {
    console.error("[SmartAlerts] Failed to log system error:", e);
  }
}
