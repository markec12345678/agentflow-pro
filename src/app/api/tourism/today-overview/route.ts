/**
 * GET /api/tourism/today-overview
 * Returns arrivals, departures, and in-house guests for a date.
 * Query: propertyId (optional), date (optional, yyyy-MM-dd)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { startOfDay, addDays, format } from "date-fns";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/database/schema";
import { getPropertyForUser, getPropertyIdsForUser } from "@/lib/tourism/property-access";

function getUserId(session: { user?: { userId?: string; email?: string | null } } | null): string | null {
  if (!session?.user) return null;
  return (session.user as { userId?: string }).userId ?? session.user.email ?? null;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyIdParam = searchParams.get("propertyId");
    const dateParam = searchParams.get("date");

    let propertyIds: string[];
    if (propertyIdParam?.trim()) {
      const property = await getPropertyForUser(propertyIdParam, userId);
      if (!property) {
        return NextResponse.json({ error: "Property not found" }, { status: 403 });
      }
      propertyIds = [property.id];
    } else {
      propertyIds = await getPropertyIdsForUser(userId);
    }

    const targetDate = dateParam?.trim()
      ? startOfDay(new Date(dateParam))
      : startOfDay(new Date());
    const nextDay = addDays(targetDate, 1);

    if (propertyIds.length === 0) {
      return NextResponse.json({
        date: format(targetDate, "yyyy-MM-dd"),
        arrivals: [],
        departures: [],
        inHouse: [],
        counts: { arrivals: 0, departures: 0, inHouse: 0 },
        pendingPreArrivalCount: 0,
        pendingPreArrivalReservationIds: [],
      });
    }

    const reservations = await prisma.reservation.findMany({
      where: {
        propertyId: { in: propertyIds },
        status: "confirmed",
        OR: [
          { checkIn: { gte: targetDate, lt: nextDay } },
          { checkOut: { gte: targetDate, lt: nextDay } },
          {
            checkIn: { lt: targetDate },
            checkOut: { gt: targetDate },
          },
        ],
      },
      include: {
        guest: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            dateOfBirth: true,
            countryCode: true,
            documentType: true,
            documentId: true,
            gender: true,
          },
        },
        property: { select: { id: true, name: true } },
      },
    });

    const arrivals = reservations.filter((r) => r.checkIn >= targetDate && r.checkIn < nextDay);
    const departures = reservations.filter((r) => r.checkOut >= targetDate && r.checkOut < nextDay);
    const inHouse = reservations.filter(
      (r) => r.checkIn < targetDate && r.checkOut > targetDate
    );

    const arrivalIds = arrivals.map((r) => r.id);
    const pendingPreArrivals = await prisma.guestCommunication.findMany({
      where: {
        propertyId: { in: propertyIds },
        type: "pre-arrival",
        status: { in: ["pending", "draft"] },
      },
    });
    const matchingPending = pendingPreArrivals.filter((c) =>
      arrivalIds.includes((c.variables as { reservationId?: string })?.reservationId ?? "")
    );

    const toArrival = (r: (typeof arrivals)[0]) => ({
      id: r.id,
      guestId: r.guestId,
      guestName: r.guest?.name ?? "Gost",
      guestPhone: r.guest?.phone ?? null,
      guestEmail: r.guest?.email ?? null,
      guest: r.guest
        ? {
          id: r.guest.id,
          name: r.guest.name,
          dateOfBirth: r.guest.dateOfBirth?.toISOString().slice(0, 10) ?? null,
          countryCode: r.guest.countryCode ?? null,
          documentType: r.guest.documentType ?? null,
          documentId: r.guest.documentId ?? null,
          gender: r.guest.gender ?? null,
        }
        : null,
      propertyName: r.property.name,
      propertyId: r.propertyId,
      checkIn: format(r.checkIn, "yyyy-MM-dd HH:mm"),
      eturizemSubmittedAt: r.eturizemSubmittedAt?.toISOString() ?? null,
    });
    const toDeparture = (r: (typeof departures)[0]) => ({
      id: r.id,
      guestName: r.guest?.name ?? "Gost",
      guestPhone: r.guest?.phone ?? null,
      guestEmail: r.guest?.email ?? null,
      propertyName: r.property.name,
      checkOut: format(r.checkOut, "yyyy-MM-dd HH:mm"),
    });
    const toInHouse = (r: (typeof inHouse)[0]) => ({
      id: r.id,
      guestName: r.guest?.name ?? "Gost",
      guestPhone: r.guest?.phone ?? null,
      guestEmail: r.guest?.email ?? null,
      propertyName: r.property.name,
    });

    return NextResponse.json({
      date: format(targetDate, "yyyy-MM-dd"),
      arrivals: arrivals.map(toArrival),
      departures: departures.map(toDeparture),
      inHouse: inHouse.map(toInHouse),
      counts: {
        arrivals: arrivals.length,
        departures: departures.length,
        inHouse: inHouse.length,
      },
      pendingPreArrivalCount: matchingPending.length,
      pendingPreArrivalReservationIds: matchingPending
        .map((c) => (c.variables as { reservationId?: string })?.reservationId)
        .filter(Boolean),
    });
  } catch (error) {
    console.error("Today overview error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load overview" },
      { status: 500 }
    );
  }
}
