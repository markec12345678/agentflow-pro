/**
 * Infrastructure Implementation: Guest Repository
 * 
 * Implementacija GuestRepository interface-a z uporabo Prisma.
 */

import { prisma } from '@/infrastructure/database/prisma'
import { GuestRepository, GuestFilters } from '@/core/ports/repositories'
import { Guest } from '@/core/domain/guest/entities/guest'
import { Money } from '@/core/domain/shared/value-objects/money'

export class GuestRepositoryImpl implements GuestRepository {
  /**
   * Najdi gosta po ID-ju
   */
  async findById(id: string): Promise<Guest | null> {
    const data = await prisma.guest.findUnique({
      where: { id }
    })

    if (!data) {
      return null
    }

    return this.mapToDomain(data)
  }

  /**
   * Najdi gosta po email-u
   */
  async findByEmail(email: string): Promise<Guest | null> {
    const data = await prisma.guest.findUnique({
      where: { email }
    })

    if (!data) {
      return null
    }

    return this.mapToDomain(data)
  }

  /**
   * Najdi goste z optional filtri
   */
  async find(filters?: GuestFilters): Promise<Guest[]> {
    const where: any = {}

    if (filters?.email) {
      where.email = { contains: filters.email, mode: 'insensitive' }
    }

    if (filters?.phone) {
      where.phone = filters.phone
    }

    if (filters?.loyaltyTier) {
      where.tier = filters.loyaltyTier
    }

    const data = await prisma.guest.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    return data.map(d => this.mapToDomain(d))
  }

  /**
   * Najdi goste z minimalnimi loyalty točkami
   */
  async findWithLoyaltyPoints(minPoints: number): Promise<Guest[]> {
    const data = await prisma.guest.findMany({
      where: {
        loyaltyPoints: { gte: minPoints }
      },
      orderBy: { loyaltyPoints: 'desc' }
    })

    return data.map(d => this.mapToDomain(d))
  }

  /**
   * Shrani gosta (create ali update)
   */
  async save(guest: Guest): Promise<void> {
    const data = guest.toObject()

    await prisma.guest.upsert({
      where: { id: guest.id },
      update: {
        email: guest.email,
        phone: guest.phone,
        firstName: guest.firstName,
        lastName: guest.lastName,
        preferences: guest.preferences as any,
        loyaltyPoints: guest.loyaltyPoints,
        tier: guest.tier,
        totalStays: guest.totalStays,
        totalSpent: guest.totalSpent.amount,
        blacklisted: guest.blacklisted,
        blacklistReason: guest.blacklistReason,
        notes: guest.notes,
        updatedAt: new Date()
      },
      create: {
        id: guest.id,
        email: guest.email,
        phone: guest.phone,
        firstName: guest.firstName,
        lastName: guest.lastName,
        preferences: guest.preferences as any,
        loyaltyPoints: guest.loyaltyPoints,
        tier: guest.tier,
        totalStays: guest.totalStays,
        totalSpent: guest.totalSpent.amount,
        blacklisted: guest.blacklisted,
        blacklistReason: guest.blacklistReason,
        notes: guest.notes,
        createdAt: guest.createdAt,
        updatedAt: guest.updatedAt
      }
    })
  }

  /**
   * Izbriši gosta
   */
  async delete(id: string): Promise<void> {
    await prisma.guest.delete({
      where: { id }
    })
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Preslikaj Prisma data v Domain Guest
   */
  private mapToDomain(data: any): Guest {
    return new Guest({
      id: data.id,
      email: data.email,
      phone: data.phone,
      firstName: data.firstName,
      lastName: data.lastName,
      dateOfBirth: data.dateOfBirth,
      nationality: data.nationality,
      preferences: data.preferences || {
        communicationChannel: 'email',
        language: 'sl',
        newsletterOptIn: false
      },
      loyaltyPoints: data.loyaltyPoints || 0,
      tier: data.tier as any || 'bronze',
      totalStays: data.totalStays || 0,
      totalSpent: new Money(data.totalSpent || 0, 'EUR'),
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      blacklisted: data.blacklisted || false,
      blacklistReason: data.blacklistReason
    })
  }
}
