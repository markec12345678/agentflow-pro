/**
 * POST /api/tourism/channel-manager/webhook
 * Webhook handler for OTA channel updates (Booking.com, Airbnb, Expedia)
 * 
 * Handles:
 * - New reservations
 * - Reservation modifications
 * - Cancellations
 * - Availability updates
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/database/schema";
import { shouldAutoApprove } from "@/lib/tourism/auto-approval";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, channel, reservationData, signature } = body;

    // Verify webhook signature (channel-specific)
    const isValid = await verifyWebhookSignature(channel, signature, body);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    switch (action) {
      case "new_reservation":
        return handleNewReservation(channel, reservationData);
      
      case "modify_reservation":
        return handleModifyReservation(channel, reservationData);
      
      case "cancel_reservation":
        return handleCancelReservation(channel, reservationData);
      
      case "availability_update":
        return handleAvailabilityUpdate(channel, body);
      
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    logger.error("[Channel Manager Webhook] Error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

/**
 * Verify webhook signature from OTA
 */
async function verifyWebhookSignature(
  channel: string,
  signature: string,
  body: any
): Promise<boolean> {
  // Channel-specific signature verification
  switch (channel.toLowerCase()) {
    case "booking.com": {
      const hmac = await crypto.subtle.sign(
        "HMAC",
        await crypto.subtle.importKey(
          "raw",
          new TextEncoder().encode(process.env.BOOKING_WEBHOOK_SECRET),
          { name: "HMAC", hash: "SHA-256" },
          false,
          ["sign"]
        ),
        new TextEncoder().encode(JSON.stringify(body))
      );
      const expectedSignature = Buffer.from(hmac).toString("hex");
      return signature === expectedSignature;
    }
    
    case "airbnb": {
      // Airbnb uses different verification
      return signature === process.env.AIRBNB_WEBHOOK_SECRET;
    }
    
    case "expedia": {
      // Expedia Group verification
      return signature === process.env.EXPEDIA_WEBHOOK_SECRET;
    }
    
    default:
      return true; // Allow if no secret configured
  }
}

/**
 * Handle new reservation from OTA
 */
async function handleNewReservation(channel: string, data: any) {
  try {
    // Check if reservation already exists
    const existing = await prisma.reservation.findUnique({
      where: { externalId: data.externalId },
    });

    if (existing) {
      return NextResponse.json({ 
        success: true, 
        message: "Reservation already exists",
        reservationId: existing.id 
      });
    }

    // Get auto-approval rules
    const property = await prisma.property.findUnique({
      where: { id: data.propertyId },
      select: { reservationAutoApprovalRules: true },
    });

    const autoApprovalRules = (property?.reservationAutoApprovalRules as any) || {};

    // Determine status
    let status = "pending";
    if (shouldAutoApprove(
      {
        checkIn: new Date(data.checkIn),
        checkOut: new Date(data.checkOut),
        guestEmail: data.guestEmail,
        totalPrice: data.totalPrice,
      },
      autoApprovalRules
    )) {
      status = "confirmed";
    }

    // Create reservation
    const reservation = await prisma.reservation.create({
      data: {
        externalId: data.externalId,
        propertyId: data.propertyId,
        roomId: data.roomId,
        guestId: data.guestId,
        checkIn: new Date(data.checkIn),
        checkOut: new Date(data.checkOut),
        status,
        channel: channel.toLowerCase(),
        totalPrice: data.totalPrice,
        deposit: data.deposit,
        touristTax: data.touristTax,
        guests: data.guests,
        notes: data.notes,
        metadata: {
          channel: channel.toLowerCase(),
          bookingId: data.externalId,
          guestName: data.guestName,
          guestEmail: data.guestEmail,
          guestPhone: data.guestPhone,
        },
      },
    });

    logger.info(`[Channel Manager] New ${channel} reservation: ${reservation.id}`);

    return NextResponse.json({
      success: true,
      reservationId: reservation.id,
      status,
    });
  } catch (error) {
    logger.error("[New Reservation] Error:", error);
    return NextResponse.json(
      { error: "Failed to create reservation" },
      { status: 500 }
    );
  }
}

