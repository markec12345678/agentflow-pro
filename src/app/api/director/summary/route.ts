/**
 * GET /api/director/summary
 * Zero-Touch Director: aggregated today overview, revenue, approvals, alerts.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { startOfDay, addDays, format, subHours } from "date-fns";
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
    const targetDate = startOfDay(new Date());
    const nextDay = addDays(targetDate, 1);
    const since = subHours(new Date(), 24);

    const [
      todayOverview,
      dailyRevenue,
      checkpoints,
      alertEvents,
      smartAlertLogs,
      pendingGuestCommsCount,
    ] = await Promise.all([
      buildTodayOverview(propertyIds, targetDate, nextDay),
      buildDailyRevenue(propertyIds, targetDate, nextDay),
      listPendingCheckpoints(userId),
      prisma.alertEvent.findMany({
        where: {
          createdAt: { gte: since },
          OR: [
            { entityId: "global" },
            ...(propertyIds.length > 0
              ? [{ entityId: { in: propertyIds } }]
              : []),
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: { id: true, eventType: true, entityId: true, metadata: true, createdAt: true },
      }),
      prisma.smartAlertLog.findMany({
        where: {
          sentAt: { gte: since },
          OR: [
            { entityId: userId },
            ...(propertyIds.length > 0 ? [{ entityId: { in: propertyIds } }] : []),
          ],
        },
        orderBy: { sentAt: "desc" },
        take: 20,
        select: { id: true, eventType: true, entityId: true, channel: true, sentAt: true },
      }),
      propertyIds.length > 0
        ? prisma.guestCommunication.count({
          where: {
            propertyId: { in: propertyIds },
            type: "pre-arrival",
            status: { in: ["draft", "pending"] },
          },
        })
        : 0,
    ]);

    const alerts = [
      ...alertEvents.map((e) => ({
        id: e.id,
        type: "event" as const,
        eventType: e.eventType,
        entityId: e.entityId,
        metadata: e.metadata,
        at: e.createdAt,
      })),
      ...smartAlertLogs.map((l) => ({
        id: l.id,
        type: "log" as const,
        eventType: l.eventType,
        entityId: l.entityId,
        channel: l.channel,
        at: l.sentAt,
      })),
    ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

    const actionsRequired: Array<{
      type: "workflow_approval" | "guest_comm" | "eturizem" | "pricing";
      title: string;
      count?: number;
      href: string;
    }> = [];

    if (checkpoints.length > 0) {
      actionsRequired.push({
        type: "workflow_approval",
        title: `${checkpoints.length} odobritev workflow`,
        count: checkpoints.length,
        href: "/dashboard",
      });
    }
    if (pendingGuestCommsCount > 0) {
      actionsRequired.push({
        type: "guest_comm",
        title: `${pendingGuestCommsCount} pre-arrival emailov`,
        count: pendingGuestCommsCount,
        href: "/dashboard/tourism/guest-communication?type=pre-arrival",
      });
    }
    const eturizemEvents = alertEvents.filter((e) => e.eventType === "eturizem_pending");
    if (eturizemEvents.length > 0) {
      const total = eturizemEvents.reduce((sum, e) => {
        const m = e.metadata as { count?: number } | null;
        return sum + (m?.count ?? 0);
      }, 0);
      if (total > 0) {
        actionsRequired.push({
          type: "eturizem",
          title: `${total} prihodov brez eTurizem`,
          count: total,
          href: "/dashboard/tourism",
        });
      }
    }
    const pricingEvents = alertEvents.filter((e) => e.eventType === "property_pricing_suggested");
    for (const e of pricingEvents) {
      const m = e.metadata as { suggestedBasePrice?: number; propertyName?: string } | null;
      if (m?.suggestedBasePrice != null && m.suggestedBasePrice > 0) {
        actionsRequired.push({
          type: "pricing",
          title: m.propertyName
            ? `Predlog cene za ${m.propertyName}: €${m.suggestedBasePrice}`
            : `Predlog cene za nastanitev: €${m.suggestedBasePrice}`,
          count: 1,
          href: "/dashboard/tourism/properties",
        });
      }
    }

    return NextResponse.json({
      todayOverview,
      dailyRevenue,
      checkpoints,
      alerts: alerts.slice(0, 30),
      pendingGuestCommsCount,
      actionsRequired,
    });
  } catch (error) {
    console.error("Director summary error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load director summary" },
      { status: 500 }
    );
  }
}

async function buildTodayOverview(
  propertyIds: string[],
  targetDate: Date,
  nextDay: Date
) {
  if (propertyIds.length === 0) {
    return {
      date: format(targetDate, "yyyy-MM-dd"),
      arrivals: [],
      departures: [],
      inHouse: [],
      counts: { arrivals: 0, departures: 0, inHouse: 0 },
      pendingPreArrivalCount: 0,
    };
  }

  const reservations = await prisma.reservation.findMany({
    where: {
      propertyId: { in: propertyIds },
      status: "confirmed",
      OR: [
        { checkIn: { gte: targetDate, lt: nextDay } },
        { checkOut: { gte: targetDate, lt: nextDay } },
        {
          checkIn: { lt: targetDate },
          checkOut: { gt: targetDate },
        },
      ],
    },
    include: {
      guest: { select: { name: true, phone: true, email: true } },
      property: { select: { name: true } },
    },
  });

  const arrivals = reservations.filter((r) => r.checkIn >= targetDate && r.checkIn < nextDay);
  const departures = reservations.filter((r) => r.checkOut >= targetDate && r.checkOut < nextDay);
  const inHouse = reservations.filter(
    (r) => r.checkIn < targetDate && r.checkOut > targetDate
  );

  const arrivalIds = arrivals.map((r) => r.id);
  const pendingPreArrivals = await prisma.guestCommunication.findMany({
    where: {
      propertyId: { in: propertyIds },
      type: "pre-arrival",
      status: { in: ["pending", "draft"] },
    },
  });
  const matchingPending = pendingPreArrivals.filter((c) =>
    arrivalIds.includes((c.variables as { reservationId?: string })?.reservationId ?? "")
  );

  return {
    date: format(targetDate, "yyyy-MM-dd"),
    arrivals: arrivals.map((r) => ({
      id: r.id,
      guestName: r.guest?.name ?? "Gost",
      propertyName: r.property.name,
      checkIn: format(r.checkIn, "yyyy-MM-dd HH:mm"),
    })),
    departures: departures.map((r) => ({
      id: r.id,
      guestName: r.guest?.name ?? "Gost",
      propertyName: r.property.name,
      checkOut: format(r.checkOut, "yyyy-MM-dd HH:mm"),
    })),
    inHouse: inHouse.map((r) => ({
      id: r.id,
      guestName: r.guest?.name ?? "Gost",
      propertyName: r.property.name,
    })),
    counts: {
      arrivals: arrivals.length,
      departures: departures.length,
      inHouse: inHouse.length,
    },
    pendingPreArrivalCount: matchingPending.length,
  };
}

async function buildDailyRevenue(
  propertyIds: string[],
  targetDate: Date,
  nextDay: Date
) {
  if (propertyIds.length === 0) {
    return { date: format(targetDate, "yyyy-MM-dd"), revenue: 0, departureCount: 0 };
  }

  const departures = await prisma.reservation.findMany({
    where: {
      propertyId: { in: propertyIds },
      status: "confirmed",
      checkOut: { gte: targetDate, lt: nextDay },
    },
    select: { totalPrice: true },
  });

  const revenue = departures.reduce((sum, r) => sum + (r.totalPrice ?? 0), 0);

  return {
    date: format(targetDate, "yyyy-MM-dd"),
    revenue: Math.round(revenue * 100) / 100,
    departureCount: departures.length,
  };
}
