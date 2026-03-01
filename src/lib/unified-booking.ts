/**
 * AgentFlow Pro - Enhanced Booking System Integrations
 * Connects with multiple booking platforms for unified management
 */

import { getBookingComAPI, BookingComAPI, MockBookingComAPI } from '@/integrations/bookingCom';
import { prisma } from '@/database/schema';
import { calculatePrice } from '@/lib/tourism/pricing-engine';

// Airbnb API Integration
export interface AirbnbProperty {
  id: string;
  name: string;
  description: string;
  location: {
    address: string;
    city: string;
    country: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  photos: string[];
  amenities: string[];
  roomTypes: AirbnbRoomType[];
  pricing: AirbnbPricing;
  availability: AirbnbAvailability[];
}

export interface AirbnbRoomType {
  id: string;
  name: string;
  capacity: number;
  price: {
    nightly: number;
    weekly?: number;
    monthly?: number;
  };
  amenities: string[];
  photos: string[];
}

export interface AirbnbPricing {
  basePrice: number;
  currency: string;
  cleaningFee?: number;
  serviceFee?: number;
  taxes: number;
  seasonalPricing?: Record<string, number>;
}

export interface AirbnbAvailability {
  date: string;
  available: boolean;
  minimumNights?: number;
  checkInDays?: string[];
  price?: number;
}

export class AirbnbAPI {
  private apiKey: string;
  private baseURL = 'https://api.airbnb.com/v2';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getProperties(location?: string, _limit: number = 50): Promise<AirbnbProperty[]> {
    // Mock implementation - integrate with real Airbnb API
    return [
      {
        id: 'airbnb-property-1',
        name: 'Cozy Apartment Ljubljana',
        description: 'Modern apartment in city center',
        location: {
          address: 'Miklošičeva ulica 12',
          city: 'Ljubljana',
          country: 'Slovenia',
          coordinates: { lat: 46.0569, lng: 14.5058 }
        },
        photos: ['photo1.jpg', 'photo2.jpg'],
        amenities: ['WiFi', 'Kitchen', 'AC', 'Washer'],
        roomTypes: [
          {
            id: 'room-1',
            name: 'Entire apartment',
            capacity: 4,
            price: { nightly: 85, weekly: 550, monthly: 1800 },
            amenities: ['WiFi', 'Kitchen', 'AC'],
            photos: ['room1.jpg']
          }
        ],
        pricing: {
          basePrice: 85,
          currency: 'EUR',
          cleaningFee: 30,
          serviceFee: 15,
          taxes: 22,
          seasonalPricing: {
            summer: 1.2,
            winter: 1.1
          }
        },
        availability: []
      }
    ];
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
    _guests: number = 1
  ): Promise<{ id: string; propertyId: string; status: string; totalPrice: number; currency: string }> {
    // Mock implementation
    return {
      id: `AIR_${Date.now()}`,
      propertyId,
      status: 'confirmed',
      totalPrice: 425,
      currency: 'EUR'
    };
  }
}

// TripAdvisor API Integration
export interface TripAdvisorReview {
  id: string;
  propertyId: string;
  rating: number;
  title: string;
  text: string;
  author: string;
  date: string;
  language: string;
  helpfulVotes: number;
  response?: TripAdvisorResponse;
}

export interface TripAdvisorResponse {
  id: string;
  text: string;
  author: string;
  date: string;
  language: string;
}

export class TripAdvisorAPI {
  private apiKey: string;
  private baseURL = 'https://api.tripadvisor.com/api/partner';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getPropertyReviews(propertyId: string, limit: number = 50): Promise<TripAdvisorReview[]> {
    // Mock implementation
    return [
      {
        id: 'review-1',
        propertyId,
        rating: 5,
        title: 'Amazing stay in Ljubljana!',
        text: 'Perfect location, clean apartment, great host. Would definitely stay again!',
        author: 'John D.',
        date: '2026-02-15',
        language: 'en',
        helpfulVotes: 12
      },
      {
        id: 'review-2',
        propertyId,
        rating: 4,
        title: 'Good value for money',
        text: 'Nice place, central location, but a bit small for 4 people.',
        author: 'Sarah M.',
        date: '2026-02-10',
        language: 'en',
        helpfulVotes: 8
      }
    ];
  }

