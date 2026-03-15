/**
 * Infrastructure Implementation: Itinerary Repository
 *
 * Implementacija ItineraryRepository interface-a z uporabo Prisma.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { ItineraryRepository } from "@/core/ports/repositories";

export interface ItineraryDTO {
  id: string;
  userId: string;
  propertyId?: string;
  title: string;
  description?: string;
  days: any[]; // Array of day plans
  duration: number; // days
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class ItineraryRepositoryImpl implements ItineraryRepository {
  /**
   * Najdi itinerary po ID-ju
   */
  async findById(id: string): Promise<ItineraryDTO | null> {
    const data = await prisma.itinerary.findUnique({
      where: { id },
      include: {
        property: true,
        user: true,
      },
    });

    if (!data) {
      return null;
    }

    return this.mapToDomain(data);
  }

  /**
   * Najdi vse itineraries za user-ja
   */
  async findByUser(
    userId: string,
    publishedOnly?: boolean,
  ): Promise<ItineraryDTO[]> {
    const where: any = { userId };

    if (publishedOnly) {
      where.isPublished = true;
    }

    const data = await prisma.itinerary.findMany({
      where,
      include: {
        property: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Najdi itineraries za property
   */
  async findByProperty(propertyId: string): Promise<ItineraryDTO[]> {
    const data = await prisma.itinerary.findMany({
      where: {
        propertyId,
        isPublished: true,
      },
      include: {
        property: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Ustvari nov itinerary
   */
  async create(
    itinerary: Omit<ItineraryDTO, "id" | "createdAt" | "updatedAt">,
  ): Promise<ItineraryDTO> {
    const data = await prisma.itinerary.create({
      data: {
        userId: itinerary.userId,
        propertyId: itinerary.propertyId,
        title: itinerary.title,
        description: itinerary.description,
        days: itinerary.days,
        duration: itinerary.duration,
        isPublished: itinerary.isPublished,
      },
      include: {
        property: true,
      },
    });

    return this.mapToDomain(data);
  }

  /**
   * Posodobi itinerary
   */
  async update(id: string, itinerary: Partial<ItineraryDTO>): Promise<void> {
    await prisma.itinerary.update({
      where: { id },
      data: {
        title: itinerary.title,
        description: itinerary.description,
        days: itinerary.days,
        duration: itinerary.duration,
        isPublished: itinerary.isPublished,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Izbriši itinerary
   */
  async delete(id: string): Promise<void> {
    await prisma.itinerary.delete({
      where: { id },
    });
  }

  /**
   * Objavi itinerary
   */
  async publish(id: string): Promise<void> {
    await prisma.itinerary.update({
      where: { id },
      data: {
        isPublished: true,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Skrij itinerary
   */
  async unpublish(id: string): Promise<void> {
    await prisma.itinerary.update({
      where: { id },
      data: {
        isPublished: false,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Dupliciraj itinerary
   */
  async duplicate(id: string, userId: string): Promise<ItineraryDTO> {
    const original = await this.findById(id);

    if (!original) {
      throw new Error("Itinerary not found");
    }

    const duplicated = await prisma.itinerary.create({
      data: {
        userId,
        propertyId: original.propertyId,
        title: `${original.title} (Copy)`,
        description: original.description,
        days: original.days,
        duration: original.duration,
        isPublished: false,
      },
      include: {
        property: true,
      },
    });

    return this.mapToDomain(duplicated);
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Preslikaj Prisma data v Domain DTO
   */
  private mapToDomain(data: any): ItineraryDTO {
    return {
      id: data.id,
      userId: data.userId,
      propertyId: data.propertyId,
      title: data.title,
      description: data.description,
      days: data.days,
      duration: data.duration,
      isPublished: data.isPublished,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
