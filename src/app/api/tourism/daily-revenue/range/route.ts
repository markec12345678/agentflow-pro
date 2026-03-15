/**
 * GET /api/tourism/daily-revenue/range
 * Returns revenue per day for a date range. Query: propertyId (required), from (yyyy-MM-dd), to (yyyy-MM-dd).
 * Defaults to last 7 days if from/to not provided.
 */

import { NextRequest, NextResponse } from "next/server";
import { logger } from '@/infrastructure/observability/logger';
import { getServerSession } from "next-auth";
import { prisma } from "@/database/schema";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { getPropertyForUser } from "@/lib/tourism/property-access";
import { startOfDay, addDays, subDays, format } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyIdParam = searchParams.get("propertyId");
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    if (!propertyIdParam?.trim()) {
      return NextResponse.json(
        { error: "propertyId is required" },
        { status: 400 }
      );
    }

    const property = await getPropertyForUser(propertyIdParam, userId);
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 403 });
    }

    const today = startOfDay(new Date());
    let dateFrom: Date;
    let dateTo: Date;

    if (fromParam && toParam) {
      dateFrom = startOfDay(new Date(fromParam));
      dateTo = startOfDay(new Date(toParam));
    } else {
      dateTo = today;
      dateFrom = subDays(today, 6);
    }

    if (dateFrom > dateTo) {
      [dateFrom, dateTo] = [dateTo, dateFrom];
    }

    const days: { date: string; revenue: number }[] = [];
    let current = dateFrom;

    while (current <= dateTo) {
      const nextDay = addDays(current, 1);
      const departures = await prisma.reservation.findMany({
        where: {
          propertyId: property.id,
          status: "confirmed",
          checkOut: { gte: current, lt: nextDay },
        },
        select: { totalPrice: true },
      });
      const revenue = departures.reduce((sum, r) => sum + (r.totalPrice ?? 0), 0);
      days.push({
        date: format(current, "yyyy-MM-dd"),
        revenue: Math.round(revenue * 100) / 100,
      });
      current = nextDay;
    }

    return NextResponse.json({ days });
  } catch (error) {
    logger.error("Daily revenue range error:", error);
    return NextResponse.json({ error: "Failed to fetch revenue range" }, { status: 500 });
  }
}
