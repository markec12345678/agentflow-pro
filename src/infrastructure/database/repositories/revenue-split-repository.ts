/**
 * Infrastructure Implementation: Revenue Split Repository
 *
 * Implementacija RevenueSplitRepository interface-a z uporabo Prisma.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { RevenueSplitRepository } from "@/core/ports/repositories";

export interface RevenueSplitDTO {
  id: string;
  propertyId: string;
  userId: string;
  amount: number;
  currency: string;
  percentage: number;
  type: "owner" | "manager" | "staff" | "partner" | "other";
  status: "pending" | "confirmed" | "paid" | "cancelled";
  period: string; // YYYY-MM format
  description?: string;
  metadata?: any;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class RevenueSplitRepositoryImpl implements RevenueSplitRepository {
  /**
   * Najdi revenue split po ID-ju
   */
  async findById(id: string): Promise<RevenueSplitDTO | null> {
    const data = await prisma.revenueSplit.findUnique({
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
   * Najdi vse revenue splits za property
   */
  async findByProperty(
    propertyId: string,
    period?: string,
  ): Promise<RevenueSplitDTO[]> {
    const where: any = { propertyId };

    if (period) {
      where.period = period;
    }

    const data = await prisma.revenueSplit.findMany({
      where,
      include: {
        property: true,
        user: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Najdi revenue splits za user-ja
   */
  async findByUser(
    userId: string,
    period?: string,
  ): Promise<RevenueSplitDTO[]> {
    const where: any = { userId };

    if (period) {
      where.period = period;
    }

    const data = await prisma.revenueSplit.findMany({
      where,
      include: {
        property: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Ustvari nov revenue split
   */
  async create(
    split: Omit<RevenueSplitDTO, "id" | "createdAt" | "updatedAt">,
  ): Promise<RevenueSplitDTO> {
    const data = await prisma.revenueSplit.create({
      data: {
        propertyId: split.propertyId,
        userId: split.userId,
        amount: split.amount,
        currency: split.currency,
        percentage: split.percentage,
        type: split.type,
        status: split.status,
        period: split.period,
        description: split.description,
        metadata: split.metadata,
        paidAt: split.paidAt,
      },
      include: {
        property: true,
        user: true,
      },
    });

    return this.mapToDomain(data);
  }

  /**
   * Posodobi revenue split
   */
  async update(id: string, split: Partial<RevenueSplitDTO>): Promise<void> {
    await prisma.revenueSplit.update({
      where: { id },
      data: {
        amount: split.amount,
        currency: split.currency,
        percentage: split.percentage,
        type: split.type,
        status: split.status,
        period: split.period,
        description: split.description,
        metadata: split.metadata,
        paidAt: split.paidAt,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Označi revenue split kot paid
   */
  async markAsPaid(id: string): Promise<void> {
    await prisma.revenueSplit.update({
      where: { id },
      data: {
        status: "paid",
        paidAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Označi revenue split kot confirmed
   */
  async markAsConfirmed(id: string): Promise<void> {
    await prisma.revenueSplit.update({
      where: { id },
      data: {
        status: "confirmed",
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Prekliči revenue split
   */
  async cancel(id: string): Promise<void> {
    await prisma.revenueSplit.update({
      where: { id },
      data: {
        status: "cancelled",
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Pridobi statistiko revenue splits
   */
  async getStats(
    propertyId?: string,
    period?: string,
  ): Promise<{
    totalSplits: number;
    totalAmount: number;
    paidSplits: number;
    paidAmount: number;
    pendingSplits: number;
    pendingAmount: number;
    splitsByType: { [key: string]: number };
    averageSplitAmount: number;
  }> {
    const where: any = {};

    if (propertyId) {
      where.propertyId = propertyId;
    }

    if (period) {
      where.period = period;
    }

    const splits = await prisma.revenueSplit.findMany({
      where,
    });

    const totalSplits = splits.length;
    const paidSplits = splits.filter((s) => s.status === "paid").length;
    const pendingSplits = splits.filter(
      (s) => s.status === "pending" || s.status === "confirmed",
    ).length;

    const totalAmount = splits.reduce((sum, s) => sum + s.amount, 0);
    const paidAmount = splits
      .filter((s) => s.status === "paid")
      .reduce((sum, s) => sum + s.amount, 0);
    const pendingAmount = splits
      .filter((s) => s.status === "pending" || s.status === "confirmed")
      .reduce((sum, s) => sum + s.amount, 0);

    const splitsByType: { [key: string]: number } = {};
    splits.forEach((s) => {
      splitsByType[s.type] = (splitsByType[s.type] || 0) + 1;
    });

    const averageSplitAmount = totalSplits > 0 ? totalAmount / totalSplits : 0;

    return {
      totalSplits,
      totalAmount,
      paidSplits,
      paidAmount,
      pendingSplits,
      pendingAmount,
      splitsByType,
      averageSplitAmount: Math.round(averageSplitAmount * 100) / 100,
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Preslikaj Prisma data v Domain DTO
   */
  private mapToDomain(data: any): RevenueSplitDTO {
    return {
      id: data.id,
      propertyId: data.propertyId,
      userId: data.userId,
      amount: data.amount,
      currency: data.currency,
      percentage: data.percentage,
      type: data.type as any,
      status: data.status as any,
      period: data.period,
      description: data.description,
      metadata: data.metadata,
      paidAt: data.paidAt,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
