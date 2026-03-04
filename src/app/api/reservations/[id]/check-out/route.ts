/**
 * POST /api/reservations/[id]/check-out
 * Process guest check-out
 */

import { NextRequest, NextResponse } from "next/server";
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

    // Check if reservation is in correct status for check-out
    if (reservation.status !== "checked_in") {
      return NextResponse.json({ 
        error: "Reservation cannot be checked out. Current status: " + reservation.status 
      }, { status: 400 });
    }

    // Update reservation status
    const updatedReservation = await prisma.reservation.update({
      where: { id: params.id },
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

    // Create check-out record
    const checkOutRecord = await prisma.checkOut.create({
      data: {
        reservationId: params.id,
        guestId: reservation.guestId,
        roomId: reservation.roomId,
        propertyId: reservation.propertyId,
        actualCheckOutTime: validatedData.actualCheckOutTime 
          ? new Date(`${format(new Date(), 'yyyy-MM-dd')}T${validatedData.actualCheckOutTime}:00`)
          : new Date(),
        notes: validatedData.notes,
        roomCondition: validatedData.roomCondition || "clean",
        damages: validatedData.damages || [],
        damageCost: validatedData.damageCost || 0,
        additionalCharges: validatedData.additionalCharges || [],
        guestSatisfaction: validatedData.guestSatisfaction || 5,
        guestFeedback: validatedData.guestFeedback,
        followUpRequired: validatedData.followUpRequired || false,
        followUpNotes: validatedData.followUpNotes,
        processedBy: userId,
      },
    });

    // Update room status based on condition
    let roomStatus = "available";
    if (validatedData.roomCondition === "damaged") {
      roomStatus = "maintenance";
    } else if (validatedData.roomCondition === "needs_cleaning") {
      roomStatus = "cleaning";
    }

    // Note: This would require adding a status field to the Room model
    // For now, we'll update the updatedAt timestamp
    await prisma.room.update({
      where: { id: reservation.roomId },
      data: {
        updatedAt: new Date(),
      },
    });

    // Create housekeeping task if room needs cleaning
    if (validatedData.roomCondition === "needs_cleaning" || validatedData.roomCondition === "minor_dirt") {
      await prisma.housekeepingTask.create({
        data: {
          roomId: reservation.roomId,
          propertyId: reservation.propertyId,
          taskType: "check_out_clean",
          priority: validatedData.roomCondition === "needs_cleaning" ? "high" : "medium",
          status: "pending",
          estimatedTime: validatedData.roomCondition === "needs_cleaning" ? 60 : 30,
          scheduledDate: new Date(),
          guestName: reservation.guest.name,
          notes: `Check-out cleaning required. Condition: ${validatedData.roomCondition}`,
          createdBy: userId,
        },
      });
    }

    // Create maintenance task if there are damages
    if (validatedData.damages && validatedData.damages.length > 0) {
      await prisma.maintenanceTask.create({
        data: {
          roomId: reservation.roomId,
          propertyId: reservation.propertyId,
          title: "Damages from check-out",
          description: `Damages reported: ${validatedData.damages.join(", ")}`,
          priority: validatedData.damageCost && validatedData.damageCost > 100 ? "high" : "medium",
          status: "pending",
          category: "general",
          estimatedCost: validatedData.damageCost,
          estimatedTime: 120, // 2 hours default for damage assessment
          scheduledDate: new Date(),
          reportedBy: userId,
          reportedAt: new Date(),
        },
      });
    }

    // Process final payment if provided
    if (validatedData.finalPaymentCollected && validatedData.finalPaymentAmount > 0) {
      await prisma.payment.create({
        data: {
          reservationId: params.id,
          guestId: reservation.guestId,
          propertyId: reservation.propertyId,
          type: "balance",
          amount: validatedData.finalPaymentAmount,
          currency: "EUR",
          method: validatedData.finalPaymentMethod || "cash",
          status: "completed",
          paidAt: new Date(),
          processedBy: userId,
          notes: "Final payment at check-out",
        },
      });
    }

    // Process additional charges
    if (validatedData.additionalCharges && validatedData.additionalCharges.length > 0) {
      for (const charge of validatedData.additionalCharges) {
        await prisma.payment.create({
          data: {
            reservationId: params.id,
            guestId: reservation.guestId,
            propertyId: reservation.propertyId,
            type: "extra",
            amount: charge.amount,
            currency: "EUR",
            method: validatedData.finalPaymentMethod || "cash",
            status: validatedData.finalPaymentCollected ? "completed" : "pending",
            paidAt: validatedData.finalPaymentCollected ? new Date() : undefined,
            processedBy: userId,
            notes: charge.description,
          },
        });
      }
    }

    // Process damage charges
    if (validatedData.damageCost && validatedData.damageCost > 0) {
      await prisma.payment.create({
        data: {
          reservationId: params.id,
          guestId: reservation.guestId,
          propertyId: reservation.propertyId,
          type: "damage",
          amount: validatedData.damageCost,
          currency: "EUR",
          method: validatedData.finalPaymentMethod || "cash",
          status: validatedData.finalPaymentCollected ? "completed" : "pending",
          paidAt: validatedData.finalPaymentCollected ? new Date() : undefined,
          processedBy: userId,
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
          status: "open",
          title: `Follow-up required for ${reservation.guest.name}`,
          description: validatedData.followUpNotes || "Guest follow-up required after check-out",
          metadata: {
            reservationId: params.id,
            guestId: reservation.guestId,
            guestName: reservation.guest.name,
            guestEmail: reservation.guest.email,
          },
          createdBy: userId,
        },
      });
    }

    // Send notification (placeholder for actual notification system)
    console.log(`Guest ${reservation.guest.name} checked out from room ${reservation.room.name}`);

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
        checkOut: {
          id: checkOutRecord.id,
          actualCheckOutTime: checkOutRecord.actualCheckOutTime.toISOString(),
          notes: checkOutRecord.notes,
          roomCondition: checkOutRecord.roomCondition,
          damages: checkOutRecord.damages,
          damageCost: checkOutRecord.damageCost,
          additionalCharges: checkOutRecord.additionalCharges,
          guestSatisfaction: checkOutRecord.guestSatisfaction,
          guestFeedback: checkOutRecord.guestFeedback,
          followUpRequired: checkOutRecord.followUpRequired,
        },
        roomStatus,
      },
    });

  } catch (error) {
    console.error("Check-out error:", error);
    return NextResponse.json(
      { error: "Failed to process check-out" },
      { status: 500 }
    );
  }
}
