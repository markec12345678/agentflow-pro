import { NextRequest, NextResponse } from "next/server";
import { logger } from '@/infrastructure/observability/logger';
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { getPropertyForUser } from "@/lib/tourism/property-access";

// GET /api/tourism/search-console - fetch GSC data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");
    const days = parseInt(searchParams.get("days") || "30");

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

    // Get property's connected GSC site
    const gscConnection = await prisma.searchConsoleConnection.findFirst({
      where: { propertyId, userId },
    });

    if (!gscConnection) {
      return NextResponse.json(
        {
          error: "Google Search Console not connected",
          setupRequired: true,
          setupUrl: "/dashboard/tourism/seo/search-console-setup",
        },
        { status: 404 }
      );
    }

    // Fetch cached metrics
    const metrics = await prisma.seoMetric.findMany({
      where: {
        propertyId,
        date: {
          gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { date: "desc" },
    });

    // Aggregate data
    const keywordData = aggregateByField(metrics.map(m => ({
      keyword: m.keyword,
      clicks: m.clicks || 0,
      impressions: m.impressions || 0,
      position: m.position || 0
    })), "keyword");
    const pageData = aggregateByField(metrics.map(m => ({
      contentType: m.contentType,
      clicks: m.clicks || 0,
      impressions: m.impressions || 0,
      position: m.position || 0
    })), "contentType");

    return NextResponse.json({
      connected: true,
      siteUrl: gscConnection.siteUrl,
      lastSync: gscConnection.lastSync,
      summary: {
        totalClicks: metrics.reduce((sum, m) => sum + (m.clicks || 0), 0),
        totalImpressions: metrics.reduce((sum, m) => sum + (m.impressions || 0), 0),
        avgCTR: metrics.length > 0
          ? metrics.reduce((sum, m) => sum + ((m.clicks || 0) / (m.impressions || 1)) * 100, 0) / metrics.length
          : 0,
        avgPosition: metrics.length > 0
          ? metrics.reduce((sum, m) => sum + (m.position || 0), 0) / metrics.length
          : 0,
      },
      topKeywords: keywordData.slice(0, 10),
      topPages: pageData.slice(0, 10),
      dailyTrend: aggregateByDate(metrics.filter(m => m.date).map(m => ({
        date: m.date!,
        clicks: m.clicks || 0,
        impressions: m.impressions || 0
      }))),
    });
  } catch (error) {
    logger.error("Search Console error:", error);
    return NextResponse.json(
      { error: "Failed to fetch Search Console data" },
      { status: 500 }
    );
  }
}

// POST /api/tourism/search-console - setup or sync
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { action, propertyId, siteUrl, accessToken } = body;

    if (action === "connect") {
      if (!propertyId || !siteUrl || !siteUrl.match(/^https?:\/\/.+/)) {
        return NextResponse.json(
          { error: "Property ID and valid site URL are required" },
          { status: 400 }
        );
      }

      const property = await getPropertyForUser(propertyId, userId);
      if (!property) {
        return NextResponse.json({ error: "Property not found" }, { status: 403 });
      }

      // Store connection
      const connection = await prisma.searchConsoleConnection.create({
        data: {
          userId,
          propertyId,
          siteUrl,
          accessToken,
          status: "pending_verification",
        },
      });

      return NextResponse.json({
        success: true,
        connection,
        verificationSteps: [
          "Add DNS TXT record or HTML tag to your site",
          "Verify ownership in Google Search Console",
          "Return here to complete setup",
        ],
      });
    }

    if (action === "sync") {
      if (!propertyId) {
        return NextResponse.json({ error: "propertyId is required for sync" }, { status: 400 });
      }

      const property = await getPropertyForUser(propertyId, userId);
      if (!property) {
        return NextResponse.json({ error: "Property not found" }, { status: 403 });
      }

      const connection = await prisma.searchConsoleConnection.findFirst({
        where: { propertyId, userId },
      });

      if (!connection) {
        return NextResponse.json(
          { error: "Connection not found" },
          { status: 404 }
        );
      }

      const syncedData = await syncSearchConsoleData({
        siteUrl: connection.siteUrl,
        accessToken: connection.accessToken || ""
      });

      await prisma.searchConsoleConnection.update({
        where: { id: connection.id },
        data: { lastSync: new Date() },
      });

      return NextResponse.json({
        success: true,
        synced: syncedData.length,
        lastSync: new Date().toISOString(),
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    logger.error("Search Console POST error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

// DELETE /api/tourism/search-console - disconnect
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");

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

    await prisma.searchConsoleConnection.deleteMany({
      where: { propertyId, userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Disconnect error:", error);
    return NextResponse.json(
      { error: "Failed to disconnect" },
      { status: 500 }
    );
  }
}

// Helper functions
function aggregateByField(
  metrics: Array<{ keyword?: string; contentType?: string; clicks?: number; impressions?: number; position?: number }>,
  field: "keyword" | "contentType"
): Array<{ name: string; clicks: number; impressions: number; position: number; ctr: number }> {
  const grouped: Record<string, { clicks: number; impressions: number; positionSum: number; count: number }> = {};

  for (const m of metrics) {
    const key = field === "keyword" ? m.keyword : m.contentType;
    if (!key) continue;

    if (!grouped[key]) {
      grouped[key] = { clicks: 0, impressions: 0, positionSum: 0, count: 0 };
    }
    grouped[key].clicks += m.clicks || 0;
    grouped[key].impressions += m.impressions || 0;
    grouped[key].positionSum += m.position || 0;
    grouped[key].count += 1;
  }

  return Object.entries(grouped)
    .map(([name, data]) => ({
      name,
      clicks: data.clicks,
      impressions: data.impressions,
      position: Math.round((data.positionSum / data.count) * 10) / 10,
      ctr: data.impressions > 0 ? Math.round((data.clicks / data.impressions) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.clicks - a.clicks);
}

function aggregateByDate(
  metrics: Array<{ date?: Date; clicks?: number; impressions?: number }>
): Array<{ date: string; clicks: number; impressions: number }> {
  const grouped: Record<string, { clicks: number; impressions: number }> = {};

  for (const m of metrics) {
    if (!m.date) continue;
    const dateKey = m.date.toISOString().split("T")[0];
    if (!grouped[dateKey]) {
      grouped[dateKey] = { clicks: 0, impressions: 0 };
    }
    grouped[dateKey].clicks += m.clicks || 0;
    grouped[dateKey].impressions += m.impressions || 0;
  }

  return Object.entries(grouped)
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

async function syncSearchConsoleData(connection: { siteUrl: string; accessToken: string }): Promise<Array<unknown>> {
  // In production, call Google Search Console API
  // https://developers.google.com/webmaster-tools/search-console-api-original/v3/searchanalytics/query

  // For now, return mock data structure
  const mockData = [
    {
      query: "apartmaji bela krajina",
      page: `${connection.siteUrl}/apartmaji`,
      clicks: 45,
      impressions: 1200,
      ctr: 0.0375,
      position: 8.5,
      date: new Date(),
    },
    {
      query: "počitnice kolpa",
      page: `${connection.siteUrl}/aktivnosti`,
      clicks: 32,
      impressions: 890,
      ctr: 0.036,
      position: 12.3,
      date: new Date(),
    },
  ];

  return mockData;
}
