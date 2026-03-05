/**
 * GET /api/tourism/notifications/daily-summary
 * Ensures a daily summary notification exists for today's arrivals/departures.
 * Creates one if not already created today. Called on Tourism page load.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { startOfDay, addDays, format } from "date-fns";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { prisma } from "@/database/schema";
import { getPropertyForUser, getPropertyIdsForUser } from "@/lib/tourism/property-access";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyIdParam = searchParams.get("propertyId");

    let propertyIds: string[];
    if (propertyIdParam?.trim()) {
      const property = await getPropertyForUser(propertyIdParam, userId);
      if (!property) {
        return NextResponse.json({ error: "Property not found" }, { status: 403 });
      }
      propertyIds = [property.id];
    } else {
      propertyIds = await getPropertyIdsForUser(userId);
    }

    const today = startOfDay(new Date());
    const nextDay = addDays(today, 1);

    if (propertyIds.length === 0) {
      return NextResponse.json({ created: false, arrivals: 0, departures: 0 });
    }

    const reservations = await prisma.reservation.findMany({
      where: {
        propertyId: { in: propertyIds },
        status: "confirmed",
        OR: [
          { checkIn: { gte: today, lt: nextDay } },
          { checkOut: { gte: today, lt: nextDay } },
          {
            checkIn: { lt: today },
            checkOut: { gt: today },
          },
        ],
      },
    });

    const arrivals = reservations.filter((r) => r.checkIn >= today && r.checkIn < nextDay);
    const departures = reservations.filter((r) => r.checkOut >= today && r.checkOut < nextDay);
    const a = arrivals.length;
    const d = departures.length;

    // Check if daily summary already created today
    const existing = await prisma.notification.findFirst({
      where: {
        userId,
        type: "info",
        title: { contains: "Danes" },
        createdAt: { gte: today },
      },
    });

    if (existing) {
      return NextResponse.json({ created: false, arrivals: a, departures: d });
    }

    // Create only if there are arrivals or departures
    if (a > 0 || d > 0) {
      const title = `Danes: ${a} prihodov, ${d} odhodov`;
      const message = "Preglejte koledar in pripravi pre-arrival emaile.";
      await prisma.notification.create({
        data: {
          userId,
          propertyId: propertyIds[0] ?? null,
          type: "info",
          title,
          message,
          read: false,
          link: "/dashboard/tourism/calendar",
        },
      });
      return NextResponse.json({ created: true, arrivals: a, departures: d });
    }

    return NextResponse.json({ created: false, arrivals: a, departures: d });
  } catch (error) {
    console.error("Daily summary error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 }
    );
  }
}
