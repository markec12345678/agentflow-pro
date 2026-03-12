/**
 * AgentFlow Pro - Approval Workflow System
 * Human-in-the-loop approvals for reservations, price changes, content, and refunds
 */

import { prisma } from "@/database/schema";
import { addHours, isBefore } from "date-fns";

export type ApprovalType = "reservation" | "price_change" | "content" | "refund" | "bulk_operation";
export type ApprovalStatus = "pending" | "approved" | "rejected" | "expired";

export interface ApprovalRequest {
  id: string;
  type: ApprovalType;
  status: ApprovalStatus;
  requestedBy: string;
  assignedTo?: string[];
  details: any;
  reason?: string;
  createdAt: Date;
  expiresAt: Date;
  respondedAt?: Date;
  respondedBy?: string;
}

export interface ApprovalRules {
  reservation?: {
    minAmount?: number;
    maxAmount?: number;
    minNights?: number;
    maxNights?: number;
    requireApprovalForChannels?: string[];
  };
  price_change?: {
    maxDiscountPercent?: number;
    maxIncreasePercent?: number;
  };
  refund?: {
    maxAmount?: number;
    maxPercent?: number;
  };
}

/**
 * Create approval request
 */
export async function createApprovalRequest(data: {
  type: ApprovalType;
  details: any;
  requestedBy: string;
  assignedTo?: string[];
  reason?: string;
  expiresAt?: Date;
}): Promise<ApprovalRequest> {
  const approval = await prisma.approvalRequest.create({
    data: {
      type: data.type,
      status: "pending",
      requestedBy: data.requestedBy,
      assignedTo: data.assignedTo || [],
      details: data.details,
      reason: data.reason,
      expiresAt: data.expiresAt || addHours(new Date(), 24),
      createdAt: new Date(),
    },
  });

  // Send notifications
  await sendApprovalNotifications(approval);

  return approval;
}

/**
 * Check if reservation requires approval
 */
export function requiresReservationApproval(reservation: {
  totalAmount: number;
  nights?: number;
  channel?: string;
  propertyId: string;
}): boolean {
  // Get property approval rules
  const rules = getPropertyApprovalRules(reservation.propertyId);

  if (!rules.reservation) return false;

  // Check minimum amount
  if (rules.reservation.minAmount && reservation.totalAmount >= rules.reservation.minAmount) {
    return true;
  }

  // Check maximum amount
  if (rules.reservation.maxAmount && reservation.totalAmount > rules.reservation.maxAmount) {
    return true;
  }

  // Check minimum nights
  if (rules.reservation.minNights && reservation.nights && reservation.nights >= rules.reservation.minNights) {
    return true;
  }

  // Check maximum nights
  if (rules.reservation.maxNights && reservation.nights && reservation.nights > rules.reservation.maxNights) {
    return true;
  }

  // Check channel
  if (rules.reservation.requireApprovalForChannels?.includes(reservation.channel || "")) {
    return true;
  }

  return false;
}

/**
 * Approve request
 */
export async function approveRequest(
  approvalId: string,
  respondedBy: string,
  notes?: string
): Promise<ApprovalRequest> {
  const approval = await prisma.approvalRequest.update({
    where: { id: approvalId },
    data: {
      status: "approved",
      respondedAt: new Date(),
      respondedBy,
      metadata: {
        notes,
      },
    },
  });

  // Execute approved action
  await executeApprovedAction(approval);

  // Send confirmation notification
  await sendApprovalResponseNotification(approval, "approved");

  return approval;
}

/**
 * Reject request
 */
export async function rejectRequest(
  approvalId: string,
  respondedBy: string,
  reason: string
): Promise<ApprovalRequest> {
  const approval = await prisma.approvalRequest.update({
    where: { id: approvalId },
    data: {
      status: "rejected",
      respondedAt: new Date(),
      respondedBy,
      rejectionReason: reason,
    },
  });

  // Send rejection notification
  await sendApprovalResponseNotification(approval, "rejected");

  return approval;
}

