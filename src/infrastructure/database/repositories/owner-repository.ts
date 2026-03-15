/**
 * Infrastructure Implementation: Owner Repository
 *
 * Implementacija OwnerRepository interface-a z uporabo Prisma.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { OwnerRepository } from "@/core/ports/repositories";

export interface OwnerDTO {
  id: string;
  userId: string;
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  status: "active" | "inactive" | "suspended";
  properties?: any[];
  settings?: any;
  createdAt: Date;
  updatedAt: Date;
}

export class OwnerRepositoryImpl implements OwnerRepository {
  /**
   * Najdi owner-ja po ID-ju
   */
  async findById(id: string): Promise<OwnerDTO | null> {
    const data = await prisma.owner.findUnique({
      where: { id },
      include: {
        properties: true,
      },
    });

    if (!data) {
      return null;
    }

    return this.mapToDomain(data);
  }

  /**
   * Najdi owner-ja po user-ju
   */
  async findByUserId(userId: string): Promise<OwnerDTO | null> {
    const data = await prisma.owner.findUnique({
      where: { userId },
      include: {
        properties: true,
      },
    });

    if (!data) {
      return null;
    }

    return this.mapToDomain(data);
  }

  /**
   * Najdi vse owner-je
   */
  async findAll(status?: string, limit?: number): Promise<OwnerDTO[]> {
    const where: any = {};

    if (status) {
      where.status = status;
    }

    const data = await prisma.owner.findMany({
      where,
      include: {
        properties: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit || 50,
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Ustvari novega owner-ja
   */
  async create(
    owner: Omit<OwnerDTO, "id" | "createdAt" | "updatedAt">,
  ): Promise<OwnerDTO> {
    const data = await prisma.owner.create({
      data: {
        userId: owner.userId,
        name: owner.name,
        email: owner.email,
        phone: owner.phone,
        company: owner.company,
        status: owner.status,
        settings: owner.settings,
      },
      include: {
        properties: true,
      },
    });

    return this.mapToDomain(data);
  }

  /**
   * Posodobi owner-ja
   */
  async update(id: string, owner: Partial<OwnerDTO>): Promise<void> {
    await prisma.owner.update({
      where: { id },
      data: {
        name: owner.name,
        email: owner.email,
        phone: owner.phone,
        company: owner.company,
        status: owner.status,
        settings: owner.settings,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Izbriši owner-ja (soft delete)
   */
  async delete(id: string): Promise<void> {
    await prisma.owner.update({
      where: { id },
      data: {
        status: "inactive",
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Poveži owner-ja z property-jem
   */
  async addProperty(ownerId: string, propertyId: string): Promise<void> {
    await prisma.property.update({
      where: { id: propertyId },
      data: {
        ownerId,
      },
    });
  }

  /**
   * Odstrani povezavo z property-jem
   */
  async removeProperty(ownerId: string, propertyId: string): Promise<void> {
    await prisma.property.update({
      where: { id: propertyId },
      data: {
        ownerId: null,
      },
    });
  }

  /**
   * Pridobi statistiko owner-jev
   */
  async getStats(): Promise<{
    totalOwners: number;
    activeOwners: number;
    averagePropertiesPerOwner: number;
    ownersWithMultipleProperties: number;
  }> {
    const owners = await this.findAll();

    const totalOwners = owners.length;
    const activeOwners = owners.filter((o) => o.status === "active").length;

    const propertiesByOwner: { [key: string]: number } = {};
    owners.forEach((o) => {
      const propertyCount = o.properties?.length || 0;
      propertiesByOwner[o.id] = propertyCount;
    });

    const totalProperties = Object.values(propertiesByOwner).reduce(
      (sum, count) => sum + count,
      0,
    );
    const averagePropertiesPerOwner =
      totalOwners > 0 ? totalProperties / totalOwners : 0;

    const ownersWithMultipleProperties = Object.values(
      propertiesByOwner,
    ).filter((count) => count > 1).length;

    return {
      totalOwners,
      activeOwners,
      averagePropertiesPerOwner:
        Math.round(averagePropertiesPerOwner * 10) / 10,
      ownersWithMultipleProperties,
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Preslikaj Prisma data v Domain DTO
   */
  private mapToDomain(data: any): OwnerDTO {
    return {
      id: data.id,
      userId: data.userId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      company: data.company,
      status: data.status as any,
      properties: data.properties,
      settings: data.settings,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
