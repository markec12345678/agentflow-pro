import { NextRequest, NextResponse } from "next/server";
import { logger } from '@/infrastructure/observability/logger';
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { getPropertyIdsForUser } from "@/lib/tourism/property-access";
import { parseISO } from "date-fns";

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

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const propertyIds = await getPropertyIdsForUser(userId);

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        guest: {
          include: {
            reservations: {
              where: { id: { not: id } },
              take: 5,
              orderBy: { checkIn: "desc" },
              select: { id: true, checkIn: true, status: true }
            },
            communications: {
              take: 10,
              orderBy: { createdAt: "desc" }
            }
          }
        },
        property: {
          include: {
            policies: {
              where: { policyType: "cancellation" }
            }
          }
        },
        payments: true,
      },
    });

    if (!reservation || !propertyIds.includes(reservation.propertyId)) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    return NextResponse.json(reservation);
  } catch (error) {
    logger.error("Reservation details API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();
    const propertyIds = await getPropertyIdsForUser(userId);

    const reservation = await prisma.reservation.findUnique({
      where: { id },
    });

    if (!reservation || !propertyIds.includes(reservation.propertyId)) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    const { status, checkIn, checkOut, totalPrice, notes, roomId } = body;

    const updated = await prisma.reservation.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(checkIn && { checkIn: parseISO(checkIn) }),
        ...(checkOut && { checkOut: parseISO(checkOut) }),
        ...(totalPrice !== undefined && { totalPrice }),
        ...(notes !== undefined && { notes }),
        ...(roomId !== undefined && { roomId }),
      },
      include: {
        guest: true,
        property: true,
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    logger.error("Reservation update API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const propertyIds = await getPropertyIdsForUser(userId);

    const reservation = await prisma.reservation.findUnique({
      where: { id },
    });

    if (!reservation || !propertyIds.includes(reservation.propertyId)) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    // Instead of actual delete, we usually cancel
    const cancelled = await prisma.reservation.update({
      where: { id },
      data: { status: "cancelled" },
    });

    return NextResponse.json(cancelled);
  } catch (error) {
    logger.error("Reservation delete API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
