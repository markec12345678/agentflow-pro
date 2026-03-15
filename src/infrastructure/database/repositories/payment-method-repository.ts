/**
 * Infrastructure Implementation: Payment Method Repository
 *
 * Implementacija PaymentMethodRepository interface-a z uporabo Prisma.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { PaymentMethodRepository } from "@/core/ports/repositories";

export interface PaymentMethodDTO {
  id: string;
  userId: string;
  type: "card" | "bank_account" | "paypal" | "crypto" | "other";
  provider: string; // stripe, paypal, etc.
  providerId: string; // stripe payment method id
  last4?: string;
  brand?: string;
  expMonth?: number;
  expYear?: number;
  isDefault: boolean;
  status: "active" | "inactive" | "expired" | "revoked";
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export class PaymentMethodRepositoryImpl implements PaymentMethodRepository {
  /**
   * Najdi payment method po ID-ju
   */
  async findById(id: string): Promise<PaymentMethodDTO | null> {
    const data = await prisma.paymentMethod.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!data) {
      return null;
    }

    return this.mapToDomain(data);
  }

  /**
   * Najdi vse payment methods za user-ja
   */
  async findByUser(
    userId: string,
    status?: string,
  ): Promise<PaymentMethodDTO[]> {
    const where: any = { userId };

    if (status) {
      where.status = status;
    }

    const data = await prisma.paymentMethod.findMany({
      where,
      include: {
        user: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Najdi default payment method za user-ja
   */
  async findDefault(userId: string): Promise<PaymentMethodDTO | null> {
    const data = await prisma.paymentMethod.findFirst({
      where: {
        userId,
        isDefault: true,
        status: "active",
      },
      include: {
        user: true,
      },
    });

    if (!data) {
      return null;
    }

    return this.mapToDomain(data);
  }

  /**
   * Ustvari nov payment method
   */
  async create(
    method: Omit<PaymentMethodDTO, "id" | "createdAt" | "updatedAt">,
  ): Promise<PaymentMethodDTO> {
    const data = await prisma.paymentMethod.create({
      data: {
        userId: method.userId,
        type: method.type,
        provider: method.provider,
        providerId: method.providerId,
        last4: method.last4,
        brand: method.brand,
        expMonth: method.expMonth,
        expYear: method.expYear,
        isDefault: method.isDefault,
        status: method.status,
        metadata: method.metadata,
      },
      include: {
        user: true,
      },
    });

    return this.mapToDomain(data);
  }

  /**
   * Posodobi payment method
   */
  async update(id: string, method: Partial<PaymentMethodDTO>): Promise<void> {
    await prisma.paymentMethod.update({
      where: { id },
      data: {
        type: method.type,
        provider: method.provider,
        providerId: method.providerId,
        last4: method.last4,
        brand: method.brand,
        expMonth: method.expMonth,
        expYear: method.expYear,
        isDefault: method.isDefault,
        status: method.status,
        metadata: method.metadata,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Nastavi payment method kot default
   */
  async setAsDefault(id: string, userId: string): Promise<void> {
    // First, unset all default methods for this user
    await prisma.paymentMethod.updateMany({
      where: {
        userId,
        isDefault: true,
      },
      data: {
        isDefault: false,
        updatedAt: new Date(),
      },
    });

    // Then, set the specified method as default
    await prisma.paymentMethod.update({
      where: { id },
      data: {
        isDefault: true,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Deaktiviraj payment method
   */
  async deactivate(id: string): Promise<void> {
    await prisma.paymentMethod.update({
      where: { id },
      data: {
        status: "inactive",
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Izbriši payment method
   */
  async delete(id: string): Promise<void> {
    await prisma.paymentMethod.delete({
      where: { id },
    });
  }

  /**
   * Pridobi statistiko payment methods
   */
  async getStats(userId?: string): Promise<{
    totalMethods: number;
    activeMethods: number;
    defaultMethods: number;
    methodsByType: { [key: string]: number };
    methodsByProvider: { [key: string]: number };
  }> {
    const where = userId ? { userId } : {};

    const methods = await prisma.paymentMethod.findMany({
      where,
    });

    const totalMethods = methods.length;
    const activeMethods = methods.filter((m) => m.status === "active").length;
    const defaultMethods = methods.filter((m) => m.isDefault).length;

    const methodsByType: { [key: string]: number } = {};
    const methodsByProvider: { [key: string]: number } = {};

    methods.forEach((m) => {
      methodsByType[m.type] = (methodsByType[m.type] || 0) + 1;
      methodsByProvider[m.provider] = (methodsByProvider[m.provider] || 0) + 1;
    });

    return {
      totalMethods,
      activeMethods,
      defaultMethods,
      methodsByType,
      methodsByProvider,
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Preslikaj Prisma data v Domain DTO
   */
  private mapToDomain(data: any): PaymentMethodDTO {
    return {
      id: data.id,
      userId: data.userId,
      type: data.type as any,
      provider: data.provider,
      providerId: data.providerId,
      last4: data.last4,
      brand: data.brand,
      expMonth: data.expMonth,
      expYear: data.expYear,
      isDefault: data.isDefault,
      status: data.status as any,
      metadata: data.metadata,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
