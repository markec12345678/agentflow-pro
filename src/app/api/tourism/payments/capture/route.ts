/**
 * POST /api/tourism/payments/capture
 * Capture pre-authorized payment
 * Body: { paymentId }
 * 
 * POST /api/tourism/payments/refund
 * Process refund
 * Body: { paymentId, amount?, reason? }
 * 
 * POST /api/tourism/payments/cancel
 * Cancel payment intent (release pre-auth)
 * Body: { paymentId }
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { stripeGuestPaymentService } from "@/lib/stripe-guest-payments";

// Capture payment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { paymentId } = body;

    if (!paymentId) {
      return NextResponse.json({ error: "paymentId is required" }, { status: 400 });
    }

    const result = await stripeGuestPaymentService.capturePayment(paymentId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Capture failed" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      amount: result.amount,
    });
  } catch (error) {
    console.error("[Capture Payment] Error:", error);
    return NextResponse.json(
      { error: "Failed to capture payment" },
      { status: 500 }
    );
  }
}
