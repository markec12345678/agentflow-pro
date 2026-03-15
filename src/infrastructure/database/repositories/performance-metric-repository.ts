/**
 * Infrastructure Implementation: Performance Metric Repository
 *
 * Implementacija PerformanceMetricRepository interface-a z uporabo Prisma.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { PerformanceMetricRepository } from "@/core/ports/repositories";

export interface PerformanceMetricDTO {
  id: string;
  propertyId: string;
  date: Date;
  metric: string;
  value: number;
  target?: number;
  unit: string;
  status: "below_target" | "on_target" | "above_target";
  createdAt: Date;
  updatedAt: Date;
}

export class PerformanceMetricRepositoryImpl implements PerformanceMetricRepository {
  /**
   * Pridobi metrike za property v date range-u
   */
  async findByProperty(
    propertyId: string,
    startDate: Date,
    endDate: Date,
    metric?: string,
  ): Promise<PerformanceMetricDTO[]> {
    const where: any = {
      propertyId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (metric) {
      where.metric = metric;
    }

    const data = await prisma.performanceMetric.findMany({
      where,
      orderBy: [{ date: "desc" }, { metric: "asc" }],
    });

    return data.map((d) => ({
      id: d.id,
      propertyId: d.propertyId,
      date: d.date,
      metric: d.metric,
      value: d.value,
      target: d.target,
      unit: d.unit,
      status: this.calculateStatus(d.value, d.target),
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    }));
  }

  /**
   * Shrani metrika
   */
  async save(metric: PerformanceMetricDTO): Promise<void> {
    await prisma.performanceMetric.upsert({
      where: {
        propertyId_date_metric: {
          propertyId: metric.propertyId,
          date: metric.date,
          metric: metric.metric,
        },
      },
      update: {
        value: metric.value,
        target: metric.target,
        unit: metric.unit,
        updatedAt: new Date(),
      },
      create: {
        propertyId: metric.propertyId,
        date: metric.date,
        metric: metric.metric,
        value: metric.value,
        target: metric.target,
        unit: metric.unit,
      },
    });
  }

  /**
   * Pridobi povprečne metrike
   */
  async getAverages(
    propertyId: string,
    startDate: Date,
    endDate: Date,
    metrics?: string[],
  ): Promise<{
    [key: string]: {
      average: number;
      min: number;
      max: number;
      targetAchieved: boolean;
    };
  }> {
    const records = await this.findByProperty(propertyId, startDate, endDate);

    const filteredRecords = metrics
      ? records.filter((r) => metrics.includes(r.metric))
      : records;

    const result: { [key: string]: any } = {};

    const metricGroups: { [key: string]: typeof records } = {};
    filteredRecords.forEach((r) => {
      if (!metricGroups[r.metric]) {
        metricGroups[r.metric] = [];
      }
      metricGroups[r.metric].push(r);
    });

    Object.entries(metricGroups).forEach(([metric, values]) => {
      const valuesOnly = values.map((v) => v.value);
      const target = values[0]?.target;
      const average =
        valuesOnly.reduce((sum, v) => sum + v, 0) / valuesOnly.length;

      result[metric] = {
        average: Math.round(average * 100) / 100,
        min: Math.min(...valuesOnly),
        max: Math.max(...valuesOnly),
        targetAchieved: target ? average >= target : false,
      };
    });

    return result;
  }

  /**
   * Pridobi KPI dashboard
   */
  async getKpiDashboard(
    propertyId: string,
    date: Date,
  ): Promise<{
    occupancy: { value: number; target: number; status: string };
    adr: { value: number; target: number; status: string };
    revpar: { value: number; target: number; status: string };
    bookingConversion: { value: number; target: number; status: string };
    guestSatisfaction: { value: number; target: number; status: string };
  }> {
    const metrics = await this.findByProperty(propertyId, date, date);

    const getMetric = (name: string) => {
      const m = metrics.find((m) => m.metric === name);
      return {
        value: m?.value || 0,
        target: m?.target || 0,
        status: m ? this.calculateStatus(m.value, m.target) : "unknown",
      };
    };

    return {
      occupancy: getMetric("occupancy_rate"),
      adr: getMetric("adr"),
      revpar: getMetric("revpar"),
      bookingConversion: getMetric("booking_conversion"),
      guestSatisfaction: getMetric("guest_satisfaction"),
    };
  }

  /**
   * Izračunaj status glede na target
   */
  private calculateStatus(
    value: number,
    target?: number,
  ): "below_target" | "on_target" | "above_target" {
    if (!target) return "on_target";

    const diff = ((value - target) / target) * 100;

    if (diff < -10) return "below_target";
    if (diff > 10) return "above_target";
    return "on_target";
  }
}
