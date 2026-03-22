import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { getPropertyForUser } from "@/lib/tourism/property-access";
import { parseISO, eachDayOfInterval, format, differenceInDays } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");
    const checkInStr = searchParams.get("checkIn");
    const checkOutStr = searchParams.get("checkOut");

    if (!propertyId || !checkInStr || !checkOutStr) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const property = await getPropertyForUser(propertyId, userId);
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 403 });
    }

    const checkIn = parseISO(checkInStr);
    const checkOut = parseISO(checkOutStr);
    const nights = differenceInDays(checkOut, checkIn);

    if (nights <= 0) {
      return NextResponse.json({ error: "Check-out must be after check-in" }, { status: 400 });
    }

    // Check availability (for simplicity, we check if any reservation overlaps)
    // In a real system with multiple rooms, we would check specific room availability
    const overlapping = await prisma.reservation.findMany({
      where: {
        propertyId,
        status: { not: "cancelled" },
        OR: [
          {
            checkIn: { lte: checkIn },
            checkOut: { gt: checkIn },
          },
          {
            checkIn: { lt: checkOut },
            checkOut: { gte: checkOut },
          },
          {
            checkIn: { gte: checkIn },
            checkOut: { lte: checkOut },
          },
        ],
      },
    });

    // Dynamic price calculation
    const basePrice = property.basePrice || 0;
    let totalPrice = basePrice * nights;

    // Apply season rates if available
    if (property.seasonRates) {
      const seasonRates = property.seasonRates as any;
      const days = eachDayOfInterval({ start: checkIn, end: subDays(checkOut, 1) });
      
      totalPrice = 0;
      for (const day of days) {
        const dayStr = format(day, "MM-dd");
        let dayPrice = basePrice;
        
        // High season check
        if (seasonRates.high) {
          for (const period of seasonRates.high) {
            if (dayStr >= period.from && dayStr <= period.to) {
              dayPrice = period.rate;
              break;
            }
          }
        }
        // ... could add mid/low season too
        totalPrice += dayPrice;
      }
    }

    return NextResponse.json({
      available: overlapping.length < (property.capacity || 1),
      overlappingCount: overlapping.length,
      capacity: property.capacity || 1,
      nights,
      totalPrice,
      basePrice,
      autoApprove: true, // For manual entry, it's usually always auto-approved
    });
  } catch (error) {
    console.error("Availability API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function subDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
}
