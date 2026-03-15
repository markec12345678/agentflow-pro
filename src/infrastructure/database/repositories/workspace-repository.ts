/**
 * Infrastructure Implementation: Workspace Repository
 *
 * Implementacija WorkspaceRepository interface-a z uporabo Prisma.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { WorkspaceRepository } from "@/core/ports/repositories";

export interface WorkspaceDTO {
  id: string;
  teamId: string;
  name: string;
  type: string;
  description?: string;
  settings?: any;
  status: "active" | "inactive" | "deleted";
  createdAt: Date;
  updatedAt: Date;
}

export class WorkspaceRepositoryImpl implements WorkspaceRepository {
  /**
   * Najdi workspace po ID-ju
   */
  async findById(id: string): Promise<WorkspaceDTO | null> {
    const data = await prisma.workspace.findUnique({
      where: { id },
      include: {
        team: true,
        campaignBoards: true,
      },
    });

    if (!data) {
      return null;
    }

    return this.mapToDomain(data);
  }

  /**
   * Najdi vse workspace za team
   */
  async findByTeam(teamId: string, status?: string): Promise<WorkspaceDTO[]> {
    const where: any = { teamId };

    if (status) {
      where.status = status;
    }

    const data = await prisma.workspace.findMany({
      where,
      include: {
        team: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Ustvari nov workspace
   */
  async create(
    workspace: Omit<WorkspaceDTO, "id" | "createdAt" | "updatedAt">,
  ): Promise<WorkspaceDTO> {
    const data = await prisma.workspace.create({
      data: {
        teamId: workspace.teamId,
        name: workspace.name,
        type: workspace.type,
        description: workspace.description,
        settings: workspace.settings,
        status: workspace.status,
      },
      include: {
        team: true,
      },
    });

    return this.mapToDomain(data);
  }

  /**
   * Posodobi workspace
   */
  async update(id: string, workspace: Partial<WorkspaceDTO>): Promise<void> {
    await prisma.workspace.update({
      where: { id },
      data: {
        name: workspace.name,
        type: workspace.type,
        description: workspace.description,
        settings: workspace.settings,
        status: workspace.status,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Izbriši workspace (soft delete)
   */
  async delete(id: string): Promise<void> {
    await prisma.workspace.update({
      where: { id },
      data: {
        status: "deleted",
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Pridobi statistiko workspace-ov
   */
  async getStats(teamId?: string): Promise<{
    totalWorkspaces: number;
    activeWorkspaces: number;
    workspacesByType: { [key: string]: number };
    averageCampaignsPerWorkspace: number;
  }> {
    const where = teamId ? { teamId } : {};

    const workspaces = await prisma.workspace.findMany({
      where,
    });

    const totalWorkspaces = workspaces.length;
    const activeWorkspaces = workspaces.filter(
      (w) => w.status === "active",
    ).length;

    const workspacesByType: { [key: string]: number } = {};
    workspaces.forEach((w) => {
      workspacesByType[w.type] = (workspacesByType[w.type] || 0) + 1;
    });

    const campaigns = await prisma.campaignBoard.findMany({
      select: {
        workspaceId: true,
      },
    });

    const campaignsByWorkspace: { [key: string]: number } = {};
    campaigns.forEach((c) => {
      campaignsByWorkspace[c.workspaceId] =
        (campaignsByWorkspace[c.workspaceId] || 0) + 1;
    });

    const totalCampaigns = Object.values(campaignsByWorkspace).reduce(
      (sum, count) => sum + count,
      0,
    );
    const averageCampaignsPerWorkspace =
      totalWorkspaces > 0 ? totalCampaigns / totalWorkspaces : 0;

    return {
      totalWorkspaces,
      activeWorkspaces,
      workspacesByType,
      averageCampaignsPerWorkspace:
        Math.round(averageCampaignsPerWorkspace * 10) / 10,
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Preslikaj Prisma data v Domain DTO
   */
  private mapToDomain(data: any): WorkspaceDTO {
    return {
      id: data.id,
      teamId: data.teamId,
      name: data.name,
      type: data.type,
      description: data.description,
      settings: data.settings,
      status: data.status as any,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