/**
 * Get pending approvals for user
 */
export async function getPendingApprovals(userId: string): Promise<ApprovalRequest[]> {
  const approvals = await prisma.approvalRequest.findMany({
    where: {
      status: "pending",
      expiresAt: { gt: new Date() },
      OR: [
        { assignedTo: { has: userId } },
        { assignedTo: { isEmpty: true } }, // Unassigned - anyone can approve
      ],
    },
    orderBy: { createdAt: "desc" },
  });

  return approvals;
}

/**
 * Auto-expire old approvals
 */
export async function expireOldApprovals(): Promise<number> {
  const now = new Date();
  
  const result = await prisma.approvalRequest.updateMany({
    where: {
      status: "pending",
      expiresAt: { lte: now },
    },
    data: {
      status: "expired",
    },
  });

  return result.count;
}

/**
 * Send approval notifications
 */
async function sendApprovalNotifications(approval: ApprovalRequest): Promise<void> {
  // Get assigned users or property owners
  const recipients = approval.assignedTo?.length > 0
    ? approval.assignedTo
    : await getPropertyOwners(approval.details.propertyId);

  // Send email notifications
  for (const recipientId of recipients) {
    try {
      await prisma.notification.create({
        data: {
          userId: recipientId,
          type: "approval_request",
          title: `Nov zahtevek za odobritev: ${approval.type}`,
          message: `Zahtevek tipa ${approval.type} čaka na vašo odobritev.`,
          metadata: {
            approvalId: approval.id,
            type: approval.type,
          },
        },
      });
    } catch (error) {
      console.error("[Approval Notification] Error:", error);
    }
  }
}

/**
 * Send approval response notification
 */
async function sendApprovalResponseNotification(
  approval: ApprovalRequest,
  response: "approved" | "rejected"
): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId: approval.requestedBy,
        type: "approval_response",
        title: `Zahtevek ${response === "approved" ? "odobren" : "zavrnjen"}`,
        message: `Vaš zahtevek tipa ${approval.type} je bil ${response === "approved" ? "odobren" : "zavrnjen"}.`,
        metadata: {
          approvalId: approval.id,
          response,
          reason: approval.rejectionReason,
        },
      },
    });
  } catch (error) {
    console.error("[Approval Response Notification] Error:", error);
  }
}

/**
 * Execute approved action
 */
async function executeApprovedAction(approval: ApprovalRequest): Promise<void> {
  switch (approval.type) {
    case "reservation":
      // Confirm reservation
      await prisma.reservation.update({
        where: { id: approval.details.reservationId },
        data: { status: "confirmed" },
      });
      break;

    case "price_change":
      // Apply price change
      await prisma.property.update({
        where: { id: approval.details.propertyId },
        data: { basePrice: approval.details.newPrice },
      });
      break;

    case "refund":
      // Process refund
      await prisma.payment.create({
        data: {
          reservationId: approval.details.reservationId,
          type: "refund",
          amount: -approval.details.amount,
          status: "completed",
        },
      });
      break;

    case "content":
      // Publish content
      await prisma.generatedContent.update({
        where: { id: approval.details.contentId },
        data: { status: "published" },
      });
      break;
  }
}

/**
 * Get property approval rules
 */
function getPropertyApprovalRules(propertyId: string): ApprovalRules {
  // In production, fetch from database
  return {
    reservation: {
      minAmount: 1000, // Require approval for bookings over €1000
      minNights: 7,    // Require approval for stays over 7 nights
      requireApprovalForChannels: ["expedia"], // Require approval for certain channels
    },
    price_change: {
      maxDiscountPercent: 20, // Max 20% discount without approval
      maxIncreasePercent: 30, // Max 30% increase without approval
    },
    refund: {
      maxAmount: 500, // Max €500 refund without approval
      maxPercent: 50, // Max 50% refund without approval
    },
  };
}

/**
 * Get property owners/admins
 */
async function getPropertyOwners(propertyId: string): Promise<string[]> {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { userId: true },
  });

  return property ? [property.userId] : [];
}
