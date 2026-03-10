/**
 * POST /api/tourism/payments/create-intent
 * Create payment intent for guest payment
 * Body: { reservationId, amount, type, customerId?, metadata? }
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { getPropertyForUser } from "@/lib/tourism/property-access";
import { prisma } from "@/database/schema";
import { stripeGuestPaymentService } from "@/lib/stripe-guest-payments";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { reservationId, amount, type, customerId, metadata } = body;

    if (!reservationId || !amount || !type) {
      return NextResponse.json(
        { error: "reservationId, amount, and type are required" },
        { status: 400 }
      );
    }

    // Verify property access
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { property: true },
    });

    if (!reservation) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    const property = await getPropertyForUser(reservation.propertyId, userId);
    if (!property) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Create payment intent
    const result = await stripeGuestPaymentService.createPaymentIntent({
      reservationId,
      amount,
      type,
      customerId,
      metadata,
    });

    return NextResponse.json({
      clientSecret: result.clientSecret,
      paymentIntentId: result.paymentIntentId,
      requiresAction: result.requiresAction,
    });
  } catch (error) {
    console.error("[Create Payment Intent] Error:", error);
    return NextResponse.json(
      { error: "Failed to create payment intent" },
      { status: 500 }
    );
  }
}
