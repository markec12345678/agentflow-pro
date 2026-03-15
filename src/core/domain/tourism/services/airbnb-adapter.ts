/**
 * AgentFlow Pro - Airbnb PMS Adapter
 * Airbnb API (Partner API)
 * Uses Airbnb OAuth2 credentials for reservation sync.
 * 
 * Note: Airbnb API access requires partnership approval.
 * This adapter implements the standard connectivity protocol.
 */

import { prisma } from "@/database/schema";
import type { PmsAdapter, PmsReservation, PmsSyncResult, PmsAdapterConfig } from "./pms-adapter";
import {
  shouldAutoApprove,
  applyAutoApproval,
  type AutoApprovalRules,
} from "./auto-approval";

const AIRBNB_API_BASE = "https://api.airbnb.com/v1";

export class AirbnbAdapter implements PmsAdapter {
  readonly name = "airbnb";

  async getReservations(opts: {
    config: PmsAdapterConfig;
    from: Date;
    to: Date;
  }): Promise<PmsReservation[]> {
    const { config, from, to } = opts;
    const credentials = config.credentials as {
      listingId?: string;
      accessToken?: string;
      refreshToken?: string;
      clientId?: string;
      clientSecret?: string;
    };

    if (!credentials.listingId || !credentials.accessToken) {
      throw new Error("Airbnb requires listingId and accessToken");
    }

    // Get access token (refresh if needed)
    const accessToken = await this.getAccessToken(credentials);

    const response = await fetch(
      `${AIRBNB_API_BASE}/reservations?listing_id=${credentials.listingId}&min_check_in_date=${from.toISOString().split("T")[0]}&max_check_in_date=${to.toISOString().split("T")[0]}`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Airbnb API error ${response.status}: ${err}`);
    }

    const data = (await response.json()) as {
      reservations?: Array<{
        id?: string;
        listing_id?: string;
        check_in_date?: string;
        check_out_date?: string;
        status?: string;
        guest?: {
          first_name?: string;
          last_name?: string;
          email?: string;
          phone?: string;
        };
        pricing?: {
          total?: number;
          currency?: string;
        };
        created_at?: string;
        updated_at?: string;
      }>;
    };

    const reservations = data.reservations ?? [];

    return reservations.map((r) => {
      const checkin = r.check_in_date ? new Date(r.check_in_date + "T15:00:00") : new Date();
      const checkout = r.check_out_date ? new Date(r.check_out_date + "11:00:00") : new Date();

      return {
        externalId: r.id ?? `airbnb-${Date.now()}`,
        propertyId: config.propertyId,
        checkIn: checkin,
        checkOut: checkout,
        status: mapAirbnbStatus(r.status),
        guestName: r.guest
          ? [r.guest.first_name, r.guest.last_name].filter(Boolean).join(" ")
          : undefined,
        guestEmail: r.guest?.email,
        guestPhone: r.guest?.phone,
        totalPrice: r.pricing?.total,
        currency: r.pricing?.currency || "EUR",
        channel: "airbnb",
        metadata: {
          listingId: r.listing_id,
          bookedAt: r.created_at,
          updatedAt: r.updated_at,
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
              channel: "airbnb",
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
              channel: "airbnb",
              metadata: r.metadata as any,
            },
          });
          result.created++;
        }

        result.synced++;
      } catch (error) {
        logger.error("[Airbnb Sync] Error:", error);
        result.errors.push({
          externalId: r.externalId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return result;
  }

  /**
   * Get or refresh access token
   */
  private async getAccessToken(credentials: {
    accessToken?: string;
    refreshToken?: string;
    clientId?: string;
    clientSecret?: string;
  }): Promise<string> {
    // In production, check token expiry and refresh if needed
    if (credentials.accessToken) {
      return credentials.accessToken;
    }

    if (!credentials.refreshToken || !credentials.clientId || !credentials.clientSecret) {
      throw new Error("Cannot refresh token: missing credentials");
    }

    // Refresh token
    const response = await fetch(`${AIRBNB_API_BASE}/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: credentials.refreshToken,
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to refresh Airbnb access token");
    }

    const data = (await response.json()) as { access_token?: string };
    return data.access_token || credentials.refreshToken;
  }
}

// Map Airbnb status to AgentFlow status
function mapAirbnbStatus(status?: string): string {
  if (!status) return "pending";

  const statusMap: Record<string, string> = {
    "confirmed": "confirmed",
    "cancelled": "cancelled",
    "pending": "pending",
    "approved": "confirmed",
    "declined": "cancelled",
    "expired": "cancelled",
    "checked_in": "checked_in",
    "checked_out": "checked_out",
  };

  return statusMap[status.toLowerCase()] || "pending";
}

/**
 * Factory function to get Airbnb adapter
 */
export function getAirbnbAdapter(): AirbnbAdapter {
  return new AirbnbAdapter();
}
