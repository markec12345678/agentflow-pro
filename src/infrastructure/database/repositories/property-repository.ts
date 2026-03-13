/**
 * Infrastructure Implementation: Reservation Repository
 * 
 * Implementacija PropertyRepository interface-a z uporabo Prisma.
 */

import { prisma } from '@/infrastructure/database/prisma'
import { PropertyRepository, PropertyFilters } from '@/core/ports/repositories'
import { Property } from '@/core/domain/tourism/entities/property'
import { Money } from '@/core/domain/shared/value-objects/money'
import { Address } from '@/core/domain/shared/value-objects/address'

export class PropertyRepositoryImpl implements PropertyRepository {
  /**
   * Najdi property po ID-ju
   */
  async findById(id: string): Promise<Property | null> {
    const data = await prisma.property.findUnique({
      where: { id },
      include: {
        rooms: true,
        amenities: true,
        policies: true
      }
    })

    if (!data) {
      return null
    }

    return this.mapToDomain(data)
  }

  /**
   * Najdi vse property-je z optional filtri
   */
  async findAll(filters?: PropertyFilters): Promise<Property[]> {
    const where: any = {}

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.location) {
      where.city = { contains: filters.location, mode: 'insensitive' }
    }

    if (filters?.minRooms) {
      where.rooms = {
        some: {},
        gte: filters.minRooms
      }
    }

    const data = await prisma.property.findMany({
      where,
      include: {
        rooms: true,
        amenities: true,
        policies: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return data.map(d => this.mapToDomain(d))
  }

  /**
   * Najdi razpoložljive property-je za datume
   */
  async findAvailable(
    checkIn: Date,
    checkOut: Date,
    guests: number
  ): Promise<Property[]> {
    // Najdi vse property-je ki imajo sobe za določeno število gostov
    const properties = await this.findAll({ status: 'active' })

    // Filtriraj tiste ki so na voljo za datume
    const available = properties.filter(property =>
      property.isAvailable(checkIn, checkOut, guests)
    )

    return available
  }

  /**
   * Shrani property (create ali update)
   */
  async save(property: Property): Promise<void> {
    const data = property.toObject()

    await prisma.property.upsert({
      where: { id: property.id },
      update: {
        name: property.name,
        status: property.status,
        baseRate: property.baseRate.amount,
        description: property.description,
        amenities: property.amenities,
        updatedAt: new Date()
      },
      create: {
        id: property.id,
        name: property.name,
        type: property.type,
        status: property.status,
        baseRate: property.baseRate.amount,
        description: property.description,
        amenities: property.amenities,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })
  }

  /**
   * Izbriši property
   */
  async delete(id: string): Promise<void> {
    await prisma.property.delete({
      where: { id }
    })
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Preslikaj Prisma data v Domain Property
   */
  private mapToDomain(data: any): Property {
    return new Property({
      id: data.id,
      name: data.name,
      type: data.type as any,
      status: data.status as any,
      address: new Address(
        data.street || '',
        data.city || '',
        data.postalCode || '',
        data.country || ''
      ),
      description: data.description || '',
      baseRate: new Money(data.baseRate || 0, 'EUR'),
      amenities: data.amenities || [],
      rooms: data.rooms || [],
      policies: data.policies || []
    })
  }
}
