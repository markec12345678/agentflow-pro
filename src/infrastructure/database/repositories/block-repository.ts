/**
 * Block Repository Implementation
 * 
 * Prisma-based repository for BlockedDate entity.
 */

import { prisma } from '@/infrastructure/database/prisma'
import { BlockRepository as IBlockRepository } from '@/core/use-cases/block-dates'

export class BlockRepositoryImpl implements IBlockRepository {
  /**
   * Find blocked date by ID
   */
  async findById(id: string): Promise<any | null> {
    const blockedDate = await prisma.blockedDate.findUnique({
      where: { id },
      include: {
        property: true,
        room: true
      }
    })

    if (!blockedDate) return null

    return this.mapToDomain(blockedDate)
  }

  /**
   * Find blocked dates by property
   */
  async findByProperty(propertyId: string, options?: any): Promise<any[]> {
    const blockedDates = await prisma.blockedDate.findMany({
      where: {
        propertyId,
        ...(options?.roomId ? { roomId: options.roomId } : {}),
        ...(options?.startDate && options?.endDate ? {
          date: {
            gte: options.startDate,
            lte: options.endDate
          }
        } : {})
      },
      include: {
        property: true,
        room: true
      }
    })

    return blockedDates.map(blockedDate => this.mapToDomain(blockedDate))
  }

  /**
   * Find blocked dates by date range
   */
  async findByDateRange(
    propertyId: string,
    startDate: Date,
    endDate: Date,
    roomId?: string
  ): Promise<any[]> {
    return this.findByProperty(propertyId, {
      roomId,
      startDate,
      endDate
    })
  }

  /**
   * Check if date is blocked
   */
  async isDateBlocked(
    propertyId: string,
    date: Date,
    roomId?: string
  ): Promise<boolean> {
    const count = await prisma.blockedDate.count({
      where: {
        propertyId,
        ...(roomId ? { roomId } : {}),
        date
      }
    })

    return count > 0
  }

  /**
   * Save blocked date
   */
  async save(blockedDate: any): Promise<void> {
    const data = this.mapToPrisma(blockedDate)

    await prisma.blockedDate.upsert({
      where: { id: blockedDate.id },
      update: data,
      create: data
    })
  }

  /**
   * Delete blocked date
   */
  async delete(id: string): Promise<void> {
    await prisma.blockedDate.delete({
      where: { id }
    })
  }

  /**
   * Delete multiple blocked dates
   */
  async deleteMany(ids: string[]): Promise<void> {
    await prisma.blockedDate.deleteMany({
      where: {
        id: {
          in: ids
        }
      }
    })
  }

  /**
   * Map Prisma data to domain entity
   */
  private mapToDomain(prismaBlockedDate: any): any {
    return {
      id: prismaBlockedDate.id,
      propertyId: prismaBlockedDate.propertyId,
      roomId: prismaBlockedDate.roomId,
      date: prismaBlockedDate.date,
      type: prismaBlockedDate.type,
      reason: prismaBlockedDate.reason,
      createdAt: prismaBlockedDate.createdAt,
      updatedAt: prismaBlockedDate.updatedAt
    }
  }

  /**
   * Map domain entity to Prisma data
   */
  private mapToPrisma(blockedDate: any): any {
    return {
      id: blockedDate.id,
      propertyId: blockedDate.propertyId,
      roomId: blockedDate.roomId,
      date: blockedDate.date,
      type: blockedDate.type,
      reason: blockedDate.reason,
      updatedAt: new Date()
    }
  }
}
