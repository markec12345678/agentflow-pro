/**
 * Infrastructure Implementation: Calendar Repository
 *
 * Implementacija CalendarRepository interface-a z uporabo Prisma.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { CalendarRepository } from "@/core/ports/repositories";
import { Availability } from "@/core/domain/tourism/entities/availability";
import { Reservation } from "@/core/domain/tourism/entities/reservation";
import { BlockedDate } from "@/core/domain/tourism/entities/blocked-date";
import { Money } from "@/core/domain/shared/value-objects/money";
import { DateRange } from "@/core/domain/shared/value-objects/date-range";

export class CalendarRepositoryImpl implements CalendarRepository {
  /**
   * Pridobi availability za property v date range-u
   */
  async getAvailability(
    propertyId: string,
    startDate: Date,
    endDate: Date,
    roomId?: string,
  ): Promise<Availability[]> {
    const availabilityRecords = await prisma.availability.findMany({
      where: {
        propertyId,
        date: {
          gte: startDate,
          lte: endDate,
        },
        ...(roomId && { roomId }),
      },
      include: {
        room: true,
      },
      orderBy: { date: "asc" },
    });

    return availabilityRecords.map(
      (record) =>
        new Availability({
          id: record.id,
          roomId: record.roomId!,
          date: record.date,
          status: record.status as any,
          baseRate: new Money(record.baseRate, "EUR"),
          minStay: record.minStay,
          maxStay: record.maxStay,
          closedToArrival: record.closedToArrival,
          closedToDeparture: record.closedToDeparture,
        }),
    );
  }

  /**
   * Pridobi rezervacije za property v date range-u
   */
  async getReservations(
    propertyId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Reservation[]> {
    const reservations = await prisma.reservation.findMany({
      where: {
        propertyId,
        OR: [
          {
            checkIn: { gte: startDate, lte: endDate },
          },
          {
            checkOut: { gte: startDate, lte: endDate },
          },
          {
            checkIn: { lte: startDate },
            checkOut: { gte: endDate },
          },
        ],
      },
      include: {
        guest: true,
        room: true,
        property: true,
      },
      orderBy: { checkIn: "asc" },
    });

    return reservations.map(
      (record) =>
        new Reservation({
          id: record.id,
          propertyId: record.propertyId,
          guestId: record.guestId,
          dateRange: new DateRange(record.checkIn, record.checkOut),
          guests: record.guests,
          status: record.status as any,
          paymentStatus: record.paymentStatus as any,
          totalPrice: new Money(record.totalPrice, "EUR"),
          paidAmount: new Money(record.paidAmount || 0, "EUR"),
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
          notes: record.notes,
          cancellationReason: record.cancellationReason,
        }),
    );
  }

  /**
   * Pridobi blokirane datume za property v date range-u
   */
  async getBlockedDates(
    propertyId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<BlockedDate[]> {
    const blockedDates = await prisma.blockedDate.findMany({
      where: {
        propertyId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        room: true,
      },
      orderBy: { date: "asc" },
    });

    return blockedDates.map(
      (record) =>
        new BlockedDate({
          id: record.id,
          propertyId: record.propertyId,
          roomId: record.roomId,
          date: record.date,
          reason: record.reason,
        }),
    );
  }

  /**
   * Shrani availability
   */
  async saveAvailability(availability: Availability): Promise<void> {
    await prisma.availability.upsert({
      where: {
        id: availability.id,
      },
      update: {
        status: availability.status,
        baseRate: availability.baseRate.amount,
        minStay: availability.minStay,
        maxStay: availability.maxStay,
        closedToArrival: availability.closedToArrival,
        closedToDeparture: availability.closedToDeparture,
        updatedAt: new Date(),
      },
      create: {
        id: availability.id,
        roomId: availability.roomId,
        date: availability.date,
        status: availability.status,
        baseRate: availability.baseRate.amount,
        minStay: availability.minStay,
        maxStay: availability.maxStay,
        closedToArrival: availability.closedToArrival,
        closedToDeparture: availability.closedToDeparture,
      },
    });
  }

  /**
   * Shrani blokirane datume
   */
  async saveBlockedDates(blockedDates: BlockedDate[]): Promise<void> {
    if (blockedDates.length === 0) return;

    await prisma.blockedDate.createMany({
      data: blockedDates.map((bd) => ({
        id: bd.id,
        propertyId: bd.propertyId,
        roomId: bd.roomId,
        date: bd.date,
        reason: bd.reason,
      })),
      skipDuplicates: true,
    });
  }

  /**
   * Izbriši blokirane datume
   */
  async deleteBlockedDates(
    propertyId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<void> {
    await prisma.blockedDate.deleteMany({
      where: {
        propertyId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });
  }
}
