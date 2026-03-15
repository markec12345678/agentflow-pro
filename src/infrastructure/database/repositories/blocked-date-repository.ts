/**
 * Infrastructure Implementation: Blocked Date Repository
 *
 * Implementacija BlockedDateRepository interface-a z uporabo Prisma.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { BlockedDateRepository } from "@/core/ports/repositories";
import { BlockedDate } from "@/core/domain/tourism/entities/blocked-date";

export class BlockedDateRepositoryImpl implements BlockedDateRepository {
  /**
   * Najdi blocked date po ID-ju
   */
  async findById(id: string): Promise<BlockedDate | null> {
    const data = await prisma.blockedDate.findUnique({
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
   * Najdi blocked dates za property v date range-u
   */
  async findByProperty(
    propertyId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<BlockedDate[]> {
    const data = await prisma.blockedDate.findMany({
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

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Najdi blocked dates za room
   */
  async findByRoom(
    roomId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<BlockedDate[]> {
    const data = await prisma.blockedDate.findMany({
      where: {
        roomId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: "asc" },
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Shrani blocked date
   */
  async save(blockedDate: BlockedDate): Promise<void> {
    await prisma.blockedDate.upsert({
      where: { id: blockedDate.id },
      update: {
        reason: blockedDate.reason,
        updatedAt: new Date(),
      },
      create: {
        id: blockedDate.id,
        propertyId: blockedDate.propertyId,
        roomId: blockedDate.roomId,
        date: blockedDate.date,
        reason: blockedDate.reason,
      },
    });
  }

  /**
   * Shrani več blocked dates hkrati
   */
  async saveMany(blockedDates: BlockedDate[]): Promise<void> {
    const data = blockedDates.map((bd) => ({
      id: bd.id,
      propertyId: bd.propertyId,
      roomId: bd.roomId,
      date: bd.date,
      reason: bd.reason,
    }));

    await prisma.blockedDate.createMany({
      data,
      skipDuplicates: true,
    });
  }

  /**
   * Izbriši blocked date
   */
  async delete(id: string): Promise<void> {
    await prisma.blockedDate.delete({
      where: { id },
    });
  }

  /**
   * Izbriši blocked dates za date range
   */
  async deleteByDateRange(
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

  /**
   * Preveri če je datum blokiran
   */
  async isBlocked(
    propertyId: string,
    date: Date,
    roomId?: string,
  ): Promise<boolean> {
    const where: any = {
      propertyId,
      date,
    };

    if (roomId) {
      where.roomId = roomId;
    }

    const count = await prisma.blockedDate.count({
      where,
    });

    return count > 0;
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Preslikaj Prisma data v Domain BlockedDate
   */
  private mapToDomain(data: any): BlockedDate {
    return new BlockedDate({
      id: data.id,
      propertyId: data.propertyId,
      roomId: data.roomId,
      date: data.date,
      reason: data.reason,
    });
  }
}
