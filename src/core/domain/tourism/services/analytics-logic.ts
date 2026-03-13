import { prisma } from "@/infrastructure/database/prisma";
import { subDays, format, parseISO } from "date-fns";
import {
  computePredictive,
  type HistoricalPoint,
} from "./predictive-analytics";

export async function getAnalyticsData(propertyId: string, userId: string, period = "30d", startDate?: string, endDate?: string) {
  // Calculate date range
  let dateFrom: Date;
  let dateTo: Date = new Date();

  if (startDate && endDate) {
    dateFrom = parseISO(startDate);
    dateTo = parseISO(endDate);
  } else {
    const days = parseInt(period.replace("d", "").replace("y", "365"));
    dateFrom = subDays(new Date(), days);
  }

  // Fetch reservations for the period
  const reservations = await prisma.reservation.findMany({
    where: {
      propertyId,
      checkIn: {
        gte: dateFrom,
        lte: dateTo,
      },
      status: { not: "cancelled" },
    },
    include: {
      guest: { select: { id: true, name: true } },
    },
  });

  // Channel performance analysis
  const channelStats = {
    direct: { bookings: 0, revenue: 0, avgStay: 0 },
    bookingcom: { bookings: 0, revenue: 0, avgStay: 0 },
    airbnb: { bookings: 0, revenue: 0, avgStay: 0 },
    expedia: { bookings: 0, revenue: 0, avgStay: 0 },
    other: { bookings: 0, revenue: 0, avgStay: 0 },
  };

  let totalNights = 0;
  const channelStayNights: Record<string, number> = {};

  for (const reservation of reservations) {
    const channel = reservation.channel || "direct";
    const channelKey = channel.toLowerCase().replace(/[^a-z]/g, "");
    const key = channelKey in channelStats ? channelKey : "other";

    const nights = Math.ceil(
      (new Date(reservation.checkOut).getTime() - new Date(reservation.checkIn).getTime()) /
      (1000 * 60 * 60 * 24)
    );

    channelStats[key as keyof typeof channelStats].bookings += 1;
    channelStats[key as keyof typeof channelStats].revenue += reservation.totalPrice ?? 0;
    channelStayNights[key] = (channelStayNights[key] || 0) + nights;
    totalNights += nights;
  }

  // Calculate averages
  for (const key of Object.keys(channelStats) as Array<keyof typeof channelStats>) {
    const nights = channelStayNights[key] || 0;
    channelStats[key].avgStay = channelStats[key].bookings > 0
      ? Math.round(nights / channelStats[key].bookings)
      : 0;
  }

  // Revenue metrics
  const totalRevenue = reservations.reduce((sum, r) => sum + (r.totalPrice ?? 0), 0);
  const totalBookings = reservations.length;
  const avgBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;
  const avgStayLength = totalBookings > 0 ? totalNights / totalBookings : 0;

  // Monthly trend + predictive input
  const monthlyRevenue: Record<string, number> = {};
  const monthlyBookings: Record<string, number> = {};
  const monthlyNights: Record<string, number> = {};
  for (const r of reservations) {
    const monthKey = format(new Date(r.checkIn), "yyyy-MM");
    const nights = Math.ceil(
      (new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime()) /
      (1000 * 60 * 60 * 24)
    );
    monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + (r.totalPrice ?? 0);
    monthlyBookings[monthKey] = (monthlyBookings[monthKey] || 0) + 1;
    monthlyNights[monthKey] = (monthlyNights[monthKey] || 0) + nights;
  }

  // Occupancy rate (approximate based on reservations in period)
  const daysInPeriod = Math.ceil((dateTo.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24));
  const occupiedDays = totalNights;
  const occupancyRate = Math.round((occupiedDays / Math.max(1, daysInPeriod)) * 100);

  // Content generation stats (from content history)
  const contentStats = await prisma.contentHistory.findMany({
    where: {
      propertyId,
      createdAt: {
        gte: dateFrom,
        lte: dateTo,
      },
    },
  });

  const contentByType: Record<string, number> = {};
  for (const c of contentStats) {
    const type = c.type || "unknown";
    contentByType[type] = (contentByType[type] || 0) + 1;
  }

  // Predictive analytics block
  const monthlyData: HistoricalPoint[] = Object.keys(monthlyRevenue).map((month) => ({
    month,
    revenue: monthlyRevenue[month] ?? 0,
    bookings: monthlyBookings[month] ?? 0,
    nights: monthlyNights[month] ?? 0,
  })).sort((a, b) => a.month.localeCompare(b.month));
  const predictive = computePredictive(monthlyData, avgStayLength);

  // FAQ response metrics
  const faqLogs = await prisma.faqResponseLog.findMany({
    where: {
      propertyId,
      createdAt: { gte: dateFrom, lte: dateTo },
    },
  });
  const avgResponseTimeMs =
    faqLogs.length > 0
      ? Math.round(
        faqLogs.reduce((s, l) => s + l.responseTimeMs, 0) / faqLogs.length
      )
      : 0;
  const autoAnsweredCount = faqLogs.filter((l) => l.confidence >= 0.9).length;
  const lowConfidenceCount = faqLogs.filter((l) => l.confidence < 0.9).length;

  return {
    summary: {
      totalBookings,
      totalRevenue,
      avgBookingValue: Math.round(avgBookingValue * 100) / 100,
      avgStayLength: Math.round(avgStayLength * 10) / 10,
      occupancyRate,
      period: {
        from: format(dateFrom, "yyyy-MM-dd"),
        to: format(dateTo, "yyyy-MM-dd"),
      },
    },
    channelPerformance: channelStats,
    monthlyTrend: Object.entries(monthlyRevenue).map(([month, revenue]) => ({
      month,
      revenue,
    })),
    contentStats: {
      totalGenerated: contentStats.length,
      byType: contentByType,
    },
    topGuests: reservations
      .filter((r) => r.guest)
      .slice(0, 5)
      .map((r) => ({
        name: r.guest?.name,
        bookings: 1,
        totalSpent: r.totalPrice ?? 0,
      })),
    predictive,
    faqMetrics: {
      totalInquiries: faqLogs.length,
      avgResponseTimeMs,
      autoAnsweredCount,
      lowConfidenceCount,
    },
    daysInPeriod,
    totalNights,
  };
}
