/**
 * Infrastructure Implementation: Eco Practice Repository
 *
 * Implementacija EcoPracticeRepository interface-a z uporabo Prisma.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { EcoPracticeRepository } from "@/core/ports/repositories";

export interface EcoPracticeDTO {
  id: string;
  propertyId: string;
  name: string;
  description: string;
  category:
    | "energy"
    | "water"
    | "waste"
    | "recycling"
    | "organic"
    | "transport"
    | "other";
  isActive: boolean;
  implementedAt?: Date;
  impactScore?: number; // 1-10
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class EcoPracticeRepositoryImpl implements EcoPracticeRepository {
  /**
   * Najdi eco practice po ID-ju
   */
  async findById(id: string): Promise<EcoPracticeDTO | null> {
    const data = await prisma.ecoPractice.findUnique({
      where: { id },
    });

    if (!data) {
      return null;
    }

    return this.mapToDomain(data);
  }

  /**
   * Najdi vse eco practices za property
   */
  async findByProperty(
    propertyId: string,
    activeOnly?: boolean,
  ): Promise<EcoPracticeDTO[]> {
    const where: any = { propertyId };

    if (activeOnly) {
      where.isActive = true;
    }

    const data = await prisma.ecoPractice.findMany({
      where,
      orderBy: { category: "asc" },
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Najdi eco practices po kategoriji
   */
  async findByCategory(
    propertyId: string,
    category: string,
  ): Promise<EcoPracticeDTO[]> {
    const data = await prisma.ecoPractice.findMany({
      where: {
        propertyId,
        category,
        isActive: true,
      },
      orderBy: { name: "asc" },
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Dodaj eco practice
   */
  async add(
    practice: Omit<EcoPracticeDTO, "id" | "createdAt" | "updatedAt">,
  ): Promise<EcoPracticeDTO> {
    const data = await prisma.ecoPractice.create({
      data: {
        propertyId: practice.propertyId,
        name: practice.name,
        description: practice.description,
        category: practice.category,
        isActive: practice.isActive,
        implementedAt: practice.implementedAt,
        impactScore: practice.impactScore,
        notes: practice.notes,
      },
    });

    return this.mapToDomain(data);
  }

  /**
   * Posodobi eco practice
   */
  async update(id: string, practice: Partial<EcoPracticeDTO>): Promise<void> {
    await prisma.ecoPractice.update({
      where: { id },
      data: {
        name: practice.name,
        description: practice.description,
        category: practice.category,
        isActive: practice.isActive,
        implementedAt: practice.implementedAt,
        impactScore: practice.impactScore,
        notes: practice.notes,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Izbriši eco practice
   */
  async delete(id: string): Promise<void> {
    await prisma.ecoPractice.delete({
      where: { id },
    });
  }

  /**
   * Aktiviraj eco practice
   */
  async activate(id: string, implementedAt?: Date): Promise<void> {
    await prisma.ecoPractice.update({
      where: { id },
      data: {
        isActive: true,
        implementedAt: implementedAt || new Date(),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Deaktiviraj eco practice
   */
  async deactivate(id: string): Promise<void> {
    await prisma.ecoPractice.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Pridobi statistiko eco practices
   */
  async getStats(propertyId: string): Promise<{
    totalPractices: number;
    activePractices: number;
    practicesByCategory: { [key: string]: number };
    averageImpactScore: number;
  }> {
    const practices = await this.findByProperty(propertyId);

    const totalPractices = practices.length;
    const activePractices = practices.filter((p) => p.isActive).length;

    const practicesByCategory: { [key: string]: number } = {};
    practices.forEach((p) => {
      practicesByCategory[p.category] =
        (practicesByCategory[p.category] || 0) + 1;
    });

    const practicesWithScore = practices.filter((p) => p.impactScore);
    const totalImpactScore = practicesWithScore.reduce(
      (sum, p) => sum + (p.impactScore || 0),
      0,
    );
    const averageImpactScore =
      practicesWithScore.length > 0
        ? totalImpactScore / practicesWithScore.length
        : 0;

    return {
      totalPractices,
      activePractices,
      practicesByCategory,
      averageImpactScore: Math.round(averageImpactScore * 10) / 10,
    };
  }

  /**
   * Sinhroniziraj eco practices
   */
  async sync(
    propertyId: string,
    practices: {
      name: string;
      description: string;
      category: string;
      impactScore?: number;
    }[],
  ): Promise<void> {
    const current = await this.findByProperty(propertyId);

    // Find practices to add
    const toAdd = practices.filter(
      (p) =>
        !current.some((c) => c.name === p.name && c.category === p.category),
    );

    // Find practices to update
    const toUpdate = practices.filter((p) =>
      current.some((c) => c.name === p.name && c.category === p.category),
    );

    // Add new
    for (const practice of toAdd) {
      await this.add({
        propertyId,
        name: practice.name,
        description: practice.description,
        category: practice.category as any,
        isActive: true,
        impactScore: practice.impactScore,
      });
    }

    // Update existing
    for (const practice of toUpdate) {
      const existing = current.find(
        (c) => c.name === practice.name && c.category === practice.category,
      );
      if (existing) {
        await this.update(existing.id, {
          description: practice.description,
          impactScore: practice.impactScore,
        });
      }
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Preslikaj Prisma data v Domain DTO
   */
  private mapToDomain(data: any): EcoPracticeDTO {
    return {
      id: data.id,
      propertyId: data.propertyId,
      name: data.name,
      description: data.description,
      category: data.category as any,
      isActive: data.isActive,
      implementedAt: data.implementedAt,
      impactScore: data.impactScore,
      notes: data.notes,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
