/**
 * AgentFlow Pro - Booking.com API Integration
 * Real-time availability, pricing, and reservation management
 */

import axios from 'axios';

export interface BookingComProperty {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  rating: number;
  room_types: RoomType[];
}

export interface RoomType {
  id: string;
  name: string;
  max_occupancy: number;
  price_per_night: number;
  currency: string;
  amenities: string[];
}

export interface BookingComAvailability {
  property_id: string;
  room_type_id: string;
  check_in: string;
  check_out: string;
  available: boolean;
  price: number;
  currency: string;
  blocked_dates: string[];
}

export interface BookingComReservation {
  id: string;
  property_id: string;
  room_type_id: string;
  guest_name: string;
  guest_email: string;
  check_in: string;
  check_out: string;
  total_price: number;
  currency: string;
  status: 'confirmed' | 'pending' | 'cancelled';
}

export class BookingComAPI {
  private apiKey: string;
  private baseURL = 'https://distribution-xml.booking.com/2.0/json';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getProperties(city?: string, limit: number = 50): Promise<BookingComProperty[]> {
    try {
      const response = await axios.get(`${this.baseURL}/hotels`, {
        params: {
          api_key: this.apiKey,
          city: city || '',
          rows: limit,
          order_by: 'popularity'
        }
      });

      return response.data.result || [];
    } catch (error) {
      console.error('Error fetching Booking.com properties:', error);
      return [];
    }
  }

  async getPropertyDetails(propertyId: string): Promise<BookingComProperty | null> {
    try {
      const response = await axios.get(`${this.baseURL}/hotels/${propertyId}`, {
        params: {
          api_key: this.apiKey,
          hotel_ids: propertyId
        }
      });

      return response.data.result?.[0] || null;
    } catch (error) {
      console.error('Error fetching property details:', error);
      return null;
    }
  }

  async checkAvailability(
    propertyId: string,
    checkIn: Date,
    checkOut: Date,
    guests: number = 1
  ): Promise<BookingComAvailability[]> {
    try {
      const response = await axios.get(`${this.baseURL}/availability`, {
        params: {
          api_key: this.apiKey,
          hotel_ids: propertyId,
          check_in: this.formatDate(checkIn),
          check_out: this.formatDate(checkOut),
          guests: guests,
          language: 'en'
        }
      });

      return response.data.result || [];
    } catch (error) {
      console.error('Error checking availability:', error);
      return [];
    }
  }

  async createReservation(
    propertyId: string,
    roomTypeId: string,
    guestData: {
      name: string;
      email: string;
      phone?: string;
    },
    checkIn: Date,
    checkOut: Date,
    guests: number = 1
  ): Promise<BookingComReservation | null> {
    try {
      const response = await axios.post(`${this.baseURL}/reservations`, {
        api_key: this.apiKey,
        hotel_id: propertyId,
        room_type_id: roomTypeId,
        guest_name: guestData.name,
        guest_email: guestData.email,
        guest_phone: guestData.phone || '',
        check_in: this.formatDate(checkIn),
        check_out: this.formatDate(checkOut),
        guests: guests,
        language: 'en'
      });

      return response.data.result || null;
    } catch (error) {
      console.error('Error creating reservation:', error);
      return null;
    }
  }

  async cancelReservation(reservationId: string): Promise<boolean> {
    try {
      const response = await axios.delete(`${this.baseURL}/reservations/${reservationId}`, {
        params: {
          api_key: this.apiKey
        }
      });

      return response.data.success || false;
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      return false;
    }
  }

  async getReservations(propertyId?: string): Promise<BookingComReservation[]> {
    try {
      const params: Record<string, string | number> = {
        api_key: this.apiKey,
        language: 'en'
      };

      if (propertyId) {
        params.hotel_ids = propertyId;
      }

      const response = await axios.get(`${this.baseURL}/reservations`, { params });
      return response.data.result || [];
    } catch (error) {
      console.error('Error fetching reservations:', error);
      return [];
    }
  }

  async updateReservation(
    reservationId: string,
    updates: Partial<{
      check_in: Date;
      check_out: Date;
      guests: number;
    }>
  ): Promise<BookingComReservation | null> {
    try {
      const response = await axios.put(`${this.baseURL}/reservations/${reservationId}`, {
        api_key: this.apiKey,
        ...updates,
        check_in: updates.check_in ? this.formatDate(updates.check_in) : undefined,
        check_out: updates.check_out ? this.formatDate(updates.check_out) : undefined
      });

      return response.data.result || null;
    } catch (error) {
      console.error('Error updating reservation:', error);
      return null;
    }
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  }

  protected formatDateForAPI(date: Date): string {
    return this.formatDate(date);
  }
}

// Singleton instance for application use
let bookingComAPI: BookingComAPI | null = null;

export function getBookingComAPI(): BookingComAPI {
  if (!bookingComAPI) {
    const apiKey = process.env.BOOKING_COM_API_KEY;
    if (!apiKey) {
      throw new Error('BOOKING_COM_API_KEY environment variable is required');
    }
    bookingComAPI = new BookingComAPI(apiKey);
  }
  return bookingComAPI;
}

// Mock implementation for development/testing
export class MockBookingComAPI extends BookingComAPI {
  constructor() {
    super('mock-key');
  }

  async getProperties(city?: string, limit: number = 50): Promise<BookingComProperty[]> {
    return [
      {
        id: 'mock-property-1',
        name: 'Grand Hotel Ljubljana',
        address: 'Miklošičeva cesta 1',
        city: 'Ljubljana',
        country: 'Slovenia',
        rating: 4.5,
        room_types: [
          {
            id: 'room-1',
            name: 'Standard Double Room',
            max_occupancy: 2,
            price_per_night: 120,
            currency: 'EUR',
            amenities: ['WiFi', 'TV', 'Air Conditioning']
          }
        ]
      }
    ];
  }

  async checkAvailability(
    propertyId: string,
    checkIn: Date,
    checkOut: Date,
    guests: number = 1
  ): Promise<BookingComAvailability[]> {
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    
    return [
      {
        property_id: propertyId,
        room_type_id: 'room-1',
        check_in: this.formatDateForAPI(checkIn),
        check_out: this.formatDateForAPI(checkOut),
        available: true,
        price: 120 * nights,
        currency: 'EUR',
        blocked_dates: []
      }
    ];
  }

  async createReservation(
    propertyId: string,
    roomTypeId: string,
    guestData: { name: string; email: string; phone?: string; },
    checkIn: Date,
    checkOut: Date,
    _guests: number = 1
  ): Promise<BookingComReservation | null> {
    return {
      id: `RES_${Date.now()}`,
      property_id: propertyId,
      room_type_id: roomTypeId,
      guest_name: guestData.name,
      guest_email: guestData.email,
      check_in: this.formatDateForAPI(checkIn),
      check_out: this.formatDateForAPI(checkOut),
      total_price: 240,
      currency: 'EUR',
      status: 'confirmed'
    };
  }
}
