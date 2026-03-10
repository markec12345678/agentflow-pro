/**
 * GET /api/tourism/housekeeping/my-tasks
 * Get housekeeping tasks for the current logged-in employee
 * Query: date (optional, defaults to today)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { prisma } from "@/database/schema";
import { startOfDay, endOfDay } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");

    // Use provided date or today
    const targetDate = dateParam
      ? startOfDay(new Date(dateParam))
      : startOfDay(new Date());

    // Find employee by user association (email match)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user?.email) {
      return NextResponse.json({ error: "User email not found" }, { status: 404 });
    }

    // Find employee record by email
    const employee = await prisma.employee.findFirst({
      where: {
        email: user.email,
      },
    });

    if (!employee) {
      // If no employee record found, return empty tasks
      return NextResponse.json({ tasks: [] });
    }

    // Get tasks assigned to this employee for the date
    const tasks = await prisma.housekeepingTask.findMany({
      where: {
        assignedToId: employee.id,
        scheduledDate: {
          gte: startOfDay(targetDate),
          lte: endOfDay(targetDate),
        },
      },
      include: {
        room: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
      orderBy: [
        { priority: "asc" }, // urgent first
        { scheduledDate: "asc" },
      ],
    });

    // Transform tasks
    const transformedTasks = tasks.map((task) => ({
      id: task.id,
      roomName: task.room?.name || "Unknown Room",
      roomType: task.room?.type || "Standard",
      taskType: task.taskType as "check_out_clean" | "stayover_clean" | "deep_clean" | "maintenance",
      priority: task.priority as "low" | "medium" | "high" | "urgent",
      status: task.status as "pending" | "in_progress" | "completed" | "delayed",
      assignedTo: task.assignedTo?.name,
      estimatedTime: task.estimatedTime,
      scheduledDate: task.scheduledDate.toISOString(),
      notes: task.notes || undefined,
    }));

    return NextResponse.json({ tasks: transformedTasks });
  } catch (error) {
    console.error("[My Tasks] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch your tasks" },
      { status: 500 }
    );
  }
}
