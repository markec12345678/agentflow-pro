/**
 * Infrastructure Implementation: Occupancy Repository
 *
 * Implementacija OccupancyRepository interface-a z uporabo Prisma.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { OccupancyRepository } from "@/core/ports/repositories";

export interface OccupancyRecord {
  date: Date;
  propertyId: string;
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  occupancyRate: number;
  revenue: number;
  adr: number; // Average Daily Rate
  revpar: number; // Revenue Per Available Room
}

export class OccupancyRepositoryImpl implements OccupancyRepository {
  /**
   * Pridobi occupancy records za property v date range-u
   */
  async findByProperty(
    propertyId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<OccupancyRecord[]> {
    const records = await prisma.occupancyRecord.findMany({
      where: {
        propertyId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: "asc" },
    });

    return records.map((record) => ({
      date: record.date,
      propertyId: record.propertyId,
      totalRooms: record.totalRooms,
      occupiedRooms: record.occupiedRooms,
      availableRooms: record.availableRooms,
      occupancyRate: record.occupancyRate,
      revenue: record.revenue,
      adr: record.adr,
      revpar: record.revpar,
    }));
  }

  /**
   * Pridobi occupancy record za datum
   */
  async findByDate(
    propertyId: string,
    date: Date,
  ): Promise<OccupancyRecord | null> {
    const record = await prisma.occupancyRecord.findUnique({
      where: {
        propertyId_date: {
          propertyId,
          date,
        },
      },
    });

    if (!record) {
      return null;
    }

    return {
      date: record.date,
      propertyId: record.propertyId,
      totalRooms: record.totalRooms,
      occupiedRooms: record.occupiedRooms,
      availableRooms: record.availableRooms,
      occupancyRate: record.occupancyRate,
      revenue: record.revenue,
      adr: record.adr,
      revpar: record.revpar,
    };
  }

  /**
   * Shrani occupancy record
   */
  async save(record: OccupancyRecord): Promise<void> {
    await prisma.occupancyRecord.upsert({
      where: {
        propertyId_date: {
          propertyId: record.propertyId,
          date: record.date,
        },
      },
      update: {
        totalRooms: record.totalRooms,
        occupiedRooms: record.occupiedRooms,
        availableRooms: record.availableRooms,
        occupancyRate: record.occupancyRate,
        revenue: record.revenue,
        adr: record.adr,
        revpar: record.revpar,
        updatedAt: new Date(),
      },
      create: {
        propertyId: record.propertyId,
        date: record.date,
        totalRooms: record.totalRooms,
        occupiedRooms: record.occupiedRooms,
        availableRooms: record.availableRooms,
        occupancyRate: record.occupancyRate,
        revenue: record.revenue,
        adr: record.adr,
        revpar: record.revpar,
      },
    });
  }

  /**
   * Izračunaj occupancy statistiko
   */
  async getStats(
    propertyId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    averageOccupancyRate: number;
    totalRevenue: number;
    averageAdr: number;
    averageRevpar: number;
    totalNights: number;
  }> {
    const records = await this.findByProperty(propertyId, startDate, endDate);

    if (records.length === 0) {
      return {
        averageOccupancyRate: 0,
        totalRevenue: 0,
        averageAdr: 0,
        averageRevpar: 0,
        totalNights: 0,
      };
    }

    const totalOccupancy = records.reduce((sum, r) => sum + r.occupancyRate, 0);
    const totalRevenue = records.reduce((sum, r) => sum + r.revenue, 0);
    const totalAdr = records.reduce((sum, r) => sum + r.adr, 0);
    const totalRevpar = records.reduce((sum, r) => sum + r.revpar, 0);

    return {
      averageOccupancyRate: totalOccupancy / records.length,
      totalRevenue,
      averageAdr: totalAdr / records.length,
      averageRevpar: totalRevpar / records.length,
      totalNights: records.length,
    };
  }

  /**
   * Posodobi occupancy za vse datume v range-u
   */
  async updateRange(
    propertyId: string,
    startDate: Date,
    endDate: Date,
    totalRooms: number,
    calculateOccupied: (date: Date) => Promise<number>,
    calculateRevenue: (date: Date) => Promise<number>,
  ): Promise<void> {
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const occupiedRooms = await calculateOccupied(currentDate);
      const revenue = await calculateRevenue(currentDate);
      const availableRooms = totalRooms - occupiedRooms;
      const occupancyRate = (occupiedRooms / totalRooms) * 100;
      const adr = occupiedRooms > 0 ? revenue / occupiedRooms : 0;
      const revpar = revenue / totalRooms;

      await this.save({
        date: new Date(currentDate),
        propertyId,
        totalRooms,
        occupiedRooms,
        availableRooms,
        occupancyRate,
        revenue,
        adr,
        revpar,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  /**
   * Izbriši occupancy records za property
   */
  async deleteByProperty(
    propertyId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<void> {
    await prisma.occupancyRecord.deleteMany({
      where: {
        propertyId,
        ...(startDate &&
          endDate && {
            date: {
              gte: startDate,
              lte: endDate,
            },
          }),
      },
    });
  }
}
