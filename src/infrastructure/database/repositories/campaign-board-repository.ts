/**
 * Infrastructure Implementation: Campaign Board Repository
 *
 * Implementacija CampaignBoardRepository interface-a z uporabo Prisma.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { CampaignBoardRepository } from "@/core/ports/repositories";

export interface CampaignBoardDTO {
  id: string;
  name: string;
  teamId: string;
  workspaceId?: string;
  userId: string;
  type?: string;
  status: "active" | "archived" | "deleted";
  data?: any;
  settings?: any;
  createdAt: Date;
  updatedAt: Date;
}

export class CampaignBoardRepositoryImpl implements CampaignBoardRepository {
  /**
   * Najdi campaign board po ID-ju
   */
  async findById(id: string): Promise<CampaignBoardDTO | null> {
    const data = await prisma.campaignBoard.findUnique({
      where: { id },
      include: {
        team: true,
        workspace: true,
        user: true,
      },
    });

    if (!data) {
      return null;
    }

    return this.mapToDomain(data);
  }

  /**
   * Najdi vse campaign boards za team
   */
  async findByTeam(
    teamId: string,
    status?: string,
  ): Promise<CampaignBoardDTO[]> {
    const where: any = { teamId };

    if (status) {
      where.status = status;
    }

    const data = await prisma.campaignBoard.findMany({
      where,
      include: {
        team: true,
        workspace: true,
        user: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Najdi campaign boards za workspace
   */
  async findByWorkspace(workspaceId: string): Promise<CampaignBoardDTO[]> {
    const data = await prisma.campaignBoard.findMany({
      where: { workspaceId },
      include: {
        team: true,
        workspace: true,
        user: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Najdi campaign boards za user-ja
   */
  async findByUser(userId: string): Promise<CampaignBoardDTO[]> {
    const data = await prisma.campaignBoard.findMany({
      where: { userId },
      include: {
        team: true,
        workspace: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Ustvari nov campaign board
   */
  async create(
    board: Omit<CampaignBoardDTO, "id" | "createdAt" | "updatedAt">,
  ): Promise<CampaignBoardDTO> {
    const data = await prisma.campaignBoard.create({
      data: {
        name: board.name,
        teamId: board.teamId,
        workspaceId: board.workspaceId,
        userId: board.userId,
        type: board.type,
        status: board.status,
        data: board.data,
        settings: board.settings,
      },
      include: {
        team: true,
      },
    });

    return this.mapToDomain(data);
  }

  /**
   * Posodobi campaign board
   */
  async update(id: string, board: Partial<CampaignBoardDTO>): Promise<void> {
    await prisma.campaignBoard.update({
      where: { id },
      data: {
        name: board.name,
        type: board.type,
        status: board.status,
        data: board.data,
        settings: board.settings,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Izbriši campaign board (soft delete)
   */
  async delete(id: string): Promise<void> {
    await prisma.campaignBoard.update({
      where: { id },
      data: {
        status: "deleted",
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Arhiviraj campaign board
   */
  async archive(id: string): Promise<void> {
    await prisma.campaignBoard.update({
      where: { id },
      data: {
        status: "archived",
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Pridobi statistiko campaign boards
   */
  async getStats(teamId?: string): Promise<{
    totalBoards: number;
    activeBoards: number;
    archivedBoards: number;
    boardsByType: { [key: string]: number };
    boardsByWorkspace: { [key: string]: number };
  }> {
    const where = teamId ? { teamId } : {};

    const boards = await prisma.campaignBoard.findMany({
      where,
    });

    const totalBoards = boards.length;
    const activeBoards = boards.filter((b) => b.status === "active").length;
    const archivedBoards = boards.filter((b) => b.status === "archived").length;

    const boardsByType: { [key: string]: number } = {};
    const boardsByWorkspace: { [key: string]: number } = {};

    boards.forEach((b) => {
      boardsByType[b.type || "unknown"] =
        (boardsByType[b.type || "unknown"] || 0) + 1;
      boardsByWorkspace[b.workspaceId || "no-workspace"] =
        (boardsByWorkspace[b.workspaceId || "no-workspace"] || 0) + 1;
    });

    return {
      totalBoards,
      activeBoards,
      archivedBoards,
      boardsByType,
      boardsByWorkspace,
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Preslikaj Prisma data v Domain DTO
   */
  private mapToDomain(data: any): CampaignBoardDTO {
    return {
      id: data.id,
      name: data.name,
      teamId: data.teamId,
      workspaceId: data.workspaceId,
      userId: data.userId,
      type: data.type,
      status: data.status as any,
      data: data.data,
      settings: data.settings,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
