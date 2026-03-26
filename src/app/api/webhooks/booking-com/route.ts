/**
 * AgentFlow Pro - Booking.com Webhook Handler
 * Real-time booking notifications from Booking.com
 */

import { prisma } from "@/database/schema";
import { NextRequest, NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "crypto";

const BOOKING_COM_WEBHOOK_SECRET = process.env.BOOKING_COM_WEBHOOK_SECRET;

export interface BookingNotification {
  notification_id: string;
  type: "new_reservation" | "modified_reservation" | "cancelled_reservation";
  timestamp: string;
  hotel_id: string;
  reservation?: {
    reservation_id: string;
    status: string;
    checkin_date: string;
    checkout_date: string;
    guest_name: string;
    guest_email: string;
    total_price: number;
    currency: string;
    created_at: string;
    modified_at?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    // Verify signature
    const signature = request.headers.get("x-booking-signature");
    const body = await request.text();

    if (!signature || !BOOKING_COM_WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    const isValid = verifySignature(body, signature, BOOKING_COM_WEBHOOK_SECRET);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const notification: BookingNotification = JSON.parse(body);

    // Find property by hotel_id
    const property = await prisma.pmsConnection.findFirst({
      where: {
        provider: "booking.com",
        credentials: {
          path: ["hotelId"],
          equals: notification.hotel_id,
        },
      },
      include: {
        property: true,
      },
    });

    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    // Process notification based on type
    switch (notification.type) {
      case "new_reservation":
        await handleNewReservation(property.propertyId, notification.reservation!);
        break;

      case "modified_reservation":
        await handleModifiedReservation(property.propertyId, notification.reservation!);
        break;

      case "cancelled_reservation":
        await handleCancelledReservation(property.propertyId, notification.reservation!);
        break;

      default:
        console.warn("[Booking.com Webhook] Unknown notification type:", notification.type);
    }

    // Log webhook
    await prisma.webhookLog.create({
      data: {
        provider: "booking.com",
        eventType: notification.type,
        payload: notification as any,
        processed: true,
        receivedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Booking.com Webhook] Error:", error);

    // Log error
    await prisma.webhookLog.create({
      data: {
        provider: "booking.com",
        eventType: "error",
        payload: { error: error instanceof Error ? error.message : "Unknown error" },
        processed: false,
        receivedAt: new Date(),
      },
    });

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function handleNewReservation(
  propertyId: string,
  reservation: BookingNotification["reservation"]
): Promise<void> {
  // Check if reservation already exists
  const existing = await prisma.reservation.findUnique({
    where: { externalId: reservation.reservation_id },
  });

  if (existing) {
    // console.log("[Booking.com Webhook] Reservation already exists:", reservation.reservation_id);
    return;
  }

  // Create reservation
  await prisma.reservation.create({
    data: {
      propertyId,
      externalId: reservation.reservation_id,
      checkIn: new Date(reservation.checkin_date + "T15:00:00"),
      checkOut: new Date(reservation.checkout_date + "11:00:00"),
      status: mapStatus(reservation.status),
      guestName: reservation.guest_name,
      guestEmail: reservation.guest_email,
      totalPrice: reservation.total_price,
      currency: reservation.currency,
      channel: "booking.com",
      metadata: {
        source: "booking.com_webhook",
        createdAt: reservation.created_at,
      },
    },
  });

  // Send notification to property owner
  await sendReservationNotification(propertyId, "new", reservation);
}

async function handleModifiedReservation(
  propertyId: string,
  reservation: BookingNotification["reservation"]
): Promise<void> {
  const existing = await prisma.reservation.findUnique({
    where: { externalId: reservation.reservation_id },
  });

  if (!existing) {
    // If doesn't exist, create it
    await handleNewReservation(propertyId, reservation);
    return;
  }

  // Update reservation
  await prisma.reservation.update({
    where: { id: existing.id },
    data: {
      status: mapStatus(reservation.status),
      checkIn: new Date(reservation.checkin_date + "T15:00:00"),
      checkOut: new Date(reservation.checkout_date + "11:00:00"),
      totalPrice: reservation.total_price,
      metadata: {
        ...existing.metadata,
        modifiedAt: reservation.modified_at,
        source: "booking.com_webhook",
      },
    },
  });

  // Send notification
  await sendReservationNotification(propertyId, "modified", reservation);
}

async function handleCancelledReservation(
  propertyId: string,
  reservation: BookingNotification["reservation"]
): Promise<void> {
  const existing = await prisma.reservation.findUnique({
    where: { externalId: reservation.reservation_id },
  });

  if (!existing) {
    // console.log("[Booking.com Webhook] Cancelled reservation not found:", reservation.reservation_id);
    return;
  }

  // Update status to cancelled
  await prisma.reservation.update({
    where: { id: existing.id },
    data: {
      status: "cancelled",
      metadata: {
        ...existing.metadata,
        cancelledAt: new Date().toISOString(),
        source: "booking.com_webhook",
      },
    },
  });

  // Send notification
  await sendReservationNotification(propertyId, "cancelled", reservation);
}

function mapStatus(status: string): string {
  const statusMap: Record<string, string> = {
    "confirmed": "confirmed",
    "cancelled": "cancelled",
    "modified": "modified",
    "pending": "pending",
  };

  return statusMap[status.toLowerCase()] || "pending";
}

function verifySignature(body: string, signature: string, secret: string): boolean {
  const expectedSignature = createHash("sha256")
    .update(body + secret)
    .digest("hex");

  try {
    return timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expectedSignature, "hex")
    );
  } catch {
    return false;
  }
}

async function sendReservationNotification(
  propertyId: string,
  type: "new" | "modified" | "cancelled",
  reservation: BookingNotification["reservation"]
): Promise<void> {
  // Get property owner
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { userId: true, name: true },
  });

  if (!property) return;

  // Create notification
  await prisma.notification.create({
    data: {
      userId: property.userId,
      type: "reservation_update",
      title: `Booking.com: ${type === "new" ? "Nova rezervacija" : type === "modified" ? "Spremenjena rezervacija" : "Preklicana rezervacija"}`,
      message: `${reservation.guest_name} - ${reservation.checkin_date} do ${reservation.checkout_date}`,
      metadata: {
        reservationId: reservation.reservation_id,
        type,
        channel: "booking.com",
      },
    },
  });

  // In production, also send email/SMS
}
