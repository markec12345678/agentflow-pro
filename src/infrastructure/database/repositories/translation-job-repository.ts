/**
 * Infrastructure Implementation: Translation Job Repository
 *
 * Implementacija TranslationJobRepository interface-a z uporabo Prisma.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { TranslationJobRepository } from "@/core/ports/repositories";

export interface TranslationJobDTO {
  id: string;
  userId: string;
  sourceContent: string;
  sourceLang: string;
  targetLangs: string[];
  status: "pending" | "processing" | "completed" | "failed";
  results?: { [key: string]: string };
  createdAt: Date;
  completedAt?: Date;
}

export class TranslationJobRepositoryImpl implements TranslationJobRepository {
  /**
   * Najdi job po ID-ju
   */
  async findById(id: string): Promise<TranslationJobDTO | null> {
    const data = await prisma.translationJob.findUnique({
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
   * Najdi vse jobs za user-ja
   */
  async findByUser(
    userId: string,
    status?: string,
  ): Promise<TranslationJobDTO[]> {
    const where: any = { userId };

    if (status) {
      where.status = status;
    }

    const data = await prisma.translationJob.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Ustvari nov translation job
   */
  async create(
    job: Omit<TranslationJobDTO, "id" | "createdAt" | "completedAt">,
  ): Promise<TranslationJobDTO> {
    const data = await prisma.translationJob.create({
      data: {
        userId: job.userId,
        sourceContent: job.sourceContent,
        sourceLang: job.sourceLang,
        targetLangs: job.targetLangs,
        status: job.status,
        results: job.results,
      },
    });

    return this.mapToDomain(data);
  }

  /**
   * Posodobi status job-a
   */
  async updateStatus(
    id: string,
    status: string,
    results?: { [key: string]: string },
  ): Promise<void> {
    await prisma.translationJob.update({
      where: { id },
      data: {
        status,
        results,
        completedAt:
          status === "completed" || status === "failed"
            ? new Date()
            : undefined,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Označi job kot completed
   */
  async markAsCompleted(
    id: string,
    results: { [key: string]: string },
  ): Promise<void> {
    await prisma.translationJob.update({
      where: { id },
      data: {
        status: "completed",
        results,
        completedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Označi job kot failed
   */
  async markAsFailed(id: string, error?: string): Promise<void> {
    await prisma.translationJob.update({
      where: { id },
      data: {
        status: "failed",
        completedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Izbriši stare job-e
   */
  async deleteOlderThan(days: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await prisma.translationJob.deleteMany({
      where: {
        status: "completed",
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }

  /**
   * Pridobi statistiko translation jobs
   */
  async getStats(
    userId?: string,
    days: number = 30,
  ): Promise<{
    totalJobs: number;
    completedJobs: number;
    failedJobs: number;
    pendingJobs: number;
    averageCompletionTime: number; // hours
  }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const where: any = {
      createdAt: {
        gte: cutoffDate,
      },
    };

    if (userId) {
      where.userId = userId;
    }

    const jobs = await prisma.translationJob.findMany({
      where,
    });

    const totalJobs = jobs.length;
    const completedJobs = jobs.filter((j) => j.status === "completed").length;
    const failedJobs = jobs.filter((j) => j.status === "failed").length;
    const pendingJobs = jobs.filter((j) => j.status === "pending").length;

    const completedWithTime = jobs.filter((j) => j.completedAt);
    const totalCompletionTime = completedWithTime.reduce((sum, j) => {
      const time =
        (j.completedAt!.getTime() - j.createdAt.getTime()) / (1000 * 60 * 60); // hours
      return sum + time;
    }, 0);

    const averageCompletionTime =
      completedWithTime.length > 0
        ? totalCompletionTime / completedWithTime.length
        : 0;

    return {
      totalJobs,
      completedJobs,
      failedJobs,
      pendingJobs,
      averageCompletionTime: Math.round(averageCompletionTime * 10) / 10,
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Preslikaj Prisma data v Domain DTO
   */
  private mapToDomain(data: any): TranslationJobDTO {
    return {
      id: data.id,
      userId: data.userId,
      sourceContent: data.sourceContent,
      sourceLang: data.sourceLang,
      targetLangs: data.targetLangs,
      status: data.status as any,
      results: data.results,
      createdAt: data.createdAt,
      completedAt: data.completedAt,
    };
  }
}
