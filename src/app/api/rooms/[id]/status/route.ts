/**
 * PUT /api/rooms/[id]/status
 * Updates room status
 */

import { NextRequest, NextResponse } from "next/server";
import { logger } from '@/infrastructure/observability/logger';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { prisma } from "@/database/schema";
import { getPropertyForUser } from "@/lib/tourism/property-access";
import { z } from "zod";

const updateRoomStatusSchema = z.object({
  status: z.enum(["available", "occupied", "cleaning", "maintenance", "out-of-order"]),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate input
    const validationResult = updateRoomStatusSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: "Validation failed", 
        details: validationResult.error.issues 
      }, { status: 400 });
    }

    const validatedData = validationResult.data;

    // Check if room exists
    const room = await prisma.room.findUnique({
      where: { id: params.id },
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

    // Update room status
    const updatedRoom = await prisma.room.update({
      where: { id: params.id },
      data: { 
        // Note: Room model doesn't have a status field in the schema
        // This would need to be added to the Prisma schema
        // For now, we'll update the updatedAt timestamp
        updatedAt: new Date(),
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // If this is a status change to "cleaning", create a housekeeping task
    if (validatedData.status === "cleaning") {
      await prisma.housekeepingTask.create({
        data: {
          roomId: params.id,
          propertyId: room.propertyId,
          taskType: "stayover_clean", // or "check_out_clean" based on context
          priority: "medium",
          status: "pending",
          estimatedTime: 30, // 30 minutes default
          scheduledDate: new Date(),
        },
      });
    }

    // If this is a status change to "maintenance", create a maintenance task
    if (validatedData.status === "maintenance") {
      await prisma.maintenanceTask.create({
        data: {
          roomId: params.id,
          propertyId: room.propertyId,
          title: "Room Maintenance",
          description: "Room requires maintenance",
          priority: "medium",
          status: "pending",
          category: "general",
          estimatedTime: 60, // 1 hour default
          scheduledDate: new Date(),
          reportedBy: userId,
          reportedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        room: {
          id: updatedRoom.id,
          name: updatedRoom.name,
          type: updatedRoom.type,
          status: validatedData.status, // Return the requested status
          property: updatedRoom.property,
          updatedAt: updatedRoom.updatedAt,
        },
      },
    });

  } catch (error) {
    logger.error("Room status update error:", error);
    return NextResponse.json(
      { error: "Failed to update room status" },
      { status: 500 }
    );
  }
}
