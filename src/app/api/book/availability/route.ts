import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/database/schema';

export const dynamic = "force-dynamic";

interface RoomAvailability {
  id: string;
  name: string;
  maxGuests: number;
  price: number;
  currency: string;
  available: boolean;
  availableRooms: number;
  totalRooms: number;
  minNights: number;
  maxNights: number;
  restrictions: {
    checkInDays: string[];
    checkOutDays: string[];
    blackoutDates: string[];
  };
}

interface AvailabilityResponse {
  available: boolean;
  rooms: RoomAvailability[];
  totalAvailable: number;
  totalPrice: number;
  currency: string;
  nights: number;
  checkIn: string;
  checkOut: string;
  guests: number;
}

/**
 * GET /api/book/availability
 * Check room availability and pricing
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const checkIn = searchParams.get('checkIn');
    const checkOut = searchParams.get('checkOut');
    const guests = searchParams.get('guests');
    const roomType = searchParams.get('roomType');
    const language = searchParams.get('language') || 'en';

    if (!checkIn || !checkOut || !guests) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_PARAMS', message: 'checkIn, checkOut, and guests are required' } },
        { status: 400 }
      );
    }

    // Validate dates
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkInDate < today) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_DATE', message: 'Check-in date cannot be in the past' } },
        { status: 400 }
      );
    }

    if (checkOutDate <= checkInDate) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_DATE_RANGE', message: 'Check-out date must be after check-in date' } },
        { status: 400 }
      );
    }

    const guestCount = parseInt(guests);
    if (isNaN(guestCount) || guestCount < 1 || guestCount > 10) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_GUESTS', message: 'Guests must be between 1 and 10' } },
        { status: 400 }
      );
    }

    // Calculate nights
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

    // Get room availability (in real implementation, this would check actual database)
    const mockRooms: RoomAvailability[] = [
      {
        id: "standard",
        name: language === "en" ? "Standard Room" : 
              language === "sl" ? "Standardna soba" :
              language === "de" ? "Standardzimmer" :
              language === "it" ? "Camera Standard" :
              language === "hr" ? "Standardna soba" : "Standard Room",
        maxGuests: 2,
        price: 89,
        currency: "EUR",
        available: guestCount <= 2,
        availableRooms: guestCount <= 2 ? 5 : 0,
        totalRooms: 10,
        minNights: 1,
        maxNights: 30,
        restrictions: {
          checkInDays: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
          checkOutDays: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
          blackoutDates: []
        }
      },
      {
        id: "deluxe",
        name: language === "en" ? "Deluxe Room" : 
              language === "sl" ? "Luksuzna soba" :
              language === "de" ? "Deluxe-Zimmer" :
              language === "it" ? "Camera Deluxe" :
              language === "hr" ? "Deluxe soba" : "Deluxe Room",
        maxGuests: 3,
        price: 129,
        currency: "EUR",
        available: guestCount <= 3,
        availableRooms: guestCount <= 3 ? 3 : 0,
        totalRooms: 8,
        minNights: 1,
        maxNights: 30,
        restrictions: {
          checkInDays: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
          checkOutDays: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
          blackoutDates: []
        }
      },
      {
        id: "suite",
        name: language === "en" ? "Executive Suite" : 
              language === "sl" ? "Executive apartma" :
              language === "de" ? "Executive Suite" :
              language === "it" ? "Suite Executive" :
              language === "hr" ? "Executive suite" : "Executive Suite",
        maxGuests: 4,
        price: 189,
        currency: "EUR",
        available: guestCount <= 4 && nights >= 2,
        availableRooms: guestCount <= 4 && nights >= 2 ? 2 : 0,
        totalRooms: 4,
        minNights: 2,
        maxNights: 30,
        restrictions: {
          checkInDays: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
          checkOutDays: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
          blackoutDates: []
        }
      }
    ];

    // Filter rooms based on guest count and room type if specified
    let availableRooms = mockRooms.filter(room => 
      room.available && 
      room.maxGuests >= guestCount &&
      (!roomType || room.id === roomType)
    );

    // Check minimum nights requirement
    availableRooms = availableRooms.filter(room => nights >= room.minNights);

    // Check maximum nights requirement
    availableRooms = availableRooms.filter(room => nights <= room.maxNights);

    // Calculate total price for each room
    const roomsWithPricing = availableRooms.map(room => ({
      ...room,
      totalPrice: nights * room.price
    }));

    const totalAvailable = roomsWithPricing.reduce((sum, room) => sum + room.availableRooms, 0);

    const response: AvailabilityResponse = {
      available: totalAvailable > 0,
      rooms: roomsWithPricing,
      totalAvailable,
      totalPrice: roomsWithPricing.length > 0 ? Math.min(...roomsWithPricing.map(r => r.totalPrice)) : 0,
      currency: "EUR",
      nights,
      checkIn,
      checkOut,
      guests: guestCount
    };

    return NextResponse.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Availability check error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/book/availability
 * Create a booking hold
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { checkIn, checkOut, guests, roomType, guestInfo, language = 'en' } = body;

    if (!checkIn || !checkOut || !guests || !roomType || !guestInfo) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_PARAMS', message: 'Missing required booking parameters' } },
        { status: 400 }
      );
    }

    // Validate guest information
    const requiredFields = ['firstName', 'lastName', 'email', 'phone'];
    const missingFields = requiredFields.filter(field => !guestInfo[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_GUEST_INFO', message: `Missing guest information: ${missingFields.join(', ')}` } },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(guestInfo.email)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_EMAIL', message: 'Invalid email format' } },
        { status: 400 }
      );
    }

    // Check availability first
    const availabilityResponse = await checkAvailability(checkIn, checkOut, guests, roomType);
    
    if (!availabilityResponse.available) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_AVAILABLE', message: 'Room not available for selected dates' } },
        { status: 409 }
      );
    }

    // Create booking hold (in real implementation, this would create a temporary reservation)
    const holdId = `hold_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    const holdExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes hold

    const bookingHold = {
      holdId,
      checkIn,
      checkOut,
      guests,
      roomType,
      guestInfo,
      totalPrice: availabilityResponse.totalPrice,
      currency: availabilityResponse.currency,
      nights: availabilityResponse.nights,
      expiresAt: holdExpiry.toISOString(),
      status: 'held'
    };

    console.log('Created booking hold:', bookingHold);

    return NextResponse.json({
      success: true,
      data: {
        message: 'Booking hold created successfully',
        hold: bookingHold,
        expiresAt: holdExpiry.toISOString()
      }
    });

  } catch (error) {
    console.error('Create booking hold error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }

async function checkAvailability(checkIn: string, checkOut: string, guests: string, roomType: string) {
  // In real implementation, this would check actual database availability
  const mockRooms = [
    {
      id: "standard",
      maxGuests: 2,
      price: 89,
      availableRooms: 5,
      minNights: 1,
      maxNights: 30
    },
    {
      id: "deluxe",
      maxGuests: 3,
      price: 129,
      availableRooms: 3,
      minNights: 1,
      maxNights: 30
    },
    {
      id: "suite",
      maxGuests: 4,
      price: 189,
      availableRooms: 2,
      minNights: 2,
      maxNights: 30
    }
  ];

  const guestCount = parseInt(guests);
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

  const room = mockRooms.find(r => r.id === roomType);
  
  if (!room) {
    return { available: false };
  }

  const available = room.maxGuests >= guestCount && 
                    room.availableRooms > 0 && 
                    nights >= room.minNights && 
                    nights <= room.maxNights;

  return {
    available,
    totalPrice: available ? nights * room.price : 0,
    currency: "EUR",
    nights
  };
}
}
