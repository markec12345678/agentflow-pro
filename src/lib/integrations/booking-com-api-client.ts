/**
 * Booking.com API Client
 *
 * Production-ready client for Booking.com Connectivity API.
 *
 * STATUS: ✅ Popolnoma implementiran
 * POTREBUJE: API credentials (.env.local)
 *
 * Uporaba:
 * const client = new BookingComApiClient()
 * await client.pushAvailability(propertyId, dates)
 */

import { prisma } from "@/infrastructure/database/prisma";
import { logger } from '@/infrastructure/observability/logger';

// ============================================================================
// Types
// ============================================================================

export interface BookingComCredentials {
  apiKey: string;
  secret: string;
  propertyId: string;
  environment: "test" | "production";
}

export interface AvailabilityUpdate {
  roomId: string;
  date: string; // ISO date
  status: "available" | "closed";
  minStay?: number;
}

export interface RateUpdate {
  roomId: string;
  date: string;
  rate: number;
  currency: string;
  minStay?: number;
  maxStay?: number;
}

export interface BookingComBooking {
  bookingId: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: number;
  currency: string;
  status: "confirmed" | "pending" | "cancelled";
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  specialRequests?: string;
  createdAt: string;
}

export interface PushAvailabilityResponse {
  success: boolean;
  propertyId: string;
  datesUpdated: number;
  errors?: string[];
}

export interface PullBookingsResponse {
  success: boolean;
  bookings: BookingComBooking[];
  totalBookings: number;
  lastSyncAt: string;
}

// ============================================================================
// API Client
// ============================================================================

export class BookingComApiClient {
  private credentials: BookingComCredentials;
  private baseUrl: string;

  constructor(credentials?: Partial<BookingComCredentials>) {
    this.credentials = {
      apiKey: credentials?.apiKey || process.env.BOOKING_COM_API_KEY || "",
      secret: credentials?.secret || process.env.BOOKING_COM_SECRET || "",
      propertyId:
        credentials?.propertyId || process.env.BOOKING_COM_PROPERTY_ID || "",
      environment:
        credentials?.environment ||
        (process.env.BOOKING_COM_ENV as "test" | "production") ||
        "test",
    };

    this.baseUrl =
      this.credentials.environment === "production"
        ? "https://connectivity.booking.com"
        : "https://test-rates.booking.com";
  }

  /**
   * Preveri če so credentials nastavljeni
   */
  isConfigured(): boolean {
    return !!(
      this.credentials.apiKey &&
      this.credentials.secret &&
      this.credentials.propertyId
    );
  }

  /**
   * Push availability na Booking.com
   */
  async pushAvailability(
    propertyId: string,
    updates: AvailabilityUpdate[],
  ): Promise<PushAvailabilityResponse> {
    if (!this.isConfigured()) {
      throw new Error("Booking.com credentials not configured");
    }

    try {
      // Pripravi payload za Booking.com API
      const payload = {
        propertyId: this.credentials.propertyId,
        availability: updates.map((update) => ({
          roomTypeId: update.roomId,
          date: update.date,
          status: update.status,
          minLengthOfStay: update.minStay,
        })),
      };

      // API call
      const response = await fetch(
        `${this.baseUrl}/connectivity/v1/availability`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.credentials.apiKey}`,
            "X-Secret": this.credentials.secret,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Booking.com API error: ${error.message}`);
      }

      const result = await response.json();

      return {
        success: true,
        propertyId,
        datesUpdated: updates.length,
      };
    } catch (error: any) {
      logger.error("[Booking.com] Push availability error:", error);
      return {
        success: false,
        propertyId,
        datesUpdated: 0,
        errors: [error.message],
      };
    }
  }

  /**
   * Push rates na Booking.com
   */
  async pushRates(
    propertyId: string,
    updates: RateUpdate[],
  ): Promise<PushAvailabilityResponse> {
    if (!this.isConfigured()) {
      throw new Error("Booking.com credentials not configured");
    }

    try {
      const payload = {
        propertyId: this.credentials.propertyId,
        rates: updates.map((update) => ({
          roomTypeId: update.roomId,
          date: update.date,
          baseRate: update.rate,
          currency: update.currency,
          minLengthOfStay: update.minStay,
          maxLengthOfStay: update.maxStay,
        })),
      };

      const response = await fetch(`${this.baseUrl}/connectivity/v1/rates`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.credentials.apiKey}`,
          "X-Secret": this.credentials.secret,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Booking.com API error: ${error.message}`);
      }

      return {
        success: true,
        propertyId,
        datesUpdated: updates.length,
      };
    } catch (error: any) {
      logger.error("[Booking.com] Push rates error:", error);
      return {
        success: false,
        propertyId,
        datesUpdated: 0,
        errors: [error.message],
      };
    }
  }

  /**
   * Pull bookings iz Booking.com
   */
  async pullBookings(
    propertyId: string,
    dateRange: { start: string; end: string },
  ): Promise<PullBookingsResponse> {
    if (!this.isConfigured()) {
      throw new Error("Booking.com credentials not configured");
    }

    try {
      const params = new URLSearchParams({
        propertyId: this.credentials.propertyId,
        checkInFrom: dateRange.start,
        checkInTo: dateRange.end,
      });

      const response = await fetch(
        `${this.baseUrl}/connectivity/v1/bookings?${params.toString()}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.credentials.apiKey}`,
            "X-Secret": this.credentials.secret,
          },
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Booking.com API error: ${error.message}`);
      }

      const data = await response.json();

      const bookings: BookingComBooking[] = data.bookings.map(
        (booking: any) => ({
          bookingId: booking.id,
          roomId: booking.roomTypeId,
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
          guests: booking.guests,
          totalPrice: booking.totalPrice,
          currency: booking.currency,
          status: this.mapBookingStatus(booking.status),
          guestName: booking.guestName,
          guestEmail: booking.guestEmail,
          guestPhone: booking.guestPhone,
          specialRequests: booking.specialRequests,
          createdAt: booking.createdAt,
        }),
      );

      return {
        success: true,
        bookings,
        totalBookings: bookings.length,
        lastSyncAt: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error("[Booking.com] Pull bookings error:", error);
      return {
        success: false,
        bookings: [],
        totalBookings: 0,
        lastSyncAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Get property details
   */
  async getPropertyDetails(propertyId: string): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error("Booking.com credentials not configured");
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/connectivity/v1/properties/${this.credentials.propertyId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.credentials.apiKey}`,
            "X-Secret": this.credentials.secret,
          },
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Booking.com API error: ${error.message}`);
      }

      return await response.json();
    } catch (error: any) {
      logger.error("[Booking.com] Get property error:", error);
      return null;
    }
  }

  /**
   * Map Booking.com status na naš status
   */
  private mapBookingStatus(status: string): BookingComBooking["status"] {
    const statusMap: Record<string, BookingComBooking["status"]> = {
      confirmed: "confirmed",
      modified: "confirmed",
      cancelled: "cancelled",
      pending: "pending",
      request: "pending",
    };

    return statusMap[status] || "confirmed";
  }
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Ustvari Booking.com API client z environment credentials
 */
export function createBookingComClient(): BookingComApiClient {
  return new BookingComApiClient();
}
