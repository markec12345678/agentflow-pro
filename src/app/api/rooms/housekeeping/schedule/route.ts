/**
 * GET /api/rooms/housekeeping/schedule
 * POST /api/rooms/housekeeping/schedule
 * Housekeeping schedule management
 */

import { NextRequest, NextResponse } from "next/server";
import { logger } from '@/infrastructure/observability/logger';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { prisma } from "@/database/schema";
import { getPropertyForUser } from "@/lib/tourism/property-access";
import { z } from "zod";
import { startOfDay, endOfDay, format } from "date-fns";

const createHousekeepingTaskSchema = z.object({
  roomId: z.string().min(1, "Room ID is required"),
  taskType: z.enum(["check_out_clean", "stayover_clean", "deep_clean", "maintenance"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  estimatedTime: z.number().positive("Estimated time must be positive"),
  scheduledDate: z.string().datetime("Invalid date"),
  notes: z.string().optional(),
  assignedTo: z.string().optional(),
});

// GET - Fetch housekeeping schedule
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyIdParam = searchParams.get("propertyId");
    const dateParam = searchParams.get("date");

    if (!propertyIdParam?.trim()) {
      return NextResponse.json({ error: "Property ID is required" }, { status: 400 });
    }

    // Validate property access
    const property = await getPropertyForUser(propertyIdParam, userId);
    if (!property) {
      return NextResponse.json({ error: "Property not found or access denied" }, { status: 404 });
    }

    // Parse date (default to today)
    const targetDate = dateParam ? new Date(dateParam) : new Date();
    const startOfDayTarget = startOfDay(targetDate);
    const endOfDayTarget = endOfDay(targetDate);

    // Fetch housekeeping tasks for the date
    const tasks = await prisma.housekeepingTask.findMany({
      where: {
        propertyId: propertyIdParam,
        scheduledDate: {
          gte: startOfDayTarget,
          lte: endOfDayTarget,
        },
      },
      include: {
        room: {
          select: {
            id: true,
            name: true,
            type: true,
            capacity: true,
          },
        },
      },
      orderBy: {
        priority: "desc", // High priority first
      },
    });

    // Fetch staff for the property
    const staff = await prisma.user.findMany({
      where: {
        properties: {
          some: {
            id: propertyIdParam,
          },
        },
        role: {
          in: ["housekeeping", "maintenance"],
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    // Calculate current tasks per staff member
    const staffWithTasks = staff.map(staffMember => ({
      ...staffMember,
      currentTasks: tasks.filter(task => task.assignedTo === staffMember.name).length,
      isAvailable: tasks.filter(task => task.assignedTo === staffMember.name).length < 5, // Max 5 tasks per staff
    }));

    // Calculate statistics
    const taskStats = {
      total: tasks.length,
      pending: tasks.filter(t => t.status === "pending").length,
      inProgress: tasks.filter(t => t.status === "in_progress").length,
      completed: tasks.filter(t => t.status === "completed").length,
      delayed: tasks.filter(t => t.status === "delayed").length,
    };

    const totalEstimatedTime = tasks.reduce((sum, task) => sum + task.estimatedTime, 0);
    const totalActualTime = tasks.reduce((sum, task) => sum + (task.actualTime || 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        tasks: tasks.map(task => ({
          id: task.id,
          roomId: task.roomId,
          roomName: task.room?.name || "Unknown",
          roomType: task.room?.type || "Standard",
          taskType: task.taskType,
          priority: task.priority,
          status: task.status,
          assignedTo: task.assignedTo,
          estimatedTime: task.estimatedTime,
          actualTime: task.actualTime,
          scheduledDate: task.scheduledDate.toISOString(),
          completedAt: task.completedAt?.toISOString(),
          notes: task.notes,
          guestName: task.guestName,
          checkOutTime: task.checkOutTime,
        })),
        staff: staffWithTasks,
        stats: taskStats,
        summary: {
          totalEstimatedTime,
          totalActualTime,
          efficiency: totalEstimatedTime > 0 ? Math.round((totalEstimatedTime / totalActualTime) * 100) : 100,
        },
      },
    });

  } catch (error) {
    logger.error("Housekeeping schedule fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch housekeeping schedule" },
      { status: 500 }
    );
  }
}

// POST - Create new housekeeping task
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate input
    const validationResult = createHousekeepingTaskSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: "Validation failed", 
        details: validationResult.error.issues 
      }, { status: 400 });
    }

    const validatedData = validationResult.data;

    // Check if room exists and user has access
    const room = await prisma.room.findUnique({
      where: { id: validatedData.roomId },
      include: { property: true },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Validate property access
    const property = await getPropertyForUser(room.propertyId, userId);
    if (!property) {
      return NextResponse.json({ error: "Property not found or access denied" }, { status: 404 });
    }

    // Create housekeeping task
    const task = await prisma.housekeepingTask.create({
      data: {
        roomId: validatedData.roomId,
        propertyId: room.propertyId,
        taskType: validatedData.taskType,
        priority: validatedData.priority,
        status: "pending",
        estimatedTime: validatedData.estimatedTime,
        scheduledDate: new Date(validatedData.scheduledDate),
        notes: validatedData.notes,
        assignedTo: validatedData.assignedTo,
        createdBy: userId,
        createdAt: new Date(),
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
    });

    return NextResponse.json({
      success: true,
      data: {
        task: {
          id: task.id,
          roomId: task.roomId,
          roomName: task.room?.name || "Unknown",
          roomType: task.room?.type || "Standard",
          taskType: task.taskType,
          priority: task.priority,
          status: task.status,
          assignedTo: task.assignedTo,
          estimatedTime: task.estimatedTime,
          scheduledDate: task.scheduledDate.toISOString(),
          notes: task.notes,
        },
      },
    });

  } catch (error) {
    logger.error("Housekeeping task creation error:", error);
    return NextResponse.json(
      { error: "Failed to create housekeeping task" },
      { status: 500 }
    );
  }
}
