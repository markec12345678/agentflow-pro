/**
 * GET /api/tourism/forecasting/occupancy
 * Predict future occupancy and revenue based on historical data and trends
 * Query: propertyId, days (default 30)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { prisma } from "@/database/schema";
import { getPropertyForUser } from "@/lib/tourism/property-access";
import { addDays, startOfDay, endOfDay, eachDayOfInterval, format, subDays } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");
    const daysParam = searchParams.get("days") || "30";
    const days = parseInt(daysParam);

    if (!propertyId) {
      return NextResponse.json({ error: "propertyId is required" }, { status: 400 });
    }

    const property = await getPropertyForUser(propertyId, userId);
    if (!property) {
      return NextResponse.json({ error: "Property not found or access denied" }, { status: 403 });
    }

    const today = startOfDay(new Date());
    const forecastStart = addDays(today, 1);
    const forecastEnd = addDays(today, days);

    // Get historical data (same period last year or last 90 days)
    const historicalStart = subDays(today, 90);
    const historicalReservations = await prisma.reservation.findMany({
      where: {
        propertyId,
        checkIn: { gte: historicalStart },
        checkOut: { lte: today },
        status: { in: ["confirmed", "checked_in", "checked_out"] },
      },
      include: {
        room: true,
      },
    });

    // Get future bookings (already confirmed)
    const futureReservations = await prisma.reservation.findMany({
      where: {
        propertyId,
        checkIn: { gte: forecastStart, lte: forecastEnd },
        status: { in: ["confirmed", "checked_in"] },
      },
    });

    const rooms = await prisma.room.findMany({ where: { propertyId } });
    const totalRooms = rooms.length;

    // Calculate historical averages
    const historicalDaily: Record<string, { occupied: number; revenue: number }> = {};
    
    historicalReservations.forEach((res) => {
      let currentDay = startOfDay(res.checkIn);
      const checkOut = startOfDay(res.checkOut);
      const dailyRevenue = (res.totalPrice || 0) / Math.max(1, Math.ceil((checkOut.getTime() - currentDay.getTime()) / (1000 * 60 * 60 * 24)));

      while (currentDay < checkOut) {
        const dateStr = format(currentDay, "yyyy-MM-dd");
        if (!historicalDaily[dateStr]) {
          historicalDaily[dateStr] = { occupied: 0, revenue: 0 };
        }
        historicalDaily[dateStr].occupied++;
        historicalDaily[dateStr].revenue += dailyRevenue;
        currentDay = addDays(currentDay, 1);
      }
    });

    // Calculate average occupancy by day of week
    const dowOccupancy: Record<number, number[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    Object.entries(historicalDaily).forEach(([dateStr, data]) => {
      const day = new Date(dateStr).getDay();
      const occupancy = (data.occupied / totalRooms) * 100;
      dowOccupancy[day].push(occupancy);
    });

    const avgDowOccupancy = Object.entries(dowOccupancy).reduce(
      (acc, [day, values]) => {
        acc[parseInt(day)] = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 50;
        return acc;
      },
      {} as Record<number, number>
    );

    // Calculate trend (is occupancy increasing or decreasing?)
    const sortedDates = Object.keys(historicalDaily).sort();
    const recentOccupancy = sortedDates.slice(-14).map((d) => historicalDaily[d].occupied / totalRooms);
    const olderOccupancy = sortedDates.slice(0, 14).map((d) => historicalDaily[d].occupied / totalRooms);
    
    const recentAvg = recentOccupancy.length > 0 ? recentOccupancy.reduce((a, b) => a + b, 0) / recentOccupancy.length : 0.5;
    const olderAvg = olderOccupancy.length > 0 ? olderOccupancy.reduce((a, b) => a + b, 0) / olderOccupancy.length : 0.5;
    const trend = olderAvg > 0 ? (recentAvg - olderAvg) / olderAvg : 0; // Percentage change

    // Generate forecast
    const forecast = eachDayOfInterval({ start: forecastStart, end: forecastEnd }).map((date) => {
      const dayOfWeek = date.getDay();
      const baseOccupancy = avgDowOccupancy[dayOfWeek] || 50;
      
      // Apply trend
      const adjustedOccupancy = Math.min(100, Math.max(0, baseOccupancy * (1 + trend)));
      
      // Add already booked rooms
      const bookedCount = futureReservations.filter((res) => {
        const checkIn = startOfDay(res.checkIn);
        const checkOut = startOfDay(res.checkOut);
        return date >= checkIn && date < checkOut;
      }).length;

      const predictedOccupied = Math.max(
        bookedCount,
        Math.round((adjustedOccupancy / 100) * totalRooms)
      );

      const predictedOccupancyRate = (predictedOccupied / totalRooms) * 100;
      const avgRate = property.basePrice || 100;
      const predictedRevenue = predictedOccupied * avgRate;

      // Confidence score (higher for near-term, lower for far-term)
      const daysAhead = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const confidence = Math.max(50, 100 - (daysAhead * 2)); // Decreases 2% per day

      return {
        date: format(date, "yyyy-MM-dd"),
        dayOfWeek: format(date, "EEE"),
        predictedOccupied,
        totalRooms,
        predictedOccupancyRate: Math.round(predictedOccupancyRate * 100) / 100,
        predictedRevenue: Math.round(predictedRevenue * 100) / 100,
        alreadyBooked: bookedCount,
        confidence: Math.round(confidence),
      };
    });

    // Summary metrics
    const totalPredictedRevenue = forecast.reduce((sum, day) => sum + day.predictedRevenue, 0);
    const avgPredictedOccupancy = forecast.reduce((sum, day) => sum + day.predictedOccupancyRate, 0) / forecast.length;
    const peakDays = forecast.filter((day) => day.predictedOccupancyRate > 80).length;
    const lowDays = forecast.filter((day) => day.predictedOccupancyRate < 40).length;

    return NextResponse.json({
      forecast,
      summary: {
        totalPredictedRevenue: Math.round(totalPredictedRevenue * 100) / 100,
        avgPredictedOccupancy: Math.round(avgPredictedOccupancy * 100) / 100,
        peakDays,
        lowDays,
        trend: Math.round(trend * 100) / 100, // Percentage
      },
      insights: [
        trend > 0.05 
          ? "Trend is positive - occupancy is increasing compared to recent period" 
          : trend < -0.05
          ? "Trend is negative - consider promotional campaigns"
          : "Occupancy trend is stable",
        peakDays > 0
          ? `${peakDays} peak days predicted - ensure adequate staffing`
          : "No peak days expected in this period",
        lowDays > 0
          ? `${lowDays} low-occupancy days - consider discounts or packages`
          : "Occupancy looks healthy throughout the period",
      ],
      period: {
        start: forecastStart.toISOString(),
        end: forecastEnd.toISOString(),
      },
    });
  } catch (error) {
    console.error("[Forecasting] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate forecast" },
      { status: 500 }
    );
  }
}
