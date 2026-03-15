import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/infrastructure/observability/logger';
import { prisma } from '@/database/schema';

export const dynamic = "force-dynamic";

interface BookingConfirmation {
  id: string;
  bookingNumber: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  roomType: string;
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
  paymentInfo: {
    paymentId: string;
    paymentMethod: string;
    status: string;
    amount: number;
    currency: string;
  };
  status: "confirmed" | "pending" | "cancelled";
  createdAt: string;
  updatedAt: string;
  specialRequests?: string;
  cancellationPolicy: {
    freeCancellation: boolean;
    cancellationDeadline: string;
    cancellationFee: number;
  };
}

/**
 * POST /api/book/confirm
 * Confirm booking after successful payment
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      bookingId, 
      paymentId, 
      checkIn, 
      checkOut, 
      guests, 
      roomType, 
      guestInfo, 
      totalPrice, 
      currency, 
      specialRequests,
      language = 'en' 
    } = body;

    if (!bookingId || !paymentId || !checkIn || !checkOut || !guests || !roomType || !guestInfo || !totalPrice || !currency) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_PARAMS', message: 'Missing required booking parameters' } },
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

    // Verify payment (in real implementation, this would check with payment gateway)
    const paymentVerification = await verifyPayment(paymentId, totalPrice, currency);
    
    if (!paymentVerification.verified) {
      return NextResponse.json(
        { success: false, error: { code: 'PAYMENT_VERIFICATION_FAILED', message: 'Payment verification failed' } },
        { status: 400 }
      );
    }

    // Check room availability (in real implementation, this would check actual database)
    const availabilityCheck = await checkRoomAvailability(roomType, checkIn, checkOut, guests);
    
    if (!availabilityCheck.available) {
      return NextResponse.json(
        { success: false, error: { code: 'ROOM_NOT_AVAILABLE', message: 'Room is no longer available for selected dates' } },
        { status: 409 }
      );
    }

    // Create booking confirmation
    const bookingConfirmation: BookingConfirmation = {
      id: bookingId,
      bookingNumber: generateBookingNumber(),
      checkIn,
      checkOut,
      guests,
      roomType,
      totalPrice,
      currency,
      guestInfo,
      paymentInfo: {
        paymentId,
        paymentMethod: paymentVerification.paymentMethod,
        status: 'completed',
        amount: totalPrice,
        currency
      },
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      specialRequests,
      cancellationPolicy: generateCancellationPolicy(checkIn, language)
    };

    // Save booking to database (in real implementation)
    await saveBooking(bookingConfirmation);

    // Send confirmation email
    await sendConfirmationEmail(bookingConfirmation, language);

    // Log booking confirmation
    await logBookingConfirmation(bookingConfirmation, request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || "unknown");

    return NextResponse.json({
      success: true,
      data: {
        message: 'Booking confirmed successfully',
        booking: bookingConfirmation
      }
    });

  } catch (error) {
    logger.error('Booking confirmation error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }

async function verifyPayment(paymentId: string, expectedAmount: number, expectedCurrency: string) {
  // In real implementation, this would verify payment with payment gateway
  logger.info('Verifying payment:', { paymentId, expectedAmount, expectedCurrency });
  
  // Simulate payment verification
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simulate successful verification
  return {
    verified: true,
    paymentMethod: 'credit_card',
    amount: expectedAmount,
    currency: expectedCurrency
  };
}

async function checkRoomAvailability(roomType: string, checkIn: string, checkOut: string, guests: number) {
  // In real implementation, this would check actual database availability
  logger.info('Checking room availability:', { roomType, checkIn, checkOut, guests });
  
  // Simulate availability check
  const roomAvailability = {
    standard: { maxGuests: 2, available: true },
    deluxe: { maxGuests: 3, available: true },
    suite: { maxGuests: 4, available: true }
  };
  
  const room = roomAvailability[roomType as keyof typeof roomAvailability];
  
  if (!room) {
    return { available: false };
  }
  
  return {
    available: room.maxGuests >= guests && room.available
  };
}

function generateBookingNumber(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `BK${timestamp}${random}`;
}

function generateCancellationPolicy(checkIn: string, language: string) {
  const checkInDate = new Date(checkIn);
  const today = new Date();
  const daysUntilCheckIn = Math.ceil((checkInDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  let freeCancellation = false;
  let cancellationDeadline = '';
  let cancellationFee = 0;
  
  if (daysUntilCheckIn >= 7) {
    freeCancellation = true;
    cancellationDeadline = new Date(checkInDate.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    cancellationFee = 0;
  } else if (daysUntilCheckIn >= 3) {
    freeCancellation = false;
    cancellationDeadline = new Date(checkInDate.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
    cancellationFee = 0.5; // 50% fee
  } else {
    freeCancellation = false;
    cancellationDeadline = checkInDate.toISOString();
    cancellationFee = 1.0; // 100% fee
  }
  
  return {
    freeCancellation,
    cancellationDeadline,
    cancellationFee
  };
}

async function saveBooking(booking: BookingConfirmation) {
  // In real implementation, this would save to database
  logger.info('Saving booking:', booking);
  
  // Simulate database save
  await new Promise(resolve => setTimeout(resolve, 500));
}

async function sendConfirmationEmail(booking: BookingConfirmation, language: string) {
  // In real implementation, this would send actual email
  logger.info('Sending confirmation email:', { bookingId: booking.id, email: booking.guestInfo.email, language });
  
  // Simulate email sending
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Generate email content based on language
  const emailContent = generateEmailContent(booking, language);
  logger.info('Email content generated:', emailContent);
}

function generateEmailContent(booking: BookingConfirmation, language: string) {
  const templates = {
    en: {
      subject: `Booking Confirmation - ${booking.bookingNumber}`,
      greeting: `Dear ${booking.guestInfo.firstName} ${booking.guestInfo.lastName},`,
      body: `Thank you for your booking at Hotel Alpina. Your reservation has been confirmed.`,
      details: `Booking Number: ${booking.bookingNumber}\nCheck-in: ${new Date(booking.checkIn).toLocaleDateString()}\nCheck-out: ${new Date(booking.checkOut).toLocaleDateString()}\nGuests: ${booking.guests}\nRoom Type: ${booking.roomType}\nTotal Amount: ${booking.currency} ${booking.totalPrice}`,
      closing: `We look forward to welcoming you to Hotel Alpina.\n\nBest regards,\nThe Hotel Alpina Team`
    },
    sl: {
      subject: `Potrditev rezervacije - ${booking.bookingNumber}`,
      greeting: `Spoštovani/a ${booking.guestInfo.firstName} ${booking.guestInfo.lastName},`,
      body: `Hvala za vašo rezervacijo v Hotel Alpina. Vaša rezervacija je bila potrjena.`,
      details: `Številka rezervacije: ${booking.bookingNumber}\nPrihod: ${new Date(booking.checkIn).toLocaleDateString()}\nOdhod: ${new Date(booking.checkOut).toLocaleDateString()}\nGostje: ${booking.guests}\nVrsta sobe: ${booking.roomType}\nSkupni znesek: ${booking.currency} ${booking.totalPrice}`,
      closing: `Z veseljem pričakujemo vaš prihod v Hotel Alpina.\n\nLep pozdrav,\nEkipa Hotel Alpina`
    },
    de: {
      subject: `Buchungsbestätigung - ${booking.bookingNumber}`,
      greeting: `Sehr geehrte/r ${booking.guestInfo.firstName} ${booking.guestInfo.lastName},`,
      body: `Vielen Dank für Ihre Buchung im Hotel Alpina. Ihre Reservierung wurde bestätigt.`,
      details: `Buchungsnummer: ${booking.bookingNumber}\nAnreise: ${new Date(booking.checkIn).toLocaleDateString()}\nAbreise: ${new Date(booking.checkOut).toLocaleDateString()}\nGäste: ${booking.guests}\nZimmertyp: ${booking.roomType}\nGesamtbetrag: ${booking.currency} ${booking.totalPrice}`,
      closing: `Wir freuen uns darauf, Sie im Hotel Alpina willkommen zu heißen.\n\nMit freundlichen Grüßen,\nDas Hotel Alpina Team`
    },
    it: {
      subject: `Conferma Prenotazione - ${booking.bookingNumber}`,
      greeting: `Gentile ${booking.guestInfo.firstName} ${booking.guestInfo.lastName},`,
      body: `Grazie per la tua prenotazione all'Hotel Alpina. La tua prenotazione è stata confermata.`,
      details: `Numero prenotazione: ${booking.bookingNumber}\nCheck-in: ${new Date(booking.checkIn).toLocaleDateString()}\nCheck-out: ${new Date(booking.checkOut).toLocaleDateString()}\nOspiti: ${booking.guests}\nTipo camera: ${booking.roomType}\nImporto totale: ${booking.currency} ${booking.totalPrice}`,
      closing: `Attendiamo con piacere la tua visita all'Hotel Alpina.\n\nCordiali saluti,\nIl Team Hotel Alpina`
    },
    hr: {
      subject: `Potvrda rezervacije - ${booking.bookingNumber}`,
      greeting: `Poštovani/a ${booking.guestInfo.firstName} ${booking.guestInfo.lastName},`,
      body: `Hvala vam na rezervaciji u Hotel Alpina. Vaša rezervacija je potvrđena.`,
      details: `Broj rezervacije: ${booking.bookingNumber}\nPrijava: ${new Date(booking.checkIn).toLocaleDateString()}\nOdjava: ${new Date(booking.checkOut).toLocaleDateString()}\nGostiju: ${booking.guests}\nVrsta sobe: ${booking.roomType}\nUkupni iznos: ${booking.currency} ${booking.totalPrice}`,
      closing: `Radujemo se vašem dolasku u Hotel Alpina.\n\nLijep pozdrav,\nTim Hotel Alpina`
    }
  };
  
  return templates[language as keyof typeof templates] || templates.en;
}

async function logBookingConfirmation(booking: BookingConfirmation, ipAddress: string) {
  // In real implementation, this would be stored in database
  logger.info('Booking confirmation logged:', {
    bookingId: booking.id,
    bookingNumber: booking.bookingNumber,
    guestEmail: booking.guestInfo.email,
    totalPrice: booking.totalPrice,
    currency: booking.currency,
    ipAddress,
    timestamp: new Date().toISOString()
  });
}
}
