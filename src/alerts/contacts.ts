/**
 * AgentFlow Pro - Role-to-contact resolution for Smart Alerts
 * Resolves director, receptionist, dev to email/phone/webhook.
 */

import type { PrismaClient } from "../../prisma/generated/prisma/client";

export type AlertRole = "director" | "receptionist" | "dev";

export interface DirectorContact {
  email: string | null;
  phone: string | null;
}

export interface ReceptionistContact {
  email: string | null;
  phone: string | null;
}

export interface DevContact {
  slackWebhook: string | null;
}

/**
 * Get director contact (property owner). Used for occupancy alerts.
 */
export async function getDirectorContact(
  prisma: PrismaClient,
  propertyId: string
): Promise<DirectorContact> {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: {
      userId: true,
      users: { take: 1, select: { email: true } },
    },
  });

  if (!property) return { email: null, phone: null };

  let email: string | null = null;
  if (property.userId) {
    const user = await prisma.user.findUnique({
      where: { id: property.userId },
      select: { email: true },
    });
    email = user?.email ?? null;
  }
  if (!email && property.users.length > 0) {
    email = (property.users[0] as { email: string }).email;
  }

  const phone = process.env.SMART_ALERT_DIRECTOR_PHONE?.trim() ?? null;

  return { email, phone };
}

/**
 * Get receptionist contact (env). Used for payment_failed.
 */
export function getReceptionistContact(): ReceptionistContact {
  const email =
    process.env.SMART_ALERT_RECEPTIONIST_EMAIL?.trim() ??
    process.env.ESCALATION_NOTIFY_EMAIL?.trim() ??
    null;
  const phone = process.env.SMART_ALERT_RECEPTIONIST_PHONE?.trim() ?? null;
  return { email, phone };
}

/**
 * Get dev contact (Slack webhook). Used for system_error.
 */
export function getDevContact(): DevContact {
  const slackWebhook =
    process.env.SLACK_ALERTS_WEBHOOK_URL?.trim() ??
    process.env.SLACK_ESCALATION_WEBHOOK_URL?.trim() ??
    null;
  return { slackWebhook };
}
