/**
 * Infrastructure Implementation: Page Design Repository
 *
 * Implementacija PageDesignRepository interface-a z uporabo Prisma.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { PageDesignRepository } from "@/core/ports/repositories";

export interface PageDesignDTO {
  id: string;
  name: string;
  userId: string;
  propertyId?: string;
  type: "landing" | "dashboard" | "booking" | "custom";
  template?: string;
  layout: any;
  styles: any;
  components: any[];
  settings: any;
  isPublished: boolean;
  publishedUrl?: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export class PageDesignRepositoryImpl implements PageDesignRepository {
  /**
   * Najdi page design po ID-ju
   */
  async findById(id: string): Promise<PageDesignDTO | null> {
    const data = await prisma.pageDesign.findUnique({
      where: { id },
      include: {
        user: true,
        properties: true,
      },
    });

    if (!data) {
      return null;
    }

    return this.mapToDomain(data);
  }

  /**
   * Najdi vse page design-e za user-ja
   */
  async findByUser(userId: string, type?: string): Promise<PageDesignDTO[]> {
    const where: any = { userId };

    if (type) {
      where.type = type;
    }

    const data = await prisma.pageDesign.findMany({
      where,
      include: {
        properties: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Najdi page design-e za property
   */
  async findByProperty(propertyId: string): Promise<PageDesignDTO[]> {
    const data = await prisma.pageDesign.findMany({
      where: {
        properties: {
          some: {
            id: propertyId,
          },
        },
      },
      include: {
        user: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Ustvari nov page design
   */
  async create(
    design: Omit<PageDesignDTO, "id" | "createdAt" | "updatedAt" | "version">,
  ): Promise<PageDesignDTO> {
    const data = await prisma.pageDesign.create({
      data: {
        name: design.name,
        userId: design.userId,
        type: design.type,
        template: design.template,
        layout: design.layout,
        styles: design.styles,
        components: design.components,
        settings: design.settings,
        isPublished: design.isPublished,
        publishedUrl: design.publishedUrl,
      },
      include: {
        properties: true,
      },
    });

    return this.mapToDomain(data);
  }

  /**
   * Posodobi page design
   */
  async update(id: string, design: Partial<PageDesignDTO>): Promise<void> {
    await prisma.pageDesign.update({
      where: { id },
      data: {
        name: design.name,
        type: design.type,
        template: design.template,
        layout: design.layout,
        styles: design.styles,
        components: design.components,
        settings: design.settings,
        isPublished: design.isPublished,
        publishedUrl: design.publishedUrl,
        version: { increment: 1 },
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Izbriši page design
   */
  async delete(id: string): Promise<void> {
    await prisma.pageDesign.delete({
      where: { id },
    });
  }

  /**
   * Objavi page design
   */
  async publish(id: string, publishedUrl?: string): Promise<void> {
    await prisma.pageDesign.update({
      where: { id },
      data: {
        isPublished: true,
        publishedUrl,
        version: { increment: 1 },
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Poveži page design s property-jem
   */
  async addProperty(id: string, propertyId: string): Promise<void> {
    await prisma.pageDesign.update({
      where: { id },
      data: {
        properties: {
          connect: { id: propertyId },
        },
      },
    });
  }

  /**
   * Odstrani povezavo s property-jem
   */
  async removeProperty(id: string, propertyId: string): Promise<void> {
    await prisma.pageDesign.update({
      where: { id },
      data: {
        properties: {
          disconnect: { id: propertyId },
        },
      },
    });
  }

  /**
   * Pridobi statistiko page design-ov
   */
  async getStats(userId?: string): Promise<{
    totalDesigns: number;
    publishedDesigns: number;
    designsByType: { [key: string]: number };
    averageVersion: number;
  }> {
    const where = userId ? { userId } : {};

    const designs = await prisma.pageDesign.findMany({
      where,
    });

    const totalDesigns = designs.length;
    const publishedDesigns = designs.filter((d) => d.isPublished).length;

    const designsByType: { [key: string]: number } = {};
    designs.forEach((d) => {
      designsByType[d.type] = (designsByType[d.type] || 0) + 1;
    });

    const totalVersion = designs.reduce((sum, d) => sum + d.version, 0);
    const averageVersion = totalDesigns > 0 ? totalVersion / totalDesigns : 0;

    return {
      totalDesigns,
      publishedDesigns,
      designsByType,
      averageVersion: Math.round(averageVersion * 10) / 10,
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Preslikaj Prisma data v Domain DTO
   */
  private mapToDomain(data: any): PageDesignDTO {
    return {
      id: data.id,
      name: data.name,
      userId: data.userId,
      propertyId: data.propertyId,
      type: data.type as any,
      template: data.template,
      layout: data.layout,
      styles: data.styles,
      components: data.components,
      settings: data.settings,
      isPublished: data.isPublished,
      publishedUrl: data.publishedUrl,
      version: data.version,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
