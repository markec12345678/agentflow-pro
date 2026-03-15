/**
 * GET /api/dashboard/tasks
 * Get pending tasks
 */

import { NextRequest, NextResponse } from "next/server";
import { logger } from '@/infrastructure/observability/logger';
import { prisma } from "@/infrastructure/database/prisma";

export async function GET(request: NextRequest) {
  try {
    const tasks = await prisma.housekeepingTask.findMany({
      where: {
        status: {
          in: ["pending", "in_progress"],
        },
      },
      take: 10,
      orderBy: { priority: "desc" },
      include: {
        assignedTo: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    logger.error("[Dashboard Tasks] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 },
    );
  }
}
