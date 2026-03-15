/**
 * Infrastructure Implementation: Billing Repository
 *
 * Implementacija BillingRepository interface-a z uporabo Prisma.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { BillingRepository } from "@/core/ports/repositories";

export interface BillingDTO {
  id: string;
  userId: string;
  propertyId?: string;
  type: "subscription" | "usage" | "one_time" | "invoice";
  amount: number;
  currency: string;
  status: "pending" | "paid" | "failed" | "refunded" | "cancelled";
  description?: string;
  metadata?: any;
  paidAt?: Date;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class BillingRepositoryImpl implements BillingRepository {
  /**
   * Najdi billing po ID-ju
   */
  async findById(id: string): Promise<BillingDTO | null> {
    const data = await prisma.billing.findUnique({
      where: { id },
      include: {
        user: true,
        property: true,
      },
    });

    if (!data) {
      return null;
    }

    return this.mapToDomain(data);
  }

  /**
   * Najdi vse billings za user-ja
   */
  async findByUser(userId: string, status?: string): Promise<BillingDTO[]> {
    const where: any = { userId };

    if (status) {
      where.status = status;
    }

    const data = await prisma.billing.findMany({
      where,
      include: {
        property: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Najdi billings za property
   */
  async findByProperty(propertyId: string): Promise<BillingDTO[]> {
    const data = await prisma.billing.findMany({
      where: { propertyId },
      include: {
        user: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Ustvari nov billing
   */
  async create(
    billing: Omit<BillingDTO, "id" | "createdAt" | "updatedAt">,
  ): Promise<BillingDTO> {
    const data = await prisma.billing.create({
      data: {
        userId: billing.userId,
        propertyId: billing.propertyId,
        type: billing.type,
        amount: billing.amount,
        currency: billing.currency,
        status: billing.status,
        description: billing.description,
        metadata: billing.metadata,
        paidAt: billing.paidAt,
        dueDate: billing.dueDate,
      },
      include: {
        property: true,
      },
    });

    return this.mapToDomain(data);
  }

  /**
   * Posodobi billing
   */
  async update(id: string, billing: Partial<BillingDTO>): Promise<void> {
    await prisma.billing.update({
      where: { id },
      data: {
        type: billing.type,
        amount: billing.amount,
        currency: billing.currency,
        status: billing.status,
        description: billing.description,
        metadata: billing.metadata,
        paidAt: billing.paidAt,
        dueDate: billing.dueDate,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Označi billing kot paid
   */
  async markAsPaid(id: string): Promise<void> {
    await prisma.billing.update({
      where: { id },
      data: {
        status: "paid",
        paidAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Označi billing kot failed
   */
  async markAsFailed(id: string): Promise<void> {
    await prisma.billing.update({
      where: { id },
      data: {
        status: "failed",
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Označi billing kot refunded
   */
  async markAsRefunded(id: string): Promise<void> {
    await prisma.billing.update({
      where: { id },
      data: {
        status: "refunded",
        paidAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Pridobi statistiko billing-ov
   */
  async getStats(userId?: string): Promise<{
    totalBillings: number;
    totalAmount: number;
    paidBillings: number;
    paidAmount: number;
    pendingBillings: number;
    pendingAmount: number;
    failedBillings: number;
    failedAmount: number;
  }> {
    const where = userId ? { userId } : {};

    const billings = await prisma.billing.findMany({
      where,
    });

    const totalBillings = billings.length;
    const paidBillings = billings.filter((b) => b.status === "paid").length;
    const pendingBillings = billings.filter(
      (b) => b.status === "pending",
    ).length;
    const failedBillings = billings.filter((b) => b.status === "failed").length;

    const totalAmount = billings.reduce((sum, b) => sum + b.amount, 0);
    const paidAmount = billings
      .filter((b) => b.status === "paid")
      .reduce((sum, b) => sum + b.amount, 0);
    const pendingAmount = billings
      .filter((b) => b.status === "pending")
      .reduce((sum, b) => sum + b.amount, 0);
    const failedAmount = billings
      .filter((b) => b.status === "failed")
      .reduce((sum, b) => sum + b.amount, 0);

    return {
      totalBillings,
      totalAmount,
      paidBillings,
      paidAmount,
      pendingBillings,
      pendingAmount,
      failedBillings,
      failedAmount,
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Preslikaj Prisma data v Domain DTO
   */
  private mapToDomain(data: any): BillingDTO {
    return {
      id: data.id,
      userId: data.userId,
      propertyId: data.propertyId,
      type: data.type as any,
      amount: data.amount,
      currency: data.currency,
      status: data.status as any,
      description: data.description,
      metadata: data.metadata,
      paidAt: data.paidAt,
      dueDate: data.dueDate,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
