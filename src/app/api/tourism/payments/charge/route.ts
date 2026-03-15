/**
 * POST /api/tourism/payments/charge
 * Charge guest or pre-authorize card
 * Body: { reservationId, paymentMethodId, amount, customerId?, capture? }
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
    const { reservationId, paymentMethodId, amount, customerId, capture = true } = body;

    if (!reservationId || !paymentMethodId || !amount) {
      return NextResponse.json(
        { error: "reservationId, paymentMethodId, and amount are required" },
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

    // Charge guest
    const result = await stripeGuestPaymentService.chargeGuest({
      paymentMethodId,
      reservationId,
      amount,
      customerId,
      capture,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Payment failed" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      paymentId: result.paymentId,
      chargeId: result.chargeId,
      captured: capture,
    });
  } catch (error) {
    logger.error("[Charge Guest] Error:", error);
    return NextResponse.json(
      { error: "Failed to process charge" },
      { status: 500 }
    );
  }
}
