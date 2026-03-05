import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/database/schema';

export const dynamic = "force-dynamic";

interface BookingDetails {
  id: string;
  bookingNumber: string;
  status: "confirmed" | "pending" | "cancelled" | "checked_in" | "checked_out";
  checkIn: string;
  checkOut: string;
  guests: number;
  roomType: string;
  roomNumber: string;
  totalPrice: number;
  currency: string;
  guestInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
    postalCode: string;
  };
  propertyInfo: {
    name: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    checkInTime: string;
    checkOutTime: string;
    amenities: string[];
  };
  paymentInfo: {
    paymentId: string;
    paymentMethod: string;
    status: string;
    amount: number;
    currency: string;
    paidAt: string;
  };
  cancellationPolicy: {
    freeCancellation: boolean;
    cancellationDeadline: string;
    cancellationFee: number;
  };
  specialRequests?: string;
  modifications: {
    canModify: boolean;
    modificationDeadline: string;
    modificationFee: number;
  };
  onlineCheckIn: {
    available: boolean;
    completed: boolean;
    checkInUrl?: string;
  };
  reviews: {
    canLeaveReview: boolean;
    reviewSubmitted: boolean;
    reviewId?: string;
  };
  invoices: {
    id: string;
    number: string;
    amount: number;
    currency: string;
    issuedAt: string;
    status: string;
    downloadUrl: string;
  }[];
}

