import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { subDays, startOfMonth, endOfMonth, format, parseISO } from "date-fns";

// GET /api/tourism/analytics - get analytics data
export async function GET(request: NextRequest) {
  try {
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
      channelStats[key as keyof typeof channelStats].revenue += reservation.totalAmount || 0;
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
    const totalRevenue = reservations.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
    const totalBookings = reservations.length;
    const avgBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;
    const avgStayLength = totalBookings > 0 ? totalNights / totalBookings : 0;

    // Monthly trend
    const monthlyRevenue: Record<string, number> = {};
    for (const r of reservations) {
      const monthKey = format(new Date(r.checkIn), "yyyy-MM");
      monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + (r.totalAmount || 0);
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
        .filter(r => r.guest)
        .slice(0, 5)
        .map(r => ({
          name: r.guest?.name,
          bookings: 1,
          totalSpent: r.totalAmount,
        })),
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
    const body = await request.json();
    const { propertyId, reportType, period } = body;

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

function generateMonthlyReport(data: any): string {
  return `# Mesečni Poročilo - ${data.summary.period.from} do ${data.summary.period.to}

## Povzetek
- Skupno rezervacij: ${data.summary.totalBookings}
- Skupni prihodki: €${data.summary.totalRevenue}
- Povprečna vrednost rezervacije: €${data.summary.avgBookingValue}
- Povprečna dolžina bivanja: ${data.summary.avgStayLength} noči
- Zasedenost: ${data.summary.occupancyRate}%

## Trend prihodkov
${data.monthlyTrend.map((t: any) => `- ${t.month}: €${t.revenue}`).join("\n")}

## Kanali prodaje
${Object.entries(data.channelPerformance)
  .map(([channel, stats]: [string, any]) => 
    `- ${channel}: ${stats.bookings} rezervacij, €${stats.revenue}, povp. ${stats.avgStay} noči`
  ).join("\n")}
`;
}

function generateChannelReport(data: any): string {
  return `# Poročilo o Kanalih Prodaje

${Object.entries(data.channelPerformance)
  .map(([channel, stats]: [string, any]) => `
## ${channel.toUpperCase()}
- Rezervacije: ${stats.bookings}
- Prihodki: €${stats.revenue}
- Povprečna dolžina: ${stats.avgStay} noči
- Delež: ${data.summary.totalRevenue > 0 ? Math.round((stats.revenue / data.summary.totalRevenue) * 100) : 0}%
`).join("\n")}
`;
}

function generateRevenueReport(data: any): string {
  return `# Poročilo o Prihodkih

## Trend
${data.monthlyTrend.map((t: any) => `- ${t.month}: €${t.revenue}`).join("\n")}

## Napoved
Na podlagi trenutnega trenda se pričakuje ${Math.round(data.summary.totalRevenue * 1.1)} € prihodkov v naslednjem obdobju.
`;
}
