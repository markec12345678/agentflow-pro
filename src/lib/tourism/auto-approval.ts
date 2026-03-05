/**
 * AgentFlow Pro - Auto-Approval Engine for Reservations
 * Applies configurable rules to auto-confirm pending reservations from PMS sync.
 */

import { prisma } from "@/database/schema";
import type { PmsReservation } from "./pms-adapter";

export interface AutoApprovalRules {
  enabled: boolean;
  channels?: string[];
  maxAmount?: number;
}

/**
 * Check if a pending reservation passes auto-approval rules.
 */
export function shouldAutoApprove(
  reservation: PmsReservation,
  rules: AutoApprovalRules | null
): boolean {
  if (!rules?.enabled) return false;

  const channel = (reservation.channel ?? "").toLowerCase();
  if (rules.channels && rules.channels.length > 0) {
    const allowed = rules.channels.map((c) => c.toLowerCase());
    if (!allowed.includes(channel) && !allowed.includes("*")) return false;
  }

  if (rules.maxAmount != null && rules.maxAmount > 0) {
    const amount = reservation.totalPrice ?? 0;
    if (amount > rules.maxAmount) return false;
  }

  return true;
}

/**
 * Update reservation status to confirmed.
 */
export async function applyAutoApproval(reservationId: string): Promise<void> {
  await prisma.reservation.update({
    where: { id: reservationId },
    data: { status: "confirmed" },
  });
}