/**
 * GET /api/guest/portal/[booking-id]
 * Get booking details for guest portal
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ 'booking-id': string }> }
) {
  try {
    const resolvedParams = await params;
    const bookingId = resolvedParams['booking-id'];

    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_BOOKING_ID', message: 'Booking ID is required' } },
        { status: 400 }
      );
    }

    // Validate booking ID format
    if (typeof bookingId !== 'string' || bookingId.length < 10) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_BOOKING_ID', message: 'Invalid booking ID format' } },
        { status: 400 }
      );
    }

    // Get booking details (in real implementation, this would fetch from database)
    const mockBookingDetails: BookingDetails = {
      id: bookingId,
      bookingNumber: `BK${Date.now()}`,
      status: "confirmed",
      checkIn: "2024-03-15",
      checkOut: "2024-03-18",
      guests: 2,
      roomType: "Deluxe Room",
      roomNumber: "201",
      totalPrice: 387,
      currency: "EUR",
      guestInfo: {
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        phone: "+386 1 234 5678",
        address: "Main Street 123",
        city: "Ljubljana",
        country: "Slovenia",
        postalCode: "1000"
      },
      propertyInfo: {
        name: "Hotel Alpina",
        address: "Cankarjeva ulica 5, 1000 Ljubljana, Slovenia",
        phone: "+386 1 234 5678",
        email: "info@hotel-alpina.si",
        website: "https://hotel-alpina.si",
        checkInTime: "15:00",
        checkOutTime: "11:00",
        amenities: ["wifi", "tv", "bath", "coffee", "minibar", "balcony", "safe", "spa", "restaurant", "bar", "gym", "parking"]
      },
      paymentInfo: {
        paymentId: `pay_${Date.now()}`,
        paymentMethod: "credit_card",
        status: "completed",
        amount: 387,
        currency: "EUR",
        paidAt: "2024-03-01T10:30:00Z"
      },
      cancellationPolicy: {
        freeCancellation: true,
        cancellationDeadline: "2024-03-13T23:59:59Z",
        cancellationFee: 0.5
      },
      specialRequests: "Late check-in requested",
      modifications: {
        canModify: true,
        modificationDeadline: "2024-03-13T23:59:59Z",
        modificationFee: 25
      },
      onlineCheckIn: {
        available: true,
        completed: false,
        checkInUrl: `/guest/checkin/${bookingId}`
      },
      reviews: {
        canLeaveReview: false,
        reviewSubmitted: false
      },
      invoices: [
        {
          id: "inv_1",
          number: "INV-2024-001",
          amount: 387,
          currency: "EUR",
          issuedAt: "2024-03-01T10:30:00Z",
          status: "paid",
          downloadUrl: `/api/invoices/inv_1/download`
        }
      ]
    };

    // Log access attempt
    await logPortalAccess(bookingId, request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || "unknown");

    return NextResponse.json({
      success: true,
      data: mockBookingDetails
    });

  } catch (error) {
    console.error('Get booking details error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/guest/portal/[booking-id]
 * Update booking details
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ 'booking-id': string }> }
) {
  try {
    const resolvedParams = await params;
    const bookingId = resolvedParams['booking-id'];
    const body = await request.json();
    const { action, data } = body;

    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_BOOKING_ID', message: 'Booking ID is required' } },
        { status: 400 }
      );
    }

    if (!action) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_ACTION', message: 'Action is required' } },
        { status: 400 }
      );
    }

    // Process different actions
    let result;
    switch (action) {
      case 'modify':
        result = await handleModifyBooking(bookingId, data);
        break;
      case 'cancel':
        result = await handleCancelBooking(bookingId, data);
        break;
      case 'special_request':
        result = await handleSpecialRequest(bookingId, data);
        break;
      case 'review':
        result = await handleReview(bookingId, data);
        break;
      case 'online_checkin':
        result = await handleOnlineCheckIn(bookingId, data);
        break;
      default:
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_ACTION', message: 'Invalid action' } },
          { status: 400 }
        );
    }

    // Log action
    await logPortalAction(bookingId, action, data, request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || "unknown");

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Update booking error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

async function handleModifyBooking(bookingId: string, data: any) {
  // In real implementation, this would update the booking in database
  console.log('Modifying booking:', { bookingId, data });
  
  // Validate modification data
  const { newCheckIn, newCheckOut, newGuests, reason } = data;
  
  if (!newCheckIn || !newCheckOut || !newGuests || !reason) {
    throw new Error('Missing required modification data');
  }

  // Validate dates
  const checkInDate = new Date(newCheckIn);
  const checkOutDate = new Date(newCheckOut);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (checkInDate < today) {
    throw new Error('Check-in date cannot be in the past');
  }

  if (checkOutDate <= checkInDate) {
    throw new Error('Check-out date must be after check-in date');
  }

  // Simulate modification
  await new Promise(resolve => setTimeout(resolve, 2000));

  return {
    message: 'Booking modification request submitted successfully',
    modificationId: `mod_${Date.now()}`,
    status: 'pending'
  };
}

async function handleCancelBooking(bookingId: string, data: any) {
  // In real implementation, this would cancel the booking in database
  console.log('Cancelling booking:', { bookingId, data });
  
  // Validate cancellation
  const { reason } = data;
  
  if (!reason) {
    throw new Error('Cancellation reason is required');
  }

  // Check cancellation policy
  const today = new Date();
  const cancellationDeadline = new Date('2024-03-13T23:59:59Z');
  
  if (today > cancellationDeadline) {
    throw new Error('Cancellation deadline has passed');
  }

  // Simulate cancellation
  await new Promise(resolve => setTimeout(resolve, 2000));

  return {
    message: 'Booking cancelled successfully',
    cancellationId: `cancel_${Date.now()}`,
    refundAmount: 193.5, // 50% refund
    refundCurrency: 'EUR'
  };
}

async function handleSpecialRequest(bookingId: string, data: any) {
  // In real implementation, this would create a special request in database
  console.log('Creating special request:', { bookingId, data });
  
  // Validate request data
  const { type, title, description } = data;
  
  if (!type || !title || !description) {
    throw new Error('Missing required special request data');
  }

  // Simulate request creation
  await new Promise(resolve => setTimeout(resolve, 1000));

  return {
    message: 'Special request submitted successfully',
    requestId: `req_${Date.now()}`,
    status: 'pending'
  };
}

async function handleReview(bookingId: string, data: any) {
  // In real implementation, this would create a review in database
  console.log('Creating review:', { bookingId, data });
  
  // Validate review data
  const { rating, title, content } = data;
  
  if (!rating || !title || !content) {
    throw new Error('Missing required review data');
  }

  if (rating < 1 || rating > 5) {
    throw new Error('Rating must be between 1 and 5');
  }

  // Simulate review creation
  await new Promise(resolve => setTimeout(resolve, 1000));

  return {
    message: 'Review submitted successfully',
    reviewId: `review_${Date.now()}`,
    status: 'pending'
  };
}

async function handleOnlineCheckIn(bookingId: string, data: any) {
  // In real implementation, this would start the online check-in process
  console.log('Starting online check-in:', { bookingId, data });
  
  // Simulate check-in process
  await new Promise(resolve => setTimeout(resolve, 1000));

  return {
    message: 'Online check-in initiated successfully',
    checkInId: `checkin_${Date.now()}`,
    status: 'initiated',
    checkInUrl: `/guest/checkin/${bookingId}`
  };
}

async function logPortalAccess(bookingId: string, ipAddress: string) {
  // In real implementation, this would be stored in database
  console.log('Portal access logged:', {
    bookingId,
    ipAddress,
    timestamp: new Date().toISOString()
  });
}

async function logPortalAction(bookingId: string, action: string, data: any, ipAddress: string) {
  // In real implementation, this would be stored in database
  console.log('Portal action logged:', {
    bookingId,
    action,
    data,
    ipAddress,
    timestamp: new Date().toISOString()
  });
}