  async respondToReview(
    reviewId: string,
    responseText: string,
    language: string = 'en'
  ): Promise<TripAdvisorResponse> {
    // Mock implementation
    return {
      id: `response_${Date.now()}`,
      text: responseText,
      author: 'Property Management',
      date: new Date().toISOString().split('T')[0],
      language
    };
  }
}

// Unified Booking Management System
export interface UnifiedBookingRequest {
  channel: 'booking.com' | 'airbnb' | 'direct';
  propertyId: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  guestData: {
    name: string;
    email: string;
    phone?: string;
  };
  preferences?: {
    roomType?: string;
    floor?: string;
    view?: string;
    specialRequests?: string;
  };
}

export interface UnifiedBookingResponse {
  success: boolean;
  bookingId?: string;
  channelId?: string;
  confirmationCode?: string;
  totalPrice?: number;
  currency?: string;
  status?: string;
  errors?: string[];
}

export class UnifiedBookingManager {
  private bookingComAPI: BookingComAPI;
  private airbnbAPI: AirbnbAPI;
  private tripAdvisorAPI: TripAdvisorAPI;

  constructor() {
    // Initialize APIs with environment variables or mock implementations
    this.bookingComAPI = process.env.BOOKING_COM_API_KEY
      ? getBookingComAPI()
      : new MockBookingComAPI();

    this.airbnbAPI = process.env.AIRBNB_API_KEY
      ? new AirbnbAPI(process.env.AIRBNB_API_KEY)
      : new AirbnbAPI('mock-key');

    this.tripAdvisorAPI = process.env.TRIPADVISOR_API_KEY
      ? new TripAdvisorAPI(process.env.TRIPADVISOR_API_KEY)
      : new TripAdvisorAPI('mock-key');
  }

  async searchAcrossChannels(
    location: string,
    checkIn: Date,
    checkOut: Date,
    guests: number
  ): Promise<{
    bookingCom: Array<{ total_price?: number; price?: number }>;
    airbnb: AirbnbProperty[];
    comparison: { bookingCom: { min: number; max: number; average: number }; airbnb: { min: number; max: number; average: number }; recommendation: string };
  }> {
    const [bookingComResults, airbnbResults] = await Promise.all([
      this.bookingComAPI.checkAvailability('mock-property', checkIn, checkOut, guests),
      this.airbnbAPI.getProperties(location)
    ]);

    return {
      bookingCom: bookingComResults,
      airbnb: airbnbResults,
      comparison: this.comparePrices(bookingComResults, airbnbResults)
    };
  }

  async createUnifiedBooking(request: UnifiedBookingRequest): Promise<UnifiedBookingResponse> {
    try {
      switch (request.channel) {
        case 'booking.com':
          return await this.createBookingComBooking(request);

        case 'airbnb':
          return await this.createAirbnbBooking(request);

        case 'direct':
          return await this.createDirectBooking(request);

        default:
          return {
            success: false,
            errors: [`Unsupported channel: ${request.channel}`]
          };
      }
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Booking failed']
      };
    }
  }

  async syncAvailabilityAcrossChannels(propertyId: string): Promise<{
    bookingCom: any[];
    airbnb: any[];
    conflicts: any[];
  }> {
    const [bookingComAvailability, airbnbProperties] = await Promise.all([
      this.bookingComAPI.getReservations(propertyId),
      this.airbnbAPI.getProperties()
    ]);

    const airbnbProperty = airbnbProperties.find(p => p.id === propertyId);
    const airbnbAvailability = airbnbProperty?.availability || [];

    const conflicts = this.detectAvailabilityConflicts(
      bookingComAvailability,
      airbnbAvailability
    );

    return {
      bookingCom: bookingComAvailability,
      airbnb: airbnbAvailability,
      conflicts
    };
  }

  private async createBookingComBooking(request: UnifiedBookingRequest): Promise<UnifiedBookingResponse> {
    const result = await this.bookingComAPI.createReservation(
      request.propertyId,
      'room-1', // Mock room type
      request.guestData,
      request.checkIn,
      request.checkOut,
      request.guests
    );

    return {
      success: !!result,
      bookingId: result?.id,
      channelId: 'booking.com',
      confirmationCode: result?.id,
      totalPrice: result?.total_price,
      currency: result?.currency,
      status: result?.status
    };
  }

