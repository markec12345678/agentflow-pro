/**
 * Infrastructure Implementation: Tax Repository
 *
 * Implementacija TaxRepository interface-a z uporabo Prisma.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { TaxRepository } from "@/core/ports/repositories";

export interface TaxDTO {
  id: string;
  propertyId: string;
  name: string;
  type: "percentage" | "fixed" | "per_night" | "per_person";
  rate: number;
  currency?: string;
  isInclusive: boolean;
  appliesTo: "room" | "booking" | "person" | "night";
  isActive: boolean;
  validFrom?: Date;
  validTo?: Date;
  description?: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export class TaxRepositoryImpl implements TaxRepository {
  /**
   * Najdi tax po ID-ju
   */
  async findById(id: string): Promise<TaxDTO | null> {
    const data = await prisma.propertyPolicy.findUnique({
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
   * Najdi vse taxes za property
   */
  async findByProperty(propertyId: string): Promise<TaxDTO[]> {
    const data = await prisma.propertyPolicy.findMany({
      where: { propertyId },
      include: {
        property: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Ustvari nov tax
   */
  async create(
    tax: Omit<TaxDTO, "id" | "createdAt" | "updatedAt">,
  ): Promise<TaxDTO> {
    const data = await prisma.propertyPolicy.create({
      data: {
        propertyId: tax.propertyId,
        type: tax.type,
        description: tax.description,
        active: tax.isActive,
      },
      include: {
        property: true,
      },
    });

    return this.mapToDomain(data);
  }

  /**
   * Posodobi tax
   */
  async update(id: string, tax: Partial<TaxDTO>): Promise<void> {
    await prisma.propertyPolicy.update({
      where: { id },
      data: {
        type: tax.type,
        description: tax.description,
        active: tax.isActive,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Aktiviraj tax
   */
  async activate(id: string): Promise<void> {
    await prisma.propertyPolicy.update({
      where: { id },
      data: {
        active: true,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Deaktiviraj tax
   */
  async deactivate(id: string): Promise<void> {
    await prisma.propertyPolicy.update({
      where: { id },
      data: {
        active: false,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Izbriši tax
   */
  async delete(id: string): Promise<void> {
    await prisma.propertyPolicy.delete({
      where: { id },
    });
  }

  /**
   * Pridobi statistiko taxes
   */
  async getStats(propertyId?: string): Promise<{
    totalTaxes: number;
    activeTaxes: number;
    taxesByType: { [key: string]: number };
    averageRate: number;
  }> {
    const where = propertyId ? { propertyId } : {};

    const taxes = await prisma.propertyPolicy.findMany({
      where,
    });

    const totalTaxes = taxes.length;
    const activeTaxes = taxes.filter((t) => t.active).length;

    const taxesByType: { [key: string]: number } = {};
    taxes.forEach((t) => {
      taxesByType[t.type] = (taxesByType[t.type] || 0) + 1;
    });

    const averageRate = 0; // Note: Rate field might not exist in property_policy table

    return {
      totalTaxes,
      activeTaxes,
      taxesByType,
      averageRate,
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Preslikaj Prisma data v Domain DTO
   */
  private mapToDomain(data: any): TaxDTO {
    return {
      id: data.id,
      propertyId: data.propertyId,
      name: data.type,
      type: data.type as any,
      rate: 0,
      currency: "EUR",
      isInclusive: false,
      appliesTo: "booking",
      isActive: data.active,
      validFrom: undefined,
      validTo: undefined,
      description: data.description,
      metadata: data.metadata,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
