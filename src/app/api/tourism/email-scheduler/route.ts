/**
 * AgentFlow Pro - Email Scheduler (TOURISM-EMAIL-ROADMAP)
 * Daily cron: creates GuestCommunication for time-based workflows.
 * Call: GET /api/tourism/email-scheduler (protect with CRON_SECRET or Vercel cron)
 */

import { NextRequest, NextResponse } from "next/server";
import { logger } from '@/infrastructure/observability/logger';
import { prisma } from "@/database/schema";
import { subDays, addDays, startOfDay, isSameDay } from "date-fns";
import { format } from "date-fns";
import { verifyCronAuth } from "@/lib/cron-auth";
import { sendPendingGuestEmails, sendPendingWhatsAppMessages } from "@/lib/tourism/email-sender";

export async function GET(request: NextRequest) {
  try {
    if (!verifyCronAuth(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = startOfDay(new Date());
    const result = {
      pre_arrival: 0,
      check_in: 0,
      during_stay: 0,
      post_stay: 0,
      re_booking: 0,
      payment_reminder: 0,
    };

    const reservations = await prisma.reservation.findMany({
      where: { status: "confirmed" },
      include: { guest: true, property: { select: { name: true, location: true } }, payments: true },
    });

    // Payment reminders: outstanding > 0, checkIn within next 7 days or up to 60 days ago
    for (const r of reservations) {
      const totalDue = (r.totalPrice ?? 0) + (r.touristTax ?? 0);
      const totalPaid = r.payments.reduce((sum, p) => sum + p.amount, 0);
      const outstanding = Math.max(0, totalDue - totalPaid);
      if (outstanding <= 0) continue;

      const checkInDay = startOfDay(r.checkIn);
      if (checkInDay < subDays(today, 60) || checkInDay > addDays(today, 7)) continue;

      const recentReminders = await prisma.guestCommunication.findMany({
        where: {
          propertyId: r.propertyId,
          guestId: r.guestId,
          type: "payment-reminder",
          createdAt: { gte: subDays(today, 3) },
        },
        take: 20,
      });
      const hasForReservation = recentReminders.some(
        (c) => (c.variables as { reservationId?: string })?.reservationId === r.id
      );
      if (hasForReservation) continue;

      if (!r.guest?.email?.trim() || !r.guest.email.includes("@")) continue;

      const propertyName = r.property?.name ?? "Property";
      const guestName = r.guest?.name ?? "Guest";
      await prisma.guestCommunication.create({
        data: {
          propertyId: r.propertyId,
          guestId: r.guestId,
          type: "payment-reminder",
          channel: "email",
          subject: `Opomnik – neplačan znesek za ${propertyName}`,
          content: `Pozdravljeni ${guestName},\n\nObveščamo vas, da imate pri rezervaciji (prihod: ${format(r.checkIn, "yyyy-MM-dd")}) neporavnan znesek v višini €${outstanding.toFixed(2)}.\n\nProsimo, poravnajte znesek pred prihodom.\n\nLep pozdrav,\n${propertyName}`,
          status: "pending",
          variables: { reservationId: r.id },
        },
      });
      result.payment_reminder++;
    }

    for (const r of reservations) {
      const checkInDay = startOfDay(r.checkIn);
      const checkOutDay = startOfDay(r.checkOut);
      const guestName = r.guest?.name ?? "Guest";
      const propertyName = r.property?.name ?? "Property";

      if (isSameDay(checkInDay, addDays(today, 7))) {
        const existingPreArrival = await prisma.guestCommunication.findMany({
          where: {
            propertyId: r.propertyId,
            guestId: r.guestId,
            type: "pre-arrival",
          },
          take: 50,
        });
        const hasForReservation = existingPreArrival.some(
          (c) => (c.variables as { reservationId?: string })?.reservationId === r.id
        );
        if (!hasForReservation) {
          await prisma.guestCommunication.create({
            data: {
              propertyId: r.propertyId,
              guestId: r.guestId,
              type: "pre-arrival",
              channel: "email",
              subject: `Pre-arrival – ${propertyName}`,
              content: `Dear ${guestName},\n\nWe look forward to welcoming you in 7 days!\n\nCheck-in: ${format(r.checkIn, "yyyy-MM-dd")}\nCheck-out: ${format(r.checkOut, "yyyy-MM-dd")}\n\nBest regards,\n${propertyName}`,
              status: "pending",
              variables: { reservationId: r.id },
            },
          });
          result.pre_arrival++;
        }
      }

      if (isSameDay(checkInDay, addDays(today, 1))) {
        const existing = await prisma.guestCommunication.findFirst({
          where: {
            propertyId: r.propertyId,
            guestId: r.guestId,
            type: "check-in-instructions",
            variables: { path: ["reservationId"], equals: r.id },
          },
        });
        if (!existing) {
          const baseUrl =
            process.env.NEXTAUTH_URL ??
            (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3002");
          const checkInLink =
            r.checkInToken != null
              ? `${baseUrl}/check-in/${r.checkInToken}`
              : null;
          const checkInSection =
            checkInLink != null
              ? `\n\nComplete your self check-in online before arrival:\n${checkInLink}\n\n`
              : "\n\n";

          await prisma.guestCommunication.create({
            data: {
              propertyId: r.propertyId,
              guestId: r.guestId,
              type: "check-in-instructions",
              channel: "email",
              subject: `Check-in tomorrow – ${propertyName}`,
              content: `Dear ${guestName},\n\nYour check-in is tomorrow.${checkInSection}Check-in date: ${format(r.checkIn, "yyyy-MM-dd")}\n\nBest regards,\n${propertyName}`,
              status: "pending",
              variables: { reservationId: r.id },
            },
          });
          result.check_in++;
        }
      }

      const day2OfStay = addDays(checkInDay, 2);
      if (
        isSameDay(day2OfStay, today) &&
        today >= checkInDay &&
        today < checkOutDay
      ) {
        const existingDuringStay = await prisma.guestCommunication.findMany({
          where: {
            propertyId: r.propertyId,
            guestId: r.guestId,
            type: "during-stay-upsell",
          },
          take: 50,
        });
        const hasDuringStayForRes = existingDuringStay.some(
          (c) => (c.variables as { reservationId?: string })?.reservationId === r.id
        );
        if (!hasDuringStayForRes) {
          await prisma.guestCommunication.create({
            data: {
              propertyId: r.propertyId,
              guestId: r.guestId,
              type: "during-stay-upsell",
              channel: "email",
              subject: `Special offers – ${propertyName}`,
              content: `Dear ${guestName},\n\nDuring your stay, why not try our spa or restaurant?\n\nBest regards,\n${propertyName}`,
              status: "pending",
              variables: { reservationId: r.id },
            },
          });
          result.during_stay++;
        }
      }

      if (isSameDay(checkOutDay, subDays(today, 1))) {
        const existingPostStay = await prisma.guestCommunication.findMany({
          where: {
            propertyId: r.propertyId,
            guestId: r.guestId,
            type: "post-stay",
          },
          take: 50,
        });
        const hasPostStayForRes = existingPostStay.some(
          (c) => (c.variables as { reservationId?: string })?.reservationId === r.id
        );
        if (!hasPostStayForRes) {
          const location = r.property?.location ?? "";
          const searchQuery = `${propertyName} ${location}`.trim();
          const googleReviewLink =
            searchQuery.length > 0
              ? `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`
              : "https://www.google.com/maps";
          let reviewSection =
            `\n\nWe'd love to hear your feedback! Please leave a review:\n` +
            `- Google: ${googleReviewLink}\n`;
          const resChannel = r.channel?.toLowerCase();
          if (resChannel?.includes("booking")) {
            reviewSection +=
              `- If you booked via Booking.com, you'll receive a review request from them directly.\n`;
          }
          reviewSection += `\nYour feedback helps us improve. Thank you!\n`;

          await prisma.guestCommunication.create({
            data: {
              propertyId: r.propertyId,
              guestId: r.guestId,
              type: "post-stay",
              channel: "email",
              subject: `Thank you – ${propertyName}`,
              content: `Dear ${guestName},\n\nThank you for staying with us!${reviewSection}\n\nBest regards,\n${propertyName}`,
              status: "pending",
              variables: { reservationId: r.id },
            },
          });
          result.post_stay++;
        }
      }

      if (isSameDay(checkOutDay, subDays(today, 60))) {
        const existingReBooking = await prisma.guestCommunication.findMany({
          where: {
            propertyId: r.propertyId,
            guestId: r.guestId,
            type: "re-booking",
          },
          take: 50,
        });
        const hasReBookingForRes = existingReBooking.some(
          (c) => (c.variables as { reservationId?: string })?.reservationId === r.id
        );
        if (!hasReBookingForRes) {
          await prisma.guestCommunication.create({
            data: {
              propertyId: r.propertyId,
              guestId: r.guestId,
              type: "re-booking",
              channel: "email",
              subject: `We miss you – ${propertyName}`,
              content: `Dear ${guestName},\n\nIt's been 60 days since your last stay. We'd love to welcome you back!\n\nBest regards,\n${propertyName}`,
              status: "pending",
              variables: { reservationId: r.id },
            },
          });
          result.re_booking++;
        }
      }
    }

    const emailResult = await sendPendingGuestEmails();
    const whatsappResult = await sendPendingWhatsAppMessages();

    return NextResponse.json({
      success: true,
      date: today.toISOString(),
      created: result,
      sent: {
        email: emailResult,
        whatsapp: whatsappResult,
      },
    });
  } catch (error) {
    logger.error("Email scheduler error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Scheduler failed" },
      { status: 500 }
    );
  }
}
