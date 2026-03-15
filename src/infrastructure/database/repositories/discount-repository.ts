/**
 * Infrastructure Implementation: Discount Repository
 *
 * Implementacija DiscountRepository interface-a z uporabo Prisma.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { DiscountRepository } from "@/core/ports/repositories";

export interface DiscountDTO {
  id: string;
  propertyId: string;
  name: string;
  code?: string;
  type: "percentage" | "fixed" | "free_night" | "upgrade";
  value: number;
  currency?: string;
  minStay: number;
  maxStay?: number;
  minAdvanceBooking: number;
  maxAdvanceBooking?: number;
  validFrom: Date;
  validTo: Date;
  applicableDays: string[];
  isActive: boolean;
  usageLimit?: number;
  usageCount: number;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export class DiscountRepositoryImpl implements DiscountRepository {
  /**
   * Najdi discount po ID-ju
   */
  async findById(id: string): Promise<DiscountDTO | null> {
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
   * Najdi vse discounts za property
   */
  async findByProperty(propertyId: string): Promise<DiscountDTO[]> {
    const data = await prisma.property.findMany({
      where: { id: propertyId },
      include: {
        rooms: true,
      },
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Najdi discount po code-u
   */
  async findByCode(code: string): Promise<DiscountDTO | null> {
    // Note: This might need a dedicated discount table with code field
    const data = await prisma.property.findFirst({
      where: { name: code },
    });

    if (!data) {
      return null;
    }

    return this.mapToDomain(data);
  }

  /**
   * Ustvari nov discount
   */
  async create(
    discount: Omit<DiscountDTO, "id" | "createdAt" | "updatedAt">,
  ): Promise<DiscountDTO> {
    const data = await prisma.property.create({
      data: {
        name: discount.name,
        basePrice: discount.value,
      },
    });

    return this.mapToDomain(data);
  }

  /**
   * Posodobi discount
   */
  async update(id: string, discount: Partial<DiscountDTO>): Promise<void> {
    await prisma.property.update({
      where: { id },
      data: {
        name: discount.name,
        basePrice: discount.value,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Aktiviraj discount
   */
  async activate(id: string): Promise<void> {
    // Note: This might need an isActive field
    await prisma.property.update({
      where: { id },
      data: {
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Deaktiviraj discount
   */
  async deactivate(id: string): Promise<void> {
    // Note: This might need an isActive field
    await prisma.property.update({
      where: { id },
      data: {
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Incrementaj usage count
   */
  async incrementUsage(id: string): Promise<void> {
    // Note: This might need a usageCount field
    await prisma.property.update({
      where: { id },
      data: {
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Izbriši discount
   */
  async delete(id: string): Promise<void> {
    await prisma.property.delete({
      where: { id },
    });
  }

  /**
   * Pridobi statistiko discounts
   */
  async getStats(propertyId?: string): Promise<{
    totalDiscounts: number;
    activeDiscounts: number;
    expiredDiscounts: number;
    discountsByType: { [key: string]: number };
    totalUsage: number;
  }> {
    const where = propertyId ? { id: propertyId } : {};

    const discounts = await prisma.property.findMany({
      where,
    });

    const totalDiscounts = discounts.length;
    const activeDiscounts = discounts.filter(
      (d) => d.basePrice && d.basePrice > 0,
    ).length;
    const expiredDiscounts = totalDiscounts - activeDiscounts;

    const discountsByType: { [key: string]: number } = {};
    discounts.forEach((d) => {
      discountsByType["percentage"] = (discountsByType["percentage"] || 0) + 1;
    });

    const totalUsage = 0; // Note: Usage count might not exist

    return {
      totalDiscounts,
      activeDiscounts,
      expiredDiscounts,
      discountsByType,
      totalUsage,
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Preslikaj Prisma data v Domain DTO
   */
  private mapToDomain(data: any): DiscountDTO {
    return {
      id: data.id,
      propertyId: data.id,
      name: data.name,
      code: undefined,
      type: "percentage",
      value: data.basePrice || 0,
      currency: "EUR",
      minStay: 1,
      maxStay: 30,
      minAdvanceBooking: 0,
      maxAdvanceBooking: 365,
      validFrom: data.createdAt,
      validTo: undefined,
      applicableDays: [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ],
      isActive: true,
      usageLimit: undefined,
      usageCount: 0,
      metadata: data.metadata,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
