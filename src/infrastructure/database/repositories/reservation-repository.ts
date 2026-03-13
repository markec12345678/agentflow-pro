/**
 * Infrastructure Implementation: Reservation Repository
 * 
 * Implementacija ReservationRepository interface-a z uporabo Prisma.
 */

import { prisma } from '@/infrastructure/database/prisma'
import { ReservationRepository, ReservationFilters } from '@/core/ports/repositories'
import { Reservation } from '@/core/domain/tourism/entities/reservation'
import { DateRange } from '@/core/domain/shared/value-objects/date-range'
import { Money } from '@/core/domain/shared/value-objects/money'

export class ReservationRepositoryImpl implements ReservationRepository {
  /**
   * Najdi rezervacijo po ID-ju
   */
  async findById(id: string): Promise<Reservation | null> {
    const data = await prisma.reservation.findUnique({
      where: { id },
      include: {
        property: true,
        guest: true
      }
    })

    if (!data) {
      return null
    }

    return this.mapToDomain(data)
  }

  /**
   * Najdi rezervacije po gostu
   */
  async findByGuest(guestId: string): Promise<Reservation[]> {
    const data = await prisma.reservation.findMany({
      where: { guestId },
      include: {
        property: true,
        guest: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return data.map(d => this.mapToDomain(d))
  }

  /**
   * Najdi rezervacije po property-ju
   */
  async findByProperty(propertyId: string): Promise<Reservation[]> {
    const data = await prisma.reservation.findMany({
      where: { propertyId },
      include: {
        property: true,
        guest: true
      },
      orderBy: { checkIn: 'asc' }
    })

    return data.map(d => this.mapToDomain(d))
  }

  /**
   * Najdi rezervacije z optional filtri
   */
  async find(filters?: ReservationFilters): Promise<Reservation[]> {
    const where: any = {}

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.propertyId) {
      where.propertyId = filters.propertyId
    }

    if (filters?.guestId) {
      where.guestId = filters.guestId
    }

    if (filters?.dateRange) {
      where.checkIn = {
        gte: filters.dateRange.start,
        lte: filters.dateRange.end
      }
    }

    const data = await prisma.reservation.findMany({
      where,
      include: {
        property: true,
        guest: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return data.map(d => this.mapToDomain(d))
  }

  /**
   * Shrani rezervacijo (create ali update)
   */
  async save(reservation: Reservation): Promise<void> {
    const data = reservation.toObject()

    await prisma.reservation.upsert({
      where: { id: reservation.id },
      update: {
        status: reservation.status,
        paymentStatus: reservation.paymentStatus,
        guests: reservation.guests,
        totalPrice: reservation.totalPrice.amount,
        paidAmount: reservation.paidAmount.amount,
        notes: reservation.notes,
        cancellationReason: reservation.cancellationReason,
        updatedAt: new Date()
      },
      create: {
        id: reservation.id,
        propertyId: reservation.propertyId,
        guestId: reservation.guestId,
        checkIn: reservation.dateRange.start,
        checkOut: reservation.dateRange.end,
        status: reservation.status,
        paymentStatus: reservation.paymentStatus,
        guests: reservation.guests,
        totalPrice: reservation.totalPrice.amount,
        paidAmount: reservation.paidAmount.amount,
        notes: reservation.notes,
        cancellationReason: reservation.cancellationReason,
        createdAt: reservation.createdAt,
        updatedAt: reservation.updatedAt
      }
    })
  }

  /**
   * Izbriši rezervacijo
   */
  async delete(id: string): Promise<void> {
    await prisma.reservation.delete({
      where: { id }
    })
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
      totalPrice: new Money(data.totalPrice || 0, 'EUR'),
      paidAmount: new Money(data.paidAmount || 0, 'EUR'),
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      notes: data.notes,
      cancellationReason: data.cancellationReason
    })
  }
}
