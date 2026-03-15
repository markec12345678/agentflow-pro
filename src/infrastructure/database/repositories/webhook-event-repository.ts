/**
 * Infrastructure Implementation: Webhook Event Repository
 *
 * Implementacija WebhookEventRepository interface-a z uporabo Prisma.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { WebhookEventRepository } from "@/core/ports/repositories";

export interface WebhookEventDTO {
  id: string;
  propertyId?: string;
  channel: string;
  eventType: string;
  payload: any;
  signature?: string;
  status: "pending" | "processing" | "processed" | "failed";
  processedAt?: Date;
  error?: string;
  retryCount: number;
  maxRetries: number;
  nextRetryAt?: Date;
  createdAt: Date;
}

export class WebhookEventRepositoryImpl implements WebhookEventRepository {
  /**
   * Najdi event po ID-ju
   */
  async findById(id: string): Promise<WebhookEventDTO | null> {
    const data = await prisma.webhookEvent.findUnique({
      where: { id },
    });

    if (!data) {
      return null;
    }

    return this.mapToDomain(data);
  }

  /**
   * Najdi vse event-e za property
   */
  async findByProperty(
    propertyId: string,
    limit?: number,
  ): Promise<WebhookEventDTO[]> {
    const data = await prisma.webhookEvent.findMany({
      where: { propertyId },
      orderBy: { createdAt: "desc" },
      take: limit || 50,
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Najdi event-e po statusu
   */
  async findByStatus(
    status: "pending" | "processing" | "processed" | "failed",
    limit?: number,
  ): Promise<WebhookEventDTO[]> {
    const data = await prisma.webhookEvent.findMany({
      where: { status },
      orderBy: { createdAt: "asc" },
      take: limit || 100,
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Ustvari nov webhook event
   */
  async create(event: WebhookEventDTO): Promise<void> {
    await prisma.webhookEvent.create({
      data: {
        id: event.id,
        propertyId: event.propertyId,
        channel: event.channel,
        eventType: event.eventType,
        payload: event.payload,
        signature: event.signature,
        status: event.status,
        retryCount: event.retryCount,
        maxRetries: event.maxRetries,
        nextRetryAt: event.nextRetryAt,
        createdAt: event.createdAt,
      },
    });
  }

  /**
   * Označi event kot procesiran
   */
  async markAsProcessed(id: string): Promise<void> {
    await prisma.webhookEvent.update({
      where: { id },
      data: {
        status: "processed",
        processedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Označi event kot failed
   */
  async markAsFailed(id: string, error: string): Promise<void> {
    await prisma.webhookEvent.update({
      where: { id },
      data: {
        status: "failed",
        error,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Povečaj retry count
   */
  async incrementRetry(id: string, nextRetryAt?: Date): Promise<void> {
    await prisma.webhookEvent.update({
      where: { id },
      data: {
        retryCount: { increment: 1 },
        nextRetryAt,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Izbriši stare event-e
   */
  async deleteOlderThan(days: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await prisma.webhookEvent.deleteMany({
      where: {
        status: "processed",
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }

  /**
   * Pridobi statistiko webhook event-ov
   */
  async getStats(days: number = 7): Promise<{
    totalEvents: number;
    pendingEvents: number;
    processedEvents: number;
    failedEvents: number;
  }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const events = await prisma.webhookEvent.findMany({
      where: {
        createdAt: {
          gte: cutoffDate,
        },
      },
    });

    return {
      totalEvents: events.length,
      pendingEvents: events.filter((e) => e.status === "pending").length,
      processedEvents: events.filter((e) => e.status === "processed").length,
      failedEvents: events.filter((e) => e.status === "failed").length,
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Preslikaj Prisma data v Domain DTO
   */
  private mapToDomain(data: any): WebhookEventDTO {
    return {
      id: data.id,
      propertyId: data.propertyId,
      channel: data.channel,
      eventType: data.eventType,
      payload: data.payload,
      signature: data.signature,
      status: data.status as any,
      processedAt: data.processedAt,
      error: data.error,
      retryCount: data.retryCount,
      maxRetries: data.maxRetries,
      nextRetryAt: data.nextRetryAt,
      createdAt: data.createdAt,
    };
  }
}
