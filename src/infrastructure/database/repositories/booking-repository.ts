/**
 * Infrastructure Implementation: Booking Repository
 *
 * Implementacija BookingRepository interface-a z uporabo Prisma.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { BookingRepository } from "@/core/ports/repositories";
import { Reservation } from "@/core/domain/tourism/entities/reservation";
import { Money } from "@/core/domain/shared/value-objects/money";
import { DateRange } from "@/core/domain/shared/value-objects/date-range";

export class BookingRepositoryImpl implements BookingRepository {
  /**
   * Najdi booking po ID-ju
   */
  async findById(id: string): Promise<Reservation | null> {
    const data = await prisma.reservation.findUnique({
      where: { id },
      include: {
        guest: true,
        property: true,
        room: true,
      },
    });

    if (!data) {
      return null;
    }

    return this.mapToDomain(data);
  }

  /**
   * Najdi bookinge po property-ju
   */
  async findByProperty(
    propertyId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<Reservation[]> {
    const where: any = { propertyId };

    if (startDate && endDate) {
      where.OR = [
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
      ];
    }

    const data = await prisma.reservation.findMany({
      where,
      include: {
        guest: true,
        property: true,
        room: true,
      },
      orderBy: { checkIn: "desc" },
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Najdi bookinge po gostu
   */
  async findByGuest(guestId: string): Promise<Reservation[]> {
    const data = await prisma.reservation.findMany({
      where: { guestId },
      include: {
        guest: true,
        property: true,
        room: true,
      },
      orderBy: { checkIn: "desc" },
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Shrani booking
   */
  async save(booking: Reservation): Promise<void> {
    await prisma.reservation.upsert({
      where: { id: booking.id },
      update: {
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        guests: booking.guests,
        totalPrice: booking.totalPrice.amount,
        paidAmount: booking.paidAmount.amount,
        notes: booking.notes,
        cancellationReason: booking.cancellationReason,
        updatedAt: new Date(),
      },
      create: {
        id: booking.id,
        propertyId: booking.propertyId,
        guestId: booking.guestId,
        checkIn: booking.dateRange.start,
        checkOut: booking.dateRange.end,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        guests: booking.guests,
        totalPrice: booking.totalPrice.amount,
        paidAmount: booking.paidAmount.amount,
        notes: booking.notes,
        cancellationReason: booking.cancellationReason,
      },
    });
  }

  /**
   * Posodobi status booking-a
   */
  async updateStatus(id: string, status: string): Promise<void> {
    await prisma.reservation.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Prekliči booking
   */
  async cancel(id: string, reason: string): Promise<void> {
    await prisma.reservation.update({
      where: { id },
      data: {
        status: "cancelled",
        cancellationReason: reason,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Izbriši booking
   */
  async delete(id: string): Promise<void> {
    await prisma.reservation.delete({
      where: { id },
    });
  }

  /**
   * Pridobi statistiko booking-ov
   */
  async getStats(
    propertyId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    totalBookings: number;
    totalRevenue: number;
    averageStayLength: number;
    cancellationRate: number;
  }> {
    const bookings = await this.findByProperty(propertyId, startDate, endDate);

    const totalBookings = bookings.length;
    const totalRevenue = bookings.reduce(
      (sum, b) => sum + b.totalPrice.amount,
      0,
    );
    const averageStayLength =
      bookings.reduce((sum, b) => sum + b.dateRange.nights(), 0) /
      (totalBookings || 1);
    const cancellations = bookings.filter(
      (b) => b.status === "cancelled",
    ).length;
    const cancellationRate = (cancellations / totalBookings) * 100;

    return {
      totalBookings,
      totalRevenue,
      averageStayLength: Math.round(averageStayLength * 10) / 10,
      cancellationRate: Math.round(cancellationRate * 100) / 100,
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Preslikaj Prisma data v Domain Reservation
   */
  private mapToDomain(data: any): Reservation {
    return new Reservation({
      id: data.id,
      propertyId: data.propertyId,
      guestId: data.guestId,
      dateRange: new DateRange(data.checkIn, data.checkOut),
      guests: data.guests,
      status: data.status as any,
      paymentStatus: data.paymentStatus as any,
      totalPrice: new Money(data.totalPrice, "EUR"),
      paidAmount: new Money(data.paidAmount || 0, "EUR"),
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      notes: data.notes,
      cancellationReason: data.cancellationReason,
    });
  }
}
