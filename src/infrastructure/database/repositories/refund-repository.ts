/**
 * Infrastructure Implementation: Refund Repository
 *
 * Implementacija RefundRepository interface-a z uporabo Prisma.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { RefundRepository } from "@/core/ports/repositories";

export interface RefundDTO {
  id: string;
  paymentId: string;
  invoiceId?: string;
  userId: string;
  amount: number;
  currency: string;
  reason: "duplicate" | "fraudulent" | "requested_by_customer" | "other";
  status: "pending" | "processing" | "succeeded" | "failed" | "cancelled";
  refundId?: string; // Stripe refund ID
  description?: string;
  metadata?: any;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class RefundRepositoryImpl implements RefundRepository {
  /**
   * Najdi refund po ID-ju
   */
  async findById(id: string): Promise<RefundDTO | null> {
    const data = await prisma.refund.findUnique({
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
   * Najdi vse refunds za user-ja
   */
  async findByUser(userId: string, status?: string): Promise<RefundDTO[]> {
    const where: any = { userId };

    if (status) {
      where.status = status;
    }

    const data = await prisma.refund.findMany({
      where,
      include: {
        user: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Najdi refunds za payment
   */
  async findByPayment(paymentId: string): Promise<RefundDTO[]> {
    const data = await prisma.refund.findMany({
      where: { paymentId },
      include: {
        user: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Ustvari nov refund
   */
  async create(
    refund: Omit<RefundDTO, "id" | "createdAt" | "updatedAt">,
  ): Promise<RefundDTO> {
    const data = await prisma.refund.create({
      data: {
        paymentId: refund.paymentId,
        invoiceId: refund.invoiceId,
        userId: refund.userId,
        amount: refund.amount,
        currency: refund.currency,
        reason: refund.reason,
        status: refund.status,
        refundId: refund.refundId,
        description: refund.description,
        metadata: refund.metadata,
        processedAt: refund.processedAt,
      },
      include: {
        user: true,
      },
    });

    return this.mapToDomain(data);
  }

  /**
   * Posodobi refund
   */
  async update(id: string, refund: Partial<RefundDTO>): Promise<void> {
    await prisma.refund.update({
      where: { id },
      data: {
        amount: refund.amount,
        currency: refund.currency,
        reason: refund.reason,
        status: refund.status,
        refundId: refund.refundId,
        description: refund.description,
        metadata: refund.metadata,
        processedAt: refund.processedAt,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Označi refund kot processing
   */
  async markAsProcessing(id: string, refundId?: string): Promise<void> {
    await prisma.refund.update({
      where: { id },
      data: {
        status: "processing",
        refundId,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Označi refund kot succeeded
   */
  async markAsSucceeded(id: string, processedAt?: Date): Promise<void> {
    await prisma.refund.update({
      where: { id },
      data: {
        status: "succeeded",
        processedAt: processedAt || new Date(),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Označi refund kot failed
   */
  async markAsFailed(id: string): Promise<void> {
    await prisma.refund.update({
      where: { id },
      data: {
        status: "failed",
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Prekliči refund
   */
  async cancel(id: string): Promise<void> {
    await prisma.refund.update({
      where: { id },
      data: {
        status: "cancelled",
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Pridobi statistiko refunds
   */
  async getStats(userId?: string): Promise<{
    totalRefunds: number;
    totalAmount: number;
    succeededRefunds: number;
    succeededAmount: number;
    pendingRefunds: number;
    pendingAmount: number;
    failedRefunds: number;
    failedAmount: number;
    refundsByReason: { [key: string]: number };
  }> {
    const where = userId ? { userId } : {};

    const refunds = await prisma.refund.findMany({
      where,
    });

    const totalRefunds = refunds.length;
    const succeededRefunds = refunds.filter(
      (r) => r.status === "succeeded",
    ).length;
    const pendingRefunds = refunds.filter(
      (r) => r.status === "pending" || r.status === "processing",
    ).length;
    const failedRefunds = refunds.filter(
      (r) => r.status === "failed" || r.status === "cancelled",
    ).length;

    const totalAmount = refunds.reduce((sum, r) => sum + r.amount, 0);
    const succeededAmount = refunds
      .filter((r) => r.status === "succeeded")
      .reduce((sum, r) => sum + r.amount, 0);
    const pendingAmount = refunds
      .filter((r) => r.status === "pending" || r.status === "processing")
      .reduce((sum, r) => sum + r.amount, 0);
    const failedAmount = refunds
      .filter((r) => r.status === "failed" || r.status === "cancelled")
      .reduce((sum, r) => sum + r.amount, 0);

    const refundsByReason: { [key: string]: number } = {};
    refunds.forEach((r) => {
      refundsByReason[r.reason] = (refundsByReason[r.reason] || 0) + 1;
    });

    return {
      totalRefunds,
      totalAmount,
      succeededRefunds,
      succeededAmount,
      pendingRefunds,
      pendingAmount,
      failedRefunds,
      failedAmount,
      refundsByReason,
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Preslikaj Prisma data v Domain DTO
   */
  private mapToDomain(data: any): RefundDTO {
    return {
      id: data.id,
      paymentId: data.paymentId,
      invoiceId: data.invoiceId,
      userId: data.userId,
      amount: data.amount,
      currency: data.currency,
      reason: data.reason as any,
      status: data.status as any,
      refundId: data.refundId,
      description: data.description,
      metadata: data.metadata,
      processedAt: data.processedAt,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
