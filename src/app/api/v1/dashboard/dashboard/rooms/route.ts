/**
 * GET /api/dashboard/rooms
 * Get room status
 */

import { NextRequest, NextResponse } from "next/server";
import { logger } from '@/infrastructure/observability/logger';
import { prisma } from "@/infrastructure/database/prisma";

export async function GET(request: NextRequest) {
  try {
    const rooms = await prisma.room.findMany({
      take: 20,
      include: {
        type: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { number: "asc" },
    });

    return NextResponse.json({ rooms });
  } catch (error) {
    logger.error("[Dashboard Rooms] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch rooms" },
      { status: 500 },
    );
  }
}
