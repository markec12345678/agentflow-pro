/**
 * AgentFlow Pro - Airbnb API Integration
 * 
 * Airbnb Partner API for PMS connectivity
 * Documentation: https://developer.airbnb.com/documentation
 * 
 * Features:
 * - Push availability calendar
 * - Pull reservations
 * - Update pricing
 * - Sync messaging
 */

import { prisma } from '@/database/schema';

const AIRBNB_API_BASE = 'https://api.airbnb.com/v1';

export interface AirbnbCredentials {
  listingId: string;
  accessToken: string;
  refreshToken?: string;
  clientId?: string;
  clientSecret?: string;
}

export interface CalendarUpdate {
  date: string; // YYYY-MM-DD
  available: boolean;
  price?: number;
  minNights?: number;
  maxNights?: number;
}

export class AirbnbService {
  private credentials: AirbnbCredentials;

  constructor(credentials: AirbnbCredentials) {
    this.credentials = credentials;
  }

  /**
   * Get OAuth2 access token
   */
  private async getAccessToken(): Promise<string> {
    // If we have a valid access token, use it
    if (this.credentials.accessToken) {
      return this.credentials.accessToken;
    }

    // Refresh token if available
    if (this.credentials.refreshToken && this.credentials.clientId && this.credentials.clientSecret) {
      const response = await fetch(`${AIRBNB_API_BASE}/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.credentials.refreshToken,
          client_id: this.credentials.clientId,
          client_secret: this.credentials.clientSecret,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh Airbnb access token');
      }

      const data = await response.json();
      return data.access_token;
    }

    throw new Error('No valid Airbnb credentials');
  }

  /**
   * Get auth headers
   */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await this.getAccessToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Push calendar availability to Airbnb
   */
  async pushCalendar(updates: CalendarUpdate[]): Promise<{
    success: boolean;
    updated: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let updated = 0;

    try {
      const headers = await this.getAuthHeaders();

      // Airbnb uses iCal format for calendar sync
      // Convert updates to iCal format
      const ical = this.generateICal(updates);

      const response = await fetch(
        `${AIRBNB_API_BASE}/listings/${this.credentials.listingId}/calendar`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            calendar: updates.map(update => ({
              date: update.date,
              available: update.available,
              price: update.price,
              min_nights: update.minNights,
              max_nights: update.maxNights,
            })),
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Airbnb API error: ${error}`);
      }

      const result = await response.json();
      updated = result.updated_count || updates.length;

      // Log sync
      await prisma.pmsConnection.upsert({
        where: {
          propertyId_provider: {
            propertyId: this.credentials.listingId,
            provider: 'airbnb',
          },
        },
        update: {
          credentials: {
            lastSyncAt: new Date().toISOString(),
            lastSyncStatus: 'success',
            updatedCount: updated,
          } as any,
        },
        create: {
          propertyId: this.credentials.listingId,
          provider: 'airbnb',
          credentials: {
            listingId: this.credentials.listingId,
            lastSyncAt: new Date().toISOString(),
            lastSyncStatus: 'success',
          } as any,
        },
      });

      return { success: true, updated, errors };
    } catch (error: any) {
      logger.error('[Airbnb Push Calendar] Error:', error);
      errors.push(error.message);

      await prisma.pmsConnection.updateMany({
        where: { propertyId: this.credentials.listingId, provider: 'airbnb' },
        data: {
          credentials: {
            lastSyncAt: new Date().toISOString(),
            lastSyncStatus: 'error',
            lastError: error.message,
          } as any,
        },
      });

      return { success: false, updated, errors };
    }
  }

  /**
   * Generate iCal format for Airbnb calendar sync
   */
  private generateICal(updates: CalendarUpdate[]): string {
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//AgentFlow Pro//EN',
    ];

    updates.forEach(update => {
      if (!update.available) {
        const date = update.date.replace(/-/g, '');
        lines.push('BEGIN:VEVENT');
        lines.push(`DTSTART;VALUE=DATE:${date}`);
        lines.push(`DTEND;VALUE=DATE:${date}`);
        lines.push('SUMMARY:Not Available');
        lines.push('END:VEVENT');
      }
    });

    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
  }

  /**
   * Pull reservations from Airbnb
   */
  async pullReservations(
    from: Date,
    to: Date
  ): Promise<{
    success: boolean;
    reservations: any[];
    errors: string[];
  }> {
    const errors: string[] = [];

    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(
        `${AIRBNB_API_BASE}/reservations?listing_id=${this.credentials.listingId}&min_check_in_date=${from.toISOString().split('T')[0]}&max_check_in_date=${to.toISOString().split('T')[0]}`,
        {
          method: 'GET',
          headers,
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Airbnb API error: ${error}`);
      }

      const data = await response.json();
      const reservations = data.reservations || [];

      return { success: true, reservations, errors };
    } catch (error: any) {
      logger.error('[Airbnb Pull Reservations] Error:', error);
      errors.push(error.message);
      return { success: false, reservations: [], errors };
    }
  }

  /**
   * Update pricing for listing
   */
  async updatePricing(updates: Array<{
    date: string;
    price: number;
    currency?: string;
  }>): Promise<{
    success: boolean;
    updated: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let updated = 0;

    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(
        `${AIRBNB_API_BASE}/listings/${this.credentials.listingId}/pricing`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            pricing: updates.map(update => ({
              date: update.date,
              price: update.price,
              currency: update.currency || 'EUR',
            })),
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Airbnb API error: ${error}`);
      }

      const result = await response.json();
      updated = result.updated_count || updates.length;

      return { success: true, updated, errors };
    } catch (error: any) {
      logger.error('[Airbnb Update Pricing] Error:', error);
      errors.push(error.message);
      return { success: false, updated, errors };
    }
  }

  /**
   * Get listing details
   */
  async getListing(): Promise<any> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(
        `${AIRBNB_API_BASE}/listings/${this.credentials.listingId}`,
        { method: 'GET', headers }
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.listing;
    } catch (error) {
      logger.error('[Airbnb Get Listing] Error:', error);
      return null;
    }
  }

  /**
   * Full sync (calendar + reservations + pricing)
   */
  async fullSync(): Promise<{
    success: boolean;
    calendarUpdated: number;
    reservationsSynced: number;
    pricingUpdated: number;
    errors: string[];
  }> {
    const errors: string[] = [];

    const today = new Date();
    const ninetyDaysLater = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);

    // Get blocked dates
    const blockedDates = await prisma.blockedDate.findMany({
      where: {
        propertyId: this.credentials.listingId,
        date: { gte: today, lte: ninetyDaysLater },
      },
    });

    // Get room for pricing
    const room = await prisma.room.findFirst({
      where: { propertyId: this.credentials.listingId },
    });

    // Prepare calendar updates
    const calendarUpdates: CalendarUpdate[] = [];
    for (let d = new Date(today); d <= ninetyDaysLater; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const blocked = blockedDates.find(b => b.date.toISOString().split('T')[0] === dateStr);
      
      calendarUpdates.push({
        date: dateStr,
        available: !blocked?.isBlocked,
        price: room?.basePrice || 100,
        minNights: 1,
        maxNights: 30,
      });
    }

    // Push calendar
    const calendarResult = await this.pushCalendar(calendarUpdates);
    if (!calendarResult.success) errors.push(...calendarResult.errors);

    // Pull reservations
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const reservationsResult = await this.pullReservations(thirtyDaysAgo, ninetyDaysLater);
    
    let reservationsSynced = 0;
    if (reservationsResult.success) {
      for (const res of reservationsResult.reservations) {
        try {
          await prisma.reservation.upsert({
            where: { externalId: res.id },
            update: {
              status: res.status === 'confirmed' ? 'confirmed' : 'cancelled',
              totalPrice: res.pricing?.total,
            },
            create: {
              externalId: res.id,
              propertyId: this.credentials.listingId,
              checkIn: new Date(res.check_in_date + 'T15:00:00'),
              checkOut: new Date(res.check_out_date + '11:00:00'),
              status: res.status === 'confirmed' ? 'confirmed' : 'cancelled',
              channel: 'airbnb',
              guestName: res.guest ? `${res.guest.first_name} ${res.guest.last_name}` : undefined,
              guestEmail: res.guest?.email,
              totalPrice: res.pricing?.total,
            },
          });
          reservationsSynced++;
        } catch (error) {
          errors.push(`Failed to sync reservation ${res.id}`);
        }
      }
    }

    // Update pricing
    const pricingUpdates = calendarUpdates.map(u => ({
      date: u.date,
      price: u.price || 100,
      currency: 'EUR',
    }));

    const pricingResult = await this.updatePricing(pricingUpdates);
    if (!pricingResult.success) errors.push(...pricingResult.errors);

    return {
      success: errors.length === 0,
      calendarUpdated: calendarResult.updated,
      reservationsSynced,
      pricingUpdated: pricingResult.updated,
      errors,
    };
  }
}

/**
 * Factory function to create Airbnb service instance
 */
export function createAirbnbService(propertyId: string): AirbnbService | null {
  const pmsConnection = prisma.pmsConnection.findFirstSync({
    where: { propertyId, provider: 'airbnb' },
  });

  if (!pmsConnection) {
    return null;
  }

  const credentials = pmsConnection.credentials as any as AirbnbCredentials;
  return new AirbnbService(credentials);
}
