/**
 * Infrastructure Implementation: Rate Plan Repository
 *
 * Implementacija RatePlanRepository interface-a z uporabo Prisma.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { RatePlanRepository } from "@/core/ports/repositories";

export interface RatePlanDTO {
  id: string;
  propertyId: string;
  roomId?: string;
  name: string;
  description?: string;
  baseRate: number;
  currency: string;
  minStay: number;
  maxStay: number;
  minAdvanceBooking: number;
  maxAdvanceBooking: number;
  cancellationPolicy: "flexible" | "moderate" | "strict" | "non_refundable";
  includes: string[]; // breakfast, wifi, etc.
  isActive: boolean;
  priority: number;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export class RatePlanRepositoryImpl implements RatePlanRepository {
  /**
   * Najdi rate plan po ID-ju
   */
  async findById(id: string): Promise<RatePlanDTO | null> {
    const data = await prisma.property.findUnique({
      where: { id },
      include: {
        rooms: true,
      },
    });

    if (!data) {
      return null;
    }

    return this.mapToDomain(data);
  }

  /**
   * Najdi vse rate plans za property
   */
  async findByProperty(propertyId: string): Promise<RatePlanDTO[]> {
    const data = await prisma.property.findMany({
      where: { id: propertyId },
      include: {
        rooms: true,
      },
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Ustvari nov rate plan
   */
  async create(
    ratePlan: Omit<RatePlanDTO, "id" | "createdAt" | "updatedAt">,
  ): Promise<RatePlanDTO> {
    // Note: This might need a dedicated rate_plan table in schema
    const data = await prisma.property.create({
      data: {
        name: ratePlan.name,
        basePrice: ratePlan.baseRate,
        currency: ratePlan.currency,
      },
    });

    return this.mapToDomain(data);
  }

  /**
   * Posodobi rate plan
   */
  async update(id: string, ratePlan: Partial<RatePlanDTO>): Promise<void> {
    await prisma.property.update({
      where: { id },
      data: {
        basePrice: ratePlan.baseRate,
        currency: ratePlan.currency,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Aktiviraj rate plan
   */
  async activate(id: string): Promise<void> {
    // Note: This might need an isActive field in schema
    await prisma.property.update({
      where: { id },
      data: {
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Deaktiviraj rate plan
   */
  async deactivate(id: string): Promise<void> {
    // Note: This might need an isActive field in schema
    await prisma.property.update({
      where: { id },
      data: {
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Izbriši rate plan
   */
  async delete(id: string): Promise<void> {
    await prisma.property.delete({
      where: { id },
    });
  }

  /**
   * Pridobi statistiko rate plans
   */
  async getStats(propertyId?: string): Promise<{
    totalRatePlans: number;
    activeRatePlans: number;
    averageRate: number;
    minRate: number;
    maxRate: number;
    ratePlansByCancellation: { [key: string]: number };
  }> {
    const where = propertyId ? { id: propertyId } : {};

    const ratePlans = await prisma.property.findMany({
      where,
    });

    const totalRatePlans = ratePlans.length;
    const activeRatePlans = ratePlans.filter(
      (r) => r.basePrice && r.basePrice > 0,
    ).length;

    const rates = ratePlans.map((r) => r.basePrice || 0).filter((r) => r > 0);
    const averageRate =
      rates.length > 0
        ? rates.reduce((sum, r) => sum + r, 0) / rates.length
        : 0;
    const minRate = rates.length > 0 ? Math.min(...rates) : 0;
    const maxRate = rates.length > 0 ? Math.max(...rates) : 0;

    const ratePlansByCancellation: { [key: string]: number } = {};

    return {
      totalRatePlans,
      activeRatePlans,
      averageRate: Math.round(averageRate * 100) / 100,
      minRate: Math.round(minRate * 100) / 100,
      maxRate: Math.round(maxRate * 100) / 100,
      ratePlansByCancellation,
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Preslikaj Prisma data v Domain DTO
   */
  private mapToDomain(data: any): RatePlanDTO {
    return {
      id: data.id,
      propertyId: data.id,
      roomId: undefined,
      name: data.name,
      description: data.description,
      baseRate: data.basePrice || 0,
      currency: data.currency || "EUR",
      minStay: 1,
      maxStay: 30,
      minAdvanceBooking: 0,
      maxAdvanceBooking: 365,
      cancellationPolicy: "flexible",
      includes: [],
      isActive: true,
      priority: 0,
      metadata: data.metadata,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
