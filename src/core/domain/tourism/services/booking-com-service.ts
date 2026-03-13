/**
 * AgentFlow Pro - Booking.com Connectivity API Integration
 * 
 * Official Booking.com Partner API (BCCP - Booking.com Connectivity Provider)
 * Documentation: https://admin.booking.com/hotelinfo/help/api
 * 
 * Features:
 * - Push availability to Booking.com
 * - Pull reservations from Booking.com
 * - Update rates and restrictions
 * - Real-time sync
 */

import { prisma } from '@/database/schema';

const BOOKING_API_BASE = 'https://connectivity.booking.com/v2';

export interface BookingCredentials {
  hotelId: string;
  username: string;
  password: string;
  apiKey: string;
}

export interface AvailabilityUpdate {
  roomId: string;
  date: string; // YYYY-MM-DD
  available: number; // number of rooms
  closed: boolean; // true = closed for arrival
}

export interface RateUpdate {
  roomId: string;
  date: string;
  rate: number; // EUR per night
  minStay?: number;
}

export class BookingComService {
  private credentials: BookingCredentials;

  constructor(credentials: BookingCredentials) {
    this.credentials = credentials;
  }

  /**
   * Get Basic Auth header
   */
  private getAuthHeader(): string {
    const auth = Buffer.from(
      `${this.credentials.username}:${this.credentials.password}`
    ).toString('base64');
    return `Basic ${auth}`;
  }

