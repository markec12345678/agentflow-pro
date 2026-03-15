/**
 * Infrastructure Implementation: Photo Repository
 *
 * Implementacija PhotoRepository interface-a z uporabo Prisma.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { PhotoRepository } from "@/core/ports/repositories";

export interface PhotoDTO {
  id: string;
  propertyId?: string;
  roomId?: string;
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  altText?: string;
  order: number;
  isPrimary: boolean;
  tags?: string[];
  metadata?: any;
  uploadedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class PhotoRepositoryImpl implements PhotoRepository {
  /**
   * Najdi photo po ID-ju
   */
  async findById(id: string): Promise<PhotoDTO | null> {
    const data = await prisma.photoAnalysis.findUnique({
      where: { id },
    });

    if (!data) {
      return null;
    }

    return this.mapToDomain(data);
  }

  /**
   * Najdi vse photos za property
   */
  async findByProperty(
    propertyId: string,
    orderBy?: string,
  ): Promise<PhotoDTO[]> {
    const data = await prisma.photoAnalysis.findMany({
      where: { propertyId },
      orderBy: { order: "asc" },
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Najdi vse photos za room
   */
  async findByRoom(roomId: string): Promise<PhotoDTO[]> {
    const data = await prisma.photoAnalysis.findMany({
      where: { roomId },
      orderBy: { order: "asc" },
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Najdi primary photo
   */
  async findPrimary(
    propertyId: string,
    roomId?: string,
  ): Promise<PhotoDTO | null> {
    const where: any = {
      propertyId,
      isPrimary: true,
    };

    if (roomId) {
      where.roomId = roomId;
    }

    const data = await prisma.photoAnalysis.findFirst({
      where,
    });

    if (!data) {
      return null;
    }

    return this.mapToDomain(data);
  }

  /**
   * Dodaj novo photo
   */
  async add(
    photo: Omit<PhotoDTO, "id" | "createdAt" | "updatedAt">,
  ): Promise<PhotoDTO> {
    const data = await prisma.photoAnalysis.create({
      data: {
        propertyId: photo.propertyId,
        roomId: photo.roomId,
        url: photo.url,
        thumbnailUrl: photo.thumbnailUrl,
        caption: photo.caption,
        altText: photo.altText,
        order: photo.order,
        isPrimary: photo.isPrimary,
        tags: photo.tags,
        metadata: photo.metadata,
        uploadedBy: photo.uploadedBy,
      },
    });

    return this.mapToDomain(data);
  }

  /**
   * Posodobi photo
   */
  async update(id: string, photo: Partial<PhotoDTO>): Promise<void> {
    await prisma.photoAnalysis.update({
      where: { id },
      data: {
        url: photo.url,
        thumbnailUrl: photo.thumbnailUrl,
        caption: photo.caption,
        altText: photo.altText,
        order: photo.order,
        isPrimary: photo.isPrimary,
        tags: photo.tags,
        metadata: photo.metadata,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Izbriši photo
   */
  async delete(id: string): Promise<void> {
    await prisma.photoAnalysis.delete({
      where: { id },
    });
  }

  /**
   * Nastavi photo kot primary
   */
  async setAsPrimary(
    id: string,
    propertyId: string,
    roomId?: string,
  ): Promise<void> {
    // First, unset all primary photos
    await prisma.photoAnalysis.updateMany({
      where: {
        propertyId,
        ...(roomId && { roomId }),
        isPrimary: true,
      },
      data: {
        isPrimary: false,
      },
    });

    // Then, set the specified photo as primary
    await prisma.photoAnalysis.update({
      where: { id },
      data: {
        isPrimary: true,
      },
    });
  }

  /**
   * Reorder photos
   */
  async reorder(photoIds: string[]): Promise<void> {
    const updates = photoIds.map((id, index) =>
      prisma.photoAnalysis.update({
        where: { id },
        data: { order: index },
      }),
    );

    await prisma.$transaction(updates);
  }

  /**
   * Bulk upload photos
   */
  async bulkAdd(
    photos: Omit<PhotoDTO, "id" | "createdAt" | "updatedAt">[],
  ): Promise<PhotoDTO[]> {
    const data = await prisma.photoAnalysis.createMany({
      data: photos.map((p) => ({
        propertyId: p.propertyId,
        roomId: p.roomId,
        url: p.url,
        thumbnailUrl: p.thumbnailUrl,
        caption: p.caption,
        altText: p.altText,
        order: p.order,
        isPrimary: p.isPrimary,
        tags: p.tags,
        metadata: p.metadata,
        uploadedBy: p.uploadedBy,
      })),
      skipDuplicates: true,
    });

    return photos.map((p, i) => ({
      ...p,
      id: `photo_${i}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Preslikaj Prisma data v Domain DTO
   */
  private mapToDomain(data: any): PhotoDTO {
    return {
      id: data.id,
      propertyId: data.propertyId,
      roomId: data.roomId,
      url: data.url,
      thumbnailUrl: data.thumbnailUrl,
      caption: data.caption,
      altText: data.altText,
      order: data.order,
      isPrimary: data.isPrimary,
      tags: data.tags,
      metadata: data.metadata,
      uploadedBy: data.uploadedBy,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
