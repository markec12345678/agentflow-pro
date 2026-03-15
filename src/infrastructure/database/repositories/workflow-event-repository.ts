/**
 * Infrastructure Implementation: Workflow Event Repository
 *
 * Implementacija WorkflowEventRepository interface-a z uporabo Prisma.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { WorkflowEventRepository } from "@/core/ports/repositories";

export interface WorkflowEventDTO {
  id: string;
  eventId: string;
  aggregateId: string;
  aggregateType: string;
  type: string;
  payload: any;
  version: number;
  metadata?: any;
  occurredAt: Date;
  createdAt: Date;
}

export class WorkflowEventRepositoryImpl implements WorkflowEventRepository {
  /**
   * Najdi event po ID-ju
   */
  async findById(id: string): Promise<WorkflowEventDTO | null> {
    const data = await prisma.workflowEvent.findUnique({
      where: { id },
    });

    if (!data) {
      return null;
    }

    return this.mapToDomain(data);
  }

  /**
   * Najdi event-e po aggregate ID-ju
   */
  async findByAggregateId(
    aggregateId: string,
    version?: number,
  ): Promise<WorkflowEventDTO[]> {
    const where: any = { aggregateId };

    if (version) {
      where.version = version;
    }

    const data = await prisma.workflowEvent.findMany({
      where,
      orderBy: { version: "asc" },
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Najdi event-e po tipu
   */
  async findByType(type: string, limit?: number): Promise<WorkflowEventDTO[]> {
    const data = await prisma.workflowEvent.findMany({
      where: { type },
      orderBy: { occurredAt: "desc" },
      take: limit || 50,
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Shrani nov event
   */
  async save(
    event: Omit<WorkflowEventDTO, "id" | "createdAt">,
  ): Promise<WorkflowEventDTO> {
    const data = await prisma.workflowEvent.create({
      data: {
        eventId: event.eventId,
        aggregateId: event.aggregateId,
        aggregateType: event.aggregateType,
        type: event.type,
        payload: event.payload,
        version: event.version,
        metadata: event.metadata,
        occurredAt: event.occurredAt,
      },
    });

    return this.mapToDomain(data);
  }

  /**
   * Shrani več event-ov hkrati (batch)
   */
  async saveMany(
    events: Array<Omit<WorkflowEventDTO, "id" | "createdAt">>,
  ): Promise<WorkflowEventDTO[]> {
    const created = await prisma.workflowEvent.createMany({
      data: events.map((e) => ({
        eventId: e.eventId,
        aggregateId: e.aggregateId,
        aggregateType: e.aggregateType,
        type: e.type,
        payload: e.payload,
        version: e.version,
        metadata: e.metadata,
        occurredAt: e.occurredAt,
      })),
    });

    return events.map((e, i) => ({
      ...e,
      id: `event_${i}`,
      createdAt: new Date(),
    }));
  }

  /**
   * Pridobi zadnji event za aggregate
   */
  async findLatestByAggregate(
    aggregateId: string,
  ): Promise<WorkflowEventDTO | null> {
    const data = await prisma.workflowEvent.findFirst({
      where: { aggregateId },
      orderBy: { version: "desc" },
    });

    if (!data) {
      return null;
    }

    return this.mapToDomain(data);
  }

  /**
   * Izbriši stare event-e
   */
  async deleteOlderThan(days: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await prisma.workflowEvent.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }

  /**
   * Pridobi statistiko event-ov
   */
  async getStats(aggregateId?: string): Promise<{
    totalEvents: number;
    eventsByType: { [key: string]: number };
    averageEventsPerAggregate: number;
    newestEventAt?: Date;
    oldestEventAt?: Date;
  }> {
    const where = aggregateId ? { aggregateId } : {};

    const events = await prisma.workflowEvent.findMany({
      where,
      select: {
        type: true,
        aggregateId: true,
        occurredAt: true,
      },
    });

    const totalEvents = events.length;

    const eventsByType: { [key: string]: number } = {};
    const aggregates = new Set<string>();
    let newestEventAt: Date | undefined;
    let oldestEventAt: Date | undefined;

    events.forEach((e) => {
      eventsByType[e.type] = (eventsByType[e.type] || 0) + 1;
      aggregates.add(e.aggregateId);

      if (!newestEventAt || e.occurredAt > newestEventAt) {
        newestEventAt = e.occurredAt;
      }

      if (!oldestEventAt || e.occurredAt < oldestEventAt) {
        oldestEventAt = e.occurredAt;
      }
    });

    const averageEventsPerAggregate =
      aggregates.size > 0 ? totalEvents / aggregates.size : 0;

    return {
      totalEvents,
      eventsByType,
      averageEventsPerAggregate:
        Math.round(averageEventsPerAggregate * 10) / 10,
      newestEventAt,
      oldestEventAt,
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Preslikaj Prisma data v Domain DTO
   */
  private mapToDomain(data: any): WorkflowEventDTO {
    return {
      id: data.id,
      eventId: data.eventId,
      aggregateId: data.aggregateId,
      aggregateType: data.aggregateType,
      type: data.type,
      payload: data.payload,
      version: data.version,
      metadata: data.metadata,
      occurredAt: data.occurredAt,
      createdAt: data.createdAt,
    };
  }
}
