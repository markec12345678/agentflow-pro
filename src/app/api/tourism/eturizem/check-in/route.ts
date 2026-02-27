/**
 * GET /api/tourism/eturizem/check-in?token=
 * Public endpoint - returns reservation guest info for self check-in by token.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/database/schema";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token")?.trim();
  if (!token) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 });
  }

  const reservation = await prisma.reservation.findFirst({
    where: { checkInToken: token, status: "confirmed" },
    include: { guest: { select: { name: true } } },
  });

  if (!reservation) {
    return NextResponse.json(
      { error: "Rezervacija ni najdena ali je neveljavna" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    guestName: reservation.guest?.name ?? "Gost",
    reservationId: reservation.id,
  });
}
