import { NextRequest, NextResponse } from "next/server";
import {
  createCheckout,
  getSubscription,
  cancelSubscription,
} from "@/api/billing";
import { authOptions } from "@/lib/auth-options";
import type { PlanId } from "@/stripe/plans";
import { getServerSession } from "next-auth";
import { getUserId } from "@/lib/auth-users";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = getUserId(session);
    const sub = await getSubscription(userId);
    return NextResponse.json(sub ?? { subscription: null });
  } catch (err) {
    console.error("Error in billing GET API:", err);
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

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = getUserId(session);
    const userEmail = session.user?.email;

    if (!userEmail) {
      return NextResponse.json({ error: "User email not found" }, { status: 400 });
    }

    if (body.action === "checkout") {
      const planId = body.planId ?? "pro";
      const origin =
        process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";

      const { url, sessionId } = await createCheckout(
        userId,
        userEmail,
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
    console.error("Error in billing POST API:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
