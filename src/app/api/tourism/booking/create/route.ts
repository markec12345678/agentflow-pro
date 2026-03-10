/**
 * POST /api/tourism/booking/create
 * Create direct booking from widget
 * Body: { propertyId, roomId, checkIn, checkOut, guests, guestDetails, paymentMethodId }
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/database/schema";
import { stripeGuestPaymentService } from "@/lib/stripe-guest-payments";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      propertyId,
      roomId,
      checkIn,
      checkOut,
      guests,
      guestDetails,
      paymentMethodId,
    } = body;

    if (!propertyId || !roomId || !checkIn || !checkOut) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify room availability
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    const existingReservation = await prisma.reservation.findFirst({
      where: {
        propertyId,
        roomId,
        status: { in: ["confirmed", "checked_in"] },
        OR: [
          {
            checkIn: { lte: checkOutDate },
            checkOut: { gte: checkInDate },
          },
        ],
      },
    });

    if (existingReservation) {
      return NextResponse.json(
        { error: "Room no longer available" },
        { status: 409 }
      );
    }

    // Calculate total price
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const nights = Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const totalPrice = (room.basePrice || 100) * nights;

    // Create guest record
    const guest = await prisma.guest.create({
      data: {
        propertyId,
        name: guestDetails.name,
        email: guestDetails.email,
        phone: guestDetails.phone,
      },
    });

    // Create reservation
    const reservation = await prisma.reservation.create({
      data: {
        propertyId,
        roomId,
        guestId: guest.id,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        status: "confirmed",
        channel: "direct",
        totalPrice,
        guests,
        guestName: guestDetails.name,
        guestEmail: guestDetails.email,
        guestPhone: guestDetails.phone,
        notes: guestDetails.notes,
      },
    });

    // Process payment
    if (paymentMethodId) {
      const paymentResult = await stripeGuestPaymentService.chargeGuest({
        paymentMethodId,
        reservationId: reservation.id,
        amount: totalPrice,
        capture: true,
      });

      if (!paymentResult.success) {
        // Rollback reservation if payment fails
        await prisma.reservation.delete({ where: { id: reservation.id } });
        
        return NextResponse.json(
          { error: paymentResult.error || "Payment failed" },
          { status: 400 }
        );
      }
    }

    // Generate invoice
    try {
      const invoice = await prisma.invoice.create({
        data: {
          reservationId: reservation.id,
          propertyId,
          guestId: guest.id,
          invoiceNumber: `INV-${new Date().getFullYear()}-${String(await prisma.invoice.count({ where: { propertyId } }) + 1).padStart(5, '0')}`,
          issueDate: new Date(),
          dueDate: new Date(),
          status: "paid",
          subtotal: totalPrice,
          taxRate: 22,
          taxAmount: totalPrice * 0.22,
          totalAmount: totalPrice * 1.22,
          paidAmount: totalPrice * 1.22,
          items: [
            {
              description: `${room.name} - ${nights} night${nights !== 1 ? 's' : ''}`,
              quantity: nights,
              unitPrice: room.basePrice || 100,
              total: totalPrice,
              type: "room",
            },
          ],
        },
      });
    } catch (error) {
      console.error("[Invoice Generation] Error:", error);
      // Continue even if invoice fails
    }

    return NextResponse.json({
      success: true,
      reservationId: reservation.id,
      guestId: guest.id,
    });
  } catch (error) {
    console.error("[Create Booking] Error:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}
