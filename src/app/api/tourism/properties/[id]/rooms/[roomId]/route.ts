/**
 * Individual Room API for a property
 * GET, PATCH, DELETE for a specific room
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { getPropertyForUser } from "@/lib/tourism/property-access";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; roomId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id: propertyId, roomId } = resolvedParams;
    const property = await getPropertyForUser(propertyId, userId);
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    const room = await prisma.room.findFirst({
      where: { 
        id: roomId,
        propertyId 
      },
      include: {
        blockedDates: true
      }
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    return NextResponse.json(room);
  } catch (error) {
    console.error("Room API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; roomId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id: propertyId, roomId } = resolvedParams;
    const property = await getPropertyForUser(propertyId, userId);
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    const existingRoom = await prisma.room.findFirst({
      where: { 
        id: roomId,
        propertyId 
      }
    });

    if (!existingRoom) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, type, capacity, beds, basePrice, amenities, description } = body;

    const data: any = {};
    if (name !== undefined) data.name = name?.trim() || existingRoom.name;
    if (type !== undefined) data.type = type?.trim() || existingRoom.type;
    if (capacity !== undefined) data.capacity = typeof capacity === "number" ? capacity : existingRoom.capacity;
    if (beds !== undefined) data.beds = typeof beds === "number" ? beds : existingRoom.beds;
    if (basePrice !== undefined) data.basePrice = typeof basePrice === "number" ? basePrice : existingRoom.basePrice;
    if (amenities !== undefined) data.amenities = Array.isArray(amenities) ? amenities : existingRoom.amenities;
    if (description !== undefined) data.description = description?.trim() || existingRoom.description;

    const room = await prisma.room.update({
      where: { id: roomId },
      data,
    });

    return NextResponse.json(room);
  } catch (error) {
    console.error("Update room API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; roomId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id: propertyId, roomId } = resolvedParams;
    const property = await getPropertyForUser(propertyId, userId);
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    const existingRoom = await prisma.room.findFirst({
      where: { 
        id: roomId,
        propertyId 
      }
    });

    if (!existingRoom) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Check if room has any reservations
    const reservationCount = await prisma.reservation.count({
      where: { roomId }
    });

    if (reservationCount > 0) {
      return NextResponse.json({ 
        error: "Cannot delete room with existing reservations" 
      }, { status: 400 });
    }

    await prisma.room.delete({
      where: { id: roomId }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete room API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
