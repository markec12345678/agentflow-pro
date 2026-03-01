/**
 * AgentFlow Pro - Mews PMS Adapter
 * Mews Connector API: https://docs.mews.com/connector-api/operations/reservations
 * Uses access token + client token for authentication.
 */

import { prisma } from "@/database/schema";
import type { PmsAdapter, PmsReservation, PmsSyncResult, PmsAdapterConfig } from "./pms-adapter";
import {
  shouldAutoApprove,
  applyAutoApproval,
  type AutoApprovalRules,
} from "./auto-approval";

const MEWS_API_BASE = "https://api.mews.com";

export class MewsAdapter implements PmsAdapter {
  readonly name = "mews";

  async getReservations(opts: {
    config: PmsAdapterConfig;
    from: Date;
    to: Date;
  }): Promise<PmsReservation[]> {
    const { config, from, to } = opts;
    const accessToken = config.credentials.accessToken;
    const clientToken = config.credentials.clientToken;
    if (!accessToken || !clientToken) {
      throw new Error("Mews requires accessToken and clientToken");
    }

    const response = await fetch(`${MEWS_API_BASE}/connectorapi/connector/v1/reservations/getAll`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "AccessToken": accessToken,
        "ClientToken": clientToken,
      },
      body: JSON.stringify({
        CollidingUtc: {
          StartUtc: from.toISOString(),
          EndUtc: to.toISOString(),
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Mews API error ${response.status}: ${err}`);
    }

    const data = (await response.json()) as {
      Reservations?: Array<{
        Id?: string;
        ServiceId?: string;
        State?: string;
        StartUtc?: string;
        EndUtc?: string;
        CustomerId?: string;
        Customer?: { Email?: string; FirstName?: string; LastName?: string; PhoneNumber?: string };
        TotalAmount?: number;
        Currency?: string;
      }>;
    };

    const reservations = data.Reservations ?? [];

    return reservations.map((r) => {
      const customer = r.Customer ?? (r as unknown as { Customer?: { Email?: string; FirstName?: string; LastName?: string; PhoneNumber?: string } }).Customer;
      const start = r.StartUtc ? new Date(r.StartUtc) : new Date();
      const end = r.EndUtc ? new Date(r.EndUtc) : new Date();
      return {
        externalId: r.Id ?? `mews-${Date.now()}`,
        propertyId: config.propertyId,
        checkIn: start,
        checkOut: end,
        status: mapMewsStateToStatus(r.State),
        guestName: customer
          ? [customer.FirstName, customer.LastName].filter(Boolean).join(" ")
          : undefined,
        guestEmail: customer?.Email,
        guestPhone: customer?.PhoneNumber,
        totalPrice: r.TotalAmount,
        channel: "mews",
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

    for (const r of reservations) {
      try {
        const existing = await prisma.reservation.findFirst({
          where: {
            propertyId: config.propertyId,
            notes: { contains: `mews:${r.externalId}` },
          },
        });

        let guestId: string | null = null;
        if (r.guestEmail || r.guestName) {
          let guest = await prisma.guest.findFirst({
            where: {
              propertyId: config.propertyId,
              ...(r.guestEmail ? { email: r.guestEmail } : { name: r.guestName! }),
            },
          });
          if (!guest) {
            guest = await prisma.guest.create({
              data: {
                propertyId: config.propertyId,
                name: r.guestName ?? "Unknown",
                email: r.guestEmail ?? null,
                phone: r.guestPhone ?? null,
              },
            });
          }
          guestId = guest.id;
        }

        let reservationId: string;
        if (existing) {
          await prisma.reservation.update({
            where: { id: existing.id },
            data: {
              checkIn: r.checkIn,
              checkOut: r.checkOut,
              status: r.status,
              totalPrice: r.totalPrice ?? undefined,
              guestId,
            },
          });
          reservationId = existing.id;
        } else {
          result.created++;
          const reservation = await prisma.reservation.create({
            data: {
              propertyId: config.propertyId,
              guestId,
              checkIn: r.checkIn,
              checkOut: r.checkOut,
              status: r.status,
              totalPrice: r.totalPrice ?? undefined,
              channel: r.channel ?? "mews",
              notes: `mews:${r.externalId}`,
            },
          });
          reservationId = reservation.id;
          const { triggerBookingConfirmation } = await import("./email-triggers");
          triggerBookingConfirmation(
            reservation.id,
            config.propertyId,
            guestId
          ).catch((err) => console.error("Booking confirmation trigger:", err));
        }
        if (r.status === "pending") {
          const property = await prisma.property.findUnique({
            where: { id: config.propertyId },
          });
          const rules = (property as { reservationAutoApprovalRules?: unknown } | null)?.reservationAutoApprovalRules as AutoApprovalRules | null;
          if (shouldAutoApprove(r, rules)) {
            await applyAutoApproval(reservationId);
          }
        }
        result.synced++;
      } catch (err) {
        result.errors.push(`${r.externalId}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    return result;
  }
}

function mapMewsStateToStatus(state?: string): "confirmed" | "cancelled" | "pending" {
  const s = (state ?? "").toLowerCase();
  if (s.includes("cancel") || s === "processed") return "cancelled";
  if (s.includes("confirmed") || s === "started") return "confirmed";
  return "pending";
}

/** Factory for PMS adapters. */
export function getPmsAdapter(name: string): PmsAdapter | null {
  switch (name) {
    case "mews":
      return new MewsAdapter();
    default:
      return null;
  }
}
