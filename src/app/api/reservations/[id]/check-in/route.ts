/**
 * POST /api/reservations/[id]/check-in
 * Process guest check-in
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { prisma } from "@/database/schema";
import { getPropertyForUser } from "@/lib/tourism/property-access";
import { z } from "zod";
import { format } from "date-fns";

const checkInSchema = z.object({
  actualCheckInTime: z.string().optional(),
  notes: z.string().optional(),
  specialRequests: z.string().optional(),
  roomCondition: z.enum(["clean", "needs_cleaning", "minor_issues", "major_issues"]).optional(),
  amenitiesProvided: z.array(z.string()).optional(),
  paymentCollected: z.boolean().optional(),
  paymentAmount: z.number().optional(),
  paymentMethod: z.string().optional(),
});

export async function POST(
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
    const validationResult = checkInSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: "Validation failed", 
        details: validationResult.error.errors 
      }, { status: 400 });
    }

    const validatedData = validationResult.data;

    // Check if reservation exists
    const reservation = await prisma.reservation.findUnique({
      where: { id: params.id },
      include: {
        guest: true,
        room: true,
        property: true,
        payments: true,
      },
    });

    if (!reservation) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    // Validate property access
    const property = await getPropertyForUser(reservation.propertyId, userId);
    if (!property) {
      return NextResponse.json({ error: "Property not found or access denied" }, { status: 404 });
    }

    // Check if reservation is in correct status for check-in
    if (reservation.status !== "confirmed") {
      return NextResponse.json({ 
        error: "Reservation cannot be checked in. Current status: " + reservation.status 
      }, { status: 400 });
    }

    // Check if check-in date is today or in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkInDate = new Date(reservation.checkIn);
    checkInDate.setHours(0, 0, 0, 0);

    if (checkInDate > today) {
      return NextResponse.json({ 
        error: "Cannot check in before the scheduled date" 
      }, { status: 400 });
    }

    // Update reservation status
    const updatedReservation = await prisma.reservation.update({
      where: { id: params.id },
      data: {
        status: "checked_in",
        updatedAt: new Date(),
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
          },
        },
        property: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Create check-in record
    const checkInRecord = await prisma.checkIn.create({
      data: {
        reservationId: params.id,
        guestId: reservation.guestId,
        roomId: reservation.roomId,
        propertyId: reservation.propertyId,
        actualCheckInTime: validatedData.actualCheckInTime 
          ? new Date(`${format(new Date(), 'yyyy-MM-dd')}T${validatedData.actualCheckInTime}:00`)
          : new Date(),
        notes: validatedData.notes,
        specialRequests: validatedData.specialRequests,
        roomCondition: validatedData.roomCondition || "clean",
        amenitiesProvided: validatedData.amenitiesProvided || [],
        processedBy: userId,
      },
    });

    // Update room status to occupied
    // Note: This would require adding a status field to the Room model
    // For now, we'll update the updatedAt timestamp
    await prisma.room.update({
      where: { id: reservation.roomId },
      data: {
        updatedAt: new Date(),
      },
    });

    // Create housekeeping task for next guest if applicable
    const nextReservation = await prisma.reservation.findFirst({
      where: {
        roomId: reservation.roomId,
        checkIn: {
          gt: reservation.checkOut,
        },
        status: "confirmed",
      },
      orderBy: {
        checkIn: "asc",
      },
    });

    if (nextReservation) {
      await prisma.housekeepingTask.create({
        data: {
          roomId: reservation.roomId,
          propertyId: reservation.propertyId,
          taskType: "check_out_clean",
          priority: "medium",
          status: "pending",
          estimatedTime: 45, // 45 minutes for check-out clean
          scheduledDate: reservation.checkOut,
          guestName: reservation.guest.name,
          checkOutTime: format(new Date(reservation.checkOut), "HH:mm"),
          createdBy: userId,
        },
      });
    }

    // Process payment if provided
    if (validatedData.paymentCollected && validatedData.paymentAmount > 0) {
      await prisma.payment.create({
        data: {
          reservationId: params.id,
          guestId: reservation.guestId,
          propertyId: reservation.propertyId,
          type: "balance",
          amount: validatedData.paymentAmount,
          currency: "EUR",
          method: validatedData.paymentMethod || "cash",
          status: "completed",
          paidAt: new Date(),
          processedBy: userId,
        },
      });
    }

    // Send notification (placeholder for actual notification system)
    console.log(`Guest ${reservation.guest.name} checked in to room ${reservation.room.name}`);

    return NextResponse.json({
      success: true,
      data: {
        reservation: {
          id: updatedReservation.id,
          guestName: updatedReservation.guest.name,
          guestEmail: updatedReservation.guest.email,
          guestPhone: updatedReservation.guest.phone,
          roomName: updatedReservation.room.name,
          roomType: updatedReservation.room.type,
          checkIn: updatedReservation.checkIn.toISOString(),
          checkOut: updatedReservation.checkOut.toISOString(),
          status: updatedReservation.status,
          property: updatedReservation.property,
        },
        checkIn: {
          id: checkInRecord.id,
          actualCheckInTime: checkInRecord.actualCheckInTime.toISOString(),
          notes: checkInRecord.notes,
          roomCondition: checkInRecord.roomCondition,
          amenitiesProvided: checkInRecord.amenitiesProvided,
        },
      },
    });

  } catch (error) {
    console.error("Check-in error:", error);
    return NextResponse.json(
      { error: "Failed to process check-in" },
      { status: 500 }
    );
  }
}
