/**
 * Infrastructure Implementation: Amenity Repository
 *
 * Implementacija AmenityRepository interface-a z uporabo Prisma.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { AmenityRepository } from "@/core/ports/repositories";

export interface AmenityDTO {
  id: string;
  propertyId: string;
  name: string;
  category: string;
  description?: string;
  icon?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class AmenityRepositoryImpl implements AmenityRepository {
  /**
   * Najdi amenity po ID-ju
   */
  async findById(id: string): Promise<AmenityDTO | null> {
    const data = await prisma.amenity.findUnique({
      where: { id },
    });

    if (!data) {
      return null;
    }

    return this.mapToDomain(data);
  }

  /**
   * Najdi vse amenities za property
   */
  async findByProperty(propertyId: string): Promise<AmenityDTO[]> {
    const data = await prisma.amenity.findMany({
      where: {
        propertyId,
        isActive: true,
      },
      orderBy: { category: "asc" },
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Najdi amenities po kategoriji
   */
  async findByCategory(
    propertyId: string,
    category: string,
  ): Promise<AmenityDTO[]> {
    const data = await prisma.amenity.findMany({
      where: {
        propertyId,
        category,
        isActive: true,
      },
      orderBy: { name: "asc" },
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Dodaj amenity property-ju
   */
  async add(
    propertyId: string,
    amenity: Omit<AmenityDTO, "id" | "propertyId" | "createdAt" | "updatedAt">,
  ): Promise<AmenityDTO> {
    const data = await prisma.amenity.create({
      data: {
        propertyId,
        name: amenity.name,
        category: amenity.category,
        description: amenity.description,
        icon: amenity.icon,
        isActive: amenity.isActive,
      },
    });

    return this.mapToDomain(data);
  }

  /**
   * Odstrani amenity
   */
  async remove(id: string): Promise<void> {
    await prisma.amenity.delete({
      where: { id },
    });
  }

  /**
   * Posodobi amenity
   */
  async update(id: string, amenity: Partial<AmenityDTO>): Promise<void> {
    await prisma.amenity.update({
      where: { id },
      data: {
        name: amenity.name,
        category: amenity.category,
        description: amenity.description,
        icon: amenity.icon,
        isActive: amenity.isActive,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Sinhroniziraj amenities (add new, remove old)
   */
  async sync(
    propertyId: string,
    amenities: { name: string; category: string; icon?: string }[],
  ): Promise<void> {
    // Get current amenities
    const current = await this.findByProperty(propertyId);

    // Find amenities to remove
    const toRemove = current.filter(
      (a) =>
        !amenities.some(
          (am) => am.name === a.name && am.category === a.category,
        ),
    );

    // Find amenities to add
    const toAdd = amenities.filter(
      (am) =>
        !current.some((a) => a.name === am.name && a.category === am.category),
    );

    // Remove old
    for (const amenity of toRemove) {
      await this.remove(amenity.id);
    }

    // Add new
    for (const amenity of toAdd) {
      await this.add(propertyId, {
        name: amenity.name,
        category: amenity.category,
        icon: amenity.icon,
        isActive: true,
      });
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Preslikaj Prisma data v Domain DTO
   */
  private mapToDomain(data: any): AmenityDTO {
    return {
      id: data.id,
      propertyId: data.propertyId,
      name: data.name,
      category: data.category,
      description: data.description,
      icon: data.icon,
      isActive: data.isActive,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
