/**
 * Infrastructure Implementation: Sustainability Metric Repository
 *
 * Implementacija SustainabilityMetricRepository interface-a z uporabo Prisma.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { SustainabilityMetricRepository } from "@/core/ports/repositories";

export interface SustainabilityMetricDTO {
  id: string;
  propertyId: string;
  date: Date;
  energyUsage: number; // kWh
  waterUsage: number; // liters
  wasteGenerated: number; // kg
  recyclingRate: number; // percentage
  carbonFootprint: number; // kg CO2
  occupancyRate: number; // percentage
  guestsCount: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class SustainabilityMetricRepositoryImpl implements SustainabilityMetricRepository {
  /**
   * Najdi metric po ID-ju
   */
  async findById(id: string): Promise<SustainabilityMetricDTO | null> {
    const data = await prisma.sustainabilityMetric.findUnique({
      where: { id },
    });

    if (!data) {
      return null;
    }

    return this.mapToDomain(data);
  }

  /**
   * Najdi metrics za property v date range-u
   */
  async findByProperty(
    propertyId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<SustainabilityMetricDTO[]> {
    const data = await prisma.sustainabilityMetric.findMany({
      where: {
        propertyId,
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
   * Shrani metric
   */
  async save(metric: SustainabilityMetricDTO): Promise<void> {
    await prisma.sustainabilityMetric.upsert({
      where: {
        propertyId_date: {
          propertyId: metric.propertyId,
          date: metric.date,
        },
      },
      update: {
        energyUsage: metric.energyUsage,
        waterUsage: metric.waterUsage,
        wasteGenerated: metric.wasteGenerated,
        recyclingRate: metric.recyclingRate,
        carbonFootprint: metric.carbonFootprint,
        occupancyRate: metric.occupancyRate,
        guestsCount: metric.guestsCount,
        notes: metric.notes,
        updatedAt: new Date(),
      },
      create: {
        propertyId: metric.propertyId,
        date: metric.date,
        energyUsage: metric.energyUsage,
        waterUsage: metric.waterUsage,
        wasteGenerated: metric.wasteGenerated,
        recyclingRate: metric.recyclingRate,
        carbonFootprint: metric.carbonFootprint,
        occupancyRate: metric.occupancyRate,
        guestsCount: metric.guestsCount,
        notes: metric.notes,
      },
    });
  }

  /**
   * Izbriši metric
   */
  async delete(id: string): Promise<void> {
    await prisma.sustainabilityMetric.delete({
      where: { id },
    });
  }

  /**
   * Pridobi statistiko sustainability
   */
  async getStats(
    propertyId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    averageEnergyUsage: number;
    averageWaterUsage: number;
    averageWasteGenerated: number;
    averageRecyclingRate: number;
    averageCarbonFootprint: number;
    totalEnergyUsage: number;
    totalWaterUsage: number;
    totalWasteGenerated: number;
  }> {
    const metrics = await this.findByProperty(propertyId, startDate, endDate);

    if (metrics.length === 0) {
      return {
        averageEnergyUsage: 0,
        averageWaterUsage: 0,
        averageWasteGenerated: 0,
        averageRecyclingRate: 0,
        averageCarbonFootprint: 0,
        totalEnergyUsage: 0,
        totalWaterUsage: 0,
        totalWasteGenerated: 0,
      };
    }

    const totalEnergyUsage = metrics.reduce((sum, m) => sum + m.energyUsage, 0);
    const totalWaterUsage = metrics.reduce((sum, m) => sum + m.waterUsage, 0);
    const totalWasteGenerated = metrics.reduce(
      (sum, m) => sum + m.wasteGenerated,
      0,
    );
    const totalRecyclingRate = metrics.reduce(
      (sum, m) => sum + m.recyclingRate,
      0,
    );
    const totalCarbonFootprint = metrics.reduce(
      (sum, m) => sum + m.carbonFootprint,
      0,
    );

    return {
      averageEnergyUsage: totalEnergyUsage / metrics.length,
      averageWaterUsage: totalWaterUsage / metrics.length,
      averageWasteGenerated: totalWasteGenerated / metrics.length,
      averageRecyclingRate: totalRecyclingRate / metrics.length,
      averageCarbonFootprint: totalCarbonFootprint / metrics.length,
      totalEnergyUsage,
      totalWaterUsage,
      totalWasteGenerated,
    };
  }

  /**
   * Primerjaj dva perioda
   */
  async comparePeriods(
    propertyId: string,
    period1Start: Date,
    period1End: Date,
    period2Start: Date,
    period2End: Date,
  ): Promise<{
    period1: {
      averageEnergyUsage: number;
      averageWaterUsage: number;
      averageCarbonFootprint: number;
    };
    period2: {
      averageEnergyUsage: number;
      averageWaterUsage: number;
      averageCarbonFootprint: number;
    };
    improvement: {
      energyUsage: number;
      waterUsage: number;
      carbonFootprint: number;
    };
  }> {
    const period1Metrics = await this.findByProperty(
      propertyId,
      period1Start,
      period1End,
    );
    const period2Metrics = await this.findByProperty(
      propertyId,
      period2Start,
      period2End,
    );

    const period1 = {
      averageEnergyUsage:
        period1Metrics.reduce((sum, m) => sum + m.energyUsage, 0) /
        (period1Metrics.length || 1),
      averageWaterUsage:
        period1Metrics.reduce((sum, m) => sum + m.waterUsage, 0) /
        (period1Metrics.length || 1),
      averageCarbonFootprint:
        period1Metrics.reduce((sum, m) => sum + m.carbonFootprint, 0) /
        (period1Metrics.length || 1),
    };

    const period2 = {
      averageEnergyUsage:
        period2Metrics.reduce((sum, m) => sum + m.energyUsage, 0) /
        (period2Metrics.length || 1),
      averageWaterUsage:
        period2Metrics.reduce((sum, m) => sum + m.waterUsage, 0) /
        (period2Metrics.length || 1),
      averageCarbonFootprint:
        period2Metrics.reduce((sum, m) => sum + m.carbonFootprint, 0) /
        (period2Metrics.length || 1),
    };

    const improvement = {
      energyUsage:
        ((period1.averageEnergyUsage - period2.averageEnergyUsage) /
          period1.averageEnergyUsage) *
        100,
      waterUsage:
        ((period1.averageWaterUsage - period2.averageWaterUsage) /
          period1.averageWaterUsage) *
        100,
      carbonFootprint:
        ((period1.averageCarbonFootprint - period2.averageCarbonFootprint) /
          period1.averageCarbonFootprint) *
        100,
    };

    return { period1, period2, improvement };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Preslikaj Prisma data v Domain DTO
   */
  private mapToDomain(data: any): SustainabilityMetricDTO {
    return {
      id: data.id,
      propertyId: data.propertyId,
      date: data.date,
      energyUsage: data.energyUsage,
      waterUsage: data.waterUsage,
      wasteGenerated: data.wasteGenerated,
      recyclingRate: data.recyclingRate,
      carbonFootprint: data.carbonFootprint,
      occupancyRate: data.occupancyRate,
      guestsCount: data.guestsCount,
      notes: data.notes,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
