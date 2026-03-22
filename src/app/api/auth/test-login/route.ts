/**
 * POST /api/auth/test-login
 * Development only: test getUser directly without NextAuth.
 * Body: { email, password }
 * Returns: { ok, message } - helps isolate if auth-users.getUser works.
 */
import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth-users";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ ok: false, message: "Disabled in production" }, { status: 404 });
  }
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!email || !password) {
      return NextResponse.json({ ok: false, message: "email and password required" }, { status: 400 });
    }
    const u = await getUser(email, password);
    return NextResponse.json({ ok: !!u, message: u ? `User ${u.id} found` : "Invalid credentials" });
  } catch (err) {
    console.error("[test-login] error:", err);
    return NextResponse.json(
      { ok: false, message: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