/**
 * Handle reservation modification
 */
async function handleModifyReservation(channel: string, data: any) {
  try {
    const reservation = await prisma.reservation.update({
      where: { externalId: data.externalId },
      data: {
        checkIn: new Date(data.checkIn),
        checkOut: new Date(data.checkOut),
        totalPrice: data.totalPrice,
        guests: data.guests,
        status: data.status || "confirmed",
        updatedAt: new Date(),
      },
    });

    logger.info(`[Channel Manager] Modified ${channel} reservation: ${reservation.id}`);

    return NextResponse.json({
      success: true,
      reservationId: reservation.id,
    });
  } catch (error) {
    logger.error("[Modify Reservation] Error:", error);
    return NextResponse.json(
      { error: "Failed to modify reservation" },
      { status: 500 }
    );
  }
}

/**
 * Handle reservation cancellation
 */
async function handleCancelReservation(channel: string, data: any) {
  try {
    const reservation = await prisma.reservation.update({
      where: { externalId: data.externalId },
      data: {
        status: "cancelled",
        updatedAt: new Date(),
        metadata: {
          cancelledAt: new Date().toISOString(),
          cancelReason: data.reason,
          channel: channel.toLowerCase(),
        },
      },
    });

    // Process refund if applicable
    if (data.refundAmount > 0) {
      const payment = await prisma.payment.findFirst({
        where: { reservationId: reservation.id },
      });

      if (payment) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: "refunded",
            refundedAt: new Date(),
            refundAmount: data.refundAmount,
          },
        });
      }
    }

    logger.info(`[Channel Manager] Cancelled ${channel} reservation: ${reservation.id}`);

    return NextResponse.json({
      success: true,
      reservationId: reservation.id,
    });
  } catch (error) {
    logger.error("[Cancel Reservation] Error:", error);
    return NextResponse.json(
      { error: "Failed to cancel reservation" },
      { status: 500 }
    );
  }
}

/**
 * Handle availability update (push to OTAs)
 */
async function handleAvailabilityUpdate(channel: string, data: any) {
  try {
    const { propertyId, roomId, dates, available } = data;

    // Update blocked dates
    for (const date of dates) {
      await prisma.blockedDate.upsert({
        where: {
          propertyId_date: {
            propertyId,
            date: new Date(date),
          },
        },
        update: {
          isBlocked: !available,
          reason: available ? undefined : "ota_sync",
        },
        create: {
          propertyId,
          roomId,
          date: new Date(date),
          isBlocked: !available,
          reason: available ? undefined : "ota_sync",
        },
      });
    }

    logger.info(`[Channel Manager] Updated availability for ${propertyId}`);

    return NextResponse.json({
      success: true,
      updatedDates: dates.length,
    });
  } catch (error) {
    logger.error("[Availability Update] Error:", error);
    return NextResponse.json(
      { error: "Failed to update availability" },
      { status: 500 }
    );
  }
}

// Helper function for auto-approval
function shouldAutoApprove(
  reservation: {
    checkIn: Date;
    checkOut: Date;
    guestEmail?: string | null;
    totalPrice?: number | null;
  },
  rules: {
    enabled?: boolean;
    minAdvanceDays?: number;
    maxAdvanceDays?: number;
    minNights?: number;
    maxNights?: number;
    requireEmail?: boolean;
  }
): boolean {
  if (!rules.enabled) return false;

  const nights = Math.ceil(
    (reservation.checkOut.getTime() - reservation.checkIn.getTime()) / (1000 * 60 * 60 * 24)
  );

  const now = new Date();
  const daysUntilCheckIn = Math.ceil(
    (reservation.checkIn.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (rules.minNights && nights < rules.minNights) return false;
  if (rules.maxNights && nights > rules.maxNights) return false;
  if (rules.minAdvanceDays && daysUntilCheckIn < rules.minAdvanceDays) return false;
  if (rules.maxAdvanceDays && daysUntilCheckIn > rules.maxAdvanceDays) return false;
  if (rules.requireEmail && !reservation.guestEmail) return false;

  return true;
}
