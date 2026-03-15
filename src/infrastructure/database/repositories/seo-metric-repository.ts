/**
 * Infrastructure Implementation: SEO Metric Repository
 *
 * Implementacija SeoMetricRepository interface-a z uporabo Prisma.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { SeoMetricRepository } from "@/core/ports/repositories";

export interface SeoMetricDTO {
  id: string;
  userId: string;
  propertyId?: string;
  contentId?: string;
  contentType: string;
  keyword: string;
  position?: number;
  searchVolume?: number;
  difficulty?: number;
  clicks?: number;
  impressions?: number;
  date?: Date;
  lastChecked?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class SeoMetricRepositoryImpl implements SeoMetricRepository {
  /**
   * Najdi SEO metrike po property-ju
   */
  async findByProperty(
    propertyId: string,
    keyword?: string,
  ): Promise<SeoMetricDTO[]> {
    const where: any = { propertyId };

    if (keyword) {
      where.keyword = keyword;
    }

    const data = await prisma.seoMetric.findMany({
      where,
      orderBy: [{ position: "asc" }, { keyword: "asc" }],
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Najdi SEO metrike po keyword-u
   */
  async findByKeyword(keyword: string): Promise<SeoMetricDTO[]> {
    const data = await prisma.seoMetric.findMany({
      where: { keyword },
      include: {
        property: true,
      },
      orderBy: { position: "asc" },
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Shrani SEO metrika
   */
  async save(metric: SeoMetricDTO): Promise<void> {
    await prisma.seoMetric.upsert({
      where: { id: metric.id },
      update: {
        position: metric.position,
        searchVolume: metric.searchVolume,
        difficulty: metric.difficulty,
        clicks: metric.clicks,
        impressions: metric.impressions,
        lastChecked: new Date(),
        updatedAt: new Date(),
      },
      create: {
        id: metric.id,
        userId: metric.userId,
        propertyId: metric.propertyId,
        contentId: metric.contentId,
        contentType: metric.contentType,
        keyword: metric.keyword,
        position: metric.position,
        searchVolume: metric.searchVolume,
        difficulty: metric.difficulty,
        clicks: metric.clicks,
        impressions: metric.impressions,
        date: metric.date,
        lastChecked: new Date(),
      },
    });
  }

  /**
   * Pridobi statistiko SEO
   */
  async getStats(propertyId?: string): Promise<{
    totalKeywords: number;
    averagePosition: number;
    topTenKeywords: number;
    topThreeKeywords: number;
    totalClicks: number;
    totalImpressions: number;
    clickThroughRate: number;
  }> {
    const where = propertyId ? { propertyId } : {};

    const metrics = await prisma.seoMetric.findMany({
      where,
    });

    const totalKeywords = metrics.length;
    const averagePosition =
      metrics.reduce((sum, m) => sum + (m.position || 0), 0) /
      (totalKeywords || 1);
    const topTenKeywords = metrics.filter(
      (m) => (m.position || 100) <= 10,
    ).length;
    const topThreeKeywords = metrics.filter(
      (m) => (m.position || 100) <= 3,
    ).length;
    const totalClicks = metrics.reduce((sum, m) => sum + (m.clicks || 0), 0);
    const totalImpressions = metrics.reduce(
      (sum, m) => sum + (m.impressions || 0),
      0,
    );
    const clickThroughRate =
      totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

    return {
      totalKeywords,
      averagePosition: Math.round(averagePosition * 10) / 10,
      topTenKeywords,
      topThreeKeywords,
      totalClicks,
      totalImpressions,
      clickThroughRate: Math.round(clickThroughRate * 100) / 100,
    };
  }

  /**
   * Spremljaj spremembe pozicij
   */
  async trackPositionChanges(
    propertyId: string,
    days: number = 7,
  ): Promise<{
    improved: number;
    declined: number;
    unchanged: number;
  }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const currentMetrics = await this.findByProperty(propertyId);
    const previousMetrics = await prisma.seoMetric.findMany({
      where: {
        propertyId,
        lastChecked: {
          lt: cutoffDate,
        },
      },
    });

    const improved = currentMetrics.filter((current) => {
      const previous = previousMetrics.find(
        (p) => p.keyword === current.keyword,
      );
      return previous && (previous.position || 100) > (current.position || 100);
    }).length;

    const declined = currentMetrics.filter((current) => {
      const previous = previousMetrics.find(
        (p) => p.keyword === current.keyword,
      );
      return previous && (previous.position || 100) < (current.position || 100);
    }).length;

    const unchanged = currentMetrics.length - improved - declined;

    return { improved, declined, unchanged };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Preslikaj Prisma data v Domain DTO
   */
  private mapToDomain(data: any): SeoMetricDTO {
    return {
      id: data.id,
      userId: data.userId,
      propertyId: data.propertyId,
      contentId: data.contentId,
      contentType: data.contentType,
      keyword: data.keyword,
      position: data.position,
      searchVolume: data.searchVolume,
      difficulty: data.difficulty,
      clicks: data.clicks,
      impressions: data.impressions,
      date: data.date,
      lastChecked: data.lastChecked,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
