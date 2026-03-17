/**
 * POST /api/receptor/reservations/quick
 * Creates a quick reservation for receptor dashboard
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { prisma } from "@/database/schema";
import { getPropertyForUser } from '@/lib/tourism/property-access';
import { createPropertySchema } from "@/lib/validations/property-schema";
import { z } from "zod";

const quickReservationSchema = z.object({
  propertyId: z.string().min(1, "Property ID is required"),
  roomId: z.string().min(1, "Room ID is required"),
  guestName: z.string().min(2, "Guest name must be at least 2 characters"),
  guestEmail: z.string().email("Invalid email address"),
  guestPhone: z.string().min(5, "Phone number must be at least 5 characters"),
  checkIn: z.string().datetime("Invalid check-in date"),
  checkOut: z.string().datetime("Invalid check-out date"),
  guests: z.number().int().positive("Number of guests must be positive"),
  totalPrice: z.number().positive("Total price must be positive"),
  notes: z.string().optional(),
  channel: z.enum(["direct", "booking.com", "airbnb", "expedia", "phone", "email"]).default("direct"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate input
    const validationResult = quickReservationSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: "Validation failed", 
        details: validationResult.error.issues 
      }, { status: 400 });
    }

    const validatedData = validationResult.data;

    // Validate property access
    const property = await getPropertyForUser(validatedData.propertyId, userId);
    if (!property) {
      return NextResponse.json({ error: "Property not found or access denied" }, { status: 404 });
    }

    // Validate room exists and is available
    const room = await prisma.room.findFirst({
      where: {
        id: validatedData.roomId,
        propertyId: validatedData.propertyId,
      },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Check room availability for the dates
    const conflictingReservation = await prisma.reservation.findFirst({
      where: {
        roomId: validatedData.roomId,
        status: "confirmed",
        OR: [
          {
            checkIn: {
              lt: validatedData.checkOut,
            },
            checkOut: {
              gt: validatedData.checkIn,
            },
          },
        ],
      },
    });

    if (conflictingReservation) {
      return NextResponse.json({ 
        error: "Room is not available for the selected dates" 
      }, { status: 409 });
    }

    // Create or find guest
    let guest = await prisma.guest.findFirst({
      where: {
        email: validatedData.guestEmail,
      },
    });

    if (!guest) {
      guest = await prisma.guest.create({
        data: {
          name: validatedData.guestName,
          email: validatedData.guestEmail,
          phone: validatedData.guestPhone,
          propertyId: validatedData.propertyId,
        },
      });
    } else {
      // Update existing guest info if needed
      guest = await prisma.guest.update({
        where: { id: guest.id },
        data: {
          name: validatedData.guestName,
          phone: validatedData.guestPhone,
        },
      });
    }

    // Create reservation
    const reservation = await prisma.reservation.create({
      data: {
        propertyId: validatedData.propertyId,
        roomId: validatedData.roomId,
        guestId: guest.id,
        checkIn: new Date(validatedData.checkIn),
        checkOut: new Date(validatedData.checkOut),
        totalPrice: validatedData.totalPrice,
        guests: validatedData.guests,
        channel: validatedData.channel,
        notes: validatedData.notes,
        status: "confirmed",
      },
      include: {
        guest: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        room: {
          select: {
            id: true,
            name: true,
            type: true,
            basePrice: true,
          },
        },
        property: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
      },
    });

    // Update room status if check-in is today
    const now = new Date();
    const checkInDate = new Date(validatedData.checkIn);
    const isToday = checkInDate.toDateString() === now.toDateString();

    if (isToday) {
      // In a real implementation, you might want to set room status to "occupied"
      // or create a housekeeping task
      console.log(`Room ${room.name} should be prepared for check-in today`);
    }

    return NextResponse.json({
      success: true,
      data: {
        reservation: {
          id: reservation.id,
          guestName: reservation.guest?.name || "Unknown",
          guestEmail: reservation.guest?.email || "",
          guestPhone: reservation.guest?.phone || "",
          roomNumber: reservation.room?.name || "Unassigned",
          roomType: reservation.room?.type || "Standard",
          checkIn: reservation.checkIn.toISOString(),
          checkOut: reservation.checkOut.toISOString(),
          totalPrice: reservation.totalPrice,
          channel: reservation.channel,
          status: reservation.status,
          notes: reservation.notes,
          propertyName: reservation.property.name,
          propertyLocation: reservation.property.location,
        },
      },
    });

  } catch (error) {
    console.error("Quick reservation error:", error);
    return NextResponse.json(
      { error: "Failed to create reservation" },
      { status: 500 }
    );
  }
}
