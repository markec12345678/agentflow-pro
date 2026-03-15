/**
 * AgentFlow Pro - Smart Alert rules and evaluation
 * Triggers notifications only on critical events (occupancy, payment_failed, system_error).
 */

import { prisma } from "@/database/schema";
import { logger } from '@/infrastructure/observability/logger';
import { sendSlack, sendEmail, sendSms } from "./channels";
import {
  getDirectorContact,
  getReceptionistContact,
  getDevContact,
  type AlertRole,
} from "./contacts";

export type AlertChannel = "sms" | "email" | "slack";

export interface AlertRule {
  id: string;
  eventType: string;
  threshold: number | "any";
  action: { channel: AlertChannel; role: AlertRole; messageTemplate?: string };
  cooldownMinutes?: number;
  escalateAfterMinutes?: number;
  escalateTo?: AlertRole;
}

export const alertRules: AlertRule[] = [
  {
    id: "occupancy_critical",
    eventType: "occupancy",
    threshold: 95,
    action: {
      channel: "sms",
      role: "director",
      messageTemplate: "Zasedenost {{value}}% - preveri kapacitete",
    },
    cooldownMinutes: 240, // 4h
    escalateAfterMinutes: 30,
    escalateTo: "dev",
  },
  {
    id: "payment_failed",
    eventType: "payment_failed",
    threshold: 1,
    action: {
      channel: "email",
      role: "receptionist",
      messageTemplate: "Neuspešno plačilo: {{detail}}",
    },
  },
  {
    id: "system_error_burst",
    eventType: "system_error",
    threshold: 3,
    action: {
      channel: "slack",
      role: "dev",
      messageTemplate: "{{count}} napak v 5 min: {{lastError}}",
    },
    cooldownMinutes: 15,
  },
];

export interface AlertContext {
  propertyId?: string;
  userId?: string;
  value?: number;
  detail?: string;
  count?: number;
  lastError?: string;
}

function interpolate(template: string | undefined, context: AlertContext): string {
  if (!template) return "";
  return template
    .replace(/\{\{value\}\}/g, String(context.value ?? ""))
    .replace(/\{\{detail\}\}/g, String(context.detail ?? ""))
    .replace(/\{\{count\}\}/g, String(context.count ?? ""))
    .replace(/\{\{lastError\}\}/g, String(context.lastError ?? ""));
}

function isWithinCooldown(
  eventType: string,
  entityId: string,
  cooldownMinutes: number
): Promise<boolean> {
  const since = new Date(Date.now() - cooldownMinutes * 60 * 1000);
  return prisma.smartAlertLog
    .findFirst({
      where: {
        eventType,
        entityId,
        sentAt: { gte: since },
      },
    })
    .then((log) => !!log);
}

function passesThreshold(rule: AlertRule, value: number | undefined): boolean {
  if (rule.threshold === "any") return true;
  // For events without numeric value (e.g. payment_failed), treat as 1
  const effectiveValue = value ?? 1;
  return effectiveValue >= (rule.threshold as number);
}

async function logAlert(
  eventType: string,
  entityId: string,
  channel: string
): Promise<void> {
  try {
    await prisma.smartAlertLog.create({
      data: { eventType, entityId, channel },
    });
  } catch (e) {
    logger.error("[SmartAlerts] Failed to log alert:", e);
  }
}

/**
 * Evaluate rules and trigger alerts. Fire-and-forget; does not throw.
 */
export async function triggerAlert(
  eventType: string,
  context: AlertContext
): Promise<void> {
  const rules = alertRules.filter((r) => r.eventType === eventType);
  if (rules.length === 0) return;

  const entityId = context.propertyId ?? context.userId ?? "global";
  const value =
    context.value ??
    (eventType === "system_error" ? context.count : undefined);

  for (const rule of rules) {
    if (!passesThreshold(rule, value)) continue;

    if (rule.cooldownMinutes) {
      const inCooldown = await isWithinCooldown(
        eventType,
        entityId,
        rule.cooldownMinutes
      );
      if (inCooldown) continue;
    }

    const channel = rule.action.channel;
    const role = rule.action.role;
    const message = interpolate(rule.action.messageTemplate, context);

    if (role === "director" && context.propertyId) {
      const contact = await getDirectorContact(prisma, context.propertyId);
      if (channel === "sms" && contact.phone) {
        await sendSms(contact.phone, message);
      } else if (contact.email) {
        await sendEmail(
          contact.email,
          `Smart Alert: ${eventType}`,
          message || `Event ${eventType} triggered.`
        );
      }
    } else if (role === "receptionist") {
      const contact = getReceptionistContact();
      if (contact.email) {
        await sendEmail(
          contact.email,
          `Smart Alert: ${eventType}`,
          message || `Event ${eventType} triggered.`
        );
      }
    } else if (role === "dev") {
      const contact = getDevContact();
      if (contact.slackWebhook) {
        await sendSlack(
          contact.slackWebhook,
          message || `[Smart Alert] ${eventType} triggered.`
        );
      }
    }

    await logAlert(eventType, entityId, channel);
  }
}

/**
 * Rules that have escalation configured.
 */
export function getRulesForEscalation(): AlertRule[] {
  return alertRules.filter(
    (r) => r.escalateAfterMinutes != null && r.escalateTo != null
  );
}

/**
 * Check for alerts that need escalation and notify escalateTo role.
 */
export async function runEscalationCheck(): Promise<number> {
  const rules = getRulesForEscalation();
  if (rules.length === 0) return 0;

  let escalated = 0;
  const now = new Date();

  for (const rule of rules) {
    const cutoff = new Date(
      now.getTime() - (rule.escalateAfterMinutes ?? 0) * 60 * 1000
    );

    const pending = await prisma.smartAlertLog.findMany({
      where: {
        eventType: rule.eventType,
        escalatedAt: null,
        sentAt: { lt: cutoff },
      },
      take: 50,
    });

    const role = rule.escalateTo!;
    const message = `Eskalacija: ${rule.eventType} (entityId: {{entityId}}) - ni odziva v ${rule.escalateAfterMinutes} min`;

    for (const log of pending) {
      const msg = message.replace("{{entityId}}", log.entityId);

      if (role === "dev") {
        const contact = getDevContact();
        if (contact.slackWebhook) {
          await sendSlack(contact.slackWebhook, msg);
        }
      } else if (role === "receptionist") {
        const contact = getReceptionistContact();
        if (contact.email) {
          await sendEmail(
            contact.email,
            `Smart Alert Eskalacija: ${rule.eventType}`,
            msg
          );
        }
      } else if (role === "director" && log.entityId) {
        const contact = await getDirectorContact(prisma, log.entityId);
        if (contact.email) {
          await sendEmail(
            contact.email,
            `Smart Alert Eskalacija: ${rule.eventType}`,
            msg
          );
        }
      }

      await prisma.smartAlertLog.update({
        where: { id: log.id },
        data: { escalatedAt: now, escalatedTo: role },
      });
      escalated++;
    }
  }

  return escalated;
}