  /**
   * Push availability to Booking.com
   */
  async pushAvailability(updates: AvailabilityUpdate[]): Promise<{
    success: boolean;
    updated: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let updated = 0;

    try {
      // Group by room and date for batch update
      const batchedUpdates = updates.reduce((acc, update) => {
        const key = `${update.roomId}_${update.date}`;
        acc[key] = update;
        return acc;
      }, {} as Record<string, AvailabilityUpdate>);

      // Send to Booking.com API
      const response = await fetch(
        `${BOOKING_API_BASE}/ota/availability`,
        {
          method: 'POST',
          headers: {
            'Authorization': this.getAuthHeader(),
            'Content-Type': 'application/json',
            'X-API-Key': this.credentials.apiKey,
          },
          body: JSON.stringify({
            hotel_id: this.credentials.hotelId,
            availability: Object.values(batchedUpdates).map(update => ({
              room_id: update.roomId,
              date: update.date,
              availability: update.available,
              status: update.closed ? 'close' : 'open',
            })),
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Booking.com API error: ${error}`);
      }

      const result = await response.json();
      updated = result.success_count || updates.length;

      // Log sync to database
      await prisma.pmsConnection.upsert({
        where: {
          propertyId_provider: {
            propertyId: this.credentials.hotelId,
            provider: 'booking.com',
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
          propertyId: this.credentials.hotelId,
          provider: 'booking.com',
          credentials: {
            hotelId: this.credentials.hotelId,
            lastSyncAt: new Date().toISOString(),
            lastSyncStatus: 'success',
          } as any,
        },
      });

      return { success: true, updated, errors };
    } catch (error: any) {
      console.error('[Booking.com Push Availability] Error:', error);
      errors.push(error.message);
      
      // Log error
      await prisma.pmsConnection.updateMany({
        where: { propertyId: this.credentials.hotelId, provider: 'booking.com' },
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
   * Push rates to Booking.com
   */
  async pushRates(updates: RateUpdate[]): Promise<{
    success: boolean;
    updated: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let updated = 0;

    try {
      const response = await fetch(
        `${BOOKING_API_BASE}/ota/rates`,
        {
          method: 'POST',
          headers: {
            'Authorization': this.getAuthHeader(),
            'Content-Type': 'application/json',
            'X-API-Key': this.credentials.apiKey,
          },
          body: JSON.stringify({
            hotel_id: this.credentials.hotelId,
            rates: updates.map(update => ({
              room_id: update.roomId,
              date: update.date,
              rate: update.rate,
              min_stay: update.minStay || 1,
              currency: 'EUR',
            })),
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Booking.com API error: ${error}`);
      }

      const result = await response.json();
      updated = result.success_count || updates.length;

      return { success: true, updated, errors };
    } catch (error: any) {
      console.error('[Booking.com Push Rates] Error:', error);
      errors.push(error.message);
      return { success: false, updated, errors };
    }
  }

  /**
   * Pull reservations from Booking.com
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
      const response = await fetch(
        `${BOOKING_API_BASE}/reservations?hotel_id=${this.credentials.hotelId}&from=${from.toISOString().split('T')[0]}&to=${to.toISOString().split('T')[0]}`,
        {
          method: 'GET',
          headers: {
            'Authorization': this.getAuthHeader(),
            'X-API-Key': this.credentials.apiKey,
          },
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Booking.com API error: ${error}`);
      }

      const data = await response.json();
      const reservations = data.reservations || [];

      return { success: true, reservations, errors };
    } catch (error: any) {
      console.error('[Booking.com Pull Reservations] Error:', error);
      errors.push(error.message);
      return { success: false, reservations: [], errors };
    }
  }

  /**
   * Get room mapping (AgentFlow room IDs ↔ Booking.com room IDs)
   */
  async getRoomMapping(): Promise<Record<string, string>> {
    try {
      const response = await fetch(
        `${BOOKING_API_BASE}/rooms?hotel_id=${this.credentials.hotelId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': this.getAuthHeader(),
            'X-API-Key': this.credentials.apiKey,
          },
        }
      );

      if (!response.ok) {
        return {};
      }

      const data = await response.json();
      const mapping: Record<string, string> = {};

      data.rooms?.forEach((room: any) => {
        mapping[room.booking_room_id] = room.external_room_id;
      });

      return mapping;
    } catch (error) {
      console.error('[Booking.com Get Room Mapping] Error:', error);
      return {};
    }
  }

  /**
   * Sync all data (availability + rates + reservations)
   */
  async fullSync(): Promise<{
    success: boolean;
    availabilityUpdated: number;
    ratesUpdated: number;
    reservationsSynced: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    
    // Get next 90 days
    const today = new Date();
    const ninetyDaysLater = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);

    // Get all rooms and blocked dates
    const rooms = await prisma.room.findMany({
      where: { propertyId: this.credentials.hotelId },
    });

    const blockedDates = await prisma.blockedDate.findMany({
      where: {
        propertyId: this.credentials.hotelId,
        date: {
          gte: today,
          lte: ninetyDaysLater,
        },
      },
    });

    // Prepare availability updates
    const availabilityUpdates: AvailabilityUpdate[] = [];
    const dateMap = new Map<string, { available: number; closed: boolean }>();

    // Initialize all dates as available
    for (let d = new Date(today); d <= ninetyDaysLater; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      dateMap.set(dateStr, { available: rooms.length, closed: false });
    }

    // Apply blocked dates
    blockedDates.forEach(blocked => {
      const dateStr = blocked.date.toISOString().split('T')[0];
      const existing = dateMap.get(dateStr);
      if (existing && blocked.isBlocked) {
        existing.closed = true;
        existing.available = 0;
      }
      dateMap.set(dateStr, existing!);
    });

    // Convert to updates
    dateMap.forEach((data, date) => {
      rooms.forEach(room => {
        availabilityUpdates.push({
          roomId: room.id,
          date,
          available: data.available,
          closed: data.closed,
        });
      });
    });

    // Push availability
    const availResult = await this.pushAvailability(availabilityUpdates);
    if (!availResult.success) errors.push(...availResult.errors);

    // Get room rates
    const rateUpdates: RateUpdate[] = [];
    rooms.forEach(room => {
      for (let d = new Date(today); d <= ninetyDaysLater; d.setDate(d.getDate() + 1)) {
        rateUpdates.push({
          roomId: room.id,
          date: d.toISOString().split('T')[0],
          rate: room.basePrice || 100,
        });
      }
    });

    // Push rates
    const ratesResult = await this.pushRates(rateUpdates);
    if (!ratesResult.success) errors.push(...ratesResult.errors);

    // Pull reservations (last 30 days to next 90 days)
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const reservationsResult = await this.pullReservations(thirtyDaysAgo, ninetyDaysLater);
    
    let reservationsSynced = 0;
    if (reservationsResult.success) {
      // Sync reservations to AgentFlow
      for (const res of reservationsResult.reservations) {
        try {
          await prisma.reservation.upsert({
            where: { externalId: res.reservation_id },
            update: {
              status: res.status === 'confirmed' ? 'confirmed' : 'cancelled',
              totalPrice: res.total_price,
            },
            create: {
              externalId: res.reservation_id,
              propertyId: this.credentials.hotelId,
              checkIn: new Date(res.checkin_date + 'T15:00:00'),
              checkOut: new Date(res.checkout_date + '11:00:00'),
              status: res.status === 'confirmed' ? 'confirmed' : 'cancelled',
              channel: 'booking.com',
              guestName: res.guest_name,
              guestEmail: res.guest_email,
              totalPrice: res.total_price,
            },
          });
          reservationsSynced++;
        } catch (error) {
          errors.push(`Failed to sync reservation ${res.reservation_id}`);
        }
      }
    }

    return {
      success: errors.length === 0,
      availabilityUpdated: availResult.updated,
      ratesUpdated: ratesResult.updated,
      reservationsSynced,
      errors,
    };
  }
}

/**
 * Factory function to create Booking.com service instance
 */
export function createBookingComService(propertyId: string): BookingComService | null {
  // Get credentials from database
  const pmsConnection = prisma.pmsConnection.findFirstSync({
    where: { propertyId, provider: 'booking.com' },
  });

  if (!pmsConnection) {
    return null;
  }

  const credentials = pmsConnection.credentials as any as BookingCredentials;
  return new BookingComService(credentials);
}
