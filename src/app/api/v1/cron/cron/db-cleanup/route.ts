/**
 * AgentFlow Pro - DB Cleanup Cron
 * Removes expired Session and VerificationToken records.
 * Schedule: 0 3 * * * (3:00 UTC daily)
 */

import { NextRequest, NextResponse } from "next/server";
import { logger } from '@/infrastructure/observability/logger';
import { prisma } from "@/database/schema";
import { verifyCronAuth } from "@/lib/cron-auth";

export async function GET(request: NextRequest) {
  try {
    if (!verifyCronAuth(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    const sessionResult = await prisma.session.deleteMany({
      where: { expires: { lt: now } },
    });

    const tokenResult = await prisma.verificationToken.deleteMany({
      where: { expires: { lt: now } },
    });

    return NextResponse.json({
      success: true,
      deleted: {
        sessions: sessionResult.count,
        verificationTokens: tokenResult.count,
      },
    });
  } catch (error) {
    logger.error("DB cleanup error:", error);
    return NextResponse.json(
      { error: "DB cleanup failed" },
      { status: 500 }
    );
  }
}
