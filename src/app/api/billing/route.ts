/**
 * AgentFlow Pro - Billing API route
 */

import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import {
  createCheckout,
  getSubscription,
  cancelSubscription,
} from "@/api/billing";
import { authOptions } from "@/lib/auth-options";
import type { PlanId } from "@/stripe/plans";

function getUserId(request: NextRequest): string {
  return request.headers.get("x-user-id") ?? "mock-user-1";
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user
      ? (session.user as { userId?: string }).userId ?? session.user.email ?? null
      : null;
    const id = userId ?? getUserId(request);
    const sub = await getSubscription(id);
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
    const body = (await request.json().catch(() => ({}))) as {
      action?: "checkout" | "cancel";
      planId?: PlanId;
      immediately?: boolean;
    };
    const session = await getServerSession(authOptions);
    const userId = session?.user
      ? (session.user as { userId?: string }).userId ?? session.user.email ?? null
      : null;

    if (body.action === "checkout") {
      if (!userId || !session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const planId = body.planId ?? "pro";
      const baseUrl =
        request.headers.get("x-forwarded-host") ||
        request.headers.get("host") ||
        "localhost:3000";
      const protocol = request.headers.get("x-forwarded-proto") ?? "http";
      const origin = baseUrl.startsWith("http") ? baseUrl : `${protocol}://${baseUrl}`;
      const { url, sessionId } = await createCheckout(
        userId,
        session.user.email,
        planId,
        origin
      );
      return NextResponse.json({ url, sessionId });
    }

    if (body.action === "cancel") {
      const id = userId ?? getUserId(request);
      await cancelSubscription(id, body.immediately ?? false);
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
