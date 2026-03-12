/**
 * GET /api/tourism/housekeeping/schedule
 * Get housekeeping tasks for a specific date and property
 * Query: propertyId, date (yyyy-MM-dd)
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
    const dateParam = searchParams.get("date");

    if (!propertyId || !dateParam) {
      return NextResponse.json(
        { error: "propertyId and date are required" },
        { status: 400 }
      );
    }

    const property = await getPropertyForUser(propertyId, userId);
    if (!property) {
      return NextResponse.json({ error: "Property not found or access denied" }, { status: 403 });
    }

    const date = parseISO(dateParam);
    if (isNaN(date.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format (use yyyy-MM-dd)" },
        { status: 400 }
      );
    }

    const dateStart = startOfDay(date);
    const dateEnd = endOfDay(date);

    // Fetch housekeeping tasks for the specified date
    const tasks = await prisma.housekeepingTask.findMany({
      where: {
        propertyId,
        scheduledDate: {
          gte: dateStart,
          lte: dateEnd,
        },
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            role: true,
            avatar: true,
          },
        },
        room: {
          select: {
            id: true,
            name: true,
            type: true,
            roomNumber: true,
          },
        },
      },
      orderBy: {
        scheduledDate: "asc",
      },
    });

    // Transform tasks to match frontend expectations
    const transformedTasks = tasks.map((task) => ({
      id: task.id,
      roomId: task.roomId,
      roomName: task.room?.name || "Unknown Room",
      roomType: task.room?.type || "Unknown",
      taskType: task.taskType as "check_out_clean" | "stayover_clean" | "deep_clean" | "maintenance",
      priority: task.priority as "low" | "medium" | "high" | "urgent",
      status: task.status as "pending" | "in_progress" | "completed" | "delayed",
      assignedTo: task.assignedTo?.name,
      assignedToId: task.assignedToId,
      estimatedTime: task.estimatedTime,
      actualTime: task.actualTime,
      scheduledDate: task.scheduledDate.toISOString(),
      completedAt: task.completedAt?.toISOString(),
      notes: task.notes || undefined,
      guestName: task.guestName || undefined,
      checkOutTime: task.checkOutTime?.toISOString(),
    }));

    return NextResponse.json({ tasks: transformedTasks });
  } catch (error) {
    console.error("[Housekeeping Schedule] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch housekeeping tasks" },
      { status: 500 }
    );
  }
}
