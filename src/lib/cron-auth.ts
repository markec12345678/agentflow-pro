/**
 * Shared cron job authentication.
 * Protects cron endpoints: CRON_SECRET + x-vercel-cron header.
 *
 * Note: Vercel rejects CRON_SECRET if it contains leading/trailing whitespace.
 * When pasting in Vercel Dashboard, ensure no extra spaces or newlines.
 */

import type { NextRequest } from "next/server";

export function verifyCronAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const raw = process.env.CRON_SECRET ?? "";
  const cronSecret = raw.trim();
  if (raw !== cronSecret && raw.length > 0) {
    console.warn(
      "CRON_SECRET has leading/trailing whitespace – Vercel cron may fail. Remove spaces in Vercel env."
    );
  }
  const token = authHeader?.replace(/^Bearer\s+/i, "").trim() ?? "";
  if (cronSecret && token && token === cronSecret) return true;
  if (request.headers.get("x-vercel-cron") === "1") return true;
  return !cronSecret; // dev: allow if no secret set
}
