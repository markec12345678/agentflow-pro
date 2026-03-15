/**
 * GET /api/dashboard/guests
 * Get recent guests
 */

import { NextRequest, NextResponse } from "next/server";
import { logger } from '@/infrastructure/observability/logger';
import { prisma } from "@/infrastructure/database/prisma";

export async function GET(request: NextRequest) {
  try {
    const guests = await prisma.guest.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ guests });
  } catch (error) {
    logger.error("[Dashboard Guests] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch guests" },
      { status: 500 },
    );
  }
}
