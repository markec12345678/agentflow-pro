/**
 * POST /api/reservations/[id]/check-in
 * Process guest check-in
 */

import { NextRequest, NextResponse } from "next/server";
import { logger } from '@/infrastructure/observability/logger';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { prisma } from "@/database/schema";
import { getPropertyForUser } from '@/core/domain/tourism/property-access';
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
        details: validationResult.error.issues 
      }, { status: 400 });
    }

    const validatedData = validationResult.data;

    // Check if reservation exists
    const reservation = await prisma.reservation.findUnique({
      where: { id },
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
      where: { id: id },
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

    // Update room status to occupied
    // Note: This would require adding a status field to the Room model
    // For now, we'll update the updatedAt timestamp
    if (reservation.roomId) {
      await prisma.room.update({
        where: { id: reservation.roomId },
        data: {
          updatedAt: new Date(),
        },
      });
    }

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

    // Process payment if provided
    if (validatedData.paymentCollected && (validatedData.paymentAmount || 0) > 0) {
      await prisma.payment.create({
        data: {
          reservationId: id,
          type: "balance",
          amount: validatedData.paymentAmount || 0,
          currency: "EUR",
          method: validatedData.paymentMethod || "cash",
          paidAt: new Date(),
          notes: validatedData.notes,
        },
      });
    }

    // Send notification (placeholder for actual notification system)
    logger.info(`Guest ${reservation.guest?.name || 'Unknown'} checked in to room ${reservation.room?.name || 'Unassigned'}`);

    return NextResponse.json({
      success: true,
      data: {
        reservation: {
          id: updatedReservation.id,
          guestName: updatedReservation.guest?.name || "Unknown",
          guestEmail: updatedReservation.guest?.email || "",
          guestPhone: updatedReservation.guest?.phone || "",
          roomName: updatedReservation.room?.name || "Unassigned",
          roomType: updatedReservation.room?.type || "Standard",
          checkIn: updatedReservation.checkIn.toISOString(),
          checkOut: updatedReservation.checkOut.toISOString(),
          status: updatedReservation.status,
          property: updatedReservation.property,
        },
      },
    });

  } catch (error) {
    logger.error("Check-in error:", error);
    return NextResponse.json(
      { error: "Failed to process check-in" },
      { status: 500 }
    );
  }
}
