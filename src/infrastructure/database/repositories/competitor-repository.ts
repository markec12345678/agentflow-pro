/**
 * Infrastructure Implementation: Competitor Repository
 *
 * Implementacija CompetitorRepository interface-a z uporabo Prisma.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { CompetitorRepository } from "@/core/ports/repositories";
import { Money } from "@/core/domain/shared/value-objects/money";

export interface CompetitorRate {
  id: string;
  propertyId: string;
  competitorId: string;
  date: Date;
  rate: Money;
  currency: string;
  minStay: number;
  availability: boolean;
  source: string;
  collectedAt: Date;
}

export class CompetitorRepositoryImpl implements CompetitorRepository {
  /**
   * Pridobi competitor rates za property v date range-u
   */
  async findByProperty(
    propertyId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<CompetitorRate[]> {
    const records = await prisma.competitorRate.findMany({
      where: {
        propertyId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        competitor: true,
      },
      orderBy: [{ date: "asc" }, { competitor: { name: "asc" } }],
    });

    return records.map((record) => ({
      id: record.id,
      propertyId: record.propertyId,
      competitorId: record.competitorId,
      date: record.date,
      rate: new Money(record.rate, record.currency || "EUR"),
      currency: record.currency || "EUR",
      minStay: record.minStay || 1,
      availability: record.availability,
      source: record.source,
      collectedAt: record.collectedAt,
    }));
  }

  /**
   * Pridobi competitor rate za datum in competitor-ja
   */
  async findByDate(
    propertyId: string,
    competitorId: string,
    date: Date,
  ): Promise<CompetitorRate | null> {
    const record = await prisma.competitorRate.findUnique({
      where: {
        propertyId_competitorId_date: {
          propertyId,
          competitorId,
          date,
        },
      },
      include: {
        competitor: true,
      },
    });

    if (!record) {
      return null;
    }

    return {
      id: record.id,
      propertyId: record.propertyId,
      competitorId: record.competitorId,
      date: record.date,
      rate: new Money(record.rate, record.currency || "EUR"),
      currency: record.currency || "EUR",
      minStay: record.minStay || 1,
      availability: record.availability,
      source: record.source,
      collectedAt: record.collectedAt,
    };
  }

  /**
   * Shrani competitor rate
   */
  async save(rate: CompetitorRate): Promise<void> {
    await prisma.competitorRate.upsert({
      where: {
        id: rate.id,
      },
      update: {
        rate: rate.rate.amount,
        currency: rate.currency,
        minStay: rate.minStay,
        availability: rate.availability,
        source: rate.source,
        collectedAt: rate.collectedAt,
        updatedAt: new Date(),
      },
      create: {
        id: rate.id,
        propertyId: rate.propertyId,
        competitorId: rate.competitorId,
        date: rate.date,
        rate: rate.rate.amount,
        currency: rate.currency,
        minStay: rate.minStay,
        availability: rate.availability,
        source: rate.source,
        collectedAt: rate.collectedAt,
      },
    });
  }

  /**
   * Shrani vec competitor rates
   */
  async saveMany(rates: CompetitorRate[]): Promise<void> {
    if (rates.length === 0) return;

    await prisma.competitorRate.createMany({
      data: rates.map((rate) => ({
        id: rate.id,
        propertyId: rate.propertyId,
        competitorId: rate.competitorId,
        date: rate.date,
        rate: rate.rate.amount,
        currency: rate.currency,
        minStay: rate.minStay,
        availability: rate.availability,
        source: rate.source,
        collectedAt: rate.collectedAt,
      })),
      skipDuplicates: true,
    });
  }

  /**
   * Pridobi povprecno ceno competitor-jev za datum
   */
  async getAverageRate(propertyId: string, date: Date): Promise<Money | null> {
    const rates = await this.findByProperty(propertyId, date, date);

    if (rates.length === 0) {
      return null;
    }

    const total = rates.reduce((sum, rate) => sum + rate.rate.amount, 0);
    const average = total / rates.length;

    return new Money(average, "EUR");
  }

  /**
   * Pridobi najnizjo ceno competitor-jev za datum
   */
  async getLowestRate(propertyId: string, date: Date): Promise<Money | null> {
    const rates = await this.findByProperty(propertyId, date, date);

    if (rates.length === 0) {
      return null;
    }

    const lowest = Math.min(...rates.map((rate) => rate.rate.amount));

    return new Money(lowest, "EUR");
  }

  /**
   * Izbriši stare competitor rates
   */
  async deleteOlderThan(propertyId: string, days: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await prisma.competitorRate.deleteMany({
      where: {
        propertyId,
        date: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }

  /**
   * Pridobi statistiko competitor rates
   */
  async getStats(
    propertyId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    averageRate: number;
    lowestRate: number;
    highestRate: number;
    totalRecords: number;
  }> {
    const rates = await this.findByProperty(propertyId, startDate, endDate);

    if (rates.length === 0) {
      return {
        averageRate: 0,
        lowestRate: 0,
        highestRate: 0,
        totalRecords: 0,
      };
    }

    const amounts = rates.map((rate) => rate.rate.amount);
    const total = amounts.reduce((sum, amount) => sum + amount, 0);

    return {
      averageRate: total / amounts.length,
      lowestRate: Math.min(...amounts),
      highestRate: Math.max(...amounts),
      totalRecords: amounts.length,
    };
  }
}
