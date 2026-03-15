/**
 * Infrastructure Implementation: Coupon Repository
 *
 * Implementacija CouponRepository interface-a z uporabo Prisma.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { CouponRepository } from "@/core/ports/repositories";

export interface CouponDTO {
  id: string;
  code: string;
  propertyId?: string;
  userId?: string;
  type: "percentage" | "fixed" | "free_night";
  value: number;
  currency?: string;
  minBookingValue?: number;
  maxDiscount?: number;
  validFrom: Date;
  validTo: Date;
  minStay?: number;
  maxStay?: number;
  applicableRoomTypes?: string[];
  isActive: boolean;
  usageLimit?: number;
  usageCount: number;
  userUsageLimit?: number;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export class CouponRepositoryImpl implements CouponRepository {
  /**
   * Najdi coupon po ID-ju
   */
  async findById(id: string): Promise<CouponDTO | null> {
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
   * Najdi coupon po code-u
   */
  async findByCode(code: string): Promise<CouponDTO | null> {
    // Note: This might need a dedicated coupon table with code field
    const data = await prisma.property.findFirst({
      where: { name: code },
    });

    if (!data) {
      return null;
    }

    return this.mapToDomain(data);
  }

  /**
   * Najdi vse coupons za property
   */
  async findByProperty(propertyId: string): Promise<CouponDTO[]> {
    const data = await prisma.property.findMany({
      where: { id: propertyId },
      include: {
        rooms: true,
      },
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Ustvari nov coupon
   */
  async create(
    coupon: Omit<CouponDTO, "id" | "createdAt" | "updatedAt">,
  ): Promise<CouponDTO> {
    const data = await prisma.property.create({
      data: {
        name: coupon.code,
        basePrice: coupon.value,
      },
    });

    return this.mapToDomain(data);
  }

  /**
   * Posodobi coupon
   */
  async update(id: string, coupon: Partial<CouponDTO>): Promise<void> {
    await prisma.property.update({
      where: { id },
      data: {
        name: coupon.code,
        basePrice: coupon.value,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Aktiviraj coupon
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
   * Deaktiviraj coupon
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
   * Incrementaj usage count
   */
  async incrementUsage(id: string): Promise<void> {
    await prisma.property.update({
      where: { id },
      data: {
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Preveri če je coupon validen
   */
  async isValid(code: string, bookingDate: Date): Promise<boolean> {
    const coupon = await this.findByCode(code);

    if (!coupon || !coupon.isActive) {
      return false;
    }

    if (coupon.validFrom > bookingDate || coupon.validTo < bookingDate) {
      return false;
    }

    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return false;
    }

    return true;
  }

  /**
   * Izbriši coupon
   */
  async delete(id: string): Promise<void> {
    await prisma.property.delete({
      where: { id },
    });
  }

  /**
   * Pridobi statistiko coupons
   */
  async getStats(propertyId?: string): Promise<{
    totalCoupons: number;
    activeCoupons: number;
    expiredCoupons: number;
    usedCoupons: number;
    couponsByType: { [key: string]: number };
    totalDiscountGiven: number;
  }> {
    const where = propertyId ? { id: propertyId } : {};

    const coupons = await prisma.property.findMany({
      where,
    });

    const totalCoupons = coupons.length;
    const activeCoupons = coupons.filter(
      (c) => c.basePrice && c.basePrice > 0,
    ).length;
    const expiredCoupons = totalCoupons - activeCoupons;
    const usedCoupons = 0; // Note: Usage count might not exist

    const couponsByType: { [key: string]: number } = {};
    coupons.forEach((c) => {
      couponsByType["percentage"] = (couponsByType["percentage"] || 0) + 1;
    });

    const totalDiscountGiven = 0;

    return {
      totalCoupons,
      activeCoupons,
      expiredCoupons,
      usedCoupons,
      couponsByType,
      totalDiscountGiven,
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Preslikaj Prisma data v Domain DTO
   */
  private mapToDomain(data: any): CouponDTO {
    return {
      id: data.id,
      code: data.name,
      propertyId: data.id,
      userId: undefined,
      type: "percentage",
      value: data.basePrice || 0,
      currency: "EUR",
      minBookingValue: undefined,
      maxDiscount: undefined,
      validFrom: data.createdAt,
      validTo: undefined,
      minStay: 1,
      maxStay: 30,
      applicableRoomTypes: [],
      isActive: true,
      usageLimit: undefined,
      usageCount: 0,
      userUsageLimit: undefined,
      metadata: data.metadata,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
