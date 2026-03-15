/**
 * POST /api/tourism/payments/refund
 * Process refund
 * Body: { paymentId, amount?, reason? }
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { stripeGuestPaymentService, type RefundOptions } from "@/lib/stripe-guest-payments";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { paymentId, amount, reason } = body as RefundOptions;

    if (!paymentId) {
      return NextResponse.json({ error: "paymentId is required" }, { status: 400 });
    }

    const result = await stripeGuestPaymentService.processRefund({
      paymentId,
      amount,
      reason,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Refund failed" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      refundId: result.refundId,
      amount: result.amount,
    });
  } catch (error) {
    logger.error("[Refund Payment] Error:", error);
    return NextResponse.json(
      { error: "Failed to process refund" },
      { status: 500 }
    );
  }
}
