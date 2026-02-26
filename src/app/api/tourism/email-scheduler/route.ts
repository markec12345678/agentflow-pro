/**
 * AgentFlow Pro - Email Scheduler (TOURISM-EMAIL-ROADMAP)
 * Daily cron: creates GuestCommunication for time-based workflows.
 * Call: GET /api/tourism/email-scheduler (protect with CRON_SECRET or Vercel cron)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/database/schema";
import { subDays, addDays, startOfDay, isSameDay } from "date-fns";
import { format } from "date-fns";

function verifyCronAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return true;
  if (request.headers.get("x-vercel-cron") === "1") return true;
  return !cronSecret;
}

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
    };

    const reservations = await prisma.reservation.findMany({
      where: { status: "confirmed" },
      include: { guest: true, property: { select: { name: true } } },
    });

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
          await prisma.guestCommunication.create({
            data: {
              propertyId: r.propertyId,
              guestId: r.guestId,
              type: "check-in-instructions",
              channel: "email",
              subject: `Check-in tomorrow – ${propertyName}`,
              content: `Dear ${guestName},\n\nYour check-in is tomorrow. Here are your instructions...\n\nCheck-in: ${format(r.checkIn, "yyyy-MM-dd")}\n\nBest regards,\n${propertyName}`,
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
          await prisma.guestCommunication.create({
            data: {
              propertyId: r.propertyId,
              guestId: r.guestId,
              type: "post-stay",
              channel: "email",
              subject: `Thank you – ${propertyName}`,
              content: `Dear ${guestName},\n\nThank you for staying with us! We'd love to hear your feedback.\n\nBest regards,\n${propertyName}`,
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

    const sendResult = await sendPendingGuestEmails();

    return NextResponse.json({
      success: true,
      date: today.toISOString(),
      created: result,
      sent: sendResult,
    });
  } catch (error) {
    console.error("Email scheduler error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Scheduler failed" },
      { status: 500 }
    );
  }
}
