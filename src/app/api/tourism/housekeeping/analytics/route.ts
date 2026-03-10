/**
 * GET /api/tourism/housekeeping/analytics
 * Get housekeeping efficiency analytics
 * Query: propertyId, startDate, endDate, employeeId?
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { prisma } from "@/database/schema";
import { getPropertyForUser } from "@/lib/tourism/property-access";
import { parseISO, startOfDay, endOfDay } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const employeeId = searchParams.get("employeeId");

    if (!propertyId || !startDateParam || !endDateParam) {
      return NextResponse.json(
        { error: "propertyId, startDate, and endDate are required" },
        { status: 400 }
      );
    }

    const property = await getPropertyForUser(propertyId, userId);
    if (!property) {
      return NextResponse.json({ error: "Property not found or access denied" }, { status: 403 });
    }

    const startDate = startOfDay(parseISO(startDateParam));
    const endDate = endOfDay(parseISO(endDateParam));

    // Get all tasks for the period
    const tasks = await prisma.housekeepingTask.findMany({
      where: {
        propertyId,
        scheduledDate: {
          gte: startDate,
          lte: endDate,
        },
        ...(employeeId ? { assignedToId: employeeId } : {}),
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        room: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    // Calculate employee efficiency metrics
    const employeeMetrics: Record<
      string,
      {
        employeeId: string;
        employeeName: string;
        totalTasks: number;
        completedTasks: number;
        pendingTasks: number;
        avgTimePerTask: number;
        totalEstimatedTime: number;
        totalActualTime: number;
        efficiencyScore: number;
        onTimeCompletion: number;
        lateCompletions: number;
        byTaskType: Record<string, number>;
      }
    > = {};

    // Group tasks by employee
    tasks.forEach((task) => {
      if (!task.assignedToId) return;

      if (!employeeMetrics[task.assignedToId]) {
        employeeMetrics[task.assignedToId] = {
          employeeId: task.assignedToId,
          employeeName: task.assignedTo?.name || "Unknown",
          totalTasks: 0,
          completedTasks: 0,
          pendingTasks: 0,
          avgTimePerTask: 0,
          totalEstimatedTime: 0,
          totalActualTime: 0,
          efficiencyScore: 0,
          onTimeCompletion: 0,
          lateCompletions: 0,
          byTaskType: {},
        };
      }

      const metric = employeeMetrics[task.assignedToId];
      metric.totalTasks++;
      metric.totalEstimatedTime += task.estimatedTime;

      if (task.status === "completed") {
        metric.completedTasks++;
        if (task.actualTime) {
          metric.totalActualTime += task.actualTime;
        }
        // Check if completed on time (same day or earlier)
        const scheduledDate = startOfDay(task.scheduledDate);
        const completedDate = task.completedAt ? startOfDay(new Date(task.completedAt)) : null;
        if (completedDate && completedDate <= scheduledDate) {
          metric.onTimeCompletion++;
        } else if (completedDate) {
          metric.lateCompletions++;
        }
      } else {
        metric.pendingTasks++;
      }

      // Count by task type
      metric.byTaskType[task.taskType] = (metric.byTaskType[task.taskType] || 0) + 1;
    });

    // Calculate efficiency scores
    Object.values(employeeMetrics).forEach((metric) => {
      // Efficiency = (completed / total) * (estimated / actual) * 100
      const completionRate = metric.totalTasks > 0 ? metric.completedTasks / metric.totalTasks : 0;
      const timeEfficiency =
        metric.totalActualTime > 0
          ? Math.min(metric.totalEstimatedTime / metric.totalActualTime, 1.5)
          : 1;
      const onTimeRate =
        metric.completedTasks > 0 ? metric.onTimeCompletion / metric.completedTasks : 0;

      metric.efficiencyScore = Math.round((completionRate * 0.4 + timeEfficiency * 0.3 + onTimeRate * 0.3) * 100);

      if (metric.completedTasks > 0) {
        metric.avgTimePerTask = Math.round(metric.totalActualTime / metric.completedTasks);
      }
    });

    // Overall property metrics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === "completed").length;
    const pendingTasks = tasks.filter((t) => t.status !== "completed").length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Tasks by status
    const tasksByStatus = tasks.reduce(
      (acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Tasks by type
    const tasksByType = tasks.reduce(
      (acc, task) => {
        acc[task.taskType] = (acc[task.taskType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Daily trend
    const dailyTrend: Record<
      string,
      { date: string; total: number; completed: number; pending: number }
    > = {};

    tasks.forEach((task) => {
      const dateStr = task.scheduledDate.toISOString().split("T")[0];
      if (!dailyTrend[dateStr]) {
        dailyTrend[dateStr] = { date: dateStr, total: 0, completed: 0, pending: 0 };
      }
      dailyTrend[dateStr].total++;
      if (task.status === "completed") {
        dailyTrend[dateStr].completed++;
      } else {
        dailyTrend[dateStr].pending++;
      }
    });

    return NextResponse.json({
      analytics: {
        overview: {
          totalTasks,
          completedTasks,
          pendingTasks,
          completionRate: Math.round(completionRate),
          period: {
            start: startDate.toISOString(),
            end: endDate.toISOString(),
          },
        },
        tasksByStatus,
        tasksByType,
        employeeMetrics: Object.values(employeeMetrics),
        dailyTrend: Object.values(dailyTrend).sort((a, b) => a.date.localeCompare(b.date)),
      },
    });
  } catch (error) {
    console.error("[Housekeeping Analytics] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch housekeeping analytics" },
      { status: 500 }
    );
  }
}
