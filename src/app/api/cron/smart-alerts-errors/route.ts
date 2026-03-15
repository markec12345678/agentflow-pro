/**
 * AgentFlow Pro - Smart Alerts Error Burst Cron
 * Counts system_error events in last 5 min; triggers alert if >= 3.
 * Schedule: every 5 minutes
 */

import { NextRequest, NextResponse } from "next/server";
import { logger } from '@/infrastructure/observability/logger';
import { prisma } from "@/database/schema";
import { verifyCronAuth } from "@/lib/cron-auth";
import { triggerAlert } from "@/alerts/smartAlerts";
import { subMinutes } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    if (!verifyCronAuth(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const since = subMinutes(new Date(), 5);

    const [count, lastEvent] = await Promise.all([
      prisma.alertEvent.count({
        where: {
          type: "system_error",
          createdAt: { gte: since },
        },
      }),
      prisma.alertEvent.findFirst({
        where: {
          type: "system_error",
          createdAt: { gte: since },
        },
        orderBy: { createdAt: "desc" },
        select: { metadata: true },
      }),
    ]);

    let triggered = 0;
    if (count >= 3) {
      const lastError =
        (lastEvent?.metadata as { message?: string } | null)?.message ?? "unknown";
      await triggerAlert("system_error", {
        count,
        lastError,
      });
      triggered = 1;

      await prisma.alertEvent.deleteMany({
        where: {
          type: "system_error",
          createdAt: { lt: since },
        },
      });
    }

    return NextResponse.json({
      success: true,
      count,
      triggered,
    });
  } catch (error) {
    logger.error("Smart alerts errors cron:", error);
    return NextResponse.json(
      { error: "Smart alerts errors cron failed" },
      { status: 500 }
    );
  }
}
