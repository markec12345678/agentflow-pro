/**
 * GET /api/reports/revenue
 * Generate revenue report data
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
        payments: {
          select: {
            id: true,
            type: true,
            amount: true,
            status: true,
            paidAt: true,
          },
        },
      },
    });

    // Get room types for the property
    const roomTypes = await prisma.room.findMany({
      where: { propertyId: propertyIdParam },
      select: {
        type: true,
      },
      distinct: ["type"],
    });

    // Calculate revenue data for each date
    const revenueData = dateRange.map(date => {
      const dateStr = format(date, "yyyy-MM-dd");
      
      // Filter reservations active on this date
      const activeReservations = reservations.filter(reservation => {
        const checkIn = startOfDay(new Date(reservation.checkIn));
        const checkOut = startOfDay(new Date(reservation.checkOut));
        const currentDate = startOfDay(date);
        
        return currentDate >= checkIn && currentDate < checkOut;
      });

      // Calculate different revenue types
      const occupancyRevenue = activeReservations.reduce((sum, reservation) => {
        const checkIn = new Date(reservation.checkIn);
        const checkOut = new Date(reservation.checkOut);
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
        return sum + (reservation.totalPrice / nights);
      }, 0);

      // Calculate extra revenue (from payments marked as "extra")
      const extraRevenue = reservations
        .filter(r => format(new Date(r.checkIn), "yyyy-MM-dd") <= dateStr && 
                    format(new Date(r.checkOut), "yyyy-MM-dd") >= dateStr)
        .reduce((sum, reservation) => {
          const extraPayments = reservation.payments.filter(p => 
            p.type === "extra" && p.status === "completed"
          );
          return sum + extraPayments.reduce((paymentSum, p) => paymentSum + p.amount, 0);
        }, 0);

      // Calculate damage revenue (from payments marked as "damage")
      const damageRevenue = reservations
        .filter(r => format(new Date(r.checkIn), "yyyy-MM-dd") <= dateStr && 
                    format(new Date(r.checkOut), "yyyy-MM-dd") >= dateStr)
        .reduce((sum, reservation) => {
          const damagePayments = reservation.payments.filter(p => 
            p.type === "damage" && p.status === "completed"
          );
          return sum + damagePayments.reduce((paymentSum, p) => paymentSum + p.amount, 0);
        }, 0);

      const totalRevenue = occupancyRevenue + extraRevenue + damageRevenue;
      const reservationsCount = activeReservations.length;
      const averageRevenuePerReservation = reservationsCount > 0 ? totalRevenue / reservationsCount : 0;
      const averageRevenuePerRoom = activeReservations.length > 0 ? totalRevenue / activeReservations.length : 0;

      return {
        date: dateStr,
        revenue: totalRevenue,
        occupancyRevenue,
        extraRevenue,
        damageRevenue,
        totalRevenue,
        reservations: reservationsCount,
        averageRevenuePerReservation: Math.round(averageRevenuePerReservation * 100) / 100,
        averageRevenuePerRoom: Math.round(averageRevenuePerRoom * 100) / 100,
      };
    });

    // Calculate channel breakdown
    const channelMap = new Map<string, { revenue: number; reservations: number }>();
    
    reservations.forEach(reservation => {
      const channel = reservation.channel || "Unknown";
      if (!channelMap.has(channel)) {
        channelMap.set(channel, { revenue: 0, reservations: 0 });
      }
      
      const channelData = channelMap.get(channel)!;
      channelData.revenue += reservation.totalPrice;
      channelData.reservations += 1;
    });

    const totalChannelRevenue = Array.from(channelMap.values()).reduce((sum, c) => sum + c.revenue, 0);
    const channelRevenue = Array.from(channelMap.entries()).map(([channel, data]) => ({
      channel,
      revenue: Math.round(data.revenue * 100) / 100,
      reservations: data.reservations,
      percentage: totalChannelRevenue > 0 ? (data.revenue / totalChannelRevenue) * 100 : 0,
    })).sort((a, b) => b.revenue - a.revenue);

    // Calculate room type breakdown
    const roomTypeMap = new Map<string, { revenue: number; reservations: number }>();
    
    reservations.forEach(reservation => {
      const roomType = reservation.room.type || "Standard";
      if (!roomTypeMap.has(roomType)) {
        roomTypeMap.set(roomType, { revenue: 0, reservations: 0 });
      }
      
      const roomTypeData = roomTypeMap.get(roomType)!;
      roomTypeData.revenue += reservation.totalPrice;
      roomTypeData.reservations += 1;
    });

    const roomTypeRevenue = Array.from(roomTypeMap.entries()).map(([roomType, data]) => ({
      roomType,
      revenue: Math.round(data.revenue * 100) / 100,
      reservations: data.reservations,
      averageRevenue: data.reservations > 0 ? Math.round((data.revenue / data.reservations) * 100) / 100 : 0,
    })).sort((a, b) => b.revenue - a.revenue);

    return NextResponse.json({
      success: true,
      data: {
        revenueData,
        channelRevenue,
        roomTypeRevenue,
        summary: {
          dateRange: {
            start: format(startDate, "yyyy-MM-dd"),
            end: format(endDate, "yyyy-MM-dd"),
          },
          totalRevenue: Math.round(revenueData.reduce((sum, d) => sum + d.totalRevenue, 0) * 100) / 100,
          totalReservations: reservations.length,
          averageRevenuePerReservation: reservations.length > 0 
            ? Math.round((revenueData.reduce((sum, d) => sum + d.totalRevenue, 0) / reservations.length) * 100) / 100
            : 0,
        },
      },
    });

  } catch (error) {
    console.error("Revenue report error:", error);
    return NextResponse.json(
      { error: "Failed to generate revenue report" },
      { status: 500 }
    );
  }
}
