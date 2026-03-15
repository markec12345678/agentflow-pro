/**
 * Infrastructure Implementation: PMS Connection Repository
 *
 * Implementacija PmsConnectionRepository interface-a z uporabo Prisma.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { PmsConnectionRepository } from "@/core/ports/repositories";

export interface PmsConnectionDTO {
  id: string;
  propertyId: string;
  provider: string;
  credentials: any;
  settings: any;
  status: "connected" | "disconnected" | "error";
  lastSyncAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class PmsConnectionRepositoryImpl implements PmsConnectionRepository {
  /**
   * Najdi connection po ID-ju
   */
  async findById(id: string): Promise<PmsConnectionDTO | null> {
    const data = await prisma.pmsConnection.findUnique({
      where: { id },
    });

    if (!data) {
      return null;
    }

    return this.mapToDomain(data);
  }

  /**
   * Najdi vse connections za property
   */
  async findByProperty(propertyId: string): Promise<PmsConnectionDTO[]> {
    const data = await prisma.pmsConnection.findMany({
      where: { propertyId },
      orderBy: { createdAt: "desc" },
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Najdi connection po provider-ju
   */
  async findByProvider(
    propertyId: string,
    provider: string,
  ): Promise<PmsConnectionDTO | null> {
    const data = await prisma.pmsConnection.findFirst({
      where: {
        propertyId,
        provider,
      },
    });

    if (!data) {
      return null;
    }

    return this.mapToDomain(data);
  }

  /**
   * Shrani connection (create ali update)
   */
  async save(connection: PmsConnectionDTO): Promise<void> {
    await prisma.pmsConnection.upsert({
      where: { id: connection.id },
      update: {
        credentials: connection.credentials,
        settings: connection.settings,
        status: connection.status,
        lastSyncAt: connection.lastSyncAt,
        isActive: connection.isActive,
        updatedAt: new Date(),
      },
      create: {
        id: connection.id,
        propertyId: connection.propertyId,
        provider: connection.provider,
        credentials: connection.credentials,
        settings: connection.settings,
        status: connection.status,
        isActive: connection.isActive,
        createdAt: connection.createdAt,
        updatedAt: connection.updatedAt,
      },
    });
  }

  /**
   * Izbriši connection
   */
  async delete(id: string): Promise<void> {
    await prisma.pmsConnection.delete({
      where: { id },
    });
  }

  /**
   * Posodobi status
   */
  async updateStatus(
    id: string,
    status: "connected" | "disconnected" | "error",
  ): Promise<void> {
    await prisma.pmsConnection.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Posodobi last sync time
   */
  async updateLastSync(id: string, lastSyncAt: Date): Promise<void> {
    await prisma.pmsConnection.update({
      where: { id },
      data: {
        lastSyncAt,
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
  private mapToDomain(data: any): PmsConnectionDTO {
    return {
      id: data.id,
      propertyId: data.propertyId,
      provider: data.provider,
      credentials: data.credentials,
      settings: data.settings || {},
      status: data.status as any,
      lastSyncAt: data.lastSyncAt,
      isActive: data.isActive,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
