/**
 * GET /api/receptor/daily-overview
 * Returns daily overview for receptor dashboard
 * Query: propertyId (required), date (optional, yyyy-MM-dd)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { startOfDay, endOfDay, format } from "date-fns";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { prisma } from "@/database/schema";
import { getPropertyForUser, getPropertyIdsForUser } from "@/lib/tourism/property-access";

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

    if (!propertyIdParam?.trim()) {
      return NextResponse.json({ error: "Property ID is required" }, { status: 400 });
    }

    // Validate property access
    const property = await getPropertyForUser(propertyIdParam, userId);
    if (!property) {
      return NextResponse.json({ error: "Property not found or access denied" }, { status: 404 });
    }

    // Parse date (default to today)
    const targetDate = dateParam ? new Date(dateParam) : new Date();
    const startOfDayTarget = startOfDay(targetDate);
    const endOfDayTarget = endOfDay(targetDate);

    // Fetch arrivals (check-ins today)
    const arrivals = await prisma.reservation.findMany({
      where: {
        propertyId: propertyIdParam,
        checkIn: {
          gte: startOfDayTarget,
          lte: endOfDayTarget,
        },
        status: {
          in: ["confirmed", "pending"],
        },
      },
      include: {
        guest: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        room: {
          select: {
            id: true,
            name: true,
            type: true,
            basePrice: true,
          },
        },
      },
      orderBy: {
        checkIn: "asc",
      },
    });

    // Fetch departures (check-outs today)
    const departures = await prisma.reservation.findMany({
      where: {
        propertyId: propertyIdParam,
        checkOut: {
          gte: startOfDayTarget,
          lte: endOfDayTarget,
        },
        status: {
          in: ["confirmed", "pending"],
        },
      },
      include: {
        guest: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        room: {
          select: {
            id: true,
            name: true,
            type: true,
            basePrice: true,
          },
        },
      },
      orderBy: {
        checkOut: "asc",
      },
    });

    // Fetch in-house guests (staying tonight)
    const inHouseReservations = await prisma.reservation.findMany({
      where: {
        propertyId: propertyIdParam,
        checkIn: {
          lte: endOfDayTarget,
        },
        checkOut: {
          gt: endOfDayTarget,
        },
        status: "confirmed",
      },
      include: {
        guest: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        room: {
          select: {
            id: true,
            name: true,
            type: true,
            basePrice: true,
          },
        },
      },
    });

    // Fetch all rooms for occupancy calculation
    const allRooms = await prisma.room.findMany({
      where: {
        propertyId: propertyIdParam,
      },
      select: {
        id: true,
        name: true,
        type: true,
        capacity: true,
        basePrice: true,
      },
    });

    // Fetch pending reservations
    const pendingReservations = await prisma.reservation.findMany({
      where: {
        propertyId: propertyIdParam,
        status: "pending",
      },
      include: {
        guest: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        room: {
          select: {
            id: true,
            name: true,
            type: true,
            basePrice: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate statistics
    const totalRooms = allRooms.length;
    const occupiedRooms = inHouseReservations.length;
    const availableRooms = totalRooms - occupiedRooms;
    const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

    // Calculate today's revenue
    const todayRevenue = arrivals.reduce((sum, arrival) => sum + (arrival.totalPrice || 0), 0);

    // Format response data
    const formattedArrivals = arrivals.map(arrival => ({
      id: arrival.id,
      guestName: arrival.guest?.name || "Unknown",
      guestEmail: arrival.guest?.email || "",
      guestPhone: arrival.guest?.phone || "",
      roomNumber: arrival.room?.name || "Unassigned",
      roomType: arrival.room?.type || "Standard",
      checkInTime: format(new Date(arrival.checkIn), "HH:mm"),
      totalPrice: arrival.totalPrice || 0,
      channel: arrival.channel || "direct",
      status: arrival.status === "confirmed" ? "confirmed" : "pending",
      notes: arrival.notes,
    }));

    const formattedDepartures = departures.map(departure => ({
      id: departure.id,
      guestName: departure.guest?.name || "Unknown",
      guestEmail: departure.guest?.email || "",
      guestPhone: departure.guest?.phone || "",
      roomNumber: departure.room?.name || "Unassigned",
      roomType: departure.room?.type || "Standard",
      checkOutTime: format(new Date(departure.checkOut), "HH:mm"),
      totalPrice: departure.totalPrice || 0,
      channel: departure.channel || "direct",
      status: departure.status === "confirmed" ? "confirmed" : "pending",
      notes: departure.notes,
      roomStatus: "dirty", // Default to dirty after check-out
    }));

    const dailyStats = {
      arrivals: formattedArrivals.length,
      departures: formattedDepartures.length,
      inHouse: inHouseReservations.length,
      available: availableRooms,
      occupancyRate: Math.round(occupancyRate * 10) / 10, // Round to 1 decimal
      revenue: todayRevenue,
      pendingReservations: pendingReservations.length,
    };

    return NextResponse.json({
      success: true,
      data: {
        date: format(targetDate, "yyyy-MM-dd"),
        stats: dailyStats,
        arrivals: formattedArrivals,
        departures: formattedDepartures,
        inHouse: inHouseReservations.map(reservation => ({
          id: reservation.id,
          guestName: reservation.guest?.name || "Unknown",
          guestEmail: reservation.guest?.email || "",
          guestPhone: reservation.guest?.phone || "",
          roomNumber: reservation.room?.name || "Unassigned",
          roomType: reservation.room?.type || "Standard",
          checkIn: format(new Date(reservation.checkIn), "yyyy-MM-dd"),
          checkOut: format(new Date(reservation.checkOut), "yyyy-MM-dd"),
          totalPrice: reservation.totalPrice || 0,
          channel: reservation.channel || "direct",
          status: reservation.status,
        })),
        pendingReservations: pendingReservations.map(reservation => ({
          id: reservation.id,
          guestName: reservation.guest?.name || "Unknown",
          guestEmail: reservation.guest?.email || "",
          guestPhone: reservation.guest?.phone || "",
          roomNumber: reservation.room?.name || "Unassigned",
          roomType: reservation.room?.type || "Standard",
          checkIn: format(new Date(reservation.checkIn), "yyyy-MM-dd"),
          checkOut: format(new Date(reservation.checkOut), "yyyy-MM-dd"),
          totalPrice: reservation.totalPrice || 0,
          channel: reservation.channel || "direct",
          status: reservation.status,
          createdAt: format(new Date(reservation.createdAt), "yyyy-MM-dd HH:mm"),
        })),
      },
    });

  } catch (error) {
    console.error("Daily overview error:", error);
    return NextResponse.json(
      { error: "Failed to fetch daily overview" },
      { status: 500 }
    );
  }
}
