/**
 * GET /api/director/summary
 * Zero-Touch Director View: Revenue trends, auto-approval rates, eturizem status, actions required.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from "date-fns";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { prisma } from "@/database/schema";
import { getPropertyIdsForUser } from "@/lib/tourism/property-access";
import { listPendingCheckpoints } from "@/api/workflows";

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const propertyIds = await getPropertyIdsForUser(userId);
    const now = new Date();

    // 1. Revenue Today/Week/Month
    const [revToday, revWeek, revMonth] = await Promise.all([
      getRevenueForPeriod(propertyIds, startOfDay(now), endOfDay(now)),
      getRevenueForPeriod(propertyIds, startOfWeek(now, { weekStartsOn: 1 }), endOfWeek(now, { weekStartsOn: 1 })),
      getRevenueForPeriod(propertyIds, startOfMonth(now), endOfMonth(now)),
    ]);

    // 2. Auto-approval rate (from AgentRuns)
    const thirtyDaysAgo = subDays(now, 30);
    const [totalRuns, manualRuns] = await Promise.all([
      prisma.agentRun.count({
        where: { userId, createdAt: { gte: thirtyDaysAgo } }
      }),
      prisma.workflowCheckpoint.count({
        where: { workflow: { userId }, createdAt: { gte: thirtyDaysAgo } }
      })
    ]);
    const autoApprovalRate = totalRuns > 0 
      ? Math.round(((totalRuns - manualRuns) / totalRuns) * 100) 
      : 100;

    // 3. Actions Required (Exceptions for approval)
    const [pendingCheckpoints, pendingGuestComms, pendingETurizem] = await Promise.all([
      listPendingCheckpoints(userId),
      prisma.guestCommunication.count({
        where: {
          propertyId: { in: propertyIds },
          type: "pre-arrival",
          status: { in: ["draft", "pending"] },
        }
      }),
      prisma.alertEvent.count({
        where: {
          type: "eturizem_pending",
          propertyId: { in: propertyIds },
          createdAt: { gte: subDays(now, 7) }
        }
      })
    ]);

    const actionsRequired = [];
    if (pendingCheckpoints.length > 0) {
      actionsRequired.push({
        id: "checkpoints",
        type: "approval",
        title: "Odobritev vsebine",
        count: pendingCheckpoints.length,
        severity: "medium",
        href: "/dashboard"
      });
    }
    if (pendingGuestComms > 0) {
      actionsRequired.push({
        id: "comms",
        type: "communication",
        title: "Pre-arrival email gosti",
        count: pendingGuestComms,
        severity: "low",
        href: "/dashboard/tourism/guest-communication"
      });
    }
    if (pendingETurizem > 0) {
      actionsRequired.push({
        id: "eturizem",
        type: "sync",
        title: "eTurizem prijave",
        count: pendingETurizem,
        severity: "high",
        href: "/dashboard/tourism"
      });
    }

    // 4. Guest Satisfaction Score (Simulated or from metadata)
    const satisfactionScore = 4.8; // MVP: static or logic-based

    // 5. eTurizem Sync Status
    const eturizemStatus = pendingETurizem === 0 ? "synced" : "pending";

    return NextResponse.json({
      revenue: {
        today: revToday,
        week: revWeek,
        month: revMonth
      },
      autoApprovalRate,
      satisfactionScore,
      eturizemStatus,
      actionsRequired,
      propertyCount: propertyIds.length
    });

  } catch (error) {
    console.error("Director summary API error:", error);
    return NextResponse.json(
      { error: "Failed to load director summary" },
      { status: 500 }
    );
  }
}

async function getRevenueForPeriod(propertyIds: string[], start: Date, end: Date) {
  if (propertyIds.length === 0) return 0;
  const reservations = await prisma.reservation.findMany({
    where: {
      propertyId: { in: propertyIds },
      status: "confirmed",
      checkOut: { gte: start, lte: end }
    },
    select: { totalPrice: true }
  });
  return reservations.reduce((sum, r) => sum + (r.totalPrice ?? 0), 0);
}
