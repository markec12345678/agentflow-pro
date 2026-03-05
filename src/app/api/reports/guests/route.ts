/**
 * GET /api/reports/guests
 * Generate guest demographics report data
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { prisma } from "@/database/schema";
import { getPropertyForUser } from "@/lib/tourism/property-access";
import { format, startOfDay, endOfDay, subMonths } from "date-fns";

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

    // Get all guests with reservations in the date range
    const guests = await prisma.guest.findMany({
      where: {
        reservations: {
          some: {
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
        },
      },
      include: {
        reservations: {
          where: {
            propertyId: propertyIdParam,
            status: {
              in: ["confirmed", "checked_in", "checked_out"],
            },
          },
          select: {
            id: true,
            checkIn: true,
            checkOut: true,
            channel: true,
            totalPrice: true,
            status: true,
          },
          orderBy: {
            checkIn: "desc",
          },
        },
      },
    });

    // Calculate demographics
    const totalGuests = guests.length;
    const vipGuests = guests.filter(g => g.isVip).length;
    
    // Calculate new vs returning guests
    const newGuests = guests.filter(g => g.reservations.length === 1).length;
    const returningGuests = guests.filter(g => g.reservations.length > 1).length;
    
    // Calculate total nights and average stay
    const totalNights = guests.reduce((sum, guest) => {
      return sum + guest.reservations.reduce((reservationSum, reservation) => {
        const checkIn = new Date(reservation.checkIn);
        const checkOut = new Date(reservation.checkOut);
        return reservationSum + Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      }, 0);
    }, 0);
    
    const averageStay = totalGuests > 0 ? totalNights / totalGuests : 0;

    // Calculate country distribution
    const countryMap = new Map<string, number>();
    guests.forEach(guest => {
      const country = guest.countryCode || "Unknown";
      countryMap.set(country, (countryMap.get(country) || 0) + 1);
    });

    const topCountries = Array.from(countryMap.entries())
      .map(([country, count]) => ({
        country,
        count,
        percentage: totalGuests > 0 ? (count / totalGuests) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 countries

    // Calculate age distribution
    const ageMap = new Map<string, number>();
    const now = new Date();
    
    guests.forEach(guest => {
      if (guest.dateOfBirth) {
        const birthDate = new Date(guest.dateOfBirth);
        const age = now.getFullYear() - birthDate.getFullYear();
        
        let ageGroup: string;
        if (age < 18) ageGroup = "Under 18";
        else if (age < 25) ageGroup = "18-24";
        else if (age < 35) ageGroup = "25-34";
        else if (age < 45) ageGroup = "35-44";
        else if (age < 55) ageGroup = "45-54";
        else if (age < 65) ageGroup = "55-64";
        else ageGroup = "65+";
        
        ageMap.set(ageGroup, (ageMap.get(ageGroup) || 0) + 1);
      } else {
        ageMap.set("Unknown", (ageMap.get("Unknown") || 0) + 1);
      }
    });

    const ageDistribution = Array.from(ageMap.entries())
      .map(([ageGroup, count]) => ({
        ageGroup,
        count,
        percentage: totalGuests > 0 ? (count / totalGuests) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Calculate gender distribution
    const genderMap = new Map<string, number>();
    guests.forEach(guest => {
      const gender = guest.gender || "Unknown";
      genderMap.set(gender, (genderMap.get(gender) || 0) + 1);
    });

    const genderDistribution = Array.from(genderMap.entries())
      .map(([gender, count]) => ({
        gender,
        count,
        percentage: totalGuests > 0 ? (count / totalGuests) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Calculate channel distribution
    const channelMap = new Map<string, number>();
    guests.forEach(guest => {
      guest.reservations.forEach(reservation => {
        const channel = reservation.channel || "Unknown";
        channelMap.set(channel, (channelMap.get(channel) || 0) + 1);
      });
    });

    const channelDistribution = Array.from(channelMap.entries())
      .map(([channel, count]) => ({
        channel,
        count,
        percentage: guests.length > 0 ? (count / guests.length) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Calculate monthly trends for the last 12 months
    const monthlyTrends: Array<{
      month: string;
      guests: number;
      newGuests: number;
      returningGuests: number;
    }> = [];

    for (let i = 11; i >= 0; i--) {
      const monthStart = startOfDay(subMonths(endDate, i));
      const monthEnd = endOfDay(subMonths(endDate, i - 1));
      
      const monthGuests = guests.filter(guest => 
        guest.reservations.some(reservation => {
          const checkIn = new Date(reservation.checkIn);
          return checkIn >= monthStart && checkIn <= monthEnd;
        })
      );

      const monthNewGuests = monthGuests.filter(g => g.reservations.length === 1).length;
      const monthReturningGuests = monthGuests.filter(g => g.reservations.length > 1).length;

      monthlyTrends.push({
        month: format(monthStart, "yyyy-MM"),
        guests: monthGuests.length,
        newGuests: monthNewGuests,
        returningGuests: monthReturningGuests,
      });
    }

    const demographics = {
      totalGuests,
      newGuests,
      returningGuests,
      vipGuests,
      averageStay: Math.round(averageStay * 10) / 10,
      totalNights,
      topCountries,
      ageDistribution,
      genderDistribution,
      channelDistribution,
      monthlyTrends,
    };

    return NextResponse.json({
      success: true,
      data: {
        demographics,
        guests: guests.map(guest => ({
          id: guest.id,
          name: guest.name,
          email: guest.email,
          phone: guest.phone,
          countryCode: guest.countryCode,
          dateOfBirth: guest.dateOfBirth,
          gender: guest.gender,
          riskScore: guest.riskScore,
          isVip: guest.isVip,
          gdprConsent: guest.gdprConsent,
          preferences: guest.preferences,
          notes: guest.notes,
          createdAt: guest.createdAt.toISOString(),
          updatedAt: guest.updatedAt.toISOString(),
          reservations: guest.reservations,
        })),
        summary: {
          dateRange: {
            start: format(startDate, "yyyy-MM-dd"),
            end: format(endDate, "yyyy-MM-dd"),
          },
          totalGuests,
          averageStay,
          topCountries: topCountries.slice(0, 5),
        },
      },
    });

  } catch (error) {
    console.error("Guests report error:", error);
    return NextResponse.json(
      { error: "Failed to generate guests report" },
      { status: 500 }
    );
  }
}
