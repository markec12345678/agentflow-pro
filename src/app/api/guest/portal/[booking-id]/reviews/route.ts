import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/database/schema';

export const dynamic = "force-dynamic";

interface Review {
  id: string;
  bookingId: string;
  rating: number;
  title: string;
  content: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  response?: string;
  guestInfo: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

/**
 * GET /api/guest/portal/[booking-id]/reviews
 * Get reviews for a booking
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

    // Get reviews (in real implementation, this would fetch from database)
    const mockReviews: Review[] = [
      {
        id: "review_1",
        bookingId,
        rating: 5,
        title: "Excellent stay!",
        content: "The hotel was amazing, clean rooms, great service, and wonderful location. Would definitely recommend!",
        status: "approved",
        submittedAt: "2024-02-15T10:30:00Z",
        reviewedAt: "2024-02-15T14:20:00Z",
        reviewedBy: "management",
        response: "Thank you for your wonderful review! We're delighted you had a great stay.",
        guestInfo: {
          firstName: "John",
          lastName: "Doe",
          email: "john.doe@example.com"
        }
      }
    ];

    return NextResponse.json({
      success: true,
      data: {
        reviews: mockReviews,
        total: mockReviews.length,
        canLeaveReview: true // In real implementation, this would check if guest can leave review
      }
    });

  } catch (error) {
    console.error('Get reviews error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/guest/portal/[booking-id]/reviews
 * Submit a new review
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ 'booking-id': string }> }
) {
  try {
    const resolvedParams = await params;
    const bookingId = resolvedParams['booking-id'];
    const body = await request.json();
    const { rating, title, content } = body;

    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_BOOKING_ID', message: 'Booking ID is required' } },
        { status: 400 }
      );
    }

    if (!rating || !title || !content) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_PARAMS', message: 'Rating, title, and content are required' } },
        { status: 400 }
      );
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_RATING', message: 'Rating must be between 1 and 5' } },
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

    // Validate content length
    if (content.length < 10 || content.length > 1000) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_CONTENT', message: 'Content must be between 10 and 1000 characters' } },
        { status: 400 }
      );
    }

    // Check if guest can leave review (in real implementation, this would check booking status and dates)
    const canLeaveReview = await checkReviewEligibility(bookingId);
    
    if (!canLeaveReview) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_ELIGIBLE', message: 'Not eligible to leave review yet' } },
        { status: 403 }
      );
    }

    // Create review (in real implementation, this would save to database)
    const newReview: Review = {
      id: `review_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
      bookingId,
      rating,
      title,
      content,
      status: "pending",
      submittedAt: new Date().toISOString(),
      guestInfo: {
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com"
      }
    };

    console.log('Created review:', newReview);

    // Send notification to management (in real implementation)
    await notifyManagement(newReview);

    return NextResponse.json({
      success: true,
      data: {
        message: 'Review submitted successfully',
        review: newReview
      }
    });

  } catch (error) {
    console.error('Submit review error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }

async function checkReviewEligibility(bookingId: string): Promise<boolean> {
  // In real implementation, this would check:
  // 1. Booking status (must be completed)
  // 2. Check-out date (must be in the past)
  // 3. Existing review (guest hasn't already reviewed)
  // 4. Time since check-out (e.g., must be at least 24 hours after check-out)
  
  console.log('Checking review eligibility for booking:', bookingId);
  
  // Simulate eligibility check
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // For demo purposes, return true
  return true;
}

async function notifyManagement(review: Review) {
  // In real implementation, this would send notification to hotel management
  console.log('Notifying management about new review:', {
    reviewId: review.id,
    bookingId: review.bookingId,
    rating: review.rating,
    title: review.title,
    timestamp: new Date().toISOString()
  });
}
}
