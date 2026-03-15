/**
 * Alert Rule Repository Implementation
 *
 * Prisma-based repository for AlertRule entity.
 */

import { prisma } from "@/infrastructure/database/prisma";
import type {
  AlertRuleRepository,
  AlertRule,
} from "@/core/use-cases/alert-rule-management";

export class AlertRuleRepositoryImpl implements AlertRuleRepository {
  /**
   * Find alert rule by ID
   */
  async findById(id: string): Promise<AlertRule | null> {
    const data = await prisma.alertRule.findUnique({
      where: { id },
    });

    if (!data) return null;

    return this.mapToDomain(data);
  }

  /**
   * Find all alert rules
   */
  async findAll(filters?: {
    userId?: string;
    enabled?: boolean;
    severity?: string;
  }): Promise<AlertRule[]> {
    const where: any = {};

    if (filters?.userId) {
      where.userId = filters.userId;
    }

    if (filters?.enabled !== undefined) {
      where.enabled = filters.enabled;
    }

    if (filters?.severity) {
      where.severity = filters.severity;
    }

    const data = await prisma.alertRule.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return data.map((rule) => this.mapToDomain(rule));
  }

  /**
   * Save alert rule
   */
  async save(rule: AlertRule): Promise<void> {
    const data = this.mapToPrisma(rule);

    await prisma.alertRule.upsert({
      where: { id: rule.id },
      update: data,
      create: data,
    });
  }

  /**
   * Delete alert rule
   */
  async delete(id: string): Promise<void> {
    await prisma.alertRule.delete({
      where: { id },
    });
  }

  /**
   * Map Prisma data to domain entity
   */
  private mapToDomain(prismaRule: any): AlertRule {
    return {
      id: prismaRule.id,
      name: prismaRule.name,
      eventType: prismaRule.eventType,
      threshold: prismaRule.threshold,
      severity: prismaRule.severity,
      enabled: prismaRule.enabled,
      channels: prismaRule.channels || [],
      cooldownMinutes: prismaRule.cooldownMinutes,
      createdAt: prismaRule.createdAt,
      updatedAt: prismaRule.updatedAt,
    };
  }

  /**
   * Map domain entity to Prisma data
   */
  private mapToPrisma(rule: AlertRule): any {
    return {
      id: rule.id,
      name: rule.name,
      eventType: rule.eventType,
      threshold: rule.threshold,
      severity: rule.severity,
      enabled: rule.enabled,
      channels: rule.channels,
      cooldownMinutes: rule.cooldownMinutes,
      updatedAt: new Date(),
    };
  }
}
