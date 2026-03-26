import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/database/schema';

export const dynamic = "force-dynamic";

interface CheckInData {
  bookingId: string;
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
  arrivalTime: string;
  specialRequests?: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  idVerification: {
    documentType: string;
    documentNumber: string;
    issuedBy: string;
    expiryDate: string;
  };
  paymentConfirmation: {
    paymentId: string;
    amount: number;
    currency: string;
  };
}

interface CheckInResponse {
  success: boolean;
  checkInId: string;
  status: "initiated" | "completed" | "failed";
  message: string;
  qrCode?: string;
  digitalKey?: string;
  roomNumber?: string;
  checkInTime?: string;
}

/**
 * GET /api/guest/portal/[booking-id]/checkin
 * Get online check-in status and information
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

    // Get check-in status (in real implementation, this would fetch from database)
    const mockCheckInStatus = {
      available: true,
      completed: false,
      checkInTime: "15:00",
      checkOutTime: "11:00",
      requirements: {
        idVerification: true,
        paymentConfirmation: true,
        emergencyContact: true,
        specialRequests: false
      },
      instructions: [
        "Please have your ID document ready for verification",
        "Confirm your payment details",
        "Provide emergency contact information",
        "Arrival time can be updated if needed"
      ]
    };

    return NextResponse.json({
      success: true,
      data: mockCheckInStatus
    });

  } catch (error) {
    console.error('Get check-in status error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/guest/portal/[booking-id]/checkin
 * Process online check-in
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ 'booking-id': string }> }
) {
  try {
    const resolvedParams = await params;
    const bookingId = resolvedParams['booking-id'];
    const body = await request.json();
    const { 
      guestInfo, 
      arrivalTime, 
      specialRequests, 
      emergencyContact, 
      idVerification, 
      paymentConfirmation 
    } = body;

    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_BOOKING_ID', message: 'Booking ID is required' } },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!guestInfo || !arrivalTime || !emergencyContact || !idVerification || !paymentConfirmation) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_PARAMS', message: 'Missing required check-in parameters' } },
        { status: 400 }
      );
    }

    // Validate guest information
    const requiredGuestFields = ['firstName', 'lastName', 'email', 'phone'];
    const missingGuestFields = requiredGuestFields.filter(field => !guestInfo[field]);
    
    if (missingGuestFields.length > 0) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_GUEST_INFO', message: `Missing guest information: ${missingGuestFields.join(', ')}` } },
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

    // Validate ID verification
    if (!idVerification.documentType || !idVerification.documentNumber || !idVerification.issuedBy || !idVerification.expiryDate) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_ID_INFO', message: 'Missing ID verification information' } },
        { status: 400 }
      );
    }

    // Validate emergency contact
    if (!emergencyContact.name || !emergencyContact.phone || !emergencyContact.relationship) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_EMERGENCY_CONTACT', message: 'Missing emergency contact information' } },
        { status: 400 }
      );
    }

    // Check if check-in is allowed (in real implementation, this would check booking status and dates)
    const checkInEligibility = await checkCheckInEligibility(bookingId);
    
    if (!checkInEligibility.allowed) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_ELIGIBLE', message: checkInEligibility.reason || 'Not eligible for check-in' } },
        { status: 403 }
      );
    }

    // Process check-in (in real implementation, this would save to database and generate keys)
    const checkInResponse = await processCheckIn(bookingId, {
      bookingId,
      guestInfo,
      arrivalTime,
      specialRequests,
      emergencyContact,
      idVerification,
      paymentConfirmation
    });

    // Send confirmation to guest (in real implementation)
    await sendCheckInConfirmation(bookingId, guestInfo.email, checkInResponse);

    // Notify front desk (in real implementation)
    await notifyFrontDesk(bookingId, checkInResponse);

    return NextResponse.json({
      success: true,
      data: checkInResponse
    });

  } catch (error) {
    console.error('Process check-in error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Check-in processing failed' } },
      { status: 500 }
    );
  }

async function checkCheckInEligibility(bookingId: string) {
  // In real implementation, this would check:
  // 1. Booking status (must be confirmed)
  // 2. Check-in date (must be today or within allowed window)
  // 3. Payment status (must be paid)
  // 4. Previous check-in (must not be already checked in)
  
  // console.log('Checking check-in eligibility for booking:', bookingId);
  
  // Simulate eligibility check
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // For demo purposes, return eligible
  return {
    allowed: true,
    reason: null
  };
}

async function processCheckIn(bookingId: string, data: CheckInData): Promise<CheckInResponse> {
  // In real implementation, this would:
  // 1. Save check-in data to database
  // 2. Generate digital key/QR code
  // 3. Update booking status
  // 4. Send notifications
  
  // console.log('Processing check-in for booking:', bookingId);
  
  // Simulate check-in processing
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const checkInId = `checkin_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  const digitalKey = `KEY_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const qrCode = `QR_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  
  return {
    success: true,
    checkInId,
    status: "completed",
    message: "Online check-in completed successfully",
    qrCode,
    digitalKey,
    roomNumber: "201",
    checkInTime: new Date().toISOString()
  };
}

async function sendCheckInConfirmation(bookingId: string, guestEmail: string, checkInResponse: CheckInResponse) {
  // In real implementation, this would send email confirmation
  // console.log('Sending check-in confirmation:', {
    bookingId,
    guestEmail,
    checkInId: checkInResponse.checkInId,
    roomNumber: checkInResponse.roomNumber,
    digitalKey: checkInResponse.digitalKey
  });
}

async function notifyFrontDesk(bookingId: string, checkInResponse: CheckInResponse) {
  // In real implementation, this would notify front desk staff
  // console.log('Notifying front desk about check-in:', {
    bookingId,
    checkInId: checkInResponse.checkInId,
    status: checkInResponse.status,
    roomNumber: checkInResponse.roomNumber,
    timestamp: new Date().toISOString()
  });
}
}
