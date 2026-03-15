/**
 * POST /api/tourism/housekeeping/tasks
 * Create a new housekeeping task
 * Body: { propertyId, roomId?, taskType, priority, scheduledDate, estimatedTime, assignedToId?, notes?, guestName?, checkOutTime? }
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { prisma } from "@/database/schema";
import { getPropertyForUser } from "@/lib/tourism/property-access";
import { parseISO } from "date-fns";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const {
      propertyId,
      roomId,
      taskType,
      priority,
      scheduledDate,
      estimatedTime,
      assignedToId,
      notes,
      guestName,
      checkOutTime,
    } = body;

    // Validate required fields
    if (!propertyId || !taskType || !priority || !scheduledDate || !estimatedTime) {
      return NextResponse.json(
        { error: "propertyId, taskType, priority, scheduledDate, and estimatedTime are required" },
        { status: 400 }
      );
    }

    // Verify user has access to the property
    const property = await getPropertyForUser(propertyId, userId);
    if (!property) {
      return NextResponse.json({ error: "Property not found or access denied" }, { status: 403 });
    }

    // Validate taskType
    const validTaskTypes = ["check_out_clean", "stayover_clean", "deep_clean", "maintenance"];
    if (!validTaskTypes.includes(taskType)) {
      return NextResponse.json(
        { error: "Invalid taskType. Must be one of: check_out_clean, stayover_clean, deep_clean, maintenance" },
        { status: 400 }
      );
    }

    // Validate priority
    const validPriorities = ["low", "medium", "high", "urgent"];
    if (!validPriorities.includes(priority)) {
      return NextResponse.json(
        { error: "Invalid priority. Must be one of: low, medium, high, urgent" },
        { status: 400 }
      );
    }

    // Validate scheduledDate
    const scheduled = parseISO(scheduledDate);
    if (isNaN(scheduled.getTime())) {
      return NextResponse.json(
        { error: "Invalid scheduledDate format (use ISO 8601 or yyyy-MM-dd)" },
        { status: 400 }
      );
    }

    // Validate roomId if provided
    if (roomId) {
      const room = await prisma.room.findUnique({
        where: { id: roomId },
      });
      if (!room || room.propertyId !== propertyId) {
        return NextResponse.json(
          { error: "Invalid roomId for this property" },
          { status: 400 }
        );
      }
    }

    // Validate assignedToId if provided
    if (assignedToId) {
      const employee = await prisma.employee.findUnique({
        where: { id: assignedToId },
      });
      if (!employee || employee.propertyId !== propertyId) {
        return NextResponse.json(
          { error: "Invalid assignedToId for this property" },
          { status: 400 }
        );
      }
    }

    // Validate checkOutTime if provided
    let checkOutParsed = null;
    if (checkOutTime) {
      checkOutParsed = parseISO(checkOutTime);
      if (isNaN(checkOutParsed.getTime())) {
        return NextResponse.json(
          { error: "Invalid checkOutTime format" },
          { status: 400 }
        );
      }
    }

    // Create the task
    const task = await prisma.housekeepingTask.create({
      data: {
        propertyId,
        roomId: roomId ?? null,
        taskType,
        priority,
        scheduledDate: scheduled,
        estimatedTime,
        assignedToId: assignedToId ?? null,
        notes: notes ?? null,
        guestName: guestName ?? null,
        checkOutTime: checkOutParsed,
        status: "pending",
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
          },
        },
      },
    });

    // If assigned to someone, update their current task count
    if (assignedToId) {
      await prisma.employee.update({
        where: { id: assignedToId },
        data: {
          currentTasks: {
            increment: 1,
          },
        },
      });
    }

    return NextResponse.json(
      {
        task: {
          id: task.id,
          roomId: task.roomId,
          roomName: task.room?.name || "Unknown Room",
          roomType: task.room?.type || "Unknown",
          taskType: task.taskType,
          priority: task.priority,
          status: task.status,
          assignedTo: task.assignedTo?.name,
          assignedToId: task.assignedToId,
          estimatedTime: task.estimatedTime,
          scheduledDate: task.scheduledDate.toISOString(),
          notes: task.notes || undefined,
          guestName: task.guestName || undefined,
          checkOutTime: task.checkOutTime?.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error("[Create Task] Error:", error);
    return NextResponse.json(
      { error: "Failed to create housekeeping task" },
      { status: 500 }
    );
  }
}
