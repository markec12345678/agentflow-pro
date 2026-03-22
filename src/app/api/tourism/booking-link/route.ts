import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth-options";
import { getAffiliateLinkForUser } from "@/lib/booking-affiliate";
import { setUserApiKey } from "@/lib/user-keys";

function getUserId(session: unknown): string | null {
  const s = session as { user?: { userId?: string; email?: string | null } } | null;
  if (!s?.user) return null;
  return s.user.userId ?? (typeof s.user.email === "string" ? s.user.email : null);
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const destId = searchParams.get("destId") ?? searchParams.get("dest_id");
    const destType = searchParams.get("destType") ?? searchParams.get("dest_type") ?? "city";
    const checkin = searchParams.get("checkin");
    const checkout = searchParams.get("checkout");
    const adults = searchParams.get("adults");
    const children = searchParams.get("children");
    const rooms = searchParams.get("rooms");

    const link = await getAffiliateLinkForUser(userId, {
      destType,
      destId: destId ?? undefined,
      checkin: checkin ?? undefined,
      checkout: checkout ?? undefined,
      groupAdults: adults ? parseInt(adults, 10) : undefined,
      groupChildren: children ? parseInt(children, 10) : undefined,
      noRooms: rooms ? parseInt(rooms, 10) : undefined,
      sbTravelPurpose: "leisure",
    });

    return NextResponse.json({ link });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to build link";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { aid?: string };
    const aid = body.aid?.trim();
    if (!aid) {
      return NextResponse.json({ error: "aid required" }, { status: 400 });
    }

    await setUserApiKey(userId, "booking_affiliate", aid);
    return NextResponse.json({ ok: true, message: "Booking.com affiliate ID shranjen" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to save";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
