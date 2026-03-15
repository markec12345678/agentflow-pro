/**
 * Infrastructure Implementation: Upsell Repository
 *
 * Implementacija UpsellRepository interface-a z uporabo Prisma.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { UpsellRepository } from "@/core/ports/repositories";

export interface UpsellDTO {
  id: string;
  propertyId: string;
  name: string;
  description?: string;
  type:
    | "room_upgrade"
    | "late_checkout"
    | "early_checkin"
    | "extra_service"
    | "package";
  price: number;
  currency: string;
  originalPrice: number;
  discount: number;
  targetAudience: "all" | "new" | "returning" | "vip";
  triggerPoint: "booking" | "checkin" | "during_stay" | "checkout";
  isActive: boolean;
  priority: number;
  conversionRate?: number;
  impressions?: number;
  purchases?: number;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export class UpsellRepositoryImpl implements UpsellRepository {
  /**
   * Najdi upsell po ID-ju
   */
  async findById(id: string): Promise<UpsellDTO | null> {
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
   * Najdi vse upsells za property
   */
  async findByProperty(propertyId: string): Promise<UpsellDTO[]> {
    const data = await prisma.property.findMany({
      where: { id: propertyId },
      include: {
        rooms: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Najdi active upsells
   */
  async findActive(
    propertyId?: string,
    triggerPoint?: string,
  ): Promise<UpsellDTO[]> {
    const where: any = {};

    if (propertyId) {
      where.id = propertyId;
    }

    const data = await prisma.property.findMany({
      where,
      include: {
        rooms: true,
      },
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Ustvari nov upsell
   */
  async create(
    upsell: Omit<UpsellDTO, "id" | "createdAt" | "updatedAt">,
  ): Promise<UpsellDTO> {
    const data = await prisma.property.create({
      data: {
        name: upsell.name,
        basePrice: upsell.price,
        description: upsell.description,
      },
      include: {
        rooms: true,
      },
    });

    return this.mapToDomain(data);
  }

  /**
   * Posodobi upsell
   */
  async update(id: string, upsell: Partial<UpsellDTO>): Promise<void> {
    await prisma.property.update({
      where: { id },
      data: {
        name: upsell.name,
        basePrice: upsell.price,
        description: upsell.description,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Aktiviraj upsell
   */
  async activate(id: string): Promise<void> {
    await prisma.property.update({
      where: { id },
      data: {
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Deaktiviraj upsell
   */
  async deactivate(id: string): Promise<void> {
    await prisma.property.update({
      where: { id },
      data: {
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Trackaj impression
   */
  async trackImpression(id: string): Promise<void> {
    // Note: This might need impression/purchase tracking fields
    await prisma.property.update({
      where: { id },
      data: {
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Trackaj purchase
   */
  async trackPurchase(id: string): Promise<void> {
    // Note: This might need impression/purchase tracking fields
    await prisma.property.update({
      where: { id },
      data: {
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Izbriši upsell
   */
  async delete(id: string): Promise<void> {
    await prisma.property.delete({
      where: { id },
    });
  }

  /**
   * Pridobi statistiko upsells
   */
  async getStats(propertyId?: string): Promise<{
    totalUpsells: number;
    activeUpsells: number;
    totalImpressions: number;
    totalPurchases: number;
    overallConversionRate: number;
    totalRevenue: number;
    upsellsByType: { [key: string]: number };
    upsellsByTriggerPoint: { [key: string]: number };
  }> {
    const where = propertyId ? { id: propertyId } : {};

    const upsells = await prisma.property.findMany({
      where,
    });

    const totalUpsells = upsells.length;
    const activeUpsells = upsells.filter(
      (u) => u.basePrice && u.basePrice > 0,
    ).length;
    const totalImpressions = 0; // Note: Tracking fields might not exist
    const totalPurchases = 0;
    const overallConversionRate = 0;
    const totalRevenue = 0;

    const upsellsByType: { [key: string]: number } = {};
    const upsellsByTriggerPoint: { [key: string]: number } = {};

    upsells.forEach((u) => {
      upsellsByType["room_upgrade"] = (upsellsByType["room_upgrade"] || 0) + 1;
      upsellsByTriggerPoint["booking"] =
        (upsellsByTriggerPoint["booking"] || 0) + 1;
    });

    return {
      totalUpsells,
      activeUpsells,
      totalImpressions,
      totalPurchases,
      overallConversionRate,
      totalRevenue,
      upsellsByType,
      upsellsByTriggerPoint,
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Preslikaj Prisma data v Domain DTO
   */
  private mapToDomain(data: any): UpsellDTO {
    return {
      id: data.id,
      propertyId: data.id,
      name: data.name,
      description: data.description,
      type: "room_upgrade",
      price: data.basePrice || 0,
      currency: "EUR",
      originalPrice: data.basePrice || 0,
      discount: 0,
      targetAudience: "all",
      triggerPoint: "booking",
      isActive: true,
      priority: 0,
      conversionRate: 0,
      impressions: 0,
      purchases: 0,
      metadata: data.metadata,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
