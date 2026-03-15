/**
 * Infrastructure Implementation: Availability Repository
 *
 * Implementacija AvailabilityRepository interface-a z uporabo Prisma.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { AvailabilityRepository } from "@/core/ports/repositories";
import { Availability } from "@/core/domain/tourism/entities/availability";
import { Money } from "@/core/domain/shared/value-objects/money";

export class AvailabilityRepositoryImpl implements AvailabilityRepository {
  /**
   * Najdi availability po ID-ju
   */
  async findById(id: string): Promise<Availability | null> {
    const data = await prisma.availability.findUnique({
      where: { id },
      include: {
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
   * Najdi availability za property v date range-u
   */
  async findByProperty(
    propertyId: string,
    startDate: Date,
    endDate: Date,
    roomId?: string,
  ): Promise<Availability[]> {
    const where: any = {
      propertyId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (roomId) {
      where.roomId = roomId;
    }

    const data = await prisma.availability.findMany({
      where,
      include: {
        room: true,
      },
      orderBy: { date: "asc" },
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Preveri availability za datum
   */
  async checkAvailability(
    propertyId: string,
    date: Date,
    roomId?: string,
  ): Promise<Availability[]> {
    const where: any = {
      propertyId,
      date,
    };

    if (roomId) {
      where.roomId = roomId;
    }

    const data = await prisma.availability.findMany({
      where,
      include: {
        room: true,
      },
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Shrani availability
   */
  async save(availability: Availability): Promise<void> {
    await prisma.availability.upsert({
      where: { id: availability.id },
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
        propertyId: availability.roomId, // Note: This might need adjustment based on schema
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
   * Shrani več availability records hkrati
   */
  async saveMany(availabilities: Availability[]): Promise<void> {
    const data = availabilities.map((a) => ({
      id: a.id,
      propertyId: a.roomId,
      roomId: a.roomId,
      date: a.date,
      status: a.status,
      baseRate: a.baseRate.amount,
      minStay: a.minStay,
      maxStay: a.maxStay,
      closedToArrival: a.closedToArrival,
      closedToDeparture: a.closedToDeparture,
    }));

    await prisma.availability.createMany({
      data,
      skipDuplicates: true,
    });
  }

  /**
   * Posodobi status
   */
  async updateStatus(id: string, status: string): Promise<void> {
    await prisma.availability.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Izbriši availability
   */
  async delete(id: string): Promise<void> {
    await prisma.availability.delete({
      where: { id },
    });
  }

  /**
   * Izbriši availability za date range
   */
  async deleteByDateRange(
    propertyId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<void> {
    await prisma.availability.deleteMany({
      where: {
        propertyId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Preslikaj Prisma data v Domain Availability
   */
  private mapToDomain(data: any): Availability {
    return new Availability({
      id: data.id,
      roomId: data.roomId,
      date: data.date,
      status: data.status as any,
      baseRate: new Money(data.baseRate, "EUR"),
      minStay: data.minStay,
      maxStay: data.maxStay,
      closedToArrival: data.closedToArrival,
      closedToDeparture: data.closedToDeparture,
    });
  }
}
