/**
 * AgentFlow Pro - HITL escalation notifications (Slack, Email)
 * Called when ChatEscalation is created (low-confidence AI response).
 * Set SLACK_ESCALATION_WEBHOOK_URL and/or ESCALATION_NOTIFY_EMAIL in env.
 */

import { sendWorkflowNotificationEmail } from "@/lib/publish/email";

export interface EscalationCreatedPayload {
  escalationId: string;
  userId: string;
  threadId: string | null;
  lastMessagePreview: string;
  confidence: number;
}

/**
 * Notify staff about new HITL escalation via Slack and/or Email.
 * Fire-and-forget; does not throw.
 */
export async function notifyEscalationCreated(payload: EscalationCreatedPayload): Promise<void> {
  const { escalationId, userId, threadId, lastMessagePreview, confidence } = payload;

  const slackUrl = process.env.SLACK_ESCALATION_WEBHOOK_URL?.trim();
  const notifyEmail = process.env.ESCALATION_NOTIFY_EMAIL?.trim();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

  const shortPreview = lastMessagePreview.slice(0, 200) + (lastMessagePreview.length > 200 ? "…" : "");
  const dashboardUrl = `${baseUrl}/dashboard/escalations`;
  const chatUrl = threadId ? `${baseUrl}/chat?threadId=${threadId}` : null;

  // Slack
  if (slackUrl) {
    try {
      const text =
        `HITL Escalation (${Math.round(confidence * 100)}%): ${shortPreview}\n` +
        `Dashboard: ${dashboardUrl}` +
        (chatUrl ? `\nChat: ${chatUrl}` : "");
      await fetch(slackUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
    } catch (e) {
      console.error("[EscalationNotify] Slack failed:", e);
    }
  }

  // Email
  if (notifyEmail && notifyEmail.includes("@")) {
    try {
      const subject = `HITL Escalation: ${Math.round(confidence * 100)}% confidence`;
      const body = `Nova escalation (ID: ${escalationId})
User: ${userId}
Preview: ${shortPreview}
Dashboard: ${dashboardUrl}
${chatUrl ? `Chat: ${chatUrl}` : ""}`;
      await sendWorkflowNotificationEmail(notifyEmail, subject, body);
    } catch (e) {
      console.error("[EscalationNotify] Email failed:", e);
    }
  }
}
