import { NextRequest, NextResponse } from "next/server";
import { logger } from '@/infrastructure/observability/logger';
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { getPropertyIdsForUser } from "@/lib/tourism/property-access";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const propertyIds = await getPropertyIdsForUser(userId);
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const properties = await prisma.property.findMany({
      where: { id: { in: propertyIds } },
      include: {
        reservations: {
          where: {
            OR: [
              { checkIn: { gte: monthStart, lte: monthEnd } },
              { checkOut: { gte: monthStart, lte: monthEnd } },
              { AND: [{ checkIn: { lte: monthStart } }, { checkOut: { gte: monthEnd } }] }
            ],
            status: { not: "cancelled" }
          }
        },
        ajpesConnection: {
          select: { rnoId: true }
        }
      }
    });

    const summary = properties.map(property => {
      // Calculate occupancy (simplified: days booked / days in month)
      const daysInMonth = 30; // Approximation
      let bookedNights = 0;
      let monthlyRevenue = 0;

      property.reservations.forEach(res => {
        // Calculate nights within this month
        const start = res.checkIn < monthStart ? monthStart : res.checkIn;
        const end = res.checkOut > monthEnd ? monthEnd : res.checkOut;
        const nights = Math.max(0, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
        
        bookedNights += nights;
        
        // Revenue (simplified: total price proportional to nights in month)
        const totalNights = Math.max(1, Math.ceil((res.checkOut.getTime() - res.checkIn.getTime()) / (1000 * 60 * 60 * 24)));
        monthlyRevenue += (res.totalPrice || 0) * (nights / totalNights);
      });

      const occupancyRate = (bookedNights / (daysInMonth * (property.capacity || 1))) * 100;

      // eTurizem sync status logic (simulation based on ajpesConnection)
      let eturizemStatus: "synced" | "pending" | "error" = "pending";
      if (property.ajpesConnection) {
        // Check if any reservation in the last 24h is NOT synced
        const unsyncedCount = property.reservations.filter(r => 
          r.status === "confirmed" && !r.eturizemSubmittedAt
        ).length;
        eturizemStatus = unsyncedCount > 0 ? "pending" : "synced";
      } else {
        eturizemStatus = "error";
      }

      return {
        id: property.id,
        name: property.name,
        location: property.location,
        type: property.type,
        status: "active", // Default
        occupancyRate: Math.min(100, occupancyRate),
        monthlyRevenue,
        eturizemStatus,
        basePrice: property.basePrice,
        currency: property.currency || "EUR"
      };
    });

    return NextResponse.json(summary);
  } catch (error) {
    logger.error("Properties summary API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
