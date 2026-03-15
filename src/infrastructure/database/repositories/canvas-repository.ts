/**
 * Infrastructure Implementation: Canvas Repository
 *
 * Implementacija CanvasRepository interface-a z uporabo Prisma.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { CanvasRepository } from "@/core/ports/repositories";

export interface CanvasDTO {
  id: string;
  name: string;
  userId: string;
  type: "whiteboard" | "diagram" | "mindmap" | "flowchart" | "other";
  data: any;
  settings?: any;
  isPublished: boolean;
  collaborators?: string[];
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export class CanvasRepositoryImpl implements CanvasRepository {
  /**
   * Najdi canvas po ID-ju
   */
  async findById(id: string): Promise<CanvasDTO | null> {
    const data = await prisma.canvas.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!data) {
      return null;
    }

    return this.mapToDomain(data);
  }

  /**
   * Najdi vse canvase za user-ja
   */
  async findByUser(userId: string, type?: string): Promise<CanvasDTO[]> {
    const where: any = { userId };

    if (type) {
      where.type = type;
    }

    const data = await prisma.canvas.findMany({
      where,
      include: {
        user: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Ustvari nov canvas
   */
  async create(
    canvas: Omit<CanvasDTO, "id" | "createdAt" | "updatedAt">,
  ): Promise<CanvasDTO> {
    const data = await prisma.canvas.create({
      data: {
        name: canvas.name,
        userId: canvas.userId,
        type: canvas.type,
        data: canvas.data,
        settings: canvas.settings,
        isPublished: canvas.isPublished,
        collaborators: canvas.collaborators,
        tags: canvas.tags,
      },
      include: {
        user: true,
      },
    });

    return this.mapToDomain(data);
  }

  /**
   * Posodobi canvas
   */
  async update(id: string, canvas: Partial<CanvasDTO>): Promise<void> {
    await prisma.canvas.update({
      where: { id },
      data: {
        name: canvas.name,
        type: canvas.type,
        data: canvas.data,
        settings: canvas.settings,
        isPublished: canvas.isPublished,
        collaborators: canvas.collaborators,
        tags: canvas.tags,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Izbriši canvas
   */
  async delete(id: string): Promise<void> {
    await prisma.canvas.delete({
      where: { id },
    });
  }

  /**
   * Dodaj collaborator-ja
   */
  async addCollaborator(id: string, userId: string): Promise<void> {
    const canvas = await this.findById(id);

    if (!canvas) {
      throw new Error("Canvas not found");
    }

    const collaborators = canvas.collaborators || [];
    if (!collaborators.includes(userId)) {
      collaborators.push(userId);
    }

    await this.update(id, { collaborators });
  }

  /**
   * Odstrani collaborator-ja
   */
  async removeCollaborator(id: string, userId: string): Promise<void> {
    const canvas = await this.findById(id);

    if (!canvas) {
      throw new Error("Canvas not found");
    }

    const collaborators = (canvas.collaborators || []).filter(
      (id) => id !== userId,
    );

    await this.update(id, { collaborators });
  }

  /**
   * Pridobi statistiko canvas-ov
   */
  async getStats(userId?: string): Promise<{
    totalCanvases: number;
    publishedCanvases: number;
    canvasesByType: { [key: string]: number };
    totalCollaborators: number;
  }> {
    const where = userId ? { userId } : {};

    const canvases = await prisma.canvas.findMany({
      where,
    });

    const totalCanvases = canvases.length;
    const publishedCanvases = canvases.filter((c) => c.isPublished).length;

    const canvasesByType: { [key: string]: number } = {};
    canvases.forEach((c) => {
      canvasesByType[c.type] = (canvasesByType[c.type] || 0) + 1;
    });

    const totalCollaborators = canvases.reduce((sum, c) => {
      return sum + (c.collaborators?.length || 0);
    }, 0);

    return {
      totalCanvases,
      publishedCanvases,
      canvasesByType,
      totalCollaborators,
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Preslikaj Prisma data v Domain DTO
   */
  private mapToDomain(data: any): CanvasDTO {
    return {
      id: data.id,
      name: data.name,
      userId: data.userId,
      type: data.type as any,
      data: data.data,
      settings: data.settings,
      isPublished: data.isPublished,
      collaborators: data.collaborators,
      tags: data.tags,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
