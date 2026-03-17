/**
 * Cron: Send Pending Guest Emails
 *
 * Runs every 5 minutes via Vercel Cron
 * Sends all pending guest communications via Resend API
 */

import { NextRequest, NextResponse } from "next/server";
import { logger } from '@/infrastructure/observability/logger';
import { sendPendingGuestEmails } from "@/core/domain/tourism/services/email-sender";
import { handleApiError, withRequestLogging } from "@/app/api/middleware";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * POST /api/cron/send-guest-emails
 * Triggered by Vercel Cron
 */
export async function POST(request: NextRequest): Promise<NextResponse<any>> {
  return withRequestLogging(
    request,
    async () => {
      // 1. Verify cron secret
      const authHeader = request.headers.get("authorization");
      const cronSecret = process.env.CRON_SECRET;

      if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // 2. Send pending emails
      const result = await sendPendingGuestEmails();

      // 3. Log results
      logger.info("[Cron:GuestEmails]", {
        sent: result.sent,
        failed: result.failed,
        skipped: result.skipped,
        timestamp: new Date().toISOString(),
      });

      // 4. Return success
      return NextResponse.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    },
    "/api/v1/cron/send-guest-emails",
  );
}

/**
 * GET /api/cron/send-guest-emails
 * Manual trigger (for testing)
 */
export async function GET(request: NextRequest): Promise<NextResponse<any>> {
  // Only allow in development
  if (process.env.NODE_ENV === "production" && !process.env.ALLOW_MANUAL_CRON) {
    return NextResponse.json(
      { error: "Manual cron trigger disabled in production" },
      { status: 403 },
    );
  }

  return POST(request);
}
