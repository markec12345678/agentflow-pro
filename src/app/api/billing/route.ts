/**
 * AgentFlow Pro - Billing API route
 */

import { NextRequest, NextResponse } from "next/server";
import {
  createCheckout,
  getSubscription,
  cancelSubscription,
} from "@/api/billing";
import type { PlanId } from "@/stripe/plans";

function getUserId(request: NextRequest): string {
  return request.headers.get("x-user-id") ?? "mock-user-1";
}

export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request);
    const sub = await getSubscription(userId);
    return NextResponse.json(sub ?? { subscription: null });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({})) as {
      action?: "checkout" | "cancel";
      planId?: PlanId;
      immediately?: boolean;
    };
    const userId = getUserId(request);

    if (body.action === "checkout") {
      const planId = body.planId ?? "starter";
      const baseUrl =
        request.headers.get("x-forwarded-host") ||
        request.headers.get("host") ||
        "http://localhost:3000";
      const protocol = request.headers.get("x-forwarded-proto") ?? "http";
      const origin = `${protocol}://${baseUrl}`;
      const { url, sessionId } = await createCheckout(
        userId,
        "user@example.com",
        planId,
        origin
      );
      return NextResponse.json({ url, sessionId });
    }

    if (body.action === "cancel") {
      await cancelSubscription(userId, body.immediately ?? false);
      return NextResponse.json({ canceled: true });
    }

    return NextResponse.json(
      { error: "Invalid action. Use checkout or cancel" },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
