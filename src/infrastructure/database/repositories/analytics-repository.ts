/**
 * Infrastructure Implementation: Analytics Repository
 *
 * Implementacija AnalyticsRepository interface-a z uporabo Prisma.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { AnalyticsRepository } from "@/core/ports/repositories";

export interface AnalyticsDataDTO {
  date: Date;
  propertyId: string;
  type: "occupancy" | "revenue" | "booking" | "channel" | "guest";
  value: number;
  metadata?: any;
  createdAt: Date;
}

export class AnalyticsRepositoryImpl implements AnalyticsRepository {
  /**
   * Pridobi analytics data za property v date range-u
   */
  async findByProperty(
    propertyId: string,
    startDate: Date,
    endDate: Date,
    type?: string,
  ): Promise<AnalyticsDataDTO[]> {
    const where: any = {
      propertyId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (type) {
      where.type = type;
    }

    const data = await prisma.analyticsDailyStats.findMany({
      where,
      orderBy: { date: "asc" },
    });

    return data.map((d) => ({
      date: d.date,
      propertyId,
      type: "revenue",
      value: d.totalRevenue || 0,
      createdAt: d.createdAt,
    }));
  }

  /**
   * Pridobi povprečne metrike
   */
  async getAverages(
    propertyId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    averageDailyRate: number;
    averageOccupancy: number;
    averageRevenue: number;
    totalBookings: number;
  }> {
    const stats = await prisma.analyticsDailyStats.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    if (stats.length === 0) {
      return {
        averageDailyRate: 0,
        averageOccupancy: 0,
        averageRevenue: 0,
        totalBookings: 0,
      };
    }

    const totalRevenue = stats.reduce(
      (sum, s) => sum + (s.totalRevenue || 0),
      0,
    );
    const totalBookings = stats.reduce((sum, s) => sum + s.totalBookings, 0);
    const averageRevenue = totalRevenue / stats.length;
    const averageOccupancy =
      stats.reduce((sum, s) => sum + s.occupancyRate, 0) / stats.length;
    const averageDailyRate =
      averageOccupancy > 0 ? averageRevenue / averageOccupancy : 0;

    return {
      averageDailyRate: Math.round(averageDailyRate * 100) / 100,
      averageOccupancy: Math.round(averageOccupancy * 100) / 100,
      averageRevenue: Math.round(averageRevenue * 100) / 100,
      totalBookings,
    };
  }

  /**
   * Pridobi trend data
   */
  async getTrends(
    propertyId: string,
    metric: string,
    days: number = 30,
  ): Promise<{
    currentValue: number;
    previousValue: number;
    change: number;
    changePercent: number;
    trend: "up" | "down" | "stable";
  }> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const previousEndDate = new Date();
    previousEndDate.setDate(previousEndDate.getDate() - days);
    const previousStartDate = new Date();
    previousStartDate.setDate(previousStartDate.getDate() - days * 2);

    const currentStats = await prisma.analyticsDailyStats.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const previousStats = await prisma.analyticsDailyStats.findMany({
      where: {
        date: {
          gte: previousStartDate,
          lte: previousEndDate,
        },
      },
    });

    const currentValue = currentStats.reduce(
      (sum, s) => sum + (s[metric as keyof typeof s] || 0),
      0,
    );
    const previousValue = previousStats.reduce(
      (sum, s) => sum + (s[metric as keyof typeof s] || 0),
      0,
    );

    const change = currentValue - previousValue;
    const changePercent =
      previousValue > 0 ? (change / previousValue) * 100 : 0;
    const trend: "up" | "down" | "stable" =
      changePercent > 5 ? "up" : changePercent < -5 ? "down" : "stable";

    return {
      currentValue,
      previousValue,
      change,
      changePercent: Math.round(changePercent * 100) / 100,
      trend,
    };
  }

  /**
   * Shrani dnevno statistiko
   */
  async saveDailyStats(stats: {
    propertyId: string;
    date: Date;
    totalBookings: number;
    totalRevenue: number;
    occupancyRate: number;
    adr: number;
    revpar: number;
  }): Promise<void> {
    await prisma.analyticsDailyStats.upsert({
      where: {
        date: stats.date,
      },
      update: {
        totalBookings: stats.totalBookings,
        totalRevenue: stats.totalRevenue,
        occupancyRate: stats.occupancyRate,
        adr: stats.adr,
        revpar: stats.revpar,
        updatedAt: new Date(),
      },
      create: {
        date: stats.date,
        totalBookings: stats.totalBookings,
        totalRevenue: stats.totalRevenue,
        occupancyRate: stats.occupancyRate,
        adr: stats.adr,
        revpar: stats.revpar,
      },
    });
  }

  /**
   * Generiraj analytics report
   */
  async generateReport(
    propertyId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    summary: {
      totalRevenue: number;
      totalBookings: number;
      averageOccupancy: number;
      averageAdr: number;
      averageRevpar: number;
    };
    trends: {
      revenue: {
        change: number;
        changePercent: number;
        trend: "up" | "down" | "stable";
      };
      bookings: {
        change: number;
        changePercent: number;
        trend: "up" | "down" | "stable";
      };
      occupancy: {
        change: number;
        changePercent: number;
        trend: "up" | "down" | "stable";
      };
    };
  }> {
    const stats = await this.findByProperty(propertyId, startDate, endDate);
    const averages = await this.getAverages(propertyId, startDate, endDate);

    const revenueTrend = await this.getTrends(propertyId, "totalRevenue");
    const bookingsTrend = await this.getTrends(propertyId, "totalBookings");
    const occupancyTrend = await this.getTrends(propertyId, "occupancyRate");

    return {
      summary: {
        totalRevenue: averages.averageRevenue * stats.length,
        totalBookings: averages.totalBookings,
        averageOccupancy: averages.averageOccupancy,
        averageAdr: averages.averageDailyRate,
        averageRevpar: averages.averageRevenue,
      },
      trends: {
        revenue: {
          change: revenueTrend.change,
          changePercent: revenueTrend.changePercent,
          trend: revenueTrend.trend,
        },
        bookings: {
          change: bookingsTrend.change,
          changePercent: bookingsTrend.changePercent,
          trend: bookingsTrend.trend,
        },
        occupancy: {
          change: occupancyTrend.change,
          changePercent: occupancyTrend.changePercent,
          trend: occupancyTrend.trend,
        },
      },
    };
  }
}
