/**
 * GET /api/tourism/booking/availability
 * Check availability for direct booking
 * Query: propertyId, checkIn, checkOut, guests
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/database/schema";
import { parseISO, startOfDay, endOfDay } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");
    const checkIn = searchParams.get("checkIn");
    const checkOut = searchParams.get("checkOut");
    const guests = searchParams.get("guests");

    if (!propertyId || !checkIn || !checkOut) {
      return NextResponse.json(
        { error: "propertyId, checkIn, and checkOut are required" },
        { status: 400 }
      );
    }

    const checkInDate = startOfDay(parseISO(checkIn));
    const checkOutDate = startOfDay(parseISO(checkOut));

    // Get all rooms for property
    const rooms = await prisma.room.findMany({
      where: { propertyId },
    });

    // Get blocked dates
    const blockedDates = await prisma.blockedDate.findMany({
      where: {
        propertyId,
        date: {
          gte: checkInDate,
          lte: checkOutDate,
        },
        isBlocked: true,
      },
    });

    // Get existing reservations
    const existingReservations = await prisma.reservation.findMany({
      where: {
        propertyId,
        status: { in: ["confirmed", "checked_in"] },
        OR: [
          {
            checkIn: { lte: checkOutDate },
            checkOut: { gte: checkInDate },
          },
        ],
      },
      include: { room: true },
    });

    // Calculate available rooms
    const availableRooms = rooms.filter((room) => {
      // Check if room is blocked
      const isBlocked = blockedDates.some(
        (blocked) =>
          blocked.roomId === room.id || blocked.roomId === null
      );
      if (isBlocked) return false;

      // Check if room is already booked
      const isBooked = existingReservations.some(
        (res) => res.roomId === room.id
      );
      if (isBooked) return false;

      // Check capacity
      if (guests && room.capacity && parseInt(guests) > room.capacity) {
        return false;
      }

      return true;
    });

    return NextResponse.json({
      available: availableRooms.length > 0,
      count: availableRooms.length,
      rooms: availableRooms.map((room) => ({
        id: room.id,
        name: room.name,
        type: room.type,
        capacity: room.capacity,
        basePrice: room.basePrice,
        amenities: room.amenities,
      })),
    });
  } catch (error) {
    console.error("[Check Availability] Error:", error);
    return NextResponse.json(
      { error: "Failed to check availability" },
      { status: 500 }
    );
  }
}
