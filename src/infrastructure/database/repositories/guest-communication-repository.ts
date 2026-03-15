/**
 * Infrastructure Implementation: Guest Communication Repository
 *
 * Implementacija GuestCommunicationRepository interface-a z uporabo Prisma.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { GuestCommunicationRepository } from "@/core/ports/repositories";

export interface GuestCommunicationDTO {
  id: string;
  propertyId: string;
  guestId?: string;
  reservationId?: string;
  type: "email" | "sms" | "whatsapp" | "phone" | "chat" | "other";
  direction: "inbound" | "outbound";
  subject?: string;
  message: string;
  status: "draft" | "sent" | "delivered" | "read" | "failed";
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  metadata?: any;
  createdAt: Date;
}

export class GuestCommunicationRepositoryImpl implements GuestCommunicationRepository {
  /**
   * Najdi communication po ID-ju
   */
  async findById(id: string): Promise<GuestCommunicationDTO | null> {
    const data = await prisma.guestCommunication.findUnique({
      where: { id },
      include: {
        property: true,
        guest: true,
        reservation: true,
      },
    });

    if (!data) {
      return null;
    }

    return this.mapToDomain(data);
  }

  /**
   * Najdi vse communications za property
   */
  async findByProperty(
    propertyId: string,
    limit?: number,
  ): Promise<GuestCommunicationDTO[]> {
    const data = await prisma.guestCommunication.findMany({
      where: { propertyId },
      include: {
        guest: true,
        reservation: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit || 50,
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Najdi communications za gosta
   */
  async findByGuest(
    guestId: string,
    limit?: number,
  ): Promise<GuestCommunicationDTO[]> {
    const data = await prisma.guestCommunication.findMany({
      where: { guestId },
      include: {
        property: true,
        reservation: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit || 50,
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Najdi communications za rezervacijo
   */
  async findByReservation(
    reservationId: string,
  ): Promise<GuestCommunicationDTO[]> {
    const data = await prisma.guestCommunication.findMany({
      where: { reservationId },
      include: {
        guest: true,
        property: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Ustvari novo communication
   */
  async create(
    communication: Omit<GuestCommunicationDTO, "id" | "createdAt">,
  ): Promise<GuestCommunicationDTO> {
    const data = await prisma.guestCommunication.create({
      data: {
        propertyId: communication.propertyId,
        guestId: communication.guestId,
        reservationId: communication.reservationId,
        type: communication.type,
        direction: communication.direction,
        subject: communication.subject,
        message: communication.message,
        status: communication.status,
        sentAt: communication.sentAt,
        deliveredAt: communication.deliveredAt,
        readAt: communication.readAt,
        metadata: communication.metadata,
      },
      include: {
        guest: true,
      },
    });

    return this.mapToDomain(data);
  }

  /**
   * Posodobi status
   */
  async updateStatus(
    id: string,
    status: string,
    deliveredAt?: Date,
    readAt?: Date,
  ): Promise<void> {
    await prisma.guestCommunication.update({
      where: { id },
      data: {
        status,
        deliveredAt,
        readAt,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Označi kot sent
   */
  async markAsSent(id: string): Promise<void> {
    await prisma.guestCommunication.update({
      where: { id },
      data: {
        status: "sent",
        sentAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Označi kot delivered
   */
  async markAsDelivered(id: string): Promise<void> {
    await prisma.guestCommunication.update({
      where: { id },
      data: {
        status: "delivered",
        deliveredAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Označi kot read
   */
  async markAsRead(id: string): Promise<void> {
    await prisma.guestCommunication.update({
      where: { id },
      data: {
        status: "read",
        readAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Označi kot failed
   */
  async markAsFailed(id: string): Promise<void> {
    await prisma.guestCommunication.update({
      where: { id },
      data: {
        status: "failed",
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Izbriši stare communications
   */
  async deleteOlderThan(days: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await prisma.guestCommunication.deleteMany({
      where: {
        status: "read",
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }

  /**
   * Pridobi statistiko communications
   */
  async getStats(
    propertyId?: string,
    days: number = 30,
  ): Promise<{
    totalCommunications: number;
    inboundCommunications: number;
    outboundCommunications: number;
    byType: { [key: string]: number };
    averageResponseTime: number; // hours
  }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const where: any = {
      createdAt: {
        gte: cutoffDate,
      },
    };

    if (propertyId) {
      where.propertyId = propertyId;
    }

    const communications = await prisma.guestCommunication.findMany({
      where,
    });

    const totalCommunications = communications.length;
    const inboundCommunications = communications.filter(
      (c) => c.direction === "inbound",
    ).length;
    const outboundCommunications = communications.filter(
      (c) => c.direction === "outbound",
    ).length;

    const byType: { [key: string]: number } = {};
    communications.forEach((c) => {
      byType[c.type] = (byType[c.type] || 0) + 1;
    });

    // Calculate average response time (time between inbound and outbound)
    const inboundGroups: { [key: string]: typeof communications } = {};
    communications
      .filter((c) => c.direction === "inbound")
      .forEach((c) => {
        const key = `${c.propertyId}-${c.guestId || "unknown"}`;
        if (!inboundGroups[key]) inboundGroups[key] = [];
        inboundGroups[key].push(c);
      });

    let totalResponseTime = 0;
    let responseCount = 0;

    Object.values(inboundGroups).forEach((inbounds) => {
      inbounds.forEach((inbound) => {
        const outbound = communications.find(
          (o) =>
            o.direction === "outbound" &&
            o.propertyId === inbound.propertyId &&
            o.createdAt > inbound.createdAt,
        );

        if (outbound) {
          const responseTime =
            (outbound.createdAt.getTime() - inbound.createdAt.getTime()) /
            (1000 * 60 * 60);
          totalResponseTime += responseTime;
          responseCount++;
        }
      });
    });

    const averageResponseTime =
      responseCount > 0 ? totalResponseTime / responseCount : 0;

    return {
      totalCommunications,
      inboundCommunications,
      outboundCommunications,
      byType,
      averageResponseTime: Math.round(averageResponseTime * 10) / 10,
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Preslikaj Prisma data v Domain DTO
   */
  private mapToDomain(data: any): GuestCommunicationDTO {
    return {
      id: data.id,
      propertyId: data.propertyId,
      guestId: data.guestId,
      reservationId: data.reservationId,
      type: data.type as any,
      direction: data.direction as any,
      subject: data.subject,
      message: data.message,
      status: data.status as any,
      sentAt: data.sentAt,
      deliveredAt: data.deliveredAt,
      readAt: data.readAt,
      metadata: data.metadata,
      createdAt: data.createdAt,
    };
  }
}
