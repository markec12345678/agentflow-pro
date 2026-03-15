/**
 * GET /api/tourism/daily-revenue
 * Returns revenue from check-outs on a given date. Query: propertyId, date (YYYY-MM-DD, default today).
 */
import { NextRequest, NextResponse } from "next/server";
import { logger } from '@/infrastructure/observability/logger';
import { getServerSession } from "next-auth";
import { prisma } from "@/database/schema";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { getPropertyForUser, getPropertyIdsForUser } from "@/lib/tourism/property-access";
import { startOfDay, addDays, format } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyIdParam = searchParams.get("propertyId");
    const dateParam = searchParams.get("date");

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

    const targetDate = dateParam
      ? startOfDay(new Date(dateParam))
      : startOfDay(new Date());
    const nextDay = addDays(targetDate, 1);

    if (propertyIds.length === 0) {
      return NextResponse.json({
        date: format(targetDate, "yyyy-MM-dd"),
        revenue: 0,
        departureCount: 0,
      });
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

    return NextResponse.json({
      date: format(targetDate, "yyyy-MM-dd"),
      revenue: Math.round(revenue * 100) / 100,
      departureCount: departures.length,
    });
  } catch (error) {
    logger.error("Daily revenue error:", error);
    return NextResponse.json({ error: "Failed to fetch daily revenue" }, { status: 500 });
  }
}
