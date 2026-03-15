/**
 * Infrastructure Implementation: Revenue Repository
 *
 * Implementacija RevenueRepository interface-a z uporabo Prisma.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { RevenueRepository } from "@/core/ports/repositories";

export interface RevenueRecordDTO {
  id: string;
  propertyId: string;
  date: Date;
  amount: number;
  currency: string;
  type: "booking" | "extra_service" | "refund" | "adjustment";
  status: "pending" | "confirmed" | "paid" | "refunded";
  bookingId?: string;
  guestId?: string;
  description?: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export class RevenueRepositoryImpl implements RevenueRepository {
  /**
   * Pridobi revenue records za property v date range-u
   */
  async findByProperty(
    propertyId: string,
    startDate: Date,
    endDate: Date,
    type?: string,
  ): Promise<RevenueRecordDTO[]> {
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

    const data = await prisma.revenueSplit.findMany({
      where,
      include: {
        property: true,
      },
      orderBy: { date: "desc" },
    });

    return data.map((d) => ({
      id: d.id,
      propertyId: d.propertyId,
      date: d.date,
      amount: d.amount,
      currency: "EUR",
      type: "booking",
      status: "confirmed",
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    }));
  }

  /**
   * Shrani revenue record
   */
  async save(record: RevenueRecordDTO): Promise<void> {
    await prisma.revenueSplit.upsert({
      where: { id: record.id },
      update: {
        amount: record.amount,
        status: record.status,
        updatedAt: new Date(),
      },
      create: {
        id: record.id,
        propertyId: record.propertyId,
        date: record.date,
        amount: record.amount,
        status: record.status,
      },
    });
  }

  /**
   * Pridobi total revenue
   */
  async getTotal(
    propertyId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    total: number;
    byType: { [key: string]: number };
    byStatus: { [key: string]: number };
  }> {
    const records = await this.findByProperty(propertyId, startDate, endDate);

    const total = records.reduce((sum, r) => sum + r.amount, 0);

    const byType: { [key: string]: number } = {};
    const byStatus: { [key: string]: number } = {};

    records.forEach((r) => {
      byType[r.type] = (byType[r.type] || 0) + r.amount;
      byStatus[r.status] = (byStatus[r.status] || 0) + r.amount;
    });

    return { total, byType, byStatus };
  }

  /**
   * Pridobi revenue po mesecih
   */
  async getByMonth(
    propertyId: string,
    year: number,
  ): Promise<
    {
      month: number;
      revenue: number;
      bookings: number;
    }[]
  > {
    const records = await this.findByProperty(
      propertyId,
      new Date(year, 0, 1),
      new Date(year, 11, 31),
    );

    const byMonth: { [key: number]: { revenue: number; bookings: number } } =
      {};

    for (let i = 0; i < 12; i++) {
      byMonth[i] = { revenue: 0, bookings: 0 };
    }

    records.forEach((r) => {
      const month = r.date.getMonth();
      byMonth[month].revenue += r.amount;
      if (r.type === "booking") {
        byMonth[month].bookings += 1;
      }
    });

    return Object.entries(byMonth).map(([month, data]) => ({
      month: parseInt(month),
      revenue: data.revenue,
      bookings: data.bookings,
    }));
  }

  /**
   * Primerjaj revenue med dvema periodoma
   */
  async comparePeriods(
    propertyId: string,
    period1Start: Date,
    period1End: Date,
    period2Start: Date,
    period2End: Date,
  ): Promise<{
    period1: { total: number; bookings: number };
    period2: { total: number; bookings: number };
    growth: number;
    growthPercent: number;
  }> {
    const period1 = await this.getTotal(propertyId, period1Start, period1End);
    const period2 = await this.getTotal(propertyId, period2Start, period2End);

    const growth = period2.total - period1.total;
    const growthPercent =
      period1.total > 0 ? (growth / period1.total) * 100 : 0;

    return {
      period1: {
        total: period1.total,
        bookings: period1.byType["booking"] || 0,
      },
      period2: {
        total: period2.total,
        bookings: period2.byType["booking"] || 0,
      },
      growth,
      growthPercent: Math.round(growthPercent * 100) / 100,
    };
  }
}
