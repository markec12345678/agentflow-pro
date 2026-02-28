/**
 * POST /api/tourism/calendar/bulk-import
 * Bulk import reservations from CSV or JSON.
 * Body: { propertyId, format: "csv" | "json", data: string }
 */

import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { getPropertyForUser } from "@/lib/tourism/property-access";

function getUserId(session: { user?: { userId?: string; email?: string | null } } | null): string | null {
  if (!session?.user) return null;
  return (session.user as { userId?: string }).userId ?? session.user.email ?? null;
}

interface ReservationRow {
  checkIn: string;
  checkOut: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  channel?: string;
  totalAmount?: number;
  notes?: string;
}

function parseCsv(data: string): ReservationRow[] {
  const lines = data.trim().split(/\r?\n/).filter(Boolean);
  const rows: ReservationRow[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    // Skip header row if it looks like column names
    if (i === 0 && /checkIn|datum|date/i.test(line)) continue;

    const parts = line.split(",").map((p) => p.trim().replace(/^["']|["']$/g, ""));
    if (parts.length < 2) continue;

    const checkIn = parts[0];
    const checkOut = parts[1];
    if (!checkIn || !checkOut) continue;

    rows.push({
      checkIn,
      checkOut,
      guestName: parts[2] || undefined,
      guestEmail: parts[3] || undefined,
      guestPhone: parts[4] || undefined,
      channel: parts[5] || "direct",
      totalAmount: parts[6] ? parseFloat(parts[6]) : undefined,
      notes: parts[7] || undefined,
    });
  }
  return rows;
}

function parseJson(data: string): ReservationRow[] {
  const parsed = JSON.parse(data);
  const arr = Array.isArray(parsed) ? parsed : parsed.reservations ?? [];
  return arr.map((r: Record<string, unknown>) => ({
    checkIn: String(r.checkIn ?? ""),
    checkOut: String(r.checkOut ?? ""),
    guestName: r.guestName != null ? String(r.guestName) : undefined,
    guestEmail: r.guestEmail != null ? String(r.guestEmail) : undefined,
    guestPhone: r.guestPhone != null ? String(r.guestPhone) : undefined,
    channel: r.channel != null ? String(r.channel) : "direct",
    totalAmount: typeof r.totalAmount === "number" ? r.totalAmount : r.totalAmount != null ? parseFloat(String(r.totalAmount)) : undefined,
    notes: r.notes != null ? String(r.notes) : undefined,
  }));
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { propertyId, format: dataFormat, data } = body;

    if (!propertyId || !dataFormat || !data) {
      return NextResponse.json(
        { error: "propertyId, format, and data are required" },
        { status: 400 }
      );
    }

    const property = await getPropertyForUser(propertyId, userId);
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 403 });
    }

    let rows: ReservationRow[];
    try {
      rows = dataFormat === "json" ? parseJson(data) : parseCsv(data);
    } catch (e) {
      return NextResponse.json(
        { error: "Invalid data format", details: e instanceof Error ? e.message : String(e) },
        { status: 400 }
      );
    }

    const errors: { row: number; message: string }[] = [];
    let imported = 0;
    let skipped = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 1;

      const checkInDate = new Date(row.checkIn);
      const checkOutDate = new Date(row.checkOut);
      if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
        errors.push({ row: rowNum, message: "Neveljavni datumi" });
        skipped++;
        continue;
      }
      if (checkOutDate <= checkInDate) {
        errors.push({ row: rowNum, message: "Odhod mora biti za prihodom" });
        skipped++;
        continue;
      }

      const existingReservations = await prisma.reservation.findMany({
        where: {
          propertyId,
          OR: [
            {
              checkIn: { lt: checkOutDate },
              checkOut: { gt: checkInDate },
            },
          ],
        },
      });

      if (existingReservations.length > 0) {
        errors.push({ row: rowNum, message: "Konflikt z obstoječo rezervacijo" });
        skipped++;
        continue;
      }

      try {
        let guest;
        const guestEmail = row.guestEmail?.trim();
        if (guestEmail) {
          guest = await prisma.guest.findFirst({ where: { email: guestEmail } });
          if (!guest) {
            guest = await prisma.guest.create({
              data: {
                name: row.guestName || "Gost",
                email: guestEmail,
                phone: row.guestPhone || null,
              },
            });
          }
        } else {
          guest = await prisma.guest.create({
            data: {
              name: row.guestName || "Gost",
              email: `${Date.now()}-${i}@temp.com`,
              phone: row.guestPhone || null,
            },
          });
        }

        const checkInToken = randomBytes(24).toString("base64url");
        const reservation = await prisma.reservation.create({
          data: {
            propertyId,
            guestId: guest.id,
            checkIn: checkInDate,
            checkOut: checkOutDate,
            channel: row.channel || "direct",
            totalPrice: row.totalAmount ?? null,
            notes: row.notes ?? null,
            status: "confirmed",
            checkInToken,
          },
        });

        const { triggerBookingConfirmation } = await import("@/lib/tourism/email-triggers");
        triggerBookingConfirmation(reservation.id, propertyId, guest.id).catch((err) =>
          console.error("Bulk import booking confirmation:", err)
        );

        imported++;
      } catch (e) {
        errors.push({
          row: rowNum,
          message: e instanceof Error ? e.message : "Napaka pri ustvarjanju",
        });
        skipped++;
      }
    }

    return NextResponse.json({
      imported,
      skipped,
      errors,
    });
  } catch (error) {
    console.error("Bulk import error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Bulk import failed" },
      { status: 500 }
    );
  }
}
