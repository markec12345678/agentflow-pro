import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth-options";
import { getUserApiKeys } from "@/lib/user-keys";
import { prisma } from "@/database/schema";

function getUserId(session: unknown): string | null {
  const s = session as { user?: { userId?: string; email?: string | null } } | null;
  if (!s?.user) return null;
  return s.user.userId ?? (typeof s.user.email === "string" ? s.user.email : null);
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = getUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const keys = await getUserApiKeys(userId, { masked: true });
  const linkedin = !!(keys.linkedin?.trim());
  const twitter = !!(keys.twitter?.trim());
  const hubspot = !!(keys.hubspot?.trim());
  const google_search_console = !!(keys.google_search_console?.trim());
  const meta = !!(keys.meta?.trim());
  const booking_affiliate = !!(keys.booking_affiliate?.trim());

  return NextResponse.json({
    linkedin,
    twitter,
    hubspot,
    google_search_console,
    meta,
    booking_affiliate,
  });
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = getUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const provider = searchParams.get("provider");
  const allowed = ["linkedin", "twitter", "hubspot", "google_search_console", "meta", "booking_affiliate"];
  if (!provider || !allowed.includes(provider)) {
    return NextResponse.json(
      { error: `provider must be one of: ${allowed.join(", ")}` },
      { status: 400 }
    );
  }

  await prisma.userApiKey.deleteMany({
    where: { userId, provider },
  });

  return NextResponse.json({ ok: true });
}
