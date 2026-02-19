import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { createCheckout } from "@/api/billing";
import { authOptions } from "@/lib/auth-options";
import type { PlanId } from "@/stripe/plans";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user
      ? (session.user as { userId?: string }).userId ?? session.user.email ?? null
      : null;
    const userEmail = session?.user?.email ?? null;

    if (!userId || !userEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as { planId?: PlanId };
    const planId = body.planId ?? "pro";

    const baseUrl =
      request.headers.get("x-forwarded-host") ||
      request.headers.get("host") ||
      "localhost:3000";
    const protocol = request.headers.get("x-forwarded-proto") ?? "http";
    const origin = baseUrl.startsWith("http") ? baseUrl : `${protocol}://${baseUrl}`;

    const { url, sessionId } = await createCheckout(
      userId,
      userEmail,
      planId,
      origin
    );

    return NextResponse.json({ url, sessionId });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Checkout failed" },
      { status: 500 }
    );
  }
}
