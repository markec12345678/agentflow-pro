/**
 * POST /api/reviews/request
 * Send review request to guest
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import {
  createReviewRequest,
  generateReviewRequestEmail,
  generateReviewRequestSMS,
  calculateReviewRequestDate
} from "@/lib/reviews/google-reviews";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);

    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const {
      reservationId,
      propertyId,
      channel = 'both', // email, sms, or both
      delayDays = 1
    } = body;

    // Fetch reservation with guest and property data
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        guest: {
          select: {
            email: true,
            phone: true,
            firstName: true,
            lastName: true
          }
        },
        property: {
          select: {
            name: true,
            googlePlaceId: true
          }
        }
      }
    });

    if (!reservation) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    // Verify ownership
    if (reservation.propertyId !== propertyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if review request already exists
    const existingRequest = await prisma.reviewRequest.findFirst({
      where: { reservationId }
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: "Review request already exists for this reservation" },
        { status: 400 }
      );
    }

    // Create review request
    const reviewRequest = createReviewRequest(
      {
        id: reservation.id,
        guestEmail: reservation.guest?.email || '',
        guestPhone: reservation.guest?.phone || undefined,
        guestName: `${reservation.guest?.firstName} ${reservation.guest?.lastName}`.trim(),
        property: {
          name: reservation.property.name,
          googlePlaceId: reservation.property.googlePlaceId || undefined
        },
        checkOutDate: reservation.checkOutDate
      },
      {
        placeId: reservation.property.googlePlaceId || '',
        apiKey: process.env.GOOGLE_API_KEY || '',
        businessName: reservation.property.name,
        reviewRequestDelayDays: delayDays
      }
    );

    // Calculate send date
    const sendDate = calculateReviewRequestDate(reservation.checkOutDate, delayDays);

    // Save to database
    const savedRequest = await prisma.reviewRequest.create({
      data: {
        id: reviewRequest.id,
        reservationId: reservation.id,
        propertyId: reservation.propertyId,
        guestEmail: reviewRequest.guestEmail,
        guestPhone: reviewRequest.guestPhone,
        guestName: reviewRequest.guestName,
        reviewUrl: reviewRequest.reviewUrl,
        channel: channel as any,
        status: 'pending',
        scheduledFor: sendDate
      }
    });

    // If checkout was already, send immediately (for testing)
    const now = new Date();
    if (reservation.checkOutDate < now) {
      // Send immediately
      await sendReviewRequest(savedRequest, channel);
    } else {
      // Schedule for later (in production, use a job queue)
      logger.info(`Review request scheduled for ${sendDate.toISOString()}`);
    }

    return NextResponse.json({
      success: true,
      reviewRequest: savedRequest,
      scheduledFor: sendDate
    });
  } catch (error) {
    logger.error("Error creating review request:", error);
    return NextResponse.json(
      { error: "Failed to create review request" },
      { status: 500 }
    );
  }
}

/**
 * Send review request (email/SMS)
 */
async function sendReviewRequest(
  request: any,
  channel: string
) {
  const emailData = generateReviewRequestEmail({
    id: request.id,
    reservationId: request.reservationId,
    guestEmail: request.guestEmail,
    guestPhone: request.guestPhone,
    guestName: request.guestName,
    propertyName: request.propertyName || request.property?.name,
    checkOutDate: new Date(),
    status: 'pending',
    reviewUrl: request.reviewUrl,
    channel: channel
  });

  const smsData = generateReviewRequestSMS({
    id: request.id,
    reservationId: request.reservationId,
    guestEmail: request.guestEmail,
    guestPhone: request.guestPhone,
    guestName: request.guestName,
    propertyName: request.propertyName || request.property?.name,
    checkOutDate: new Date(),
    status: 'pending',
    reviewUrl: request.reviewUrl,
    channel: channel
  });

  // In production, integrate with email/SMS providers
  logger.info("Email to:", request.guestEmail);
  logger.info("Email subject:", emailData.subject);
  logger.info("SMS to:", request.guestPhone);
  logger.info("SMS body:", smsData.body);

  // Update status to sent
  await prisma.reviewRequest.update({
    where: { id: request.id },
    data: {
      status: 'sent',
      sentAt: new Date()
    }
  });
}
