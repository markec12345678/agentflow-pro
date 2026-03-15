/**
 * Infrastructure Implementation: Team Repository
 *
 * Implementacija TeamRepository interface-a z uporabo Prisma.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { TeamRepository } from "@/core/ports/repositories";

export interface TeamDTO {
  id: string;
  name: string;
  ownerId: string;
  description?: string;
  status: "active" | "inactive" | "deleted";
  maxMembers?: number;
  settings?: any;
  createdAt: Date;
  updatedAt: Date;
}

export class TeamRepositoryImpl implements TeamRepository {
  /**
   * Najdi team po ID-ju
   */
  async findById(id: string): Promise<TeamDTO | null> {
    const data = await prisma.team.findUnique({
      where: { id },
      include: {
        owner: true,
        members: {
          include: {
            user: true,
          },
        },
        workspaces: true,
      },
    });

    if (!data) {
      return null;
    }

    return this.mapToDomain(data);
  }

  /**
   * Najdi vse team-e
   */
  async findAll(status?: string, limit?: number): Promise<TeamDTO[]> {
    const where: any = {};

    if (status) {
      where.status = status;
    }

    const data = await prisma.team.findMany({
      where,
      include: {
        owner: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit || 50,
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Najdi team-e po owner-ju
   */
  async findByOwner(ownerId: string): Promise<TeamDTO[]> {
    const data = await prisma.team.findMany({
      where: { ownerId },
      include: {
        owner: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Ustvari nov team
   */
  async create(
    team: Omit<TeamDTO, "id" | "createdAt" | "updatedAt">,
  ): Promise<TeamDTO> {
    const data = await prisma.team.create({
      data: {
        name: team.name,
        ownerId: team.ownerId,
        description: team.description,
        status: team.status,
        maxMembers: team.maxMembers,
        settings: team.settings,
      },
      include: {
        owner: true,
      },
    });

    return this.mapToDomain(data);
  }

  /**
   * Posodobi team
   */
  async update(id: string, team: Partial<TeamDTO>): Promise<void> {
    await prisma.team.update({
      where: { id },
      data: {
        name: team.name,
        description: team.description,
        status: team.status,
        maxMembers: team.maxMembers,
        settings: team.settings,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Izbriši team (soft delete)
   */
  async delete(id: string): Promise<void> {
    await prisma.team.update({
      where: { id },
      data: {
        status: "deleted",
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Dodaj member-a v team
   */
  async addMember(
    teamId: string,
    userId: string,
    role?: string,
  ): Promise<void> {
    await prisma.teamMember.create({
      data: {
        teamId,
        userId,
        role: role || "member",
      },
    });
  }

  /**
   * Odstrani member-ja iz team-a
   */
  async removeMember(teamId: string, userId: string): Promise<void> {
    await prisma.teamMember.delete({
      where: {
        userId_teamId: {
          userId,
          teamId,
        },
      },
    });
  }

  /**
   * Pridobi statistiko team-ov
   */
  async getStats(): Promise<{
    totalTeams: number;
    activeTeams: number;
    averageMembersPerTeam: number;
    teamsWithWorkspaces: number;
  }> {
    const teams = await this.findAll();

    const totalTeams = teams.length;
    const activeTeams = teams.filter((t) => t.status === "active").length;

    const members = await prisma.teamMember.findMany({
      include: {
        team: true,
      },
    });

    const membersByTeam: { [key: string]: number } = {};
    members.forEach((m) => {
      membersByTeam[m.teamId] = (membersByTeam[m.teamId] || 0) + 1;
    });

    const totalMembers = Object.values(membersByTeam).reduce(
      (sum, count) => sum + count,
      0,
    );
    const averageMembersPerTeam =
      totalTeams > 0 ? totalMembers / totalTeams : 0;

    const workspaces = await prisma.workspace.findMany({
      select: {
        teamId: true,
      },
      distinct: ["teamId"],
    });

    const teamsWithWorkspaces = workspaces.length;

    return {
      totalTeams,
      activeTeams,
      averageMembersPerTeam: Math.round(averageMembersPerTeam * 10) / 10,
      teamsWithWorkspaces,
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Preslikaj Prisma data v Domain DTO
   */
  private mapToDomain(data: any): TeamDTO {
    return {
      id: data.id,
      name: data.name,
      ownerId: data.ownerId,
      description: data.description,
      status: data.status as any,
      maxMembers: data.maxMembers,
      settings: data.settings,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
