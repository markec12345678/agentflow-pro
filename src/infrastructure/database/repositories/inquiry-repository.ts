/**
 * Infrastructure Implementation: Inquiry Repository
 *
 * Implementacija InquiryRepository interface-a z uporabo Prisma.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { InquiryRepository } from "@/core/ports/repositories";

export interface InquiryDTO {
  id: string;
  propertyId?: string;
  guestId?: string;
  userId?: string;
  type: "general" | "booking" | "pricing" | "availability" | "other";
  subject: string;
  message: string;
  status: "pending" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  response?: string;
  respondedAt?: Date;
  respondedBy?: string;
  source: "email" | "phone" | "website" | "walk_in" | "other";
  createdAt: Date;
  updatedAt: Date;
}

export class InquiryRepositoryImpl implements InquiryRepository {
  /**
   * Najdi inquiry po ID-ju
   */
  async findById(id: string): Promise<InquiryDTO | null> {
    const data = await prisma.inquiry.findUnique({
      where: { id },
      include: {
        property: true,
        guest: true,
      },
    });

    if (!data) {
      return null;
    }

    return this.mapToDomain(data);
  }

  /**
   * Najdi vse inquiries za property
   */
  async findByProperty(
    propertyId: string,
    status?: string,
  ): Promise<InquiryDTO[]> {
    const where: any = { propertyId };

    if (status) {
      where.status = status;
    }

    const data = await prisma.inquiry.findMany({
      where,
      include: {
        property: true,
        guest: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Najdi inquiries po statusu
   */
  async findByStatus(status: string, limit?: number): Promise<InquiryDTO[]> {
    const data = await prisma.inquiry.findMany({
      where: { status },
      orderBy: { createdAt: "asc" },
      take: limit || 50,
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Ustvari nov inquiry
   */
  async create(
    inquiry: Omit<InquiryDTO, "id" | "createdAt" | "updatedAt">,
  ): Promise<InquiryDTO> {
    const data = await prisma.inquiry.create({
      data: {
        propertyId: inquiry.propertyId,
        guestId: inquiry.guestId,
        userId: inquiry.userId,
        type: inquiry.type,
        subject: inquiry.subject,
        message: inquiry.message,
        status: inquiry.status,
        priority: inquiry.priority,
        source: inquiry.source,
      },
      include: {
        property: true,
        guest: true,
      },
    });

    return this.mapToDomain(data);
  }

  /**
   * Posodobi inquiry
   */
  async update(id: string, inquiry: Partial<InquiryDTO>): Promise<void> {
    await prisma.inquiry.update({
      where: { id },
      data: {
        type: inquiry.type,
        subject: inquiry.subject,
        message: inquiry.message,
        status: inquiry.status,
        priority: inquiry.priority,
        response: inquiry.response,
        respondedAt: inquiry.respondedAt,
        respondedBy: inquiry.respondedBy,
        source: inquiry.source,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Označi inquiry kot resolved
   */
  async markAsResolved(
    id: string,
    response: string,
    respondedBy: string,
  ): Promise<void> {
    await prisma.inquiry.update({
      where: { id },
      data: {
        status: "resolved",
        response,
        respondedBy,
        respondedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Dodeli inquiry user-ju
   */
  async assignTo(id: string, userId: string): Promise<void> {
    await prisma.inquiry.update({
      where: { id },
      data: {
        userId,
        status: "in_progress",
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Izbriši stare resolved inquiries
   */
  async deleteOlderThan(days: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await prisma.inquiry.deleteMany({
      where: {
        status: "resolved",
        updatedAt: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }

  /**
   * Pridobi statistiko inquiries
   */
  async getStats(
    propertyId?: string,
    days: number = 30,
  ): Promise<{
    totalInquiries: number;
    pendingInquiries: number;
    resolvedInquiries: number;
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

    const inquiries = await prisma.inquiry.findMany({
      where,
    });

    const totalInquiries = inquiries.length;
    const pendingInquiries = inquiries.filter(
      (i) => i.status === "pending",
    ).length;
    const resolvedInquiries = inquiries.filter(
      (i) => i.status === "resolved",
    ).length;

    // Calculate average response time
    const respondedInquiries = inquiries.filter((i) => i.respondedAt);
    const totalResponseTime = respondedInquiries.reduce((sum, i) => {
      const responseTime =
        (i.respondedAt!.getTime() - i.createdAt.getTime()) / (1000 * 60 * 60); // hours
      return sum + responseTime;
    }, 0);

    const averageResponseTime =
      respondedInquiries.length > 0
        ? totalResponseTime / respondedInquiries.length
        : 0;

    return {
      totalInquiries,
      pendingInquiries,
      resolvedInquiries,
      averageResponseTime: Math.round(averageResponseTime * 10) / 10,
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Preslikaj Prisma data v Domain DTO
   */
  private mapToDomain(data: any): InquiryDTO {
    return {
      id: data.id,
      propertyId: data.propertyId,
      guestId: data.guestId,
      userId: data.userId,
      type: data.type as any,
      subject: data.subject,
      message: data.message,
      status: data.status as any,
      priority: data.priority as any,
      response: data.response,
      respondedAt: data.respondedAt,
      respondedBy: data.respondedBy,
      source: data.source as any,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
