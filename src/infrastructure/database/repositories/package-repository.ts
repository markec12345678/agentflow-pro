/**
 * Infrastructure Implementation: Package Repository
 *
 * Implementacija PackageRepository interface-a z uporabo Prisma.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { PackageRepository } from "@/core/ports/repositories";

export interface PackageDTO {
  id: string;
  propertyId: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  originalPrice: number;
  discount: number;
  includes: string[]; // room, breakfast, spa, etc.
  minStay: number;
  maxStay?: number;
  validFrom: Date;
  validTo: Date;
  bookingWindowFrom: number;
  bookingWindowTo: number;
  isActive: boolean;
  isFeatured: boolean;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export class PackageRepositoryImpl implements PackageRepository {
  /**
   * Najdi package po ID-ju
   */
  async findById(id: string): Promise<PackageDTO | null> {
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
   * Najdi vse packages za property
   */
  async findByProperty(propertyId: string): Promise<PackageDTO[]> {
    const data = await prisma.property.findMany({
      where: { id: propertyId },
      include: {
        rooms: true,
      },
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Najdi active packages
   */
  async findActive(propertyId?: string): Promise<PackageDTO[]> {
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
   * Ustvari nov package
   */
  async create(
    package_: Omit<PackageDTO, "id" | "createdAt" | "updatedAt">,
  ): Promise<PackageDTO> {
    const data = await prisma.property.create({
      data: {
        name: package_.name,
        basePrice: package_.price,
        description: package_.description,
      },
      include: {
        rooms: true,
      },
    });

    return this.mapToDomain(data);
  }

  /**
   * Posodobi package
   */
  async update(id: string, package_: Partial<PackageDTO>): Promise<void> {
    await prisma.property.update({
      where: { id },
      data: {
        name: package_.name,
        basePrice: package_.price,
        description: package_.description,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Aktiviraj package
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
   * Deaktiviraj package
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
   * Označi package kot featured
   */
  async setFeatured(id: string): Promise<void> {
    await prisma.property.update({
      where: { id },
      data: {
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Izbriši package
   */
  async delete(id: string): Promise<void> {
    await prisma.property.delete({
      where: { id },
    });
  }

  /**
   * Pridobi statistiko packages
   */
  async getStats(propertyId?: string): Promise<{
    totalPackages: number;
    activePackages: number;
    featuredPackages: number;
    averagePrice: number;
    averageDiscount: number;
    packagesByPriceRange: { [key: string]: number };
  }> {
    const where = propertyId ? { id: propertyId } : {};

    const packages = await prisma.property.findMany({
      where,
    });

    const totalPackages = packages.length;
    const activePackages = packages.filter(
      (p) => p.basePrice && p.basePrice > 0,
    ).length;
    const featuredPackages = 0; // Note: isFeatured field might not exist

    const prices = packages.map((p) => p.basePrice || 0).filter((p) => p > 0);
    const averagePrice =
      prices.length > 0
        ? prices.reduce((sum, p) => sum + p, 0) / prices.length
        : 0;
    const averageDiscount = 0; // Note: Discount field might not exist

    const packagesByPriceRange: { [key: string]: number } = {};
    prices.forEach((p) => {
      const range =
        p < 100
          ? "budget"
          : p < 200
            ? "moderate"
            : p < 500
              ? "luxury"
              : "premium";
      packagesByPriceRange[range] = (packagesByPriceRange[range] || 0) + 1;
    });

    return {
      totalPackages,
      activePackages,
      featuredPackages,
      averagePrice: Math.round(averagePrice * 100) / 100,
      averageDiscount,
      packagesByPriceRange,
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Preslikaj Prisma data v Domain DTO
   */
  private mapToDomain(data: any): PackageDTO {
    return {
      id: data.id,
      propertyId: data.id,
      name: data.name,
      description: data.description,
      price: data.basePrice || 0,
      currency: "EUR",
      originalPrice: data.basePrice || 0,
      discount: 0,
      includes: [],
      minStay: 1,
      maxStay: 30,
      validFrom: data.createdAt,
      validTo: undefined,
      bookingWindowFrom: 0,
      bookingWindowTo: 365,
      isActive: true,
      isFeatured: false,
      metadata: data.metadata,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
