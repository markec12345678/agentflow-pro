/**
 * Infrastructure Implementation: User Repository
 *
 * Implementacija UserRepository interface-a z uporabo Prisma.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { UserRepository } from "@/core/ports/repositories";

export interface UserDTO {
  id: string;
  email: string;
  name?: string;
  passwordHash?: string;
  role: string;
  status: "active" | "inactive" | "suspended" | "deleted";
  emailVerified?: Date;
  image?: string;
  alertConfiguration?: any;
  activeTeamId?: string;
  activePropertyId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class UserRepositoryImpl implements UserRepository {
  /**
   * Najdi user-ja po ID-ju
   */
  async findById(id: string): Promise<UserDTO | null> {
    const data = await prisma.user.findUnique({
      where: { id },
      include: {
        activeTeam: true,
        activeProperty: true,
      },
    });

    if (!data) {
      return null;
    }

    return this.mapToDomain(data);
  }

  /**
   * Najdi user-ja po email-u
   */
  async findByEmail(email: string): Promise<UserDTO | null> {
    const data = await prisma.user.findUnique({
      where: { email },
      include: {
        activeTeam: true,
        activeProperty: true,
      },
    });

    if (!data) {
      return null;
    }

    return this.mapToDomain(data);
  }

  /**
   * Najdi vse user-je
   */
  async findAll(status?: string, limit?: number): Promise<UserDTO[]> {
    const where: any = {};

    if (status) {
      where.status = status;
    }

    const data = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit || 50,
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Ustvari novega user-ja
   */
  async create(
    user: Omit<UserDTO, "id" | "createdAt" | "updatedAt">,
  ): Promise<UserDTO> {
    const data = await prisma.user.create({
      data: {
        email: user.email,
        name: user.name,
        passwordHash: user.passwordHash,
        role: user.role,
        status: user.status,
        emailVerified: user.emailVerified,
        image: user.image,
        alertConfiguration: user.alertConfiguration,
        activeTeamId: user.activeTeamId,
        activePropertyId: user.activePropertyId,
      },
    });

    return this.mapToDomain(data);
  }

  /**
   * Posodobi user-ja
   */
  async update(id: string, user: Partial<UserDTO>): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: {
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        emailVerified: user.emailVerified,
        image: user.image,
        alertConfiguration: user.alertConfiguration,
        activeTeamId: user.activeTeamId,
        activePropertyId: user.activePropertyId,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Izbriši user-ja (soft delete)
   */
  async delete(id: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: {
        status: "deleted",
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Posodobi status
   */
  async updateStatus(id: string, status: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Verificiraj email
   */
  async verifyEmail(id: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: {
        emailVerified: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Nastavi aktivni team
   */
  async setActiveTeam(userId: string, teamId?: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        activeTeamId: teamId,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Nastavi aktivni property
   */
  async setActiveProperty(userId: string, propertyId?: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        activePropertyId: propertyId,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Pridobi statistiko user-jev
   */
  async getStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    usersByRole: { [key: string]: number };
    verifiedUsers: number;
    verificationRate: number;
  }> {
    const users = await this.findAll();

    const totalUsers = users.length;
    const activeUsers = users.filter((u) => u.status === "active").length;
    const inactiveUsers = users.filter((u) => u.status !== "active").length;

    const usersByRole: { [key: string]: number } = {};
    users.forEach((u) => {
      usersByRole[u.role] = (usersByRole[u.role] || 0) + 1;
    });

    const verifiedUsers = users.filter((u) => u.emailVerified).length;
    const verificationRate =
      totalUsers > 0 ? (verifiedUsers / totalUsers) * 100 : 0;

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      usersByRole,
      verifiedUsers,
      verificationRate: Math.round(verificationRate * 100) / 100,
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Preslikaj Prisma data v Domain DTO
   */
  private mapToDomain(data: any): UserDTO {
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      passwordHash: data.passwordHash,
      role: data.role,
      status: data.status as any,
      emailVerified: data.emailVerified,
      image: data.image,
      alertConfiguration: data.alertConfiguration,
      activeTeamId: data.activeTeamId,
      activePropertyId: data.activePropertyId,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
