/**
 * Infrastructure Implementation: Team Member Repository
 *
 * Implementacija TeamMemberRepository interface-a z uporabo Prisma.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { TeamMemberRepository } from "@/core/ports/repositories";

export interface TeamMemberDTO {
  id: string;
  userId: string;
  teamId: string;
  role: string;
  status: "active" | "inactive" | "suspended";
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class TeamMemberRepositoryImpl implements TeamMemberRepository {
  /**
   * Najdi member-ja po ID-ju
   */
  async findById(id: string): Promise<TeamMemberDTO | null> {
    const data = await prisma.teamMember.findUnique({
      where: { id },
      include: {
        user: true,
        team: true,
      },
    });

    if (!data) {
      return null;
    }

    return this.mapToDomain(data);
  }

  /**
   * Najdi vse member-je za team
   */
  async findByTeam(teamId: string, status?: string): Promise<TeamMemberDTO[]> {
    const where: any = { teamId };

    if (status) {
      where.status = status;
    }

    const data = await prisma.teamMember.findMany({
      where,
      include: {
        user: true,
      },
      orderBy: { joinedAt: "asc" },
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Najdi vse team-e za user-ja
   */
  async findByUser(userId: string): Promise<TeamMemberDTO[]> {
    const data = await prisma.teamMember.findMany({
      where: { userId },
      include: {
        team: true,
      },
      orderBy: { joinedAt: "desc" },
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Preveri če je user member team-a
   */
  async isMember(teamId: string, userId: string): Promise<boolean> {
    const member = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId,
          teamId,
        },
      },
    });

    return member !== null;
  }

  /**
   * Dodaj member-a v team
   */
  async add(
    member: Omit<TeamMemberDTO, "id" | "joinedAt" | "createdAt" | "updatedAt">,
  ): Promise<TeamMemberDTO> {
    const data = await prisma.teamMember.create({
      data: {
        userId: member.userId,
        teamId: member.teamId,
        role: member.role,
        status: member.status,
      },
      include: {
        user: true,
      },
    });

    return this.mapToDomain(data);
  }

  /**
   * Posodobi member-ja
   */
  async update(id: string, member: Partial<TeamMemberDTO>): Promise<void> {
    await prisma.teamMember.update({
      where: { id },
      data: {
        role: member.role,
        status: member.status,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Odstrani member-ja iz team-a
   */
  async remove(id: string): Promise<void> {
    await prisma.teamMember.delete({
      where: { id },
    });
  }

  /**
   * Posodobi role member-ja
   */
  async updateRole(id: string, role: string): Promise<void> {
    await prisma.teamMember.update({
      where: { id },
      data: {
        role,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Deaktiviraj member-ja
   */
  async deactivate(id: string): Promise<void> {
    await prisma.teamMember.update({
      where: { id },
      data: {
        status: "inactive",
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Pridobi statistiko team member-jev
   */
  async getStats(teamId?: string): Promise<{
    totalMembers: number;
    activeMembers: number;
    membersByRole: { [key: string]: number };
    averageMembersPerTeam: number;
  }> {
    const where = teamId ? { teamId } : {};

    const members = await prisma.teamMember.findMany({
      where,
    });

    const totalMembers = members.length;
    const activeMembers = members.filter((m) => m.status === "active").length;

    const membersByRole: { [key: string]: number } = {};
    members.forEach((m) => {
      membersByRole[m.role] = (membersByRole[m.role] || 0) + 1;
    });

    const teams = await prisma.team.findMany({
      select: {
        id: true,
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    const totalTeamMembers = teams.reduce(
      (sum, t) => sum + t._count.members,
      0,
    );
    const averageMembersPerTeam =
      teams.length > 0 ? totalTeamMembers / teams.length : 0;

    return {
      totalMembers,
      activeMembers,
      membersByRole,
      averageMembersPerTeam: Math.round(averageMembersPerTeam * 10) / 10,
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Preslikaj Prisma data v Domain DTO
   */
  private mapToDomain(data: any): TeamMemberDTO {
    return {
      id: data.id,
      userId: data.userId,
      teamId: data.teamId,
      role: data.role,
      status: data.status as any,
      joinedAt: data.createdAt,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
