/**
 * AgentFlow Pro - Email Sender for GuestCommunication
 * Sends pending guest emails via Resend.
 * Requires RESEND_API_KEY and EMAIL_FROM in env.
 */

import { prisma } from "@/database/schema";
import { sendWorkflowNotificationEmail } from "@/lib/publish/email";

export interface SendPendingResult {
  sent: number;
  failed: number;
  skipped: number;
}

/**
 * Fetches all GuestCommunication with status=pending and channel=email,
 * sends each via Resend, and updates status to 'sent' or 'failed'.
 */
export async function sendPendingGuestEmails(): Promise<SendPendingResult> {
  const result: SendPendingResult = { sent: 0, failed: 0, skipped: 0 };

  if (!process.env.RESEND_API_KEY) {
    console.log("[EmailSender] Skipped: RESEND_API_KEY not set");
    return result;
  }

  const pending = await prisma.guestCommunication.findMany({
    where: { status: "pending", channel: "email" },
    include: { guest: { select: { email: true } } },
    orderBy: { createdAt: "asc" },
  });

  for (const comm of pending) {
    const to = comm.guest?.email?.trim();
    if (!to || !to.includes("@")) {
      await prisma.guestCommunication.update({
        where: { id: comm.id },
        data: { status: "failed" },
      });
      result.skipped++;
      continue;
    }

    const subject = comm.subject ?? "Message from your accommodation";
    try {
      await sendWorkflowNotificationEmail(to, subject, comm.content);
      await prisma.guestCommunication.update({
        where: { id: comm.id },
        data: { status: "sent", sentAt: new Date() },
      });
      result.sent++;
    } catch (error) {
      console.error("[EmailSender] Failed for", comm.id, error);
      await prisma.guestCommunication.update({
        where: { id: comm.id },
        data: { status: "failed" },
      });
      result.failed++;
    }
  }

  return result;
}
