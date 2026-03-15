/**
 * PUT /api/tourism/housekeeping/tasks/[id]/status
 * Update housekeeping task status and assignment
 * Body: { status, assignedTo?, notes? }
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { prisma } from "@/database/schema";
import { getPropertyForUser } from "@/lib/tourism/property-access";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, assignedTo, notes } = body;

    if (!status) {
      return NextResponse.json({ error: "status is required" }, { status: 400 });
    }

    // Fetch the task to verify ownership
    const existingTask = await prisma.housekeepingTask.findUnique({
      where: { id },
      include: { property: true },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Verify user has access to the property
    const property = await getPropertyForUser(existingTask.propertyId, userId);
    if (!property) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Validate status
    const validStatuses = ["pending", "in_progress", "completed", "delayed"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be one of: pending, in_progress, completed, delayed" },
        { status: 400 }
      );
    }

    // If assigning to someone, verify they exist and belong to the property
    if (assignedTo) {
      const employee = await prisma.employee.findUnique({
        where: { id: assignedTo },
      });
      if (!employee || employee.propertyId !== existingTask.propertyId) {
        return NextResponse.json(
          { error: "Invalid employee assignment" },
          { status: 400 }
        );
      }
    }

    // Update the task
    const updatedTask = await prisma.housekeepingTask.update({
      where: { id },
      data: {
        status,
        assignedToId: assignedTo ?? null,
        notes: notes ?? existingTask.notes,
        completedAt: status === "completed" ? new Date() : null,
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

    // If task is completed, update employee's current task count
    if (status === "completed" && assignedTo) {
      await prisma.employee.update({
        where: { id: assignedTo },
        data: {
          currentTasks: {
            decrement: 1,
          },
        },
      });
    }

    return NextResponse.json({
      task: {
        id: updatedTask.id,
        roomId: updatedTask.roomId,
        roomName: updatedTask.room?.name || "Unknown Room",
        roomType: updatedTask.room?.type || "Unknown",
        taskType: updatedTask.taskType,
        priority: updatedTask.priority,
        status: updatedTask.status,
        assignedTo: updatedTask.assignedTo?.name,
        assignedToId: updatedTask.assignedToId,
        estimatedTime: updatedTask.estimatedTime,
        actualTime: updatedTask.actualTime,
        scheduledDate: updatedTask.scheduledDate.toISOString(),
        completedAt: updatedTask.completedAt?.toISOString(),
        notes: updatedTask.notes || undefined,
        guestName: updatedTask.guestName || undefined,
      },
    });
  } catch (error) {
    logger.error("[Update Task Status] Error:", error);
    return NextResponse.json(
      { error: "Failed to update task status" },
      { status: 500 }
    );
  }
}
