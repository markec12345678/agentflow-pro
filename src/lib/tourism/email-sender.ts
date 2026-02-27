/**
 * AgentFlow Pro - Email & WhatsApp Sender for GuestCommunication
 * Sends pending guest communications via Resend (email) or WhatsApp Cloud API.
 */

import { prisma } from "@/database/schema";
import { sendWorkflowNotificationEmail } from "@/lib/publish/email";
import { sendWhatsAppMessage } from "@/infrastructure/messaging/WhatsAppAdapter";

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

/**
 * Sends pending GuestCommunication with channel=whatsapp via Meta Cloud API.
 * Requires Guest.phone; skips if phone is missing.
 */
export async function sendPendingWhatsAppMessages(): Promise<SendPendingResult> {
  const result: SendPendingResult = { sent: 0, failed: 0, skipped: 0 };

  const pending = await prisma.guestCommunication.findMany({
    where: { status: "pending", channel: "whatsapp" },
    include: { guest: { select: { phone: true } } },
    orderBy: { createdAt: "asc" },
  });

  for (const comm of pending) {
    const phone = comm.guest?.phone?.trim();
    if (!phone || phone.length < 9) {
      await prisma.guestCommunication.update({
        where: { id: comm.id },
        data: { status: "failed" },
      });
      result.skipped++;
      continue;
    }

    const outcome = await sendWhatsAppMessage(comm.content, phone);
    if (outcome.success) {
      await prisma.guestCommunication.update({
        where: { id: comm.id },
        data: { status: "sent", sentAt: new Date() },
      });
      result.sent++;
    } else {
      console.error("[WhatsAppSender] Failed for", comm.id, outcome.error);
      await prisma.guestCommunication.update({
        where: { id: comm.id },
        data: { status: "failed" },
      });
      result.failed++;
    }
  }

  return result;
}
