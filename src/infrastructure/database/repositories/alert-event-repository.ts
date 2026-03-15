/**
 * Infrastructure Implementation: Alert Event Repository
 *
 * Implementacija AlertEventRepository interface-a z uporabo Prisma.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { AlertEventRepository } from "@/core/ports/repositories";

export interface AlertEventDTO {
  id: string;
  propertyId: string;
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  message: string;
  status: "new" | "acknowledged" | "resolved" | "dismissed";
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export class AlertEventRepositoryImpl implements AlertEventRepository {
  /**
   * Najdi alert po ID-ju
   */
  async findById(id: string): Promise<AlertEventDTO | null> {
    const data = await prisma.alertEvent.findUnique({
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
   * Najdi vse alerts za property
   */
  async findByProperty(
    propertyId: string,
    status?: string,
  ): Promise<AlertEventDTO[]> {
    const where: any = { propertyId };

    if (status) {
      where.status = status;
    }

    const data = await prisma.alertEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Najdi alerts po severity
   */
  async findBySeverity(
    severity: string,
    limit?: number,
  ): Promise<AlertEventDTO[]> {
    const data = await prisma.alertEvent.findMany({
      where: { severity },
      orderBy: { createdAt: "desc" },
      take: limit || 50,
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Ustvari nov alert
   */
  async create(
    alert: Omit<AlertEventDTO, "id" | "createdAt" | "updatedAt">,
  ): Promise<AlertEventDTO> {
    const data = await prisma.alertEvent.create({
      data: {
        propertyId: alert.propertyId,
        type: alert.type,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        status: alert.status,
        metadata: alert.metadata,
      },
      include: {
        property: true,
      },
    });

    return this.mapToDomain(data);
  }

  /**
   * Posodobi alert
   */
  async update(id: string, alert: Partial<AlertEventDTO>): Promise<void> {
    await prisma.alertEvent.update({
      where: { id },
      data: {
        status: alert.status,
        acknowledgedAt: alert.acknowledgedAt,
        acknowledgedBy: alert.acknowledgedBy,
        resolvedAt: alert.resolvedAt,
        resolvedBy: alert.resolvedBy,
        metadata: alert.metadata,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Acknowledgjaj alert
   */
  async acknowledge(id: string, acknowledgedBy: string): Promise<void> {
    await prisma.alertEvent.update({
      where: { id },
      data: {
        status: "acknowledged",
        acknowledgedBy,
        acknowledgedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Resolvaj alert
   */
  async resolve(id: string, resolvedBy: string): Promise<void> {
    await prisma.alertEvent.update({
      where: { id },
      data: {
        status: "resolved",
        resolvedBy,
        resolvedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Dismissaj alert
   */
  async dismiss(id: string): Promise<void> {
    await prisma.alertEvent.update({
      where: { id },
      data: {
        status: "dismissed",
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Izbriši stare resolved alerts
   */
  async deleteOlderThan(days: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await prisma.alertEvent.deleteMany({
      where: {
        status: "resolved",
        resolvedAt: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }

  /**
   * Pridobi statistiko alerts
   */
  async getStats(
    propertyId?: string,
    days: number = 30,
  ): Promise<{
    totalAlerts: number;
    newAlerts: number;
    acknowledgedAlerts: number;
    resolvedAlerts: number;
    criticalAlerts: number;
    averageResolutionTime: number; // hours
  }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const where: any = {
      createdAt: {
        gte: cutoffDate,
      },
    };

    if (propertyId) {
      where.propertyId = propertyId;
    }

    const alerts = await prisma.alertEvent.findMany({
      where,
    });

    const totalAlerts = alerts.length;
    const newAlerts = alerts.filter((a) => a.status === "new").length;
    const acknowledgedAlerts = alerts.filter(
      (a) => a.status === "acknowledged",
    ).length;
    const resolvedAlerts = alerts.filter((a) => a.status === "resolved").length;
    const criticalAlerts = alerts.filter(
      (a) => a.severity === "critical",
    ).length;

    const resolvedWithTime = alerts.filter((a) => a.resolvedAt && a.createdAt);
    const totalResolutionTime = resolvedWithTime.reduce((sum, a) => {
      const time =
        (a.resolvedAt!.getTime() - a.createdAt.getTime()) / (1000 * 60 * 60); // hours
      return sum + time;
    }, 0);

    const averageResolutionTime =
      resolvedWithTime.length > 0
        ? totalResolutionTime / resolvedWithTime.length
        : 0;

    return {
      totalAlerts,
      newAlerts,
      acknowledgedAlerts,
      resolvedAlerts,
      criticalAlerts,
      averageResolutionTime: Math.round(averageResolutionTime * 10) / 10,
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Preslikaj Prisma data v Domain DTO
   */
  private mapToDomain(data: any): AlertEventDTO {
    return {
      id: data.id,
      propertyId: data.propertyId,
      type: data.type,
      severity: data.severity as any,
      title: data.title,
      message: data.message,
      status: data.status as any,
      acknowledgedAt: data.acknowledgedAt,
      acknowledgedBy: data.acknowledgedBy,
      resolvedAt: data.resolvedAt,
      resolvedBy: data.resolvedBy,
      metadata: data.metadata,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
