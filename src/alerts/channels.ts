/**
 * AgentFlow Pro - Smart Alert delivery channels
 * Slack, Email, SMS (Twilio). Fire-and-forget; do not throw.
 */

import { sendWorkflowNotificationEmail } from "@/lib/publish/email";
import { logger } from '@/infrastructure/observability/logger';

/**
 * Send Slack message via incoming webhook.
 * If webhookUrl is empty, skips and logs.
 */
export async function sendSlack(webhookUrl: string | undefined, text: string): Promise<void> {
  const url = webhookUrl?.trim();
  if (!url) {
    logger.info("[SmartAlerts] Slack skipped: no webhook URL");
    return;
  }
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
  } catch (e) {
    logger.error("[SmartAlerts] Slack failed:", e);
  }
}

/**
 * Send email via Resend.
 * If to is invalid or Resend not configured, skips.
 */
export async function sendEmail(to: string | undefined, subject: string, body: string): Promise<void> {
  if (!to?.includes("@")) {
    logger.info("[SmartAlerts] Email skipped: invalid or missing to");
    return;
  }
  try {
    await sendWorkflowNotificationEmail(to, subject, body);
  } catch (e) {
    logger.error("[SmartAlerts] Email failed:", e);
  }
}

/**
 * Send SMS via Twilio.
 * If TWILIO_* env vars not set, skips and logs. Does not throw.
 */
export async function sendSms(to: string | undefined, message: string): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_FROM?.trim();

  if (!accountSid || !authToken || !from || !to?.replace(/\D/g, "")) {
    logger.info("[SmartAlerts] SMS skipped: TWILIO_* not configured or invalid to");
    return;
  }
  if (process.env.DRY_RUN === "true") {
    logger.info("[DRY RUN] SMS would be sent to:", to, "message:", message.substring(0, 50) + "...");
    return;
  }

  try {
    const body = new URLSearchParams({
      To: to,
      From: from,
      Body: message,
    });
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      }
    );
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Twilio ${res.status}: ${err}`);
    }
  } catch (e) {
    logger.error("[SmartAlerts] SMS failed:", e);
  }
}
