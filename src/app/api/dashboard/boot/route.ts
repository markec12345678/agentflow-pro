/**
 * Dashboard boot API - consolidated endpoint for profile, usage, properties, content, checkpoints.
 * Replaces 6+ separate API calls with a single request.
 */

import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/database/schema";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { getUsage } from "@/api/usage";
import { getPropertyIdsForUser } from "@/lib/tourism/property-access";
import { listPendingCheckpoints } from "@/api/workflows";
import { getAnalyticsData } from "@/lib/tourism/analytics-logic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [userData, onboarding, usageData, propertyIds, blogPosts, contentHistory, checkpoints, alertLogs] =
      await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: { activePropertyId: true },
        }),
        prisma.onboarding.findFirst({
          where: { userId },
          orderBy: { createdAt: "desc" },
          select: { industry: true },
        }),
        getUsage(userId),
        getPropertyIdsForUser(userId),
        prisma.blogPost.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 10,
          select: { id: true, title: true, topic: true, pipelineStage: true, createdAt: true },
        }),
        prisma.contentHistory.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 10,
          select: { id: true, content: true, type: true, createdAt: true },
        }),
        listPendingCheckpoints(userId),
        prisma.smartAlertLog.findMany({
          where: { entityId: userId },
          orderBy: { sentAt: "desc" },
          take: 5,
        }),
      ]);

    // Fetch analytics if property exists
    let summary = null;
    let channelPerformance = null;
    if (userData?.activePropertyId) {
      try {
        const analytics = await getAnalyticsData(userData.activePropertyId, userId);
        summary = analytics.summary;
        channelPerformance = {
          direct: analytics.channelPerformance.direct.bookings,
          bookingcom: analytics.channelPerformance.bookingcom.bookings,
          airbnb: analytics.channelPerformance.airbnb.bookings,
          expedia: analytics.channelPerformance.expedia.bookings,
          other: analytics.channelPerformance.other.bookings,
        };
      } catch (e) {
        console.error("Dashboard boot analytics fetch error:", e);
      }
    }

    const fromBlog = blogPosts.map((p) => ({
      id: p.id,
      type: (p.topic ?? p.pipelineStage ?? "blog") as string,
      content: (p.title ?? p.topic ?? "").slice(0, 60),
      createdAt: p.createdAt,
    }));
    const fromHistory = contentHistory.map((h) => ({
      id: h.id,
      type: h.type,
      content: (h.content ?? "").slice(0, 60),
      createdAt: h.createdAt,
    }));
    const contentMerged = [...fromBlog, ...fromHistory]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    const alerts = alertLogs.map(log => ({
      id: log.id,
      type: log.escalatedAt ? "error" : "warning",
      message: `${log.eventType === 'occupancy' ? 'Visoka zasedenost' : 'Sistemsko obvestilo'}`,
      timestamp: log.sentAt.toISOString(),
    }));

    return NextResponse.json({
      profile: {
        onboarding: onboarding ? { industry: onboarding.industry } : null,
      },
      usage: usageData,
      activePropertyId: userData?.activePropertyId ?? null,
      hasProperty: propertyIds.length > 0,
      hasContent: contentMerged.length > 0,
      recentContent: contentMerged,
      checkpoints,
      alerts,
      summary,
      channelPerformance,
    });
  } catch (err) {
    console.error("Dashboard boot API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load dashboard" },
      { status: 500 }
    );
  }
}
