/**
 * Infrastructure Implementation: Staff Schedule Repository
 *
 * Implementacija StaffScheduleRepository interface-a z uporabo Prisma.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { StaffScheduleRepository } from "@/core/ports/repositories";

export interface StaffScheduleDTO {
  id: string;
  propertyId: string;
  employeeId: string;
  userId?: string;
  date: Date;
  shiftType: "morning" | "afternoon" | "night" | "full_day" | "half_day";
  startTime?: string;
  endTime?: string;
  hours: number;
  role: string;
  notes?: string;
  status: "scheduled" | "worked" | "missed" | "cancelled";
  overtimeHours?: number;
  createdAt: Date;
  updatedAt: Date;
}

export class StaffScheduleRepositoryImpl implements StaffScheduleRepository {
  /**
   * Najdi schedule po ID-ju
   */
  async findById(id: string): Promise<StaffScheduleDTO | null> {
    const data = await prisma.staffSchedule.findUnique({
      where: { id },
      include: {
        property: true,
        employee: true,
      },
    });

    if (!data) {
      return null;
    }

    return this.mapToDomain(data);
  }

  /**
   * Najdi vse schedules za property
   */
  async findByProperty(
    propertyId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<StaffScheduleDTO[]> {
    const where: any = { propertyId };

    if (startDate && endDate) {
      where.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    const data = await prisma.staffSchedule.findMany({
      where,
      include: {
        property: true,
        employee: true,
      },
      orderBy: { date: "asc" },
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Najdi schedules za employee-ja
   */
  async findByEmployee(
    employeeId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<StaffScheduleDTO[]> {
    const where: any = { employeeId };

    if (startDate && endDate) {
      where.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    const data = await prisma.staffSchedule.findMany({
      where,
      include: {
        property: true,
        employee: true,
      },
      orderBy: { date: "asc" },
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Ustvari nov schedule
   */
  async create(
    schedule: Omit<StaffScheduleDTO, "id" | "createdAt" | "updatedAt">,
  ): Promise<StaffScheduleDTO> {
    const data = await prisma.staffSchedule.create({
      data: {
        propertyId: schedule.propertyId,
        employeeId: schedule.employeeId,
        userId: schedule.userId,
        date: schedule.date,
        shiftType: schedule.shiftType,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        hours: schedule.hours,
        role: schedule.role,
        notes: schedule.notes,
        status: schedule.status,
        overtimeHours: schedule.overtimeHours,
      },
      include: {
        property: true,
        employee: true,
      },
    });

    return this.mapToDomain(data);
  }

  /**
   * Posodobi schedule
   */
  async update(id: string, schedule: Partial<StaffScheduleDTO>): Promise<void> {
    await prisma.staffSchedule.update({
      where: { id },
      data: {
        date: schedule.date,
        shiftType: schedule.shiftType,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        hours: schedule.hours,
        role: schedule.role,
        notes: schedule.notes,
        status: schedule.status,
        overtimeHours: schedule.overtimeHours,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Označi schedule kot worked
   */
  async markAsWorked(
    id: string,
    actualHours?: number,
    overtimeHours?: number,
  ): Promise<void> {
    await prisma.staffSchedule.update({
      where: { id },
      data: {
        status: "worked",
        hours: actualHours !== undefined ? actualHours : undefined,
        overtimeHours,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Označi schedule kot missed
   */
  async markAsMissed(id: string): Promise<void> {
    await prisma.staffSchedule.update({
      where: { id },
      data: {
        status: "missed",
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Prekliči schedule
   */
  async cancel(id: string): Promise<void> {
    await prisma.staffSchedule.update({
      where: { id },
      data: {
        status: "cancelled",
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Izbriši schedule
   */
  async delete(id: string): Promise<void> {
    await prisma.staffSchedule.delete({
      where: { id },
    });
  }

  /**
   * Pridobi statistiko staff schedules
   */
  async getStats(
    propertyId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    totalSchedules: number;
    scheduledShifts: number;
    workedShifts: number;
    missedShifts: number;
    cancelledShifts: number;
    totalHours: number;
    totalOvertimeHours: number;
    averageHoursPerShift: number;
  }> {
    const where: any = {};

    if (propertyId) {
      where.propertyId = propertyId;
    }

    if (startDate && endDate) {
      where.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    const schedules = await prisma.staffSchedule.findMany({
      where,
    });

    const totalSchedules = schedules.length;
    const scheduledShifts = schedules.filter(
      (s) => s.status === "scheduled",
    ).length;
    const workedShifts = schedules.filter((s) => s.status === "worked").length;
    const missedShifts = schedules.filter((s) => s.status === "missed").length;
    const cancelledShifts = schedules.filter(
      (s) => s.status === "cancelled",
    ).length;

    const totalHours = schedules.reduce((sum, s) => sum + s.hours, 0);
    const totalOvertimeHours = schedules.reduce(
      (sum, s) => sum + (s.overtimeHours || 0),
      0,
    );
    const averageHoursPerShift =
      workedShifts > 0 ? totalHours / workedShifts : 0;

    return {
      totalSchedules,
      scheduledShifts,
      workedShifts,
      missedShifts,
      cancelledShifts,
      totalHours,
      totalOvertimeHours,
      averageHoursPerShift: Math.round(averageHoursPerShift * 10) / 10,
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Preslikaj Prisma data v Domain DTO
   */
  private mapToDomain(data: any): StaffScheduleDTO {
    return {
      id: data.id,
      propertyId: data.propertyId,
      employeeId: data.employeeId,
      userId: data.userId,
      date: data.date,
      shiftType: data.shiftType as any,
      startTime: data.startTime,
      endTime: data.endTime,
      hours: data.hours,
      role: data.role,
      notes: data.notes,
      status: data.status as any,
      overtimeHours: data.overtimeHours,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
