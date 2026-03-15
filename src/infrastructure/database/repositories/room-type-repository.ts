/**
 * Infrastructure Implementation: Room Type Repository
 *
 * Implementacija RoomTypeRepository interface-a z uporabo Prisma.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { RoomTypeRepository } from "@/core/ports/repositories";

export interface RoomTypeDTO {
  id: string;
  propertyId?: string;
  name: string;
  description?: string;
  maxOccupancy: number;
  basePrice: number;
  currency: string;
  amenities: string[];
  photos: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class RoomTypeRepositoryImpl implements RoomTypeRepository {
  /**
   * Najdi room type po ID-ju
   */
  async findById(id: string): Promise<RoomTypeDTO | null> {
    const data = await prisma.room.findUnique({
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
   * Najdi vse room types za property
   */
  async findByProperty(propertyId: string): Promise<RoomTypeDTO[]> {
    const data = await prisma.room.findMany({
      where: { propertyId },
      include: {
        property: true,
      },
      orderBy: { basePrice: "asc" },
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Ustvari nov room type
   */
  async create(
    roomType: Omit<RoomTypeDTO, "id" | "createdAt" | "updatedAt">,
  ): Promise<RoomTypeDTO> {
    const data = await prisma.room.create({
      data: {
        propertyId: roomType.propertyId!,
        name: roomType.name,
        type: roomType.name,
        capacity: roomType.maxOccupancy,
        basePrice: roomType.basePrice,
        description: roomType.description,
        amenities: roomType.amenities,
        photos: roomType.photos,
      },
      include: {
        property: true,
      },
    });

    return this.mapToDomain(data);
  }

  /**
   * Posodobi room type
   */
  async update(id: string, roomType: Partial<RoomTypeDTO>): Promise<void> {
    await prisma.room.update({
      where: { id },
      data: {
        name: roomType.name,
        type: roomType.name,
        capacity: roomType.maxOccupancy,
        basePrice: roomType.basePrice,
        description: roomType.description,
        amenities: roomType.amenities,
        photos: roomType.photos,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Izbriši room type
   */
  async delete(id: string): Promise<void> {
    await prisma.room.delete({
      where: { id },
    });
  }

  /**
   * Aktiviraj room type
   */
  async activate(id: string): Promise<void> {
    // Note: This might need a status field in schema
    await prisma.room.update({
      where: { id },
      data: {
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Deaktiviraj room type
   */
  async deactivate(id: string): Promise<void> {
    // Note: This might need a status field in schema
    await prisma.room.update({
      where: { id },
      data: {
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Pridobi statistiko room types
   */
  async getStats(propertyId?: string): Promise<{
    totalRoomTypes: number;
    activeRoomTypes: number;
    averagePrice: number;
    averageOccupancy: number;
    roomTypesByOccupancy: { [key: number]: number };
  }> {
    const where = propertyId ? { propertyId } : {};

    const roomTypes = await prisma.room.findMany({
      where,
    });

    const totalRoomTypes = roomTypes.length;
    const activeRoomTypes = roomTypes.filter((r) => r.basePrice > 0).length;

    const averagePrice =
      roomTypes.reduce((sum, r) => sum + (r.basePrice || 0), 0) /
      (totalRoomTypes || 1);
    const averageOccupancy =
      roomTypes.reduce((sum, r) => sum + r.capacity, 0) / (totalRoomTypes || 1);

    const roomTypesByOccupancy: { [key: number]: number } = {};
    roomTypes.forEach((r) => {
      roomTypesByOccupancy[r.capacity] =
        (roomTypesByOccupancy[r.capacity] || 0) + 1;
    });

    return {
      totalRoomTypes,
      activeRoomTypes,
      averagePrice: Math.round(averagePrice * 100) / 100,
      averageOccupancy: Math.round(averageOccupancy),
      roomTypesByOccupancy,
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Preslikaj Prisma data v Domain DTO
   */
  private mapToDomain(data: any): RoomTypeDTO {
    return {
      id: data.id,
      propertyId: data.propertyId,
      name: data.name,
      description: data.description,
      maxOccupancy: data.capacity,
      basePrice: data.basePrice,
      currency: "EUR",
      amenities: data.amenities || [],
      photos: data.photos || [],
      isActive: true,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
