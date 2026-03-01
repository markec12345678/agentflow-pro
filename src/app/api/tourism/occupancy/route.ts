/**
 * GET /api/tourism/occupancy
 * Returns occupancy and revenue for today, today+1, today+2, MTD, YTD.
 * Query: propertyId (required), date (optional, yyyy-MM-dd)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/database/schema";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { getPropertyForUser } from "@/lib/tourism/property-access";
import {
  startOfDay,
  addDays,
  startOfMonth,
  startOfYear,
  format,
  eachDayOfInterval,
} from "date-fns";

type ReservationRow = { propertyId: string; totalPrice: number | null; checkIn: Date; checkOut: Date };

function computeOccupancyForDate(
  reservations: ReservationRow[],
  propertyIds: string[],
  date: Date
): { occupancyPercent: number; revenue: number } {
  if (propertyIds.length === 0) {
    return { occupancyPercent: 0, revenue: 0 };
  }
  const dayStart = startOfDay(date);
  const dayEnd = addDays(dayStart, 1);

  const overlapping = reservations.filter((r) => {
    const ci = new Date(r.checkIn);
    const co = new Date(r.checkOut);
    return ci < dayEnd && co > dayStart;
  });

  const occupiedPropertyIds = new Set(overlapping.map((r) => r.propertyId));
  const occupancyPercent = Math.round((occupiedPropertyIds.size / propertyIds.length) * 100);

  const departuresOnDay = overlapping.filter((r) => {
    const co = new Date(r.checkOut);
    return co >= dayStart && co < dayEnd;
  });
  const revenue = departuresOnDay.reduce((sum, r) => sum + (r.totalPrice ?? 0), 0);

  return { occupancyPercent, revenue: Math.round(revenue * 100) / 100 };
}

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

    const baseDate = dateParam ? startOfDay(new Date(dateParam)) : startOfDay(new Date());
    const propertyIds = [property.id];

    const rangeEnd = addDays(baseDate, 1);
    const monthStart = startOfMonth(baseDate);
    const yearStart = startOfYear(baseDate);
    const day3End = addDays(baseDate, 3);

    const [
      todayReservations,
      mtdReservations,
      ytdReservations,
      mtdRevenueRes,
      ytdRevenueRes,
    ] = await Promise.all([
      prisma.reservation.findMany({
        where: {
          propertyId: { in: propertyIds },
          status: { not: "cancelled" },
          checkIn: { lt: day3End },
          checkOut: { gt: baseDate },
        },
        select: { propertyId: true, totalPrice: true, checkIn: true, checkOut: true },
      }),
      prisma.reservation.findMany({
        where: {
          propertyId: { in: propertyIds },
          status: { not: "cancelled" },
          checkIn: { lt: rangeEnd },
          checkOut: { gt: monthStart },
        },
        select: { propertyId: true, totalPrice: true, checkIn: true, checkOut: true },
      }),
      prisma.reservation.findMany({
        where: {
          propertyId: { in: propertyIds },
          status: { not: "cancelled" },
          checkIn: { lt: rangeEnd },
          checkOut: { gt: yearStart },
        },
        select: { propertyId: true, totalPrice: true, checkIn: true, checkOut: true },
      }),
      prisma.reservation.aggregate({
        where: {
          propertyId: { in: propertyIds },
          status: { not: "cancelled" },
          checkOut: { gte: monthStart, lte: rangeEnd },
        },
        _sum: { totalPrice: true },
      }),
      prisma.reservation.aggregate({
        where: {
          propertyId: { in: propertyIds },
          status: { not: "cancelled" },
          checkOut: { gte: yearStart, lte: rangeEnd },
        },
        _sum: { totalPrice: true },
      }),
    ]);

    const mtdDays = eachDayOfInterval({ start: monthStart, end: baseDate });
    let mtdSum = 0;
    for (const d of mtdDays) {
      mtdSum += computeOccupancyForDate(mtdReservations, propertyIds, d).occupancyPercent;
    }
    const mtdOccupancy = mtdDays.length > 0 ? Math.round(mtdSum / mtdDays.length) : 0;

    const ytdDays = eachDayOfInterval({ start: yearStart, end: baseDate });
    let ytdSum = 0;
    for (const d of ytdDays) {
      ytdSum += computeOccupancyForDate(ytdReservations, propertyIds, d).occupancyPercent;
    }
    const ytdOccupancy = ytdDays.length > 0 ? Math.round(ytdSum / ytdDays.length) : 0;

    const today = computeOccupancyForDate(todayReservations, propertyIds, baseDate);
    const todayPlus1 = computeOccupancyForDate(todayReservations, propertyIds, addDays(baseDate, 1));
    const todayPlus2 = computeOccupancyForDate(todayReservations, propertyIds, addDays(baseDate, 2));

    return NextResponse.json({
      date: format(baseDate, "yyyy-MM-dd"),
      today: { ...today, label: "Danes" },
      todayPlus1: { ...todayPlus1, label: "Jutri" },
      todayPlus2: { ...todayPlus2, label: "Pojutrišnjem" },
      mtd: {
        occupancyPercent: mtdOccupancy,
        revenue: Math.round((mtdRevenueRes._sum.totalPrice ?? 0) * 100) / 100,
        label: "MTD",
      },
      ytd: {
        occupancyPercent: ytdOccupancy,
        revenue: Math.round((ytdRevenueRes._sum.totalPrice ?? 0) * 100) / 100,
        label: "YTD",
      },
    });
  } catch (error) {
    console.error("Occupancy error:", error);
    return NextResponse.json({ error: "Failed to fetch occupancy" }, { status: 500 });
  }
}
