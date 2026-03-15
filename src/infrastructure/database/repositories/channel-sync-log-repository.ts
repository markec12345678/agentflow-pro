/**
 * Infrastructure Implementation: Channel Sync Log Repository
 *
 * Implementacija ChannelSyncLogRepository interface-a z uporabo Prisma.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { ChannelSyncLogRepository } from "@/core/ports/repositories";

export interface ChannelSyncLogDTO {
  id: string;
  propertyId: string;
  connectionId: string;
  channel: string;
  syncType: "availability" | "rates" | "bookings" | "full";
  status: "pending" | "syncing" | "completed" | "failed";
  itemsSynced: number;
  itemsFailed: number;
  errors?: string[];
  startedAt: Date;
  completedAt?: Date;
  duration: number; // milliseconds
  createdAt: Date;
}

export class ChannelSyncLogRepositoryImpl implements ChannelSyncLogRepository {
  /**
   * Najdi log po ID-ju
   */
  async findById(id: string): Promise<ChannelSyncLogDTO | null> {
    const data = await prisma.channelSyncLog.findUnique({
      where: { id },
    });

    if (!data) {
      return null;
    }

    return this.mapToDomain(data);
  }

  /**
   * Najdi vse log-e za property
   */
  async findByProperty(
    propertyId: string,
    limit?: number,
  ): Promise<ChannelSyncLogDTO[]> {
    const data = await prisma.channelSyncLog.findMany({
      where: { propertyId },
      orderBy: { createdAt: "desc" },
      take: limit || 50,
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Najdi zadnji uspešen sync
   */
  async findLastSuccessful(
    propertyId: string,
    channel?: string,
  ): Promise<ChannelSyncLogDTO | null> {
    const data = await prisma.channelSyncLog.findFirst({
      where: {
        propertyId,
        channel: channel ? channel : undefined,
        status: "completed",
      },
      orderBy: { completedAt: "desc" },
    });

    if (!data) {
      return null;
    }

    return this.mapToDomain(data);
  }

  /**
   * Ustvari nov sync log
   */
  async create(log: ChannelSyncLogDTO): Promise<void> {
    await prisma.channelSyncLog.create({
      data: {
        id: log.id,
        propertyId: log.propertyId,
        connectionId: log.connectionId,
        channel: log.channel,
        syncType: log.syncType,
        status: log.status,
        itemsSynced: log.itemsSynced,
        itemsFailed: log.itemsFailed,
        errors: log.errors || [],
        startedAt: log.startedAt,
        completedAt: log.completedAt,
        duration: log.duration,
        createdAt: log.createdAt,
      },
    });
  }

  /**
   * Posodobi sync log
   */
  async update(
    log: Partial<ChannelSyncLogDTO> & { id: string },
  ): Promise<void> {
    await prisma.channelSyncLog.update({
      where: { id: log.id },
      data: {
        status: log.status,
        itemsSynced: log.itemsSynced,
        itemsFailed: log.itemsFailed,
        errors: log.errors,
        completedAt: log.completedAt,
        duration: log.duration,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Izbriši stare log-e (older than 30 days)
   */
  async deleteOlderThan(days: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await prisma.channelSyncLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }

  /**
   * Pridobi statistiko sync-ov
   */
  async getStats(
    propertyId: string,
    days: number = 7,
  ): Promise<{
    totalSyncs: number;
    successfulSyncs: number;
    failedSyncs: number;
    averageDuration: number;
  }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const logs = await prisma.channelSyncLog.findMany({
      where: {
        propertyId,
        createdAt: {
          gte: cutoffDate,
        },
      },
    });

    const totalSyncs = logs.length;
    const successfulSyncs = logs.filter((l) => l.status === "completed").length;
    const failedSyncs = logs.filter((l) => l.status === "failed").length;
    const averageDuration =
      logs.reduce((sum, log) => sum + log.duration, 0) / (totalSyncs || 1);

    return {
      totalSyncs,
      successfulSyncs,
      failedSyncs,
      averageDuration: Math.round(averageDuration),
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Preslikaj Prisma data v Domain DTO
   */
  private mapToDomain(data: any): ChannelSyncLogDTO {
    return {
      id: data.id,
      propertyId: data.propertyId,
      connectionId: data.connectionId,
      channel: data.channel,
      syncType: data.syncType as any,
      status: data.status as any,
      itemsSynced: data.itemsSynced,
      itemsFailed: data.itemsFailed,
      errors: data.errors,
      startedAt: data.startedAt,
      completedAt: data.completedAt,
      duration: data.duration,
      createdAt: data.createdAt,
    };
  }
}
