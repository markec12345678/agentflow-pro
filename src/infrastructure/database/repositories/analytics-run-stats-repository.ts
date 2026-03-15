/**
 * Infrastructure Implementation: Analytics Run Stats Repository
 *
 * Implementacija AnalyticsRunStatsRepository interface-a z uporabo Prisma.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { AnalyticsRunStatsRepository } from "@/core/ports/repositories";

export interface AnalyticsRunStatsDTO {
  id: string;
  workflowId: string;
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  avgDuration: number; // milliseconds
  avgTokens: number;
  lastRunAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class AnalyticsRunStatsRepositoryImpl implements AnalyticsRunStatsRepository {
  /**
   * Najdi stats po workflow ID-ju
   */
  async findByWorkflow(
    workflowId: string,
  ): Promise<AnalyticsRunStatsDTO | null> {
    const data = await prisma.analyticsRunStats.findUnique({
      where: { workflowId },
    });

    if (!data) {
      return null;
    }

    return this.mapToDomain(data);
  }

  /**
   * Najdi vse stats
   */
  async findAll(): Promise<AnalyticsRunStatsDTO[]> {
    const data = await prisma.analyticsRunStats.findMany({
      orderBy: { totalRuns: "desc" },
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Shrani stats (create ali update)
   */
  async save(
    stats: Omit<AnalyticsRunStatsDTO, "id" | "createdAt" | "updatedAt">,
  ): Promise<AnalyticsRunStatsDTO> {
    const data = await prisma.analyticsRunStats.upsert({
      where: {
        workflowId: stats.workflowId,
      },
      update: {
        totalRuns: stats.totalRuns,
        successfulRuns: stats.successfulRuns,
        failedRuns: stats.failedRuns,
        avgDuration: stats.avgDuration,
        avgTokens: stats.avgTokens,
        lastRunAt: stats.lastRunAt,
        updatedAt: new Date(),
      },
      create: {
        workflowId: stats.workflowId,
        totalRuns: stats.totalRuns,
        successfulRuns: stats.successfulRuns,
        failedRuns: stats.failedRuns,
        avgDuration: stats.avgDuration,
        avgTokens: stats.avgTokens,
        lastRunAt: stats.lastRunAt,
      },
    });

    return this.mapToDomain(data);
  }

  /**
   * Incrementaj run count
   */
  async incrementRun(
    workflowId: string,
    success: boolean,
    duration: number,
    tokens: number,
  ): Promise<void> {
    const stats = await this.findByWorkflow(workflowId);

    if (stats) {
      const newTotalRuns = stats.totalRuns + 1;
      const newSuccessfulRuns = stats.successfulRuns + (success ? 1 : 0);
      const newFailedRuns = stats.failedRuns + (success ? 0 : 1);
      const newAvgDuration =
        (stats.avgDuration * stats.totalRuns + duration) / newTotalRuns;
      const newAvgTokens =
        (stats.avgTokens * stats.totalRuns + tokens) / newTotalRuns;

      await this.save({
        workflowId,
        totalRuns: newTotalRuns,
        successfulRuns: newSuccessfulRuns,
        failedRuns: newFailedRuns,
        avgDuration: Math.round(newAvgDuration),
        avgTokens: Math.round(newAvgTokens),
        lastRunAt: new Date(),
      });
    } else {
      await this.save({
        workflowId,
        totalRuns: 1,
        successfulRuns: success ? 1 : 0,
        failedRuns: success ? 0 : 1,
        avgDuration: duration,
        avgTokens: tokens,
        lastRunAt: new Date(),
      });
    }
  }

  /**
   * Izbriši stats
   */
  async delete(workflowId: string): Promise<void> {
    await prisma.analyticsRunStats.deleteMany({
      where: { workflowId },
    });
  }

  /**
   * Pridobi statistiko vseh workflow-ov
   */
  async getOverallStats(): Promise<{
    totalWorkflows: number;
    totalRuns: number;
    totalSuccessfulRuns: number;
    totalFailedRuns: number;
    overallSuccessRate: number;
    averageDuration: number;
    averageTokens: number;
  }> {
    const stats = await this.findAll();

    const totalWorkflows = stats.length;
    const totalRuns = stats.reduce((sum, s) => sum + s.totalRuns, 0);
    const totalSuccessfulRuns = stats.reduce(
      (sum, s) => sum + s.successfulRuns,
      0,
    );
    const totalFailedRuns = stats.reduce((sum, s) => sum + s.failedRuns, 0);

    const overallSuccessRate =
      totalRuns > 0 ? (totalSuccessfulRuns / totalRuns) * 100 : 0;

    const workflowsWithDuration = stats.filter((s) => s.avgDuration > 0);
    const totalDuration = workflowsWithDuration.reduce(
      (sum, s) => sum + s.avgDuration,
      0,
    );
    const averageDuration =
      workflowsWithDuration.length > 0
        ? totalDuration / workflowsWithDuration.length
        : 0;

    const workflowsWithTokens = stats.filter((s) => s.avgTokens > 0);
    const totalTokens = workflowsWithTokens.reduce(
      (sum, s) => sum + s.avgTokens,
      0,
    );
    const averageTokens =
      workflowsWithTokens.length > 0
        ? totalTokens / workflowsWithTokens.length
        : 0;

    return {
      totalWorkflows,
      totalRuns,
      totalSuccessfulRuns,
      totalFailedRuns,
      overallSuccessRate: Math.round(overallSuccessRate * 100) / 100,
      averageDuration: Math.round(averageDuration),
      averageTokens: Math.round(averageTokens),
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Preslikaj Prisma data v Domain DTO
   */
  private mapToDomain(data: any): AnalyticsRunStatsDTO {
    return {
      id: data.id,
      workflowId: data.workflowId,
      totalRuns: data.totalRuns,
      successfulRuns: data.successfulRuns,
      failedRuns: data.failedRuns,
      avgDuration: data.avgDuration,
      avgTokens: data.avgTokens,
      lastRunAt: data.lastRunAt,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
