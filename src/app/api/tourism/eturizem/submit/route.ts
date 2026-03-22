/**
 * POST /api/tourism/eturizem/submit
 * Submit guest to AJPES eTurizem. Body: { reservationId }
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/database/schema";
import { getPropertyForUser } from "@/lib/tourism/property-access";
import { getUserId } from "@/lib/auth-users";
import { decrypt } from "@/lib/crypto/encrypt";
import {
  buildGuestBookXml,
  submitToAjpes,
  type EturizemRow,
} from "@/lib/tourism/eturizem-client";
import { withSentryLogging, ApiOperations } from "@/lib/sentry-api-logging";

function parseName(fullName: string): { ime: string; pri: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { ime: parts[0], pri: parts[0] };
  return {
    ime: parts[0] ?? "",
    pri: parts.slice(1).join(" ") ?? "",
  };
}

export const POST = withSentryLogging(async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = getUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    reservationId: string;
    guestUpdates?: {
      dateOfBirth?: string;
      countryCode?: string;
      documentType?: string;
      documentId?: string;
      gender?: string;
    };
  };
  if (!body.reservationId?.trim()) {
    return NextResponse.json({ error: "reservationId is required" }, { status: 400 });
  }

  const reservation = await prisma.reservation.findUnique({
    where: { id: body.reservationId },
    include: {
      guest: true,
      property: true,
    },
  });

  if (!reservation) {
    return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
  }

  const property = await getPropertyForUser(reservation.propertyId, userId);
  if (!property) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  const conn = await prisma.ajpesConnection.findUnique({
    where: { propertyId: reservation.propertyId },
  });

  if (!conn) {
    return NextResponse.json(
      { error: "AJPES connection not configured for this property" },
      { status: 400 }
    );
  }

  const rnoId = conn.rnoId ?? property.rnoId ?? 0;
  if (rnoId === 0) {
    return NextResponse.json(
      { error: "RNO ID not set. Configure it in AJPES settings." },
      { status: 400 }
    );
  }

  if (!reservation.guestId || !reservation.guest) {
    return NextResponse.json({ error: "Reservation has no guest" }, { status: 400 });
  }

  const updates = body.guestUpdates;
  if (updates && Object.keys(updates).length > 0) {
    const guestData: Record<string, unknown> = {};
    if (updates.dateOfBirth) guestData.dateOfBirth = new Date(updates.dateOfBirth);
    if (updates.countryCode != null) guestData.countryCode = updates.countryCode;
    if (updates.documentType != null) guestData.documentType = updates.documentType;
    if (updates.documentId != null) guestData.documentId = updates.documentId;
    if (updates.gender != null) guestData.gender = updates.gender;
    if (Object.keys(guestData).length > 0) {
      await prisma.guest.update({
        where: { id: reservation.guestId },
        data: guestData,
      });
    }
  }

  const refreshed = await prisma.reservation.findUnique({
    where: { id: reservation.id },
    include: { guest: true },
  });
  const g = refreshed?.guest ?? reservation.guest;
  const missing: string[] = [];
  if (!g.dateOfBirth) missing.push("dateOfBirth");
  if (!g.countryCode) missing.push("countryCode");
  if (!g.documentType) missing.push("documentType");
  if (!g.documentId) missing.push("documentId");
  if (!g.gender) missing.push("gender");

  if (missing.length > 0) {
    return NextResponse.json(
      { error: "Guest missing required fields for eTurizem", missing },
      { status: 400 }
    );
  }

  const { ime, pri } = parseName(g.name);
  const touristTax = reservation.touristTax ?? 0;
  const checkInStr = reservation.checkIn.toISOString().replace("Z", "").slice(0, 19);
  const checkOutStr = reservation.checkOut.toISOString().replace("Z", "").slice(0, 19);
  const dtRoj = g.dateOfBirth!.toISOString().slice(0, 10);
  const docType = g.documentType as EturizemRow["vrstaDok"];
  const sp = g.gender === "M" || g.gender === "F" ? (g.gender as "M" | "F") : "M";

  const row: EturizemRow = {
    idNO: rnoId,
    zst: 1,
    ime,
    pri,
    sp,
    dtRoj,
    drzava: g.countryCode!,
    vrstaDok: docType,
    idStDok: g.documentId!,
    casPrihoda: checkInStr,
    casOdhoda: checkOutStr,
    ttObracun: 0,
    ttVisina: touristTax,
    status: 1,
  };

  const xml = buildGuestBookXml([row]);
  let password: string;
  try {
    password = decrypt(conn.passwordEnc);
  } catch {
    return NextResponse.json(
      { error: "AJPES password decryption failed. Check AJPES_ENCRYPTION_KEY." },
      { status: 503 }
    );
  }

  const result = await submitToAjpes(conn.username, password, xml);

  if (!result.success) {
    return NextResponse.json(
      { error: result.message ?? "AJPES submit failed" },
      { status: 502 }
    );
  }

  await prisma.reservation.update({
    where: { id: reservation.id },
    data: { eturizemSubmittedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
