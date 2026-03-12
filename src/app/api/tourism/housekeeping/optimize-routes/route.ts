/**
 * POST /api/tourism/housekeeping/optimize-routes
 * Optimize housekeeping routes based on priority and location
 * Body: { propertyId, date, floor?, section? }
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { prisma } from "@/database/schema";
import { getPropertyForUser } from "@/lib/tourism/property-access";
import { parseISO, startOfDay, endOfDay } from "date-fns";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { propertyId, date, floor, section } = body;

    if (!propertyId || !date) {
      return NextResponse.json(
        { error: "propertyId and date are required" },
        { status: 400 }
      );
    }

    const property = await getPropertyForUser(propertyId, userId);
    if (!property) {
      return NextResponse.json({ error: "Property not found or access denied" }, { status: 403 });
    }

    const targetDate = parseISO(date);
    if (isNaN(targetDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format (use ISO 8601 or yyyy-MM-dd)" },
        { status: 400 }
      );
    }

    const dateStart = startOfDay(targetDate);
    const dateEnd = endOfDay(targetDate);

    // Get all checkouts and stayovers for the date
    const reservations = await prisma.reservation.findMany({
      where: {
        propertyId,
        roomId: floor || section ? undefined : undefined,
        OR: [
          {
            checkOut: {
              gte: dateStart,
              lte: dateEnd,
            },
          },
          {
            checkIn: {
              gte: dateStart,
              lte: dateEnd,
            },
          },
        ],
      },
      include: {
        room: {
          include: {
            housekeepingTasks: {
              where: {
                scheduledDate: {
                  gte: dateStart,
                  lte: dateEnd,
                },
              },
            },
          },
        },
        guest: true,
      },
    });

    // Build optimized tasks
    const tasks = reservations.map((res) => {
      const isCheckout =
        new Date(res.checkOut).toDateString() === targetDate.toDateString();
      const isStayover =
        new Date(res.checkIn).toDateString() === targetDate.toDateString();

      // Determine priority
      let priority: "low" | "medium" | "high" | "urgent" = "medium";

      // Early check-in = high priority
      if (isStayover && new Date(res.checkIn).getHours() < 14) {
        priority = "high";
      }

      // VIP guest = vip priority
      if (res.guest?.loyaltyTier === "platinum" || res.guest?.loyaltyTier === "diamond") {
        priority = "urgent";
      }

      // Determine task type
      const taskType = isCheckout
        ? "check_out_clean"
        : isStayover
        ? "stayover_clean"
        : "maintenance";

      // Estimated time based on type
      const estimatedTime = isCheckout ? 45 : isStayover ? 30 : 60;

      return {
        id: `opt-${Date.now()}-${res.id}`,
        roomId: res.roomId,
        roomName: res.room?.name || `Room ${res.room?.id}`,
        roomType: res.room?.type || "Standard",
        taskType,
        priority,
        status: "pending" as const,
        assignedTo: undefined,
        estimatedTime,
        scheduledDate: targetDate.toISOString(),
        guestName: res.guest?.name,
        checkOutTime: isCheckout ? res.checkOut.toISOString() : undefined,
        notes: isCheckout ? "Full checkout cleaning" : isStayover ? "Stayover service" : "Maintenance check",
      };
    });

    // Sort by priority and floor/section
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    tasks.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      // Then by room number for efficient routing
      return a.roomName.localeCompare(b.roomName);
    });

    // Group by floor/section if specified
    const groupedTasks: Record<string, typeof tasks> = {};
    tasks.forEach((task) => {
      const key = floor || section || "all";
      if (!groupedTasks[key]) groupedTasks[key] = [];
      groupedTasks[key].push(task);
    });

    // Calculate route efficiency metrics
    const totalEstimatedTime = tasks.reduce((sum, t) => sum + t.estimatedTime, 0);
    const highPriorityCount = tasks.filter((t) => t.priority === "high" || t.priority === "urgent").length;

    return NextResponse.json({
      optimizedTasks: tasks,
      groupedTasks,
      metrics: {
        totalTasks: tasks.length,
        totalEstimatedTime,
        highPriorityCount,
        checkoutCount: tasks.filter((t) => t.taskType === "check_out_clean").length,
        stayoverCount: tasks.filter((t) => t.taskType === "stayover_clean").length,
        maintenanceCount: tasks.filter((t) => t.taskType === "maintenance").length,
      },
    });
  } catch (error) {
    console.error("[Optimize Routes] Error:", error);
    return NextResponse.json(
      { error: "Failed to optimize housekeeping routes" },
      { status: 500 }
    );
  }
}
