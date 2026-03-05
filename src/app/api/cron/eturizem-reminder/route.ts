/**
 * AgentFlow Pro - eTurizem Reminder Cron
 * Flags today's arrivals without eTurizem submission for Director.
 * Schedule: 0 7 * * * (daily 07:00 UTC)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/database/schema";
import { verifyCronAuth } from "@/lib/cron-auth";
import { startOfDay, addDays } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    if (!verifyCronAuth(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = startOfDay(new Date());
    const nextDay = addDays(today, 1);

    const pending = await prisma.reservation.findMany({
      where: {
        status: "confirmed",
        eturizemSubmittedAt: null,
        checkIn: { gte: today, lt: nextDay },
      },
      select: { id: true, propertyId: true },
    });

    if (pending.length > 0) {
      await prisma.alertEvent.create({
        data: {
          type: "eturizem_pending",
          title: "eTurizem Reminder",
          message: `${pending.length} reservations pending eTurizem submission`,
          metadata: {
            count: pending.length,
            reservationIds: pending.map((r) => r.id),
            propertyIds: [...new Set(pending.map((r) => r.propertyId))],
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      pendingCount: pending.length,
    });
  } catch (error) {
    console.error("eTurizem reminder cron error:", error);
    return NextResponse.json(
      { error: "eTurizem reminder cron failed" },
      { status: 500 }
    );
  }
}
