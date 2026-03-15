/**
 * POST /api/reservations/[id]/check-out
 * Process guest check-out
 */

import { NextRequest, NextResponse } from "next/server";
import { logger } from '@/infrastructure/observability/logger';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { prisma } from "@/database/schema";
import { getPropertyForUser } from "@/lib/tourism/property-access";
import { z } from "zod";
import { format } from "date-fns";

const checkOutSchema = z.object({
  actualCheckOutTime: z.string().optional(),
  notes: z.string().optional(),
  roomCondition: z.enum(["clean", "minor_dirt", "needs_cleaning", "damaged"]).optional(),
  damages: z.array(z.string()).optional(),
  damageCost: z.number().optional(),
  additionalCharges: z.array(z.object({
    description: z.string(),
    amount: z.number(),
  })).optional(),
  finalPaymentCollected: z.boolean().optional(),
  finalPaymentAmount: z.number().optional(),
  finalPaymentMethod: z.string().optional(),
  guestSatisfaction: z.number().min(1).max(5).optional(),
  guestFeedback: z.string().optional(),
  followUpRequired: z.boolean().optional(),
  followUpNotes: z.string().optional(),
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
    const validationResult = checkOutSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: "Validation failed", 
        details: validationResult.error.issues 
      }, { status: 400 });
    }

    const validatedData = validationResult.data;

    // Check if reservation exists
    const reservation = await prisma.reservation.findUnique({
      where: { id: id },
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

    // Check if reservation is in correct status for check-out
    if (reservation.status !== "checked_in") {
      return NextResponse.json({ 
        error: "Reservation cannot be checked out. Current status: " + reservation.status 
      }, { status: 400 });
    }

    // Update reservation status
    const updatedReservation = await prisma.reservation.update({
      where: { id: id },
      data: {
        status: "checked_out",
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

    // Update room status based on condition
    let roomStatus = "available";
    if (validatedData.roomCondition === "needs_cleaning") {
      roomStatus = "cleaning";
    }

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

    // Process final payment if provided
    if (validatedData.finalPaymentCollected && (validatedData.finalPaymentAmount || 0) > 0) {
      await prisma.payment.create({
        data: {
          reservationId: id,
          type: "balance",
          amount: validatedData.finalPaymentAmount || 0,
          currency: "EUR",
          method: validatedData.finalPaymentMethod || "cash",
          paidAt: new Date(),
          notes: "Final payment at check-out",
        },
      });
    }

    // Process additional charges
    if (validatedData.additionalCharges && validatedData.additionalCharges.length > 0) {
      for (const charge of validatedData.additionalCharges) {
        await prisma.payment.create({
          data: {
            reservationId: id,
            type: "extra",
            amount: charge.amount,
            currency: "EUR",
            method: validatedData.finalPaymentMethod || "cash",
            notes: charge.description,
          },
        });
      }
    }

    // Process damage charges
    if (validatedData.damageCost && validatedData.damageCost > 0) {
      await prisma.payment.create({
        data: {
          reservationId: id,
          type: "damage",
          amount: validatedData.damageCost,
          currency: "EUR",
          method: validatedData.finalPaymentMethod || "cash",
          notes: `Damage charges: ${validatedData.damages?.join(", ")}`,
        },
      });
    }

    // Create follow-up task if required
    if (validatedData.followUpRequired) {
      await prisma.alertEvent.create({
        data: {
          propertyId: reservation.propertyId,
          type: "follow_up",
          severity: "low",
          title: `Follow-up required for ${reservation.guest?.name || "Unknown"}`,
          message: validatedData.followUpNotes || "Guest follow-up required after check-out",
          metadata: {
            reservationId: id,
            guestId: reservation.guestId,
            guestName: reservation.guest?.name || "Unknown",
            guestEmail: reservation.guest?.email || "",
          },
        },
      });
    }

    // Send notification (placeholder for actual notification system)
    logger.info(`Guest ${reservation.guest?.name || "Unknown"} checked out from room ${reservation.room?.name || "Unassigned"}`);

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
        roomStatus,
      },
    });

  } catch (error) {
    logger.error("Check-out error:", error);
    return NextResponse.json(
      { error: "Failed to process check-out" },
      { status: 500 }
    );
  }
}
