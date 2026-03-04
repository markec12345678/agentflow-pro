/**
 * GET /api/reports/occupancy
 * Generate occupancy report data
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { prisma } from "@/database/schema";
import { getPropertyForUser } from "@/lib/tourism/property-access";
import { format, startOfDay, endOfDay, eachDayOfInterval } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyIdParam = searchParams.get("propertyId");
    const startDateParam = searchParams.get("start");
    const endDateParam = searchParams.get("end");

    if (!propertyIdParam?.trim()) {
      return NextResponse.json({ error: "Property ID is required" }, { status: 400 });
    }

    if (!startDateParam?.trim() || !endDateParam?.trim()) {
      return NextResponse.json({ error: "Start and end dates are required" }, { status: 400 });
    }

    // Validate property access
    const property = await getPropertyForUser(propertyIdParam, userId);
    if (!property) {
      return NextResponse.json({ error: "Property not found or access denied" }, { status: 404 });
    }

    const startDate = new Date(startDateParam);
    const endDate = new Date(endDateParam);

    // Get all rooms for the property
    const rooms = await prisma.room.findMany({
      where: { propertyId: propertyIdParam },
      select: {
        id: true,
        name: true,
        type: true,
        capacity: true,
        basePrice: true,
      },
    });

    const totalRooms = rooms.length;
    if (totalRooms === 0) {
      return NextResponse.json({
        success: true,
        data: {
          occupancyData: [],
        },
      });
    }

    // Generate date range
    const dateRange = eachDayOfInterval({
      start: startOfDay(startDate),
      end: endOfDay(endDate),
    });

    // Get all reservations for the date range
    const reservations = await prisma.reservation.findMany({
      where: {
        propertyId: propertyIdParam,
        status: {
          in: ["confirmed", "checked_in", "checked_out"],
        },
        OR: [
          {
            checkIn: {
              lte: endDate,
            },
            checkOut: {
              gte: startDate,
            },
          },
          {
            checkIn: {
              gte: startDate,
              lte: endDate,
            },
          },
          {
            checkOut: {
              gte: startDate,
              lte: endDate,
            },
          },
        ],
      },
      include: {
        room: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        guest: {
          select: {
            id: true,
            name: true,
            email: true,
          },
          },
      },
    });

    // Calculate occupancy data for each date
    const occupancyData = dateRange.map(date => {
      const dateStr = format(date, "yyyy-MM-dd");
      
      // Count occupied rooms for this date
      const occupiedRooms = reservations.filter(reservation => {
        const checkIn = startOfDay(new Date(reservation.checkIn));
        const checkOut = startOfDay(new Date(reservation.checkOut));
        const currentDate = startOfDay(date);
        
        return currentDate >= checkIn && currentDate < checkOut;
      });

      const occupiedRoomIds = new Set(occupiedRooms.map(r => r.roomId));
      const occupiedCount = occupiedRoomIds.size;
      const availableCount = totalRooms - occupiedCount;
      const occupancyRate = totalRooms > 0 ? (occupiedCount / totalRooms) * 100 : 0;

      // Calculate revenue for occupied rooms
      const revenue = occupiedRooms.reduce((sum, reservation) => {
        const checkIn = new Date(reservation.checkIn);
        const checkOut = new Date(reservation.checkOut);
        const currentDate = new Date(date);
        
        if (currentDate >= checkIn && currentDate < checkOut) {
          return sum + (reservation.totalPrice / Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
        }
        return sum;
      }, 0);

      // Count arrivals and departures
      const arrivals = reservations.filter(reservation => 
        format(new Date(reservation.checkIn), "yyyy-MM-dd") === dateStr
      ).length;

      const departures = reservations.filter(reservation => 
        format(new Date(reservation.checkOut), "yyyy-MM-dd") === dateStr
      ).length;

      // Count in-house guests
      const inHouse = occupiedRooms.length;

      return {
        date: dateStr,
        occupancyRate: Math.round(occupancyRate * 10) / 10,
        occupiedRooms: occupiedCount,
        totalRooms,
        availableRooms: availableCount,
        revenue: Math.round(revenue * 100) / 100,
        arrivals,
        departures,
        inHouse,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        occupancyData,
        summary: {
          totalRooms,
          dateRange: {
            start: format(startDate, "yyyy-MM-dd"),
            end: format(endDate, "yyyy-MM-dd"),
          },
          averageOccupancy: occupancyData.length > 0 
            ? Math.round((occupancyData.reduce((sum, d) => sum + d.occupancyRate, 0) / occupancyData.length) * 10) / 10
            : 0,
          totalRevenue: Math.round(occupancyData.reduce((sum, d) => sum + d.revenue, 0) * 100) / 100,
        },
      },
    });

  } catch (error) {
    console.error("Occupancy report error:", error);
    return NextResponse.json(
      { error: "Failed to generate occupancy report" },
      { status: 500 }
    );
  }
}
