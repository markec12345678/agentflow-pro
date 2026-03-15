/**
 * Infrastructure Implementation: Usage Record Repository
 *
 * Implementacija UsageRecordRepository interface-a z uporabo Prisma.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { UsageRecordRepository } from "@/core/ports/repositories";

export interface UsageRecordDTO {
  id: string;
  userId: string;
  subscriptionId: string;
  period: string; // YYYY-MM format
  agentRuns: number;
  storageUsed: number; // in MB
  teamMembers: number;
  overageRuns: number;
  overageStorage: number;
  overageTeamMembers: number;
  totalCost: number; // in cents
  createdAt: Date;
  updatedAt: Date;
}

export class UsageRecordRepositoryImpl implements UsageRecordRepository {
  /**
   * Najdi usage record po ID-ju
   */
  async findById(id: string): Promise<UsageRecordDTO | null> {
    const data = await prisma.usageRecord.findUnique({
      where: { id },
      include: {
        user: true,
        subscription: true,
      },
    });

    if (!data) {
      return null;
    }

    return this.mapToDomain(data);
  }

  /**
   * Najdi usage records za user-ja
   */
  async findByUser(userId: string, period?: string): Promise<UsageRecordDTO[]> {
    const where: any = { userId };

    if (period) {
      where.period = period;
    }

    const data = await prisma.usageRecord.findMany({
      where,
      include: {
        subscription: true,
      },
      orderBy: { period: "desc" },
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Najdi usage record za period
   */
  async findByPeriod(
    userId: string,
    period: string,
  ): Promise<UsageRecordDTO | null> {
    const data = await prisma.usageRecord.findUnique({
      where: {
        userId_period: {
          userId,
          period,
        },
      },
      include: {
        subscription: true,
      },
    });

    if (!data) {
      return null;
    }

    return this.mapToDomain(data);
  }

  /**
   * Shrani usage record
   */
  async save(
    record: Omit<UsageRecordDTO, "id" | "createdAt" | "updatedAt">,
  ): Promise<UsageRecordDTO> {
    const data = await prisma.usageRecord.upsert({
      where: {
        userId_period: {
          userId: record.userId,
          period: record.period,
        },
      },
      update: {
        agentRuns: record.agentRuns,
        storageUsed: record.storageUsed,
        teamMembers: record.teamMembers,
        overageRuns: record.overageRuns,
        overageStorage: record.overageStorage,
        overageTeamMembers: record.overageTeamMembers,
        totalCost: record.totalCost,
        updatedAt: new Date(),
      },
      create: {
        userId: record.userId,
        subscriptionId: record.subscriptionId,
        period: record.period,
        agentRuns: record.agentRuns,
        storageUsed: record.storageUsed,
        teamMembers: record.teamMembers,
        overageRuns: record.overageRuns,
        overageStorage: record.overageStorage,
        overageTeamMembers: record.overageTeamMembers,
        totalCost: record.totalCost,
      },
    });

    return this.mapToDomain(data);
  }

  /**
   * Incrementaj agent runs
   */
  async incrementAgentRuns(
    userId: string,
    period: string,
    runs: number = 1,
  ): Promise<void> {
    const record = await this.findByPeriod(userId, period);

    if (record) {
      await prisma.usageRecord.update({
        where: {
          userId_period: {
            userId,
            period,
          },
        },
        data: {
          agentRuns: { increment: runs },
          updatedAt: new Date(),
        },
      });
    }
  }

  /**
   * Pridobi statistiko usage records
   */
  async getStats(
    userId?: string,
    period?: string,
  ): Promise<{
    totalRecords: number;
    totalAgentRuns: number;
    totalStorageUsed: number;
    totalTeamMembers: number;
    totalOverageCost: number;
    averageAgentRunsPerUser: number;
    averageStoragePerUser: number;
  }> {
    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (period) {
      where.period = period;
    }

    const records = await prisma.usageRecord.findMany({
      where,
    });

    const totalRecords = records.length;
    const totalAgentRuns = records.reduce((sum, r) => sum + r.agentRuns, 0);
    const totalStorageUsed = records.reduce((sum, r) => sum + r.storageUsed, 0);
    const totalTeamMembers = records.reduce((sum, r) => sum + r.teamMembers, 0);
    const totalOverageCost = records.reduce((sum, r) => sum + r.totalCost, 0);

    const uniqueUsers = new Set(records.map((r) => r.userId)).size;
    const averageAgentRunsPerUser =
      uniqueUsers > 0 ? totalAgentRuns / uniqueUsers : 0;
    const averageStoragePerUser =
      uniqueUsers > 0 ? totalStorageUsed / uniqueUsers : 0;

    return {
      totalRecords,
      totalAgentRuns,
      totalStorageUsed,
      totalTeamMembers,
      totalOverageCost,
      averageAgentRunsPerUser: Math.round(averageAgentRunsPerUser),
      averageStoragePerUser: Math.round(averageStoragePerUser),
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Preslikaj Prisma data v Domain DTO
   */
  private mapToDomain(data: any): UsageRecordDTO {
    return {
      id: data.id,
      userId: data.userId,
      subscriptionId: data.subscriptionId,
      period: data.period,
      agentRuns: data.agentRuns,
      storageUsed: data.storageUsed,
      teamMembers: data.teamMembers,
      overageRuns: data.overageRuns,
      overageStorage: data.overageStorage,
      overageTeamMembers: data.overageTeamMembers,
      totalCost: data.totalCost,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
