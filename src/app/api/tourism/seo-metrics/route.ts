/**
 * Tourism SEO Metrics API
 * GET: fetch SEO metrics (keywords, position, volume, difficulty) for current user
 */

import { NextResponse } from "next/server";
import { logger } from '@/infrastructure/observability/logger';
import { getServerSession } from "next-auth";
import { prisma } from "@/database/schema";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const metrics = await prisma.seoMetric.findMany({
      where: { userId },
      orderBy: { keyword: "asc" },
    });

    return NextResponse.json({ metrics });
  } catch (error) {
    logger.error("SEO metrics error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
