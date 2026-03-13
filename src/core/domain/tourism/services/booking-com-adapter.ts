/**
 * AgentFlow Pro - Booking.com PMS Adapter
 * Booking.com Connectivity API (BCCP)
 * Uses BDC API credentials for reservation sync.
 * 
 * Note: Booking.com requires certification process.
 * This adapter implements the standard connectivity protocol.
 */

import { prisma } from "@/database/schema";
import type { PmsAdapter, PmsReservation, PmsSyncResult, PmsAdapterConfig } from "./pms-adapter";
import {
  shouldAutoApprove,
  applyAutoApproval,
  type AutoApprovalRules,
} from "./auto-approval";

const BOOKING_API_BASE = "https://connectivity.booking.com";

export class BookingComAdapter implements PmsAdapter {
  readonly name = "booking.com";

  async getReservations(opts: {
    config: PmsAdapterConfig;
    from: Date;
    to: Date;
  }): Promise<PmsReservation[]> {
    const { config, from, to } = opts;
    const credentials = config.credentials as {
      hotelId?: string;
      username?: string;
      password?: string;
      apiKey?: string;
    };

    if (!credentials.hotelId || !credentials.username || !credentials.password) {
      throw new Error("Booking.com requires hotelId, username, and password");
    }

    // Booking.com uses Basic Auth
    const auth = Buffer.from(`${credentials.username}:${credentials.password}`).toString("base64");

    const response = await fetch(
      `${BOOKING_API_BASE}/v1/reservations?hotel_id=${credentials.hotelId}&from=${from.toISOString().split("T")[0]}&to=${to.toISOString().split("T")[0]}`,
      {
        method: "GET",
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Booking.com API error ${response.status}: ${err}`);
    }

    const data = (await response.json()) as {
      reservations?: Array<{
        reservation_id?: string;
        room_id?: string;
        checkin_date?: string;
        checkout_date?: string;
        status?: string;
        guest_name?: string;
        guest_email?: string;
        guest_phone?: string;
        total_price?: number;
        currency?: string;
        booking_origin?: string;
        is_genius?: boolean;
        room_name?: string;
      }>;
    };

    const reservations = data.reservations ?? [];

    return reservations.map((r) => {
      const checkin = r.checkin_date ? new Date(r.checkin_date + "T15:00:00") : new Date();
      const checkout = r.checkout_date ? new Date(r.checkout_date + "11:00:00") : new Date();

      return {
        externalId: r.reservation_id ?? `booking-${Date.now()}`,
        propertyId: config.propertyId,
        checkIn: checkin,
        checkOut: checkout,
        status: mapBookingStatus(r.status),
        guestName: r.guest_name,
        guestEmail: r.guest_email,
        guestPhone: r.guest_phone,
        totalPrice: r.total_price,
        currency: r.currency || "EUR",
        channel: "booking.com",
        metadata: {
          roomId: r.room_id,
          roomName: r.room_name,
          isGenius: r.is_genius ?? false,
          bookingOrigin: r.booking_origin,
        },
        raw: r,
      } satisfies PmsReservation;
    });
  }

  async syncToAgentFlow(opts: {
    config: PmsAdapterConfig;
    reservations: PmsReservation[];
  }): Promise<PmsSyncResult> {
    const { config, reservations } = opts;
    const result: PmsSyncResult = { synced: 0, created: 0, updated: 0, errors: [] };

    // Get auto-approval rules
    const property = await prisma.property.findUnique({
      where: { id: config.propertyId },
      select: { reservationAutoApprovalRules: true },
    });
    const autoApprovalRules = (property?.reservationAutoApprovalRules as any) || {};

    for (const r of reservations) {
      try {
        const existing = await prisma.reservation.findFirst({
          where: {
            propertyId: config.propertyId,
            externalId: r.externalId,
          },
        });

        if (existing) {
          // Update existing reservation
          await prisma.reservation.update({
            where: { id: existing.id },
            data: {
              status: r.status,
              checkIn: r.checkIn,
              checkOut: r.checkOut,
              totalPrice: r.totalPrice,
              guestName: r.guestName,
              guestEmail: r.guestEmail,
              guestPhone: r.guestPhone,
              channel: "booking.com",
              metadata: r.metadata as any,
            },
          });
          result.updated++;
        } else {
          // Determine if should auto-approve
          let status = r.status;
          if (status === "pending" && shouldAutoApprove(r, autoApprovalRules)) {
            status = "confirmed";
          }

          // Create new reservation
          await prisma.reservation.create({
            data: {
              propertyId: config.propertyId,
              externalId: r.externalId!,
              checkIn: r.checkIn,
              checkOut: r.checkOut,
              status,
              totalPrice: r.totalPrice || 0,
              guestName: r.guestName,
              guestEmail: r.guestEmail,
              guestPhone: r.guestPhone,
              channel: "booking.com",
              metadata: r.metadata as any,
            },
          });
          result.created++;
        }

        result.synced++;
      } catch (error) {
        console.error("[Booking.com Sync] Error:", error);
        result.errors.push({
          externalId: r.externalId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return result;
  }
}

// Map Booking.com status to AgentFlow status
function mapBookingStatus(status?: string): string {
  if (!status) return "pending";

  const statusMap: Record<string, string> = {
    "confirmed": "confirmed",
    "cancelled": "cancelled",
    "no_show": "cancelled",
    "checked_out": "checked_out",
    "checked_in": "checked_in",
    "pending": "pending",
    "modified": "confirmed",
  };

  return statusMap[status.toLowerCase()] || "pending";
}

/**
 * Factory function to get Booking.com adapter
 */
export function getBookingComAdapter(): BookingComAdapter {
  return new BookingComAdapter();
}
