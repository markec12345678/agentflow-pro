/**
 * Infrastructure Implementation: Policy Repository
 *
 * Implementacija PolicyRepository interface-a z uporabo Prisma.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { PolicyRepository } from "@/core/ports/repositories";

export interface PolicyDTO {
  id: string;
  propertyId: string;
  type:
    | "cancellation"
    | "check_in"
    | "check_out"
    | "pets"
    | "smoking"
    | "parties"
    | "children";
  title: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class PolicyRepositoryImpl implements PolicyRepository {
  /**
   * Najdi policy po ID-ju
   */
  async findById(id: string): Promise<PolicyDTO | null> {
    const data = await prisma.propertyPolicy.findUnique({
      where: { id },
    });

    if (!data) {
      return null;
    }

    return this.mapToDomain(data);
  }

  /**
   * Najdi vse policies za property
   */
  async findByProperty(propertyId: string): Promise<PolicyDTO[]> {
    const data = await prisma.propertyPolicy.findMany({
      where: {
        propertyId,
        isActive: true,
      },
      orderBy: { type: "asc" },
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Najdi policy po tipu
   */
  async findByType(
    propertyId: string,
    type: string,
  ): Promise<PolicyDTO | null> {
    const data = await prisma.propertyPolicy.findFirst({
      where: {
        propertyId,
        type,
        isActive: true,
      },
    });

    if (!data) {
      return null;
    }

    return this.mapToDomain(data);
  }

  /**
   * Dodaj policy property-ju
   */
  async add(
    propertyId: string,
    policy: Omit<PolicyDTO, "id" | "propertyId" | "createdAt" | "updatedAt">,
  ): Promise<PolicyDTO> {
    const data = await prisma.propertyPolicy.create({
      data: {
        propertyId,
        type: policy.type,
        title: policy.title,
        description: policy.description,
        isActive: policy.isActive,
      },
    });

    return this.mapToDomain(data);
  }

  /**
   * Odstrani policy
   */
  async remove(id: string): Promise<void> {
    await prisma.propertyPolicy.delete({
      where: { id },
    });
  }

  /**
   * Posodobi policy
   */
  async update(id: string, policy: Partial<PolicyDTO>): Promise<void> {
    await prisma.propertyPolicy.update({
      where: { id },
      data: {
        title: policy.title,
        description: policy.description,
        isActive: policy.isActive,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Sinhroniziraj policies
   */
  async sync(
    propertyId: string,
    policies: {
      type: string;
      title: string;
      description: string;
    }[],
  ): Promise<void> {
    // Get current policies
    const current = await this.findByProperty(propertyId);

    // Find policies to remove
    const toRemove = current.filter(
      (p) => !policies.some((pol) => pol.type === p.type),
    );

    // Find policies to add/update
    const toAdd = policies.filter(
      (pol) => !current.some((p) => p.type === pol.type),
    );

    const toUpdate = policies.filter((pol) =>
      current.some((p) => p.type === pol.type),
    );

    // Remove old
    for (const policy of toRemove) {
      await this.remove(policy.id);
    }

    // Add new
    for (const policy of toAdd) {
      await this.add(propertyId, {
        type: policy.type as any,
        title: policy.title,
        description: policy.description,
        isActive: true,
      });
    }

    // Update existing
    for (const policy of toUpdate) {
      const existing = current.find((p) => p.type === policy.type);
      if (existing) {
        await this.update(existing.id, {
          title: policy.title,
          description: policy.description,
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
  private mapToDomain(data: any): PolicyDTO {
    return {
      id: data.id,
      propertyId: data.propertyId,
      type: data.type as any,
      title: data.title,
      description: data.description,
      isActive: data.isActive,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
