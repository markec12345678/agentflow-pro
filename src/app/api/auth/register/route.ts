import { NextResponse } from "next/server";
import { registerUser } from "@/lib/auth-users";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    let body: { email?: string; password?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const { email, password } = body;
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }
    const user = await registerUser(email, password);
    if (!user) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }
    return NextResponse.json({ ok: true, id: user.id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Registration failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
