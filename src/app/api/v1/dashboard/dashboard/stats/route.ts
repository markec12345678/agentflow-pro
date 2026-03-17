/**
 * GET /api/dashboard/stats
 * Get dashboard statistics
 */

import { NextRequest, NextResponse } from "next/server";
import { logger } from '@/infrastructure/observability/logger';
import { prisma } from "@/infrastructure/database/prisma";

export async function GET(request: NextRequest) {
  try {
    // Get counts from database
    const [
      totalProperties,
      totalRooms,
      totalGuests,
      totalReservations,
      checkInsToday,
      checkOutsToday,
    ] = await Promise.all([
      prisma.property.count(),
      prisma.room.count(),
      prisma.guest.count(),
      prisma.reservation.count(),
      prisma.reservation.count({
        where: {
          checkIn: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),
      prisma.reservation.count({
        where: {
          checkOut: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),
    ]);

    return NextResponse.json({
      stats: {
        totalProperties,
        totalRooms,
        totalGuests,
        totalReservations,
        checkInsToday,
        checkOutsToday,
        occupancyRate:
          totalRooms > 0 ? Math.round((checkInsToday / totalRooms) * 100) : 0,
      },
    });
  } catch (error) {
    logger.error("[Dashboard Stats] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 },
    );
  }
}
