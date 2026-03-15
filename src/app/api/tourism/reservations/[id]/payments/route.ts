/**
 * GET: list payments for a reservation
 * POST: add payment to a reservation
 */
import { NextRequest, NextResponse } from "next/server";
import { logger } from '@/infrastructure/observability/logger';
import { getServerSession } from "next-auth";
import { prisma } from "@/database/schema";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { getPropertyForUser } from "@/lib/tourism/property-access";

async function ensureReservationAccess(reservationId: string, userId: string) {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { property: { select: { currency: true } } },
  });
  if (!reservation) return null;
  const property = await getPropertyForUser(reservation.propertyId, userId);
  if (!property) return null;
  return reservation;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id } = await params;
    const reservation = await ensureReservationAccess(id, userId);
    if (!reservation) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    const payments = await prisma.payment.findMany({
      where: { reservationId: id },
      orderBy: { paidAt: "desc" },
    });

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalDue = (reservation.totalPrice ?? 0) + (reservation.touristTax ?? 0);
    const outstanding = Math.max(0, totalDue - totalPaid);

    return NextResponse.json({
      payments,
      totalPaid,
      totalDue,
      outstanding,
      deposit: reservation.deposit,
      touristTax: reservation.touristTax,
    });
  } catch (error) {
    logger.error("Payments GET error:", error);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id } = await params;
    const reservation = await ensureReservationAccess(id, userId);
    if (!reservation) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      type?: string;
      amount?: number;
      method?: string;
      notes?: string;
    };

    if (!body.type || body.amount == null || typeof body.amount !== "number" || body.amount <= 0) {
      return NextResponse.json(
        { error: "type and amount (positive number) are required" },
        { status: 400 }
      );
    }

    const validTypes = ["deposit", "balance", "tourist_tax", "extra"];
    if (!validTypes.includes(body.type)) {
      return NextResponse.json(
        { error: `type must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const currency = reservation.property?.currency ?? "EUR";

    const payment = await prisma.payment.create({
      data: {
        reservationId: id,
        type: body.type,
        amount: body.amount,
        currency,
        method: body.method?.trim() || null,
        notes: body.notes?.trim() || null,
      },
    });

    return NextResponse.json({ payment });
  } catch (error) {
    logger.error("Payments POST error:", error);
    return NextResponse.json({ error: "Failed to add payment" }, { status: 500 });
  }
}
