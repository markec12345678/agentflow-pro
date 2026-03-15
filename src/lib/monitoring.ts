/**
 * Monitoring & Logging Utility
 *
 * Centralized logging and monitoring for API endpoints
 */

import { prisma } from "@/database/schema";
import { logger } from '@/infrastructure/observability/logger';

export interface ApiLog {
  endpoint: string;
  method: string;
  userId?: string;
  statusCode: number;
  duration: number;
  timestamp: Date;
  error?: string;
  metadata?: Record<string, any>;
}

export interface PerformanceMetrics {
  endpoint: string;
  p50: number;
  p90: number;
  p95: number;
  p99: number;
  errorRate: number;
  totalRequests: number;
  period: string;
}

/**
 * Log API request
 */
export async function logApiRequest(log: ApiLog): Promise<void> {
  try {
    await prisma.eventLog.create({
      data: {
        eventType: "api_request",
        payload: {
          endpoint: log.endpoint,
          method: log.method,
          userId: log.userId,
          statusCode: log.statusCode,
          duration: log.duration,
          error: log.error,
          metadata: log.metadata,
        },
        timestamp: log.timestamp,
        severity:
          log.statusCode >= 500
            ? "error"
            : log.statusCode >= 400
              ? "warning"
              : "info",
      },
    });
  } catch (error) {
    logger.error("[Monitoring] Failed to log API request:", error);
  }
}

/**
 * Log error with context
 */
export async function logError(
  error: Error,
  context: {
    endpoint: string;
    method: string;
    userId?: string;
    metadata?: Record<string, any>;
  },
): Promise<void> {
  try {
    await prisma.eventLog.create({
      data: {
        eventType: "error",
        payload: {
          error: error.message,
          stack: error.stack,
          ...context,
        },
        timestamp: new Date(),
        severity: "error",
      },
    });

    // Also log to console in development
    if (process.env.NODE_ENV === "development") {
      logger.error(`[Error] ${context.endpoint}:`, error.message);
    }
  } catch (logError) {
    logger.error("[Monitoring] Failed to log error:", logError);
  }
}

/**
 * Get performance metrics for endpoint
 */
export async function getPerformanceMetrics(
  endpoint: string,
  hours: number = 24,
): Promise<PerformanceMetrics | null> {
  try {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const logs = await prisma.eventLog.findMany({
      where: {
        eventType: "api_request",
        timestamp: { gte: since },
        payload: {
          path: ["endpoint"],
          equals: endpoint,
        },
      },
      select: {
        payload: true,
        timestamp: true,
      },
    });

    if (logs.length === 0) {
      return null;
    }

    const durations = logs
      .map((log) => (log.payload as any).duration)
      .filter((d) => typeof d === "number")
      .sort((a, b) => a - b);

    const totalRequests = durations.length;
    const errorCount = logs.filter(
      (log) => (log.payload as any).statusCode >= 500,
    ).length;

    return {
      endpoint,
      p50: getPercentile(durations, 50),
      p90: getPercentile(durations, 90),
      p95: getPercentile(durations, 95),
      p99: getPercentile(durations, 99),
      errorRate: (errorCount / totalRequests) * 100,
      totalRequests,
      period: `${hours}h`,
    };
  } catch (error) {
    logger.error("[Monitoring] Failed to get performance metrics:", error);
    return null;
  }
}

/**
 * Get percentile from sorted array
 */
function getPercentile(sortedArray: number[], percentile: number): number {
  if (sortedArray.length === 0) return 0;

  const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
  return sortedArray[Math.max(0, index)];
}

/**
 * Monitor critical operations
 */
export class OperationMonitor {
  private startTime: number;
  private operationName: string;
  private metadata: Record<string, any>;

  constructor(operationName: string, metadata: Record<string, any> = {}) {
    this.startTime = Date.now();
    this.operationName = operationName;
    this.metadata = metadata;
  }

  async success(result?: any): Promise<void> {
    const duration = Date.now() - this.startTime;
    await logApiRequest({
      endpoint: this.operationName,
      method: "OPERATION",
      statusCode: 200,
      duration,
      timestamp: new Date(),
      metadata: { ...this.metadata, result },
    });
  }

  async error(error: Error, userId?: string): Promise<void> {
    const duration = Date.now() - this.startTime;
    await logError(error, {
      endpoint: this.operationName,
      method: "OPERATION",
      userId,
      metadata: this.metadata,
    });
  }
}

/**
 * Health check for critical services
 */
export async function healthCheck(): Promise<{
  database: boolean;
  email: boolean;
  stripe: boolean;
  ai: boolean;
  overall: boolean;
}> {
  const checks = {
    database: false,
    email: false,
    stripe: false,
    ai: false,
  };

  // Database check
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch (error) {
    logger.error("[Health] Database check failed:", error);
  }

  // Email check
  checks.email = !!process.env.RESEND_API_KEY;

  // Stripe check
  checks.stripe = !!process.env.STRIPE_SECRET_KEY;

  // AI check
  checks.ai = !!(process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY);

  return {
    ...checks,
    overall: checks.database && checks.email && checks.stripe && checks.ai,
  };
}

/**
 * Alert on threshold breach
 */
export async function checkThresholds(
  metrics: PerformanceMetrics,
): Promise<void> {
  const thresholds = {
    p95: 2000, // 2 seconds
    errorRate: 5, // 5%
  };

  if (metrics.p95 > thresholds.p95) {
    logger.warn(
      `[Alert] High latency detected: ${metrics.p95}ms (threshold: ${thresholds.p95}ms)`,
    );

    // Log alert
    await prisma.eventLog.create({
      data: {
        eventType: "performance_alert",
        payload: {
          type: "high_latency",
          endpoint: metrics.endpoint,
          p95: metrics.p95,
          threshold: thresholds.p95,
        },
        timestamp: new Date(),
        severity: "warning",
      },
    });
  }

  if (metrics.errorRate > thresholds.errorRate) {
    logger.warn(
      `[Alert] High error rate detected: ${metrics.errorRate}% (threshold: ${thresholds.errorRate}%)`,
    );

    // Log alert
    await prisma.eventLog.create({
      data: {
        eventType: "performance_alert",
        payload: {
          type: "high_error_rate",
          endpoint: metrics.endpoint,
          errorRate: metrics.errorRate,
          threshold: thresholds.errorRate,
        },
        timestamp: new Date(),
        severity: "error",
      },
    });
  }
}
