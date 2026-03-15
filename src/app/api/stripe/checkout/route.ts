import { getServerSession } from "next-auth";
import { logger } from '@/infrastructure/observability/logger';
import { NextRequest, NextResponse } from "next/server";
import { createCheckout } from "@/api/billing";
import { authOptions } from "@/lib/auth-options";
import type { PlanId } from "@/stripe/plans";
import { getUserId } from "@/lib/auth-users";

const BILLING_NOT_READY =
  "Pro plans coming soon. We're setting up payments – check back later.";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = getUserId(session);
    const userEmail = session.user?.email;

    if (!userId || !userEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as { planId?: PlanId };
    const planId = body.planId ?? "pro";

    const origin =
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3002";

    const { url, sessionId } = await createCheckout(
      userId,
      userEmail,
      planId,
      origin
    );

    return NextResponse.json({ url, sessionId });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (
      msg.includes("not configured") ||
      msg.includes("No Stripe price configured")
    ) {
      return NextResponse.json(
        { error: BILLING_NOT_READY, code: "BILLING_NOT_CONFIGURED" },
        { status: 503 }
      );
    }
    logger.error("Error in Stripe checkout API:", err);
    return NextResponse.json(
      { error: msg || "Checkout failed" },
      { status: 500 }
    );
  }
}
