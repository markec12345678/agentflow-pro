/**
 * GET /api/tourism/revenue/analytics
 * Get revenue management analytics (RevPAR, ADR, occupancy, etc.)
 * Query: propertyId, startDate, endDate
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { prisma } from "@/database/schema";
import { getPropertyForUser } from "@/lib/tourism/property-access";
import { parseISO, startOfDay, endOfDay, eachDayOfInterval, format } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    if (!propertyId || !startDateParam || !endDateParam) {
      return NextResponse.json(
        { error: "propertyId, startDate, and endDate are required" },
        { status: 400 }
      );
    }

    const property = await getPropertyForUser(propertyId, userId);
    if (!property) {
      return NextResponse.json({ error: "Property not found or access denied" }, { status: 403 });
    }

    const startDate = startOfDay(parseISO(startDateParam));
    const endDate = endOfDay(parseISO(endDateParam));

    // Get all reservations for the period
    const reservations = await prisma.reservation.findMany({
      where: {
        propertyId,
        checkIn: {
          lte: endDate,
        },
        checkOut: {
          gte: startDate,
        },
        status: {
          in: ["confirmed", "checked_in", "checked_out"],
        },
      },
      include: {
        room: true,
        payments: true,
      },
    });

    // Get all rooms
    const rooms = await prisma.room.findMany({
      where: { propertyId },
    });

    const totalRooms = rooms.length;
    const roomNightsAvailable = totalRooms * eachDayOfInterval({ start: startDate, end: endDate }).length;

    // Calculate metrics
    let totalRevenue = 0;
    let totalNights = 0;
    let occupiedRoomNights = 0;

    const dailyRevenue: Record<string, number> = {};
    const dailyOccupancy: Record<string, { occupied: number; available: number }> = {};

    // Initialize daily buckets
    eachDayOfInterval({ start: startDate, end: endDate }).forEach((day) => {
      const dateStr = format(day, "yyyy-MM-dd");
      dailyRevenue[dateStr] = 0;
      dailyOccupancy[dateStr] = { occupied: 0, available: totalRooms };
    });

    reservations.forEach((res) => {
      const checkIn = startOfDay(res.checkIn);
      const checkOut = startOfDay(res.checkOut);
      const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));

      totalNights += nights;
      totalRevenue += res.totalPrice || 0;

      // Mark occupied days
      let currentDay = checkIn;
      while (currentDay < checkOut) {
        const dateStr = format(currentDay, "yyyy-MM-dd");
        if (dailyOccupancy[dateStr]) {
          dailyOccupancy[dateStr].occupied++;
        }
        if (dailyRevenue[dateStr] && res.totalPrice) {
          dailyRevenue[dateStr] += res.totalPrice / nights;
        }
        currentDay = new Date(currentDay.getTime() + 24 * 60 * 60 * 1000);
      }

      occupiedRoomNights += nights;
    });

    // Calculate KPIs
    const occupancyRate = roomNightsAvailable > 0 ? (occupiedRoomNights / roomNightsAvailable) * 100 : 0;
    const adr = totalNights > 0 ? totalRevenue / totalNights : 0; // Average Daily Rate
    const revpar = roomNightsAvailable > 0 ? totalRevenue / roomNightsAvailable : 0; // Revenue Per Available Room

    // Revenue by channel
    const revenueByChannel = reservations.reduce(
      (acc, res) => {
        const channel = res.channel || "direct";
        if (!acc[channel]) acc[channel] = { revenue: 0, bookings: 0 };
        acc[channel].revenue += res.totalPrice || 0;
        acc[channel].bookings++;
        return acc;
      },
      {} as Record<string, { revenue: number; bookings: number }>
    );

    // Daily trends
    const dailyTrend = Object.entries(dailyRevenue).map(([date, revenue]) => ({
      date,
      revenue: Math.round(revenue * 100) / 100,
      occupancy: dailyOccupancy[date] ? Math.round((dailyOccupancy[date].occupied / dailyOccupancy[date].available) * 100) : 0,
      occupiedRooms: dailyOccupancy[date]?.occupied || 0,
      availableRooms: dailyOccupancy[date]?.available || totalRooms,
    }));

    // Top performing rooms
    const roomPerformance = rooms.map((room) => {
      const roomReservations = reservations.filter((r) => r.roomId === room.id);
      const roomRevenue = roomReservations.reduce((sum, r) => sum + (r.totalPrice || 0), 0);
      const roomNights = roomReservations.reduce((sum, r) => {
        const nights = Math.ceil((r.checkOut.getTime() - r.checkIn.getTime()) / (1000 * 60 * 60 * 24));
        return sum + Math.max(1, nights);
      }, 0);

      return {
        roomId: room.id,
        roomName: room.name,
        roomType: room.type,
        revenue: roomRevenue,
        nights: roomNights,
        adr: roomNights > 0 ? roomRevenue / roomNights : 0,
        bookings: roomReservations.length,
      };
    });

    return NextResponse.json({
      revenue: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalNights,
        occupiedRoomNights,
        roomNightsAvailable,
      },
      kpis: {
        occupancyRate: Math.round(occupancyRate * 100) / 100,
        adr: Math.round(adr * 100) / 100,
        revpar: Math.round(revpar * 100) / 100,
        averageStayLength: totalNights > 0 ? Math.round((totalNights / reservations.length) * 10) / 10 : 0,
      },
      revenueByChannel,
      dailyTrend,
      roomPerformance,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    });
  } catch (error) {
    logger.error("[Revenue Analytics] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch revenue analytics" },
      { status: 500 }
    );
  }
}
