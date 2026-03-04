/**
 * POST /api/reservations/[id]/payment
 * Add payment to reservation
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { prisma } from "@/database/schema";
import { getPropertyForUser } from "@/lib/tourism/property-access";
import { z } from "zod";

const paymentSchema = z.object({
  type: z.enum(["deposit", "balance", "tourist_tax", "extra", "damage"]),
  amount: z.number().positive("Amount must be positive"),
  method: z.enum(["cash", "card", "transfer", "online", "other"]),
  notes: z.string().optional(),
  dueDate: z.string().datetime().optional(),
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
    const validationResult = paymentSchema.safeParse(body);
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
        payments: {
          orderBy: {
            createdAt: "desc",
          },
        },
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

    // Calculate total payments for this reservation
    const totalPaid = reservation.payments
      .filter(p => p.status === "completed")
      .reduce((sum, p) => sum + p.amount, 0);
    
    const newTotal = totalPaid + validatedData.amount;
    const maxAllowed = reservation.totalPrice + 1000; // Allow some flexibility for extra charges

    if (newTotal > maxAllowed) {
      return NextResponse.json({ 
        error: "Payment amount exceeds reasonable limit" 
      }, { status: 400 });
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        reservationId: params.id,
        guestId: reservation.guestId,
        propertyId: reservation.propertyId,
        type: validatedData.type,
        amount: validatedData.amount,
        currency: "EUR",
        method: validatedData.method,
        status: "completed", // Assume payment is completed when added
        paidAt: new Date(),
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        notes: validatedData.notes,
        processedBy: userId,
      },
      include: {
        reservation: {
          select: {
            id: true,
            totalPrice: true,
            status: true,
          },
        },
      },
    });

    // Update reservation status if this is the final payment
    const remainingBalance = reservation.totalPrice - newTotal;
    if (remainingBalance <= 0 && reservation.status === "confirmed") {
      await prisma.reservation.update({
        where: { id: params.id },
        data: {
          status: "paid",
          updatedAt: new Date(),
        },
      });
    }

    // Send notification (placeholder for actual notification system)
    console.log(`Payment of €${validatedData.amount} added to reservation ${params.id}`);

    return NextResponse.json({
      success: true,
      data: {
        payment: {
          id: payment.id,
          type: payment.type,
          amount: payment.amount,
          currency: payment.currency,
          method: payment.method,
          status: payment.status,
          paidAt: payment.paidAt.toISOString(),
          notes: payment.notes,
        },
        reservation: {
          id: payment.reservation.id,
          totalPrice: payment.reservation.totalPrice,
          status: payment.reservation.status,
        },
        paymentSummary: {
          totalPaid: newTotal,
          remainingBalance: Math.max(0, remainingBalance),
          paymentCount: reservation.payments.length + 1,
        },
      },
    });

  } catch (error) {
    console.error("Payment creation error:", error);
    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 }
    );
  }
}
