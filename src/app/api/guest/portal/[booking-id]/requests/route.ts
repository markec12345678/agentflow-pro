import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/database/schema';

export const dynamic = "force-dynamic";

interface SpecialRequest {
  id: string;
  bookingId: string;
  type: "early_checkin" | "late_checkout" | "room_preference" | "extra_bed" | "other";
  title: string;
  description: string;
  status: "pending" | "approved" | "rejected" | "completed";
  submittedAt: string;
  response?: string;
  respondedAt?: string;
  respondedBy?: string;
}

/**
 * GET /api/guest/portal/[booking-id]/requests
 * Get special requests for a booking
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

    // Get special requests (in real implementation, this would fetch from database)
    const mockRequests: SpecialRequest[] = [
      {
        id: "req_1",
        bookingId,
        type: "late_checkout",
        title: "Late Checkout Request",
        description: "Request for late checkout until 14:00 on departure day",
        status: "approved",
        submittedAt: "2024-03-10T09:00:00Z",
        response: "Late checkout approved until 14:00. Additional fee may apply.",
        respondedAt: "2024-03-10T11:30:00Z",
        respondedBy: "front_desk"
      },
      {
        id: "req_2",
        bookingId,
        type: "room_preference",
        title: "Room Preference",
        description: "Prefer a room on a higher floor with mountain view if available",
        status: "pending",
        submittedAt: "2024-03-12T14:20:00Z"
      }
    ];

    return NextResponse.json({
      success: true,
      data: {
        requests: mockRequests,
        total: mockRequests.length
      }
    });

  } catch (error) {
    console.error('Get special requests error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/guest/portal/[booking-id]/requests
 * Create a new special request
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ 'booking-id': string }> }
) {
  try {
    const resolvedParams = await params;
    const bookingId = resolvedParams['booking-id'];
    const body = await request.json();
    const { type, title, description } = body;

    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_BOOKING_ID', message: 'Booking ID is required' } },
        { status: 400 }
      );
    }

    if (!type || !title || !description) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_PARAMS', message: 'Type, title, and description are required' } },
        { status: 400 }
      );
    }

    // Validate request type
    const validTypes = ["early_checkin", "late_checkout", "room_preference", "extra_bed", "other"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_TYPE', message: 'Invalid request type' } },
        { status: 400 }
      );
    }

    // Validate title length
    if (title.length < 3 || title.length > 100) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_TITLE', message: 'Title must be between 3 and 100 characters' } },
        { status: 400 }
      );
    }

    // Validate description length
    if (description.length < 10 || description.length > 500) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_DESCRIPTION', message: 'Description must be between 10 and 500 characters' } },
        { status: 400 }
      );
    }

    // Create special request (in real implementation, this would save to database)
    const newRequest: SpecialRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
      bookingId,
      type,
      title,
      description,
      status: "pending",
      submittedAt: new Date().toISOString()
    };

    // console.log('Created special request:', newRequest);

    // Send notification to staff (in real implementation)
    await notifyStaff(newRequest);

    return NextResponse.json({
      success: true,
      data: {
        message: 'Special request submitted successfully',
        request: newRequest
      }
    });

  } catch (error) {
    console.error('Create special request error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }

async function notifyStaff(request: SpecialRequest) {
  // In real implementation, this would send notification to hotel staff
  // console.log('Notifying staff about new request:', {
    requestId: request.id,
    bookingId: request.bookingId,
    type: request.type,
    title: request.title,
    timestamp: new Date().toISOString()
  });
}
}
