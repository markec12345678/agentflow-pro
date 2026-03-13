/**
 * AgentFlow Pro - Expedia PMS Adapter
 * Expedia Partner Solutions API
 */

import { prisma } from "@/database/schema";
import type { PmsAdapter, PmsReservation, PmsSyncResult, PmsAdapterConfig } from "./pms-adapter";

const EXPEDIA_API_BASE = "https://api.expediapartnersolutions.com/v1";

export class ExpediaAdapter implements PmsAdapter {
  readonly name = "expedia";

  async getReservations(opts: {
    config: PmsAdapterConfig;
    from: Date;
    to: Date;
  }): Promise<PmsReservation[]> {
    const { config, from, to } = opts;
    const credentials = config.credentials as {
      propertyId?: string;
      apiKey?: string;
      apiSecret?: string;
    };

    if (!credentials.propertyId || !credentials.apiKey || !credentials.apiSecret) {
      throw new Error("Expedia requires propertyId, apiKey, and apiSecret");
    }

    // Expedia uses Basic Auth with API key/secret
    const auth = Buffer.from(`${credentials.apiKey}:${credentials.apiSecret}`).toString("base64");

    const response = await fetch(
      `${EXPEDIA_API_BASE}/reservations?property_id=${credentials.propertyId}&from=${from.toISOString().split("T")[0]}&to=${to.toISOString().split("T")[0]}`,
      {
        method: "GET",
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Expedia-Version": "1.0",
        },
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Expedia API error ${response.status}: ${err}`);
    }

    const data = await response.json();
    const reservations = data.reservations || [];

    return reservations.map((r: any) => {
      const checkin = r.arrival_date ? new Date(r.arrival_date + "T15:00:00") : new Date();
      const checkout = r.departure_date ? new Date(r.departure_date + "11:00:00") : new Date();

      return {
        externalId: r.reservation_id || `expedia-${Date.now()}`,
        propertyId: config.propertyId,
        checkIn: checkin,
        checkOut: checkout,
        status: mapExpediaStatus(r.status),
        guestName: r.guest ? [r.guest.first_name, r.guest.last_name].filter(Boolean).join(" ") : undefined,
        guestEmail: r.guest?.email,
        guestPhone: r.guest?.phone,
        totalPrice: r.pricing?.total,
        currency: r.pricing?.currency || "EUR",
        channel: "expedia",
        metadata: {
          confirmationNumber: r.confirmation_number,
          bookedAt: r.created_at,
          updatedAt: r.updated_at,
        },
        raw: r,
      };
    });
  }

  async syncToAgentFlow(opts: {
    config: PmsAdapterConfig;
    reservations: PmsReservation[];
  }): Promise<PmsSyncResult> {
    const { config, reservations } = opts;
    const result: PmsSyncResult = { synced: 0, created: 0, updated: 0, errors: [] };

    for (const r of reservations) {
      try {
        const existing = await prisma.reservation.findFirst({
          where: {
            propertyId: config.propertyId,
            externalId: r.externalId,
          },
        });

        if (existing) {
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
              channel: "expedia",
              metadata: r.metadata as any,
            },
          });
          result.updated++;
        } else {
          await prisma.reservation.create({
            data: {
              propertyId: config.propertyId,
              externalId: r.externalId!,
              checkIn: r.checkIn,
              checkOut: r.checkOut,
              status: r.status,
              totalPrice: r.totalPrice || 0,
              guestName: r.guestName,
              guestEmail: r.guestEmail,
              guestPhone: r.guestPhone,
              channel: "expedia",
              metadata: r.metadata as any,
            },
          });
          result.created++;
        }

        result.synced++;
      } catch (error) {
        console.error("[Expedia Sync] Error:", error);
        result.errors.push({
          externalId: r.externalId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return result;
  }
}

function mapExpediaStatus(status?: string): string {
  if (!status) return "pending";

  const statusMap: Record<string, string> = {
    "confirmed": "confirmed",
    "cancelled": "cancelled",
    "pending": "pending",
    "modified": "modified",
    "checked_in": "checked_in",
    "checked_out": "checked_out",
  };

  return statusMap[status.toLowerCase()] || "pending";
}

export function getExpediaAdapter(): ExpediaAdapter {
  return new ExpediaAdapter();
}
