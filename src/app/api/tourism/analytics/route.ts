import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";
import { getPropertyForUser } from "@/lib/tourism/property-access";
import { subDays, format, parseISO } from "date-fns";
import {
  computePredictive,
  type HistoricalPoint,
} from "@/lib/tourism/predictive-analytics";

function getUserId(session: { user?: { userId?: string; email?: string | null } } | null): string | null {
  if (!session?.user) return null;
  return (session.user as { userId?: string }).userId ?? session.user.email ?? null;
}

// GET /api/tourism/analytics - get analytics data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");
    const period = searchParams.get("period") || "30d"; // '7d', '30d', '90d', '1y'
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!propertyId) {
      return NextResponse.json(
        { error: "Property ID is required" },
        { status: 400 }
      );
    }

    const property = await getPropertyForUser(propertyId, userId);
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 403 });
    }

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
    const occupancyRate = Math.round((occupiedDays / daysInPeriod) * 100);

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
      const type = c.promptType || "unknown";
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

    return NextResponse.json({
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
      successMetrics: {
        avgResponseTimeMs,
        autoAnsweredCount,
        totalFaqResponses: faqLogs.length,
        lowConfidenceCount,
        revParPlaceholder: null,
        revParNote: "Placeholder za prihodnji RevPAR – podatek bo na voljo z integracijo PMS.",
      },
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}

// POST /api/tourism/analytics - generate report
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { propertyId, reportType, period } = body;

    if (!propertyId) {
      return NextResponse.json({ error: "propertyId is required" }, { status: 400 });
    }

    const property = await getPropertyForUser(propertyId, userId);
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 403 });
    }

    // Fetch analytics data
    const analyticsRes = await fetch(
      `${request.nextUrl.origin}/api/tourism/analytics?propertyId=${propertyId}&period=${period}`,
      { headers: { cookie: request.headers.get("cookie") || "" } }
    );

    if (!analyticsRes.ok) {
      throw new Error("Failed to fetch analytics");
    }

    const data = await analyticsRes.json();

    // Generate report content based on type
    let reportContent = "";

    if (reportType === "monthly") {
      reportContent = generateMonthlyReport(data);
    } else if (reportType === "channel") {
      reportContent = generateChannelReport(data);
    } else if (reportType === "revenue") {
      reportContent = generateRevenueReport(data);
    }

    return NextResponse.json({
      reportType,
      generatedAt: new Date().toISOString(),
      content: reportContent,
      data,
    });
  } catch (error) {
    console.error("Report generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}

interface MonthlyReportData {
  summary: {
    period: { from: string; to: string };
    totalBookings: number;
    totalRevenue: number;
    avgBookingValue: number;
    avgStayLength: number;
    occupancyRate: number;
  };
  monthlyTrend: Array<{ month: string; revenue: number }>;
  channelPerformance: Record<string, {
    bookings: number;
    revenue: number;
    avgStay: number;
  }>;
}

function generateMonthlyReport(data: MonthlyReportData): string {
  return `# Mesečni Poročilo - ${data.summary.period.from} do ${data.summary.period.to}

## Povzetek
- Skupno rezervacij: ${data.summary.totalBookings}
- Skupni prihodki: €${data.summary.totalRevenue}
- Povprečna vrednost rezervacije: €${data.summary.avgBookingValue}
- Povprečna dolžina bivanja: ${data.summary.avgStayLength} noči
- Zasedenost: ${data.summary.occupancyRate}%

## Trend prihodkov
${data.monthlyTrend.map((t) => `- ${t.month}: €${t.revenue}`).join("\n")}

## Kanali prodaje
${Object.entries(data.channelPerformance)
      .map(([channel, stats]) => `- ${channel}: ${stats.bookings} rezervacij, €${stats.revenue}, povp. ${stats.avgStay} noči`)
      .join("\n")}
`;
}

interface RevenueReportData {
  summary: { totalRevenue: number };
  monthlyTrend: Array<{ month: string; revenue: number }>;
}

interface ChannelReportData {
  summary: {
    totalRevenue: number;
  };
  channelPerformance: Record<string, {
    bookings: number;
    revenue: number;
    avgStay: number;
  }>;
}

function generateChannelReport(data: ChannelReportData): string {
  return `# Poročilo o Kanalih Prodaje

${Object.entries(data.channelPerformance)
      .map(([channel, stats]) => `## ${channel.toUpperCase()}
- Rezervacije: ${stats.bookings}
- Prihodki: €${stats.revenue}
- Povprečna dolžina: ${stats.avgStay} noči
- Delež: ${data.summary.totalRevenue > 0 ? Math.round((stats.revenue / data.summary.totalRevenue) * 100) : 0}%`)
      .join("\n")}
`;
}

function generateRevenueReport(data: RevenueReportData): string {
  return `# Poročilo o Prihodkih

## Trend
${data.monthlyTrend.map((t) => `- ${t.month}: €${t.revenue}`).join("\n")}

## Napoved
Na podlagi trenutnega trenda se pričakuje ${Math.round(data.summary.totalRevenue * 1.1)} € prihodkov v naslednjem obdobju.
`;
}
