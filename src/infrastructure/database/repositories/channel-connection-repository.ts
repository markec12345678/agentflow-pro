/**
 * Infrastructure Implementation: Channel Connection Repository
 *
 * Implementacija ChannelConnectionRepository interface-a z uporabo Prisma.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { ChannelConnectionRepository } from "@/core/ports/repositories";

export interface ChannelConnectionDTO {
  id: string;
  propertyId: string;
  channel: string;
  status: "connected" | "disconnected" | "error";
  credentials: any;
  settings: any;
  lastSyncAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class ChannelConnectionRepositoryImpl implements ChannelConnectionRepository {
  /**
   * Najdi connection po ID-ju
   */
  async findById(id: string): Promise<ChannelConnectionDTO | null> {
    const data = await prisma.channelConnection.findUnique({
      where: { id },
    });

    if (!data) {
      return null;
    }

    return this.mapToDomain(data);
  }

  /**
   * Najdi vse connection-e za property
   */
  async findByProperty(propertyId: string): Promise<ChannelConnectionDTO[]> {
    const data = await prisma.channelConnection.findMany({
      where: { propertyId },
      orderBy: { createdAt: "desc" },
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Najdi connection po channel-u
   */
  async findByChannel(
    propertyId: string,
    channel: string,
  ): Promise<ChannelConnectionDTO | null> {
    const data = await prisma.channelConnection.findFirst({
      where: {
        propertyId,
        channel,
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
  async save(connection: ChannelConnectionDTO): Promise<void> {
    await prisma.channelConnection.upsert({
      where: { id: connection.id },
      update: {
        status: connection.status,
        credentials: connection.credentials,
        settings: connection.settings,
        lastSyncAt: connection.lastSyncAt,
        isActive: connection.isActive,
        updatedAt: new Date(),
      },
      create: {
        id: connection.id,
        propertyId: connection.propertyId,
        channel: connection.channel,
        status: connection.status,
        credentials: connection.credentials,
        settings: connection.settings,
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
    await prisma.channelConnection.delete({
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
    await prisma.channelConnection.update({
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
    await prisma.channelConnection.update({
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
  private mapToDomain(data: any): ChannelConnectionDTO {
    return {
      id: data.id,
      propertyId: data.propertyId,
      channel: data.channel,
      status: data.status as any,
      credentials: data.credentials,
      settings: data.settings,
      lastSyncAt: data.lastSyncAt,
      isActive: data.isActive,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
