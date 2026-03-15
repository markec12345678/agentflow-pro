/**
 * Infrastructure Implementation: Event Log Repository
 *
 * Implementacija EventLogRepository interface-a z uporabo Prisma.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { EventLogRepository } from "@/core/ports/repositories";

export interface EventLogDTO {
  id: string;
  eventId: string;
  type: string;
  aggregateId?: string;
  userId?: string;
  payload: any;
  metadata?: any;
  processed: boolean;
  error?: string;
  createdAt: Date;
  processedAt?: Date;
}

export class EventLogRepositoryImpl implements EventLogRepository {
  /**
   * Najdi log po ID-ju
   */
  async findById(id: string): Promise<EventLogDTO | null> {
    const data = await prisma.eventLog.findUnique({
      where: { id },
    });

    if (!data) {
      return null;
    }

    return this.mapToDomain(data);
  }

  /**
   * Najdi log-e po event ID-ju
   */
  async findByEventId(eventId: string): Promise<EventLogDTO | null> {
    const data = await prisma.eventLog.findUnique({
      where: { eventId },
    });

    if (!data) {
      return null;
    }

    return this.mapToDomain(data);
  }

  /**
   * Najdi log-e po aggregate ID-ju
   */
  async findByAggregateId(
    aggregateId: string,
    limit?: number,
  ): Promise<EventLogDTO[]> {
    const data = await prisma.eventLog.findMany({
      where: { aggregateId },
      orderBy: { createdAt: "desc" },
      take: limit || 50,
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Najdi log-e po tipu
   */
  async findByType(type: string, limit?: number): Promise<EventLogDTO[]> {
    const data = await prisma.eventLog.findMany({
      where: { type },
      orderBy: { createdAt: "desc" },
      take: limit || 50,
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Najdi neprocesirane log-e
   */
  async findUnprocessed(limit?: number): Promise<EventLogDTO[]> {
    const data = await prisma.eventLog.findMany({
      where: {
        processed: false,
      },
      orderBy: { createdAt: "asc" },
      take: limit || 100,
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Shrani nov log
   */
  async save(log: Omit<EventLogDTO, "id" | "createdAt">): Promise<EventLogDTO> {
    const data = await prisma.eventLog.create({
      data: {
        eventId: log.eventId,
        type: log.type,
        aggregateId: log.aggregateId,
        userId: log.userId,
        payload: log.payload,
        metadata: log.metadata,
        processed: log.processed,
        error: log.error,
      },
    });

    return this.mapToDomain(data);
  }

  /**
   * Označi log kot procesiran
   */
  async markAsProcessed(id: string): Promise<void> {
    await prisma.eventLog.update({
      where: { id },
      data: {
        processed: true,
        processedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Označi log kot failed
   */
  async markAsFailed(id: string, error: string): Promise<void> {
    await prisma.eventLog.update({
      where: { id },
      data: {
        processed: true,
        error,
        processedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Izbriši stare procesirane log-e
   */
  async deleteOlderThan(days: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await prisma.eventLog.deleteMany({
      where: {
        processed: true,
        processedAt: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }

  /**
   * Pridobi statistiko event log-ov
   */
  async getStats(type?: string): Promise<{
    totalLogs: number;
    processedLogs: number;
    failedLogs: number;
    unprocessedLogs: number;
    processingRate: number;
    logsByType: { [key: string]: number };
  }> {
    const where = type ? { type } : {};

    const logs = await prisma.eventLog.findMany({
      where,
    });

    const totalLogs = logs.length;
    const processedLogs = logs.filter((l) => l.processed && !l.error).length;
    const failedLogs = logs.filter((l) => l.processed && l.error).length;
    const unprocessedLogs = logs.filter((l) => !l.processed).length;

    const processingRate =
      totalLogs > 0 ? (processedLogs / totalLogs) * 100 : 0;

    const logsByType: { [key: string]: number } = {};
    logs.forEach((l) => {
      logsByType[l.type] = (logsByType[l.type] || 0) + 1;
    });

    return {
      totalLogs,
      processedLogs,
      failedLogs,
      unprocessedLogs,
      processingRate: Math.round(processingRate * 100) / 100,
      logsByType,
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Preslikaj Prisma data v Domain DTO
   */
  private mapToDomain(data: any): EventLogDTO {
    return {
      id: data.id,
      eventId: data.eventId,
      type: data.type,
      aggregateId: data.aggregateId,
      userId: data.userId,
      payload: data.payload,
      metadata: data.metadata,
      processed: data.processed,
      error: data.error,
      createdAt: data.createdAt,
      processedAt: data.processedAt,
    };
  }
}
