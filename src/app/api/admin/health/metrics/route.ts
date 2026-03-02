import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getUserId } from '@/lib/auth-users';
import { prisma } from '@/database/schema';

export const dynamic = "force-dynamic";

interface PerformanceMetrics {
  timestamp: string;
  responseTime: number;
  errorRate: number;
  requestsPerMinute: number;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkIn: number;
  networkOut: number;
  databaseConnections: number;
  cacheHitRate: number;
}

interface UptimeMetrics {
  startTime: string;
  totalUptime: number;
  uptimePercentage: number;
  downtimeEvents: {
    timestamp: string;
    duration: number;
    component: string;
    reason: string;
  }[];
}

/**
 * GET /api/admin/health/metrics
 * Get performance and uptime metrics
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Check if user is admin
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '24h';
    const metricType = searchParams.get('type') || 'performance';

    // Get metrics (in real implementation, this would fetch from monitoring system)
    let data;
    
    if (metricType === 'performance') {
      data = await getPerformanceMetrics(timeRange);
    } else if (metricType === 'uptime') {
      data = await getUptimeMetrics(timeRange);
    } else {
      data = {
        performance: await getPerformanceMetrics(timeRange),
        uptime: await getUptimeMetrics(timeRange)
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        type: metricType,
        timeRange,
        timestamp: new Date().toISOString(),
        ...data
      }
    });

  } catch (error) {
    console.error('Get metrics error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }

async function getPerformanceMetrics(timeRange: string): Promise<PerformanceMetrics[]> {
  const now = new Date();
  const dataPoints = getDataPointsCount(timeRange);
  const metrics: PerformanceMetrics[] = [];

  for (let i = 0; i < dataPoints; i++) {
    const timestamp = new Date(now.getTime() - i * getIntervalMs(timeRange));
    
    metrics.push({
      timestamp: timestamp.toISOString(),
      responseTime: Math.random() * 500 + 50,
      errorRate: Math.random() * 5,
      requestsPerMinute: Math.random() * 2000 + 500,
      cpuUsage: Math.random() * 80 + 10,
      memoryUsage: Math.random() * 80 + 10,
      diskUsage: Math.random() * 30 + 70,
      networkIn: Math.random() * 1000000 + 500000,
      networkOut: Math.random() * 500000 + 250000,
      databaseConnections: Math.floor(Math.random() * 20) + 5,
      cacheHitRate: Math.random() * 10 + 90
    });
  }

  return metrics.reverse();
}

async function getUptimeMetrics(timeRange: string): Promise<UptimeMetrics> {
  const now = new Date();
  const startTime = new Date(now.getTime() - getTimeRangeMs(timeRange));
  
  // Simulate uptime data
  const totalUptime = getTimeRangeMs(timeRange) * 0.995; // 99.5% uptime
  const uptimePercentage = (totalUptime / getTimeRangeMs(timeRange)) * 100;
  
  // Generate some downtime events
  const downtimeEvents = [];
  for (let i = 0; i < 3; i++) {
    const eventTime = new Date(startTime.getTime() + Math.random() * getTimeRangeMs(timeRange));
    downtimeEvents.push({
      timestamp: eventTime.toISOString(),
      duration: Math.floor(Math.random() * 300) + 60, // 1-5 minutes
      component: ['database', 'api', 'agents', 'cache'][Math.floor(Math.random() * 4)],
      reason: ['maintenance', 'error', 'restart', 'timeout'][Math.floor(Math.random() * 4)]
    });
  }

  return {
    startTime: startTime.toISOString(),
    totalUptime,
    uptimePercentage,
    downtimeEvents
  };
}

function getDataPointsCount(timeRange: string): number {
  switch (timeRange) {
    case '1h': return 60; // 1 per minute
    case '6h': return 72; // 1 per 5 minutes
    case '24h': return 96; // 1 per 15 minutes
    case '7d': return 168; // 1 per hour
    case '30d': return 30; // 1 per day
    default: return 96;
  }
}

function getIntervalMs(timeRange: string): number {
  switch (timeRange) {
    case '1h': return 60 * 1000; // 1 minute
    case '6h': return 5 * 60 * 1000; // 5 minutes
    case '24h': return 15 * 60 * 1000; // 15 minutes
    case '7d': return 60 * 60 * 1000; // 1 hour
    case '30d': return 24 * 60 * 60 * 1000; // 1 day
    default: return 15 * 60 * 1000;
  }
}

function getTimeRangeMs(timeRange: string): number {
  switch (timeRange) {
    case '1h': return 60 * 60 * 1000;
    case '6h': return 6 * 60 * 60 * 1000;
    case '24h': return 24 * 60 * 60 * 1000;
    case '7d': return 7 * 24 * 60 * 60 * 1000;
    case '30d': return 30 * 24 * 60 * 60 * 1000;
    default: return 24 * 60 * 60 * 1000;
  }
}
}
