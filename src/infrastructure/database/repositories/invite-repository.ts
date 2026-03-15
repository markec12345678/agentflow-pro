/**
 * Infrastructure Implementation: Invite Repository
 *
 * Implementacija InviteRepository interface-a z uporabo Prisma.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { InviteRepository } from "@/core/ports/repositories";

export interface InviteDTO {
  id: string;
  teamId: string;
  email: string;
  role: string;
  token: string;
  status: "pending" | "accepted" | "declined" | "expired";
  expiresAt?: Date;
  invitedBy?: string;
  acceptedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class InviteRepositoryImpl implements InviteRepository {
  /**
   * Najdi invite po ID-ju
   */
  async findById(id: string): Promise<InviteDTO | null> {
    const data = await prisma.invite.findUnique({
      where: { id },
      include: {
        team: true,
      },
    });

    if (!data) {
      return null;
    }

    return this.mapToDomain(data);
  }

  /**
   * Najdi invite po token-u
   */
  async findByToken(token: string): Promise<InviteDTO | null> {
    const data = await prisma.invite.findUnique({
      where: { token },
      include: {
        team: true,
      },
    });

    if (!data) {
      return null;
    }

    return this.mapToDomain(data);
  }

  /**
   * Najdi vse invites za team
   */
  async findByTeam(teamId: string, status?: string): Promise<InviteDTO[]> {
    const where: any = { teamId };

    if (status) {
      where.status = status;
    }

    const data = await prisma.invite.findMany({
      where,
      include: {
        team: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Najdi invites po email-u
   */
  async findByEmail(email: string): Promise<InviteDTO[]> {
    const data = await prisma.invite.findMany({
      where: { email },
      include: {
        team: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Ustvari nov invite
   */
  async create(
    invite: Omit<InviteDTO, "id" | "createdAt" | "updatedAt">,
  ): Promise<InviteDTO> {
    const data = await prisma.invite.create({
      data: {
        teamId: invite.teamId,
        email: invite.email,
        role: invite.role,
        token: invite.token,
        status: invite.status,
        expiresAt: invite.expiresAt,
        invitedBy: invite.invitedBy,
      },
      include: {
        team: true,
      },
    });

    return this.mapToDomain(data);
  }

  /**
   * Posodobi invite
   */
  async update(id: string, invite: Partial<InviteDTO>): Promise<void> {
    await prisma.invite.update({
      where: { id },
      data: {
        status: invite.status,
        acceptedAt: invite.acceptedAt,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Sprejmi invite
   */
  async accept(id: string): Promise<void> {
    await prisma.invite.update({
      where: { id },
      data: {
        status: "accepted",
        acceptedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Zavrni invite
   */
  async decline(id: string): Promise<void> {
    await prisma.invite.update({
      where: { id },
      data: {
        status: "declined",
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Prekliči invite
   */
  async cancel(id: string): Promise<void> {
    await prisma.invite.update({
      where: { id },
      data: {
        status: "expired",
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Generiraj unikaten token
   */
  async generateUniqueToken(): Promise<string> {
    const token =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);

    const existing = await this.findByToken(token);

    if (existing) {
      return this.generateUniqueToken();
    }

    return token;
  }

  /**
   * Izbriši stare invites
   */
  async deleteOlderThan(days: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await prisma.invite.deleteMany({
      where: {
        status: {
          in: ["accepted", "declined", "expired"],
        },
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }

  /**
   * Pridobi statistiko invites
   */
  async getStats(teamId?: string): Promise<{
    totalInvites: number;
    pendingInvites: number;
    acceptedInvites: number;
    declinedInvites: number;
    expiredInvites: number;
    acceptanceRate: number;
  }> {
    const where = teamId ? { teamId } : {};

    const invites = await prisma.invite.findMany({
      where,
    });

    const totalInvites = invites.length;
    const pendingInvites = invites.filter((i) => i.status === "pending").length;
    const acceptedInvites = invites.filter(
      (i) => i.status === "accepted",
    ).length;
    const declinedInvites = invites.filter(
      (i) => i.status === "declined",
    ).length;
    const expiredInvites = invites.filter((i) => i.status === "expired").length;

    const acceptanceRate =
      totalInvites > 0 ? (acceptedInvites / totalInvites) * 100 : 0;

    return {
      totalInvites,
      pendingInvites,
      acceptedInvites,
      declinedInvites,
      expiredInvites,
      acceptanceRate: Math.round(acceptanceRate * 100) / 100,
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Preslikaj Prisma data v Domain DTO
   */
  private mapToDomain(data: any): InviteDTO {
    return {
      id: data.id,
      teamId: data.teamId,
      email: data.email,
      role: data.role,
      token: data.token,
      status: data.status as any,
      expiresAt: data.expiresAt,
      invitedBy: data.invitedBy,
      acceptedAt: data.acceptedAt,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
