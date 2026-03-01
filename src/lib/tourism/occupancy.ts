/**
 * AgentFlow Pro - Shared occupancy computation
 * Used by /api/tourism/occupancy and cron/smart-alerts
 */

import { addDays, eachDayOfInterval, startOfDay, startOfMonth, startOfYear } from "date-fns";
import type { Prisma } from "../database/schema";

export type ReservationRow = {
  propertyId: string;
  totalPrice: number | null;
  checkIn: Date;
  checkOut: Date;
};

export function computeOccupancyForDate(
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

export interface OccupancyForPropertyResult {
  date: string;
  today: { occupancyPercent: number; revenue: number };
  todayPlus1: { occupancyPercent: number; revenue: number };
  todayPlus2: { occupancyPercent: number; revenue: number };
  mtd: { occupancyPercent: number; revenue: number };
  ytd: { occupancyPercent: number; revenue: number };
}

/**
 * Compute occupancy for a single property. Used by API route and cron.
 */
export async function getOccupancyForProperty(
  prisma: { reservation: { findMany: (args: object) => Promise<ReservationRow[]>; aggregate: (args: object) => Promise<{ _sum: { totalPrice: number | null } }> } },
  propertyIds: string[],
  baseDate: Date
): Promise<OccupancyForPropertyResult> {
  const { format } = await import("date-fns");
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

  return {
    date: format(baseDate, "yyyy-MM-dd"),
    today: { ...today },
    todayPlus1: { ...todayPlus1 },
    todayPlus2: { ...todayPlus2 },
    mtd: {
      occupancyPercent: mtdOccupancy,
      revenue: Math.round((mtdRevenueRes._sum.totalPrice ?? 0) * 100) / 100,
    },
    ytd: {
      occupancyPercent: ytdOccupancy,
      revenue: Math.round((ytdRevenueRes._sum.totalPrice ?? 0) * 100) / 100,
    },
  };
}
