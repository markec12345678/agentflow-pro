/**
 * Infrastructure Implementation: Seasonal Rate Repository
 *
 * Implementacija SeasonalRateRepository interface-a z uporabo Prisma.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { SeasonalRateRepository } from "@/core/ports/repositories";
import { SeasonalRate } from "@/core/domain/tourism/entities/seasonal-rate";
import { Money } from "@/core/domain/shared/value-objects/money";
import { DateRange } from "@/core/domain/shared/value-objects/date-range";

export class SeasonalRateRepositoryImpl implements SeasonalRateRepository {
  /**
   * Najdi seasonal rate po ID-ju
   */
  async findById(id: string): Promise<SeasonalRate | null> {
    const data = await prisma.seasonalRate.findUnique({
      where: { id },
      include: {
        property: true,
      },
    });

    if (!data) {
      return null;
    }

    return this.mapToDomain(data);
  }

  /**
   * Najdi vse seasonal rates za property
   */
  async findByProperty(propertyId: string): Promise<SeasonalRate[]> {
    const data = await prisma.seasonalRate.findMany({
      where: { propertyId },
      orderBy: { startDate: "asc" },
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Najdi seasonal rate za datum
   */
  async findByDate(
    propertyId: string,
    date: Date,
  ): Promise<SeasonalRate | null> {
    const data = await prisma.seasonalRate.findFirst({
      where: {
        propertyId,
        startDate: { lte: date },
        endDate: { gte: date },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!data) {
      return null;
    }

    return this.mapToDomain(data);
  }

  /**
   * Shrani seasonal rate
   */
  async save(rate: SeasonalRate): Promise<void> {
    await prisma.seasonalRate.upsert({
      where: { id: rate.id },
      update: {
        name: rate.name,
        startDate: rate.dateRange.start,
        endDate: rate.dateRange.end,
        baseRate: rate.baseRate.amount,
        weekendRate: rate.weekendRate?.amount,
        weeklyDiscount: rate.weeklyDiscount,
        monthlyDiscount: rate.monthlyDiscount,
        minStay: rate.minStay,
        maxStay: rate.maxStay,
        updatedAt: new Date(),
      },
      create: {
        id: rate.id,
        propertyId: rate.propertyId,
        name: rate.name,
        startDate: rate.dateRange.start,
        endDate: rate.dateRange.end,
        baseRate: rate.baseRate.amount,
        weekendRate: rate.weekendRate?.amount,
        weeklyDiscount: rate.weeklyDiscount,
        monthlyDiscount: rate.monthlyDiscount,
        minStay: rate.minStay,
        maxStay: rate.maxStay,
      },
    });
  }

  /**
   * Izbriši seasonal rate
   */
  async delete(id: string): Promise<void> {
    await prisma.seasonalRate.delete({
      where: { id },
    });
  }

  /**
   * Ustvari seasonal rates za celo leto
   */
  async createYearlyRates(
    propertyId: string,
    year: number,
    rates: {
      name: string;
      startMonth: number;
      endMonth: number;
      baseRate: Money;
      weekendRate?: Money;
    }[],
  ): Promise<void> {
    const seasonalRates = rates.map((rate) => ({
      id: `seasonal_${propertyId}_${year}_${rate.startMonth}`,
      propertyId,
      name: rate.name,
      startDate: new Date(year, rate.startMonth - 1, 1),
      endDate: new Date(year, rate.endMonth, 0),
      baseRate: rate.baseRate.amount,
      weekendRate: rate.weekendRate?.amount,
      weeklyDiscount: 0,
      monthlyDiscount: 0,
      minStay: 1,
      maxStay: 30,
    }));

    await prisma.seasonalRate.createMany({
      data: seasonalRates,
      skipDuplicates: true,
    });
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Preslikaj Prisma data v Domain SeasonalRate
   */
  private mapToDomain(data: any): SeasonalRate {
    return new SeasonalRate({
      id: data.id,
      propertyId: data.propertyId,
      name: data.name,
      dateRange: new DateRange(data.startDate, data.endDate),
      baseRate: new Money(data.baseRate, "EUR"),
      weekendRate: data.weekendRate
        ? new Money(data.weekendRate, "EUR")
        : undefined,
      weeklyDiscount: data.weeklyDiscount || 0,
      monthlyDiscount: data.monthlyDiscount || 0,
      minStay: data.minStay || 1,
      maxStay: data.maxStay || 30,
    });
  }
}