  private async createAirbnbBooking(request: UnifiedBookingRequest): Promise<UnifiedBookingResponse> {
    const result = await this.airbnbAPI.createReservation(
      request.propertyId,
      'room-1', // Mock room type
      request.guestData,
      request.checkIn,
      request.checkOut,
      request.guests
    );

    return {
      success: !!result,
      bookingId: result?.id,
      channelId: 'airbnb',
      confirmationCode: result?.id,
      totalPrice: result?.totalPrice,
      currency: result?.currency,
      status: result?.status
    };
  }

  private async createDirectBooking(request: UnifiedBookingRequest): Promise<UnifiedBookingResponse> {
    const bookingId = `DIRECT_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const confirmationCode = `CONF_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    const property = await prisma.property.findUnique({
      where: { id: request.propertyId },
      select: { basePrice: true, currency: true },
    });
    const baseRate = property?.basePrice ?? 120;
    const result = calculatePrice(baseRate, request.checkIn, request.checkOut);
    const currency = property?.currency ?? 'EUR';

    return {
      success: true,
      bookingId,
      channelId: 'direct',
      confirmationCode,
      totalPrice: result.finalPrice,
      currency,
      status: 'confirmed'
    };
  }

  private comparePrices(bookingComResults: Array<{ total_price?: number; price?: number }>, airbnbResults: AirbnbProperty[]): { bookingCom: { min: number; max: number; average: number }; airbnb: { min: number; max: number; average: number }; recommendation: string } {
    // Price comparison logic (BookingCom uses price or total_price)
    const bookingComPrices = bookingComResults.map(r => r.total_price ?? r.price ?? 0);
    const airbnbPrices = airbnbResults.map(p => p.roomTypes[0]?.price?.nightly || 0);

    return {
      bookingCom: {
        min: Math.min(...bookingComPrices),
        max: Math.max(...bookingComPrices),
        average: bookingComPrices.reduce((a, b) => a + b, 0) / bookingComPrices.length
      },
      airbnb: {
        min: airbnbPrices.length ? Math.min(...airbnbPrices) : 0,
        max: airbnbPrices.length ? Math.max(...airbnbPrices) : 0,
        average: airbnbPrices.length ? airbnbPrices.reduce((a, b) => a + b, 0) / airbnbPrices.length : 0
      },
      recommendation: this.getBestValueRecommendation(bookingComResults, airbnbResults)
    };
  }

  private getBestValueRecommendation(bookingComResults: any[], airbnbResults: AirbnbProperty[]): string {
    const bookingComAvg = bookingComResults.reduce((sum, r) => sum + (r.total_price || 0), 0) / bookingComResults.length;
    const airbnbAvg = airbnbResults.reduce((sum, p) => sum + (p.roomTypes[0]?.price?.nightly ?? 0), 0) / (airbnbResults.length || 1);

    if (airbnbAvg < bookingComAvg) {
      return 'Airbnb offers better value';
    } else if (bookingComAvg < airbnbAvg) {
      return 'Booking.com offers better value';
    } else {
      return 'Both channels offer similar pricing';
    }
  }

  private detectAvailabilityConflicts(
    bookingComReservations: Array<{ check_in?: string; check_out?: string }>,
    airbnbAvailability: AirbnbAvailability[]
  ): Array<{ date: string; type: string; channels: string[] }> {
    // Detect double-bookings and availability conflicts
    const conflicts: Array<{ date: string; type: string; channels: string[] }> = [];

    // Mock conflict detection logic
    const bookingDates = bookingComReservations.map(r => ({
      checkIn: new Date(r.check_in ?? 0),
      checkOut: new Date(r.check_out ?? 0)
    }));

    for (const availability of airbnbAvailability) {
      const availDate = new Date(availability.date);
      const hasConflict = bookingDates.some(booking =>
        availDate >= booking.checkIn && availDate < booking.checkOut
      );

      if (hasConflict && !availability.available) {
        conflicts.push({
          date: availability.date,
          type: 'double_booking',
          channels: ['airbnb', 'booking.com']
        });
      }
    }

    return conflicts;
  }
}

// Singleton instance
let unifiedBookingManager: UnifiedBookingManager | null = null;

export function getUnifiedBookingManager(): UnifiedBookingManager {
  if (!unifiedBookingManager) {
    unifiedBookingManager = new UnifiedBookingManager();
  }
  return unifiedBookingManager;
}
