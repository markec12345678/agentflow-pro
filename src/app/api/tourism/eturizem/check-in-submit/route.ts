/**
 * POST /api/tourism/eturizem/check-in-submit
 * Public endpoint - self check-in: update guest and submit to AJPES.
 * Body: { token, guestUpdates }
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/database/schema";
import { decrypt } from "@/lib/crypto/encrypt";
import {
  buildGuestBookXml,
  submitToAjpes,
  type EturizemRow,
} from "@/lib/tourism/eturizem-client";

function parseName(fullName: string): { ime: string; pri: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { ime: parts[0], pri: parts[0] };
  return {
    ime: parts[0] ?? "",
    pri: parts.slice(1).join(" ") ?? "",
  };
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    token?: string;
    guestUpdates?: {
      dateOfBirth?: string;
      countryCode?: string;
      documentType?: string;
      documentId?: string;
      gender?: string;
    };
  };

  const token = body.token?.trim();
  if (!token) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 });
  }

  const reservation = await prisma.reservation.findFirst({
    where: { checkInToken: token, status: "confirmed" },
    include: { guest: true, property: true },
  });

  if (!reservation || !reservation.guest) {
    return NextResponse.json(
      { error: "Rezervacija ni najdena" },
      { status: 404 }
    );
  }

  const updates = body.guestUpdates ?? {};
  const guestData: Record<string, unknown> = {};
  if (updates.dateOfBirth) guestData.dateOfBirth = new Date(updates.dateOfBirth);
  if (updates.countryCode != null) guestData.countryCode = updates.countryCode;
  if (updates.documentType != null) guestData.documentType = updates.documentType;
  if (updates.documentId != null) guestData.documentId = updates.documentId;
  if (updates.gender != null) guestData.gender = updates.gender;

  if (Object.keys(guestData).length > 0) {
    await prisma.guest.update({
      where: { id: reservation.guestId! },
      data: guestData,
    });
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
      { error: "Manjkajo obvezni podatki gosta", missing },
      { status: 400 }
    );
  }

  const conn = await prisma.ajpesConnection.findUnique({
    where: { propertyId: reservation.propertyId },
  });

  if (!conn) {
    return NextResponse.json(
      { error: "AJPES povezava ni nastavljena za to nastanitev" },
      { status: 400 }
    );
  }

  const rnoId = conn.rnoId ?? reservation.property.rnoId ?? 0;
  if (rnoId === 0) {
    return NextResponse.json(
      { error: "RNO ID ni nastavljen" },
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
      { error: "Napaka pri dekodiranju gesla" },
      { status: 503 }
    );
  }

  const result = await submitToAjpes(conn.username, password, xml);

  if (!result.success) {
    return NextResponse.json(
      { error: result.message ?? "Pošiljanje v AJPES ni uspelo" },
      { status: 502 }
    );
  }

  await prisma.reservation.update({
    where: { id: reservation.id },
    data: { eturizemSubmittedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
