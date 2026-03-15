/**
 * Infrastructure Implementation: Analytics Daily Stats Repository
 *
 * Implementacija AnalyticsDailyStatsRepository interface-a z uporabo Prisma.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { AnalyticsDailyStatsRepository } from "@/core/ports/repositories";

export interface AnalyticsDailyStatsDTO {
  id: string;
  date: Date;
  totalRuns: number;
  completedRuns: number;
  failedRuns: number;
  totalDuration: number; // milliseconds
  totalTokens: number;
  createdAt: Date;
  updatedAt: Date;
}

export class AnalyticsDailyStatsRepositoryImpl implements AnalyticsDailyStatsRepository {
  /**
   * Najdi stats po datumu
   */
  async findByDate(date: Date): Promise<AnalyticsDailyStatsDTO | null> {
    const data = await prisma.analyticsDailyStats.findUnique({
      where: { date },
    });

    if (!data) {
      return null;
    }

    return this.mapToDomain(data);
  }

  /**
   * Najdi stats za date range
   */
  async findByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<AnalyticsDailyStatsDTO[]> {
    const data = await prisma.analyticsDailyStats.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: "asc" },
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Shrani stats (create ali update)
   */
  async save(
    stats: Omit<AnalyticsDailyStatsDTO, "id" | "createdAt" | "updatedAt">,
  ): Promise<AnalyticsDailyStatsDTO> {
    const data = await prisma.analyticsDailyStats.upsert({
      where: {
        date: stats.date,
      },
      update: {
        totalRuns: stats.totalRuns,
        completedRuns: stats.completedRuns,
        failedRuns: stats.failedRuns,
        totalDuration: stats.totalDuration,
        totalTokens: stats.totalTokens,
        updatedAt: new Date(),
      },
      create: {
        date: stats.date,
        totalRuns: stats.totalRuns,
        completedRuns: stats.completedRuns,
        failedRuns: stats.failedRuns,
        totalDuration: stats.totalDuration,
        totalTokens: stats.totalTokens,
      },
    });

    return this.mapToDomain(data);
  }

  /**
   * Incrementaj dnevne stats
   */
  async incrementStats(
    date: Date,
    runs: number,
    completed: number,
    failed: number,
    duration: number,
    tokens: number,
  ): Promise<void> {
    const stats = await this.findByDate(date);

    if (stats) {
      await this.save({
        date,
        totalRuns: stats.totalRuns + runs,
        completedRuns: stats.completedRuns + completed,
        failedRuns: stats.failedRuns + failed,
        totalDuration: stats.totalDuration + duration,
        totalTokens: stats.totalTokens + tokens,
      });
    } else {
      await this.save({
        date,
        totalRuns: runs,
        completedRuns: completed,
        failedRuns: failed,
        totalDuration: duration,
        totalTokens: tokens,
      });
    }
  }

  /**
   * Pridobi statistiko za mesec
   */
  async getMonthlyStats(
    year: number,
    month: number,
  ): Promise<{
    totalRuns: number;
    totalCompletedRuns: number;
    totalFailedRuns: number;
    averageDailyRuns: number;
    successRate: number;
    totalDuration: number;
    totalTokens: number;
  }> {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);

    const stats = await this.findByDateRange(startDate, endDate);

    const totalRuns = stats.reduce((sum, s) => sum + s.totalRuns, 0);
    const totalCompletedRuns = stats.reduce(
      (sum, s) => sum + s.completedRuns,
      0,
    );
    const totalFailedRuns = stats.reduce((sum, s) => sum + s.failedRuns, 0);
    const totalDuration = stats.reduce((sum, s) => sum + s.totalDuration, 0);
    const totalTokens = stats.reduce((sum, s) => sum + s.totalTokens, 0);

    const averageDailyRuns = stats.length > 0 ? totalRuns / stats.length : 0;
    const successRate =
      totalRuns > 0 ? (totalCompletedRuns / totalRuns) * 100 : 0;

    return {
      totalRuns,
      totalCompletedRuns,
      totalFailedRuns,
      averageDailyRuns: Math.round(averageDailyRuns * 10) / 10,
      successRate: Math.round(successRate * 100) / 100,
      totalDuration,
      totalTokens,
    };
  }

  /**
   * Pridobi trend stats
   */
  async getTrend(days: number = 30): Promise<{
    trend: "up" | "down" | "stable";
    changePercent: number;
    averageRuns: number;
  }> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await this.findByDateRange(startDate, endDate);

    if (stats.length < 2) {
      return {
        trend: "stable",
        changePercent: 0,
        averageRuns: 0,
      };
    }

    const firstHalf = stats.slice(0, Math.floor(stats.length / 2));
    const secondHalf = stats.slice(Math.floor(stats.length / 2));

    const firstHalfRuns = firstHalf.reduce((sum, s) => sum + s.totalRuns, 0);
    const secondHalfRuns = secondHalf.reduce((sum, s) => sum + s.totalRuns, 0);

    const changePercent =
      firstHalfRuns > 0
        ? ((secondHalfRuns - firstHalfRuns) / firstHalfRuns) * 100
        : 0;
    const trend: "up" | "down" | "stable" =
      changePercent > 10 ? "up" : changePercent < -10 ? "down" : "stable";

    const totalRuns = stats.reduce((sum, s) => sum + s.totalRuns, 0);
    const averageRuns = stats.length > 0 ? totalRuns / stats.length : 0;

    return {
      trend,
      changePercent: Math.round(changePercent * 100) / 100,
      averageRuns: Math.round(averageRuns),
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Preslikaj Prisma data v Domain DTO
   */
  private mapToDomain(data: any): AnalyticsDailyStatsDTO {
    return {
      id: data.id,
      date: data.date,
      totalRuns: data.totalRuns,
      completedRuns: data.completedRuns,
      failedRuns: data.failedRuns,
      totalDuration: data.totalDuration,
      totalTokens: data.totalTokens,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
