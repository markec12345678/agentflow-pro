/**
 * Infrastructure Implementation: Template Usage Repository
 *
 * Implementacija TemplateUsageRepository interface-a z uporabo Prisma.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { TemplateUsageRepository } from "@/core/ports/repositories";

export interface TemplateUsageDTO {
  id: string;
  templateId: string;
  system: string;
  count: number;
  lastUsed: Date;
  totalRenderTime: number; // milliseconds
  errorCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export class TemplateUsageRepositoryImpl implements TemplateUsageRepository {
  /**
   * Najdi usage po template ID-ju
   */
  async findByTemplate(templateId: string): Promise<TemplateUsageDTO | null> {
    const data = await prisma.templateUsage.findUnique({
      where: {
        templateId_system: {
          templateId,
          system: "email",
        },
      },
    });

    if (!data) {
      return null;
    }

    return this.mapToDomain(data);
  }

  /**
   * Najdi vse usage za system
   */
  async findBySystem(system: string): Promise<TemplateUsageDTO[]> {
    const data = await prisma.templateUsage.findMany({
      where: { system },
      orderBy: { count: "desc" },
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Zabeleži uporabo template-a
   */
  async trackUsage(
    templateId: string,
    system: string,
    renderTime?: number,
    error?: boolean,
  ): Promise<void> {
    await prisma.templateUsage.upsert({
      where: {
        templateId_system: {
          templateId,
          system,
        },
      },
      update: {
        count: { increment: 1 },
        totalRenderTime: { increment: renderTime || 0 },
        errorCount: { increment: error ? 1 : 0 },
        lastUsed: new Date(),
        updatedAt: new Date(),
      },
      create: {
        templateId,
        system,
        count: 1,
        totalRenderTime: renderTime || 0,
        errorCount: error ? 1 : 0,
        lastUsed: new Date(),
      },
    });
  }

  /**
   * Pridobi statistiko usage
   */
  async getStats(system?: string): Promise<{
    totalTemplates: number;
    totalUses: number;
    averageRenderTime: number;
    errorRate: number;
    mostUsedTemplates: TemplateUsageDTO[];
  }> {
    const where = system ? { system } : {};

    const usages = await prisma.templateUsage.findMany({
      where,
    });

    const totalTemplates = usages.length;
    const totalUses = usages.reduce((sum, u) => sum + u.count, 0);
    const totalRenderTime = usages.reduce(
      (sum, u) => sum + u.totalRenderTime,
      0,
    );
    const totalErrors = usages.reduce((sum, u) => sum + u.errorCount, 0);

    const averageRenderTime = totalUses > 0 ? totalRenderTime / totalUses : 0;
    const errorRate = totalUses > 0 ? (totalErrors / totalUses) * 100 : 0;

    const mostUsedTemplates = usages
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map((u) => this.mapToDomain(u));

    return {
      totalTemplates,
      totalUses,
      averageRenderTime: Math.round(averageRenderTime),
      errorRate: Math.round(errorRate * 100) / 100,
      mostUsedTemplates,
    };
  }

  /**
   * Resetiraj usage statistiko
   */
  async reset(templateId?: string, system?: string): Promise<void> {
    const where: any = {};

    if (templateId) {
      where.templateId = templateId;
    }

    if (system) {
      where.system = system;
    }

    await prisma.templateUsage.updateMany({
      where,
      data: {
        count: 0,
        totalRenderTime: 0,
        errorCount: 0,
        updatedAt: new Date(),
      },
    });
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Preslikaj Prisma data v Domain DTO
   */
  private mapToDomain(data: any): TemplateUsageDTO {
    return {
      id: data.id,
      templateId: data.templateId,
      system: data.system,
      count: data.count,
      lastUsed: data.lastUsed,
      totalRenderTime: data.totalRenderTime,
      errorCount: data.errorCount,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
