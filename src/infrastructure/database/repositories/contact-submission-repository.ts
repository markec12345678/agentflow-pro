/**
 * Infrastructure Implementation: Contact Submission Repository
 *
 * Implementacija ContactSubmissionRepository interface-a z uporabo Prisma.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { ContactSubmissionRepository } from "@/core/ports/repositories";

export interface ContactSubmissionDTO {
  id: string;
  name: string;
  email: string;
  company?: string;
  plan?: string;
  message: string;
  status: "new" | "contacted" | "qualified" | "converted" | "rejected";
  notes?: string;
  respondedAt?: Date;
  respondedBy?: string;
  createdAt: Date;
}

export class ContactSubmissionRepositoryImpl implements ContactSubmissionRepository {
  /**
   * Najdi submission po ID-ju
   */
  async findById(id: string): Promise<ContactSubmissionDTO | null> {
    const data = await prisma.contactSubmission.findUnique({
      where: { id },
    });

    if (!data) {
      return null;
    }

    return this.mapToDomain(data);
  }

  /**
   * Najdi vse submissions
   */
  async findAll(
    status?: string,
    limit?: number,
  ): Promise<ContactSubmissionDTO[]> {
    const where: any = {};

    if (status) {
      where.status = status;
    }

    const data = await prisma.contactSubmission.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit || 50,
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Ustvari novo submission
   */
  async create(
    submission: Omit<ContactSubmissionDTO, "id" | "createdAt" | "status">,
  ): Promise<ContactSubmissionDTO> {
    const data = await prisma.contactSubmission.create({
      data: {
        name: submission.name,
        email: submission.email,
        company: submission.company,
        plan: submission.plan,
        message: submission.message,
      },
    });

    return this.mapToDomain(data);
  }

  /**
   * Posodobi submission
   */
  async update(
    id: string,
    submission: Partial<ContactSubmissionDTO>,
  ): Promise<void> {
    await prisma.contactSubmission.update({
      where: { id },
      data: {
        status: submission.status,
        notes: submission.notes,
        respondedAt: submission.respondedAt,
        respondedBy: submission.respondedBy,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Označi submission kot contacted
   */
  async markAsContacted(
    id: string,
    respondedBy: string,
    notes?: string,
  ): Promise<void> {
    await prisma.contactSubmission.update({
      where: { id },
      data: {
        status: "contacted",
        notes,
        respondedBy,
        respondedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Označi submission kot qualified
   */
  async markAsQualified(id: string): Promise<void> {
    await prisma.contactSubmission.update({
      where: { id },
      data: {
        status: "qualified",
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Označi submission kot converted
   */
  async markAsConverted(id: string): Promise<void> {
    await prisma.contactSubmission.update({
      where: { id },
      data: {
        status: "converted",
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Izbriši stare submissions
   */
  async deleteOlderThan(days: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await prisma.contactSubmission.deleteMany({
      where: {
        status: "converted",
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }

  /**
   * Pridobi statistiko submissions
   */
  async getStats(days: number = 30): Promise<{
    totalSubmissions: number;
    newSubmissions: number;
    contactedSubmissions: number;
    qualifiedSubmissions: number;
    convertedSubmissions: number;
    conversionRate: number;
  }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const submissions = await prisma.contactSubmission.findMany({
      where: {
        createdAt: {
          gte: cutoffDate,
        },
      },
    });

    const totalSubmissions = submissions.length;
    const newSubmissions = submissions.filter((s) => s.status === "new").length;
    const contactedSubmissions = submissions.filter(
      (s) => s.status === "contacted",
    ).length;
    const qualifiedSubmissions = submissions.filter(
      (s) => s.status === "qualified",
    ).length;
    const convertedSubmissions = submissions.filter(
      (s) => s.status === "converted",
    ).length;

    const conversionRate =
      totalSubmissions > 0
        ? (convertedSubmissions / totalSubmissions) * 100
        : 0;

    return {
      totalSubmissions,
      newSubmissions,
      contactedSubmissions,
      qualifiedSubmissions,
      convertedSubmissions,
      conversionRate: Math.round(conversionRate * 100) / 100,
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Preslikaj Prisma data v Domain DTO
   */
  private mapToDomain(data: any): ContactSubmissionDTO {
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      company: data.company,
      plan: data.plan,
      message: data.message,
      status: data.status as any,
      notes: data.notes,
      respondedAt: data.respondedAt,
      respondedBy: data.respondedBy,
      createdAt: data.createdAt,
    };
  }
}
