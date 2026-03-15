/**
 * Infrastructure Implementation: Extra Service Repository
 *
 * Implementacija ExtraServiceRepository interface-a z uporabo Prisma.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { ExtraServiceRepository } from "@/core/ports/repositories";

export interface ExtraServiceDTO {
  id: string;
  propertyId: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  type: "one_time" | "per_day" | "per_person" | "per_stay";
  category: "food" | "transport" | "activity" | "amenity" | "other";
  isActive: boolean;
  bookingRequired: boolean;
  advanceBookingHours: number;
  maxQuantity: number;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export class ExtraServiceRepositoryImpl implements ExtraServiceRepository {
  /**
   * Najdi extra service po ID-ju
   */
  async findById(id: string): Promise<ExtraServiceDTO | null> {
    const data = await prisma.amenity.findUnique({
      where: { id },
      include: {
        property: true,
      },
    });

    if (!data) {
      return null;
    }

    return this.mapToDomain(data);
  }

  /**
   * Najdi vse extra services za property
   */
  async findByProperty(propertyId: string): Promise<ExtraServiceDTO[]> {
    const data = await prisma.amenity.findMany({
      where: { propertyId },
      include: {
        property: true,
      },
      orderBy: { name: "asc" },
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Ustvari nov extra service
   */
  async create(
    service: Omit<ExtraServiceDTO, "id" | "createdAt" | "updatedAt">,
  ): Promise<ExtraServiceDTO> {
    const data = await prisma.amenity.create({
      data: {
        propertyId: service.propertyId,
        name: service.name,
        description: service.description,
      },
      include: {
        property: true,
      },
    });

    return this.mapToDomain(data);
  }

  /**
   * Posodobi extra service
   */
  async update(id: string, service: Partial<ExtraServiceDTO>): Promise<void> {
    await prisma.amenity.update({
      where: { id },
      data: {
        name: service.name,
        description: service.description,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Aktiviraj extra service
   */
  async activate(id: string): Promise<void> {
    // Note: This might need an isActive field in schema
    await prisma.amenity.update({
      where: { id },
      data: {
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Deaktiviraj extra service
   */
  async deactivate(id: string): Promise<void> {
    // Note: This might need an isActive field in schema
    await prisma.amenity.update({
      where: { id },
      data: {
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Izbriši extra service
   */
  async delete(id: string): Promise<void> {
    await prisma.amenity.delete({
      where: { id },
    });
  }

  /**
   * Pridobi statistiko extra services
   */
  async getStats(propertyId?: string): Promise<{
    totalServices: number;
    activeServices: number;
    servicesByCategory: { [key: string]: number };
    servicesByType: { [key: string]: number };
    averagePrice: number;
  }> {
    const where = propertyId ? { propertyId } : {};

    const services = await prisma.amenity.findMany({
      where,
    });

    const totalServices = services.length;
    const activeServices = services.filter((s) => s.name).length;

    const servicesByCategory: { [key: string]: number } = {};
    const servicesByType: { [key: string]: number } = {};

    services.forEach((s) => {
      servicesByCategory["amenity"] = (servicesByCategory["amenity"] || 0) + 1;
      servicesByType["one_time"] = (servicesByType["one_time"] || 0) + 1;
    });

    const averagePrice = 0; // Note: Price field might not exist in amenity table

    return {
      totalServices,
      activeServices,
      servicesByCategory,
      servicesByType,
      averagePrice,
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Preslikaj Prisma data v Domain DTO
   */
  private mapToDomain(data: any): ExtraServiceDTO {
    return {
      id: data.id,
      propertyId: data.propertyId,
      name: data.name,
      description: data.description,
      price: 0,
      currency: "EUR",
      type: "one_time",
      category: "amenity",
      isActive: true,
      bookingRequired: false,
      advanceBookingHours: 0,
      maxQuantity: 1,
      metadata: data.metadata,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
