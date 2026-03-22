/**
 * AgentFlow Pro - Email Triggers (TOURISM-EMAIL-ROADMAP)
 * Event hooks for reservation-related email automation.
 */

import { prisma } from "@/database/schema";
import { format } from "date-fns";

function getBaseUrl(): string {
  return (
    process.env.NEXTAUTH_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3002")
  );
}

/** Trigger booking confirmation email when a new reservation is created. */
export async function triggerBookingConfirmation(
  reservationId: string,
  propertyId: string,
  guestId: string | null
): Promise<void> {
  try {
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        guest: true,
        property: { select: { name: true } },
      },
    });

    if (!reservation || reservation.status === "cancelled") return;

    const guestName = reservation.guest?.name ?? "Guest";
    const propertyName = reservation.property?.name ?? "Property";
    const checkInStr = format(reservation.checkIn, "yyyy-MM-dd");
    const checkOutStr = format(reservation.checkOut, "yyyy-MM-dd");
    const totalPrice =
      reservation.totalPrice != null
        ? String(reservation.totalPrice)
        : "—";

    const checkInSection =
      reservation.checkInToken != null
        ? `\n\nSelf check-in (eTurizem): ${getBaseUrl()}/check-in/${reservation.checkInToken}\n\n`
        : "\n\n";

    const content = `Dear ${guestName},

Thank you for your reservation at ${propertyName}.

**Reservation details:**
- Check-in: ${checkInStr}
- Check-out: ${checkOutStr}
- Total: ${totalPrice}
${checkInSection}We look forward to welcoming you.

Best regards,
${propertyName}`;

    await prisma.guestCommunication.create({
      data: {
        propertyId,
        guestId: guestId ?? reservation.guestId,
        type: "booking-confirmation",
        channel: "email",
        subject: `Booking confirmation – ${propertyName}`,
        content,
        status: "pending",
        variables: {
          guest_name: guestName,
          property_name: propertyName,
          check_in: checkInStr,
          check_out: checkOutStr,
          total_price: totalPrice,
        },
      },
    });
  } catch (err) {
    console.error("triggerBookingConfirmation error:", err);
  }
}
