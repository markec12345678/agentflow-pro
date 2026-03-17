/**
 * GET /api/receptor/rooms/status
 * Returns real-time room status for receptor dashboard
 * Query: propertyId (required)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { prisma } from "@/database/schema";
import { getPropertyForUser } from '@/lib/tourism/property-access';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyIdParam = searchParams.get("propertyId");

    if (!propertyIdParam?.trim()) {
      return NextResponse.json({ error: "Property ID is required" }, { status: 400 });
    }

    // Validate property access
    const property = await getPropertyForUser(propertyIdParam, userId);
    if (!property) {
      return NextResponse.json({ error: "Property not found or access denied" }, { status: 404 });
    }

    // Get current date for determining current guests
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    // Fetch all rooms with current and next reservations
    const rooms = await prisma.room.findMany({
      where: {
        propertyId: propertyIdParam,
      },
      include: {
        reservations: {
          where: {
            OR: [
              {
                checkIn: {
                  lte: endOfToday,
                },
                checkOut: {
                  gt: startOfToday,
                },
                status: "confirmed",
              },
              {
                checkIn: {
                  gte: startOfToday,
                },
                status: "confirmed",
              },
            ],
          },
          include: {
            guest: {
              select: {
                id: true,
                name: true,
                email: true,
              },
          },
          },
          orderBy: {
            checkIn: "asc",
          },
        },
        blockedDates: {
          where: {
            date: {
              gte: startOfToday,
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    // Process room status
    const processedRooms = rooms.map(room => {
      const currentReservation = room.reservations.find(res => 
        res.checkIn <= now && res.checkOut > now && res.status === "confirmed"
      );
      
      const nextReservation = room.reservations.find(res => 
        res.checkIn > now && res.status === "confirmed"
      );

      const isBlockedToday = room.blockedDates.some(blocked => 
        blocked.date >= startOfToday && blocked.date < endOfToday
      );

      let status: "available" | "occupied" | "cleaning" | "maintenance" | "out-of-order" = "available";
      
      if (currentReservation) {
        status = "occupied";
      } else if (isBlockedToday) {
        status = "out-of-order";
      } else if (nextReservation && nextReservation.checkIn <= endOfToday) {
        status = "cleaning";
      }

      return {
        id: room.id,
        name: room.name,
        type: room.type,
        capacity: room.capacity,
        beds: room.beds,
        basePrice: room.basePrice,
        status,
        currentGuest: currentReservation ? {
          name: currentReservation.guest?.name || "Unknown",
          checkIn: currentReservation.checkIn.toISOString(),
          checkOut: currentReservation.checkOut.toISOString(),
          channel: currentReservation.channel || "direct",
        } : undefined,
        nextGuest: nextReservation ? {
          name: nextReservation.guest?.name || "Unknown",
          checkIn: nextReservation.checkIn.toISOString(),
          checkOut: nextReservation.checkOut.toISOString(),
          channel: nextReservation.channel || "direct",
        } : undefined,
        amenities: room.amenities,
        photos: room.photos,
        lastCleaned: currentReservation ? null : new Date().toISOString(), // Mock last cleaned time
        notes: room.blockedDates.find(blocked => blocked.date >= startOfToday)?.reason,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        rooms: processedRooms,
        totalRooms: rooms.length,
        availableRooms: processedRooms.filter(r => r.status === "available").length,
        occupiedRooms: processedRooms.filter(r => r.status === "occupied").length,
        cleaningRooms: processedRooms.filter(r => r.status === "cleaning").length,
        outOfOrderRooms: processedRooms.filter(r => r.status === "out-of-order").length,
      },
    });

  } catch (error) {
    console.error("Room status error:", error);
    return NextResponse.json(
      { error: "Failed to fetch room status" },
      { status: 500 }
    );
  }
}
