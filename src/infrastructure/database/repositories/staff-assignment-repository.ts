/**
 * Infrastructure Implementation: Staff Assignment Repository
 *
 * Implementacija StaffAssignmentRepository interface-a z uporabo Prisma.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { StaffAssignmentRepository } from "@/core/ports/repositories";

export interface StaffAssignmentDTO {
  id: string;
  propertyId: string;
  employeeId: string;
  role: string;
  shift: "morning" | "afternoon" | "night" | "flexible";
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class StaffAssignmentRepositoryImpl implements StaffAssignmentRepository {
  /**
   * Najdi assignment po ID-ju
   */
  async findById(id: string): Promise<StaffAssignmentDTO | null> {
    const data = await prisma.staffAssignment.findUnique({
      where: { id },
      include: {
        property: true,
        employee: true,
      },
    });

    if (!data) {
      return null;
    }

    return this.mapToDomain(data);
  }

  /**
   * Najdi vse assignments za property
   */
  async findByProperty(
    propertyId: string,
    activeOnly?: boolean,
  ): Promise<StaffAssignmentDTO[]> {
    const where: any = { propertyId };

    if (activeOnly) {
      where.isActive = true;
    }

    const data = await prisma.staffAssignment.findMany({
      where,
      include: {
        employee: true,
      },
      orderBy: { startDate: "desc" },
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Najdi assignments za employee-ja
   */
  async findByEmployee(
    employeeId: string,
    activeOnly?: boolean,
  ): Promise<StaffAssignmentDTO[]> {
    const where: any = { employeeId };

    if (activeOnly) {
      where.isActive = true;
    }

    const data = await prisma.staffAssignment.findMany({
      where,
      include: {
        property: true,
      },
      orderBy: { startDate: "desc" },
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Ustvari nov assignment
   */
  async create(
    assignment: Omit<StaffAssignmentDTO, "id" | "createdAt" | "updatedAt">,
  ): Promise<StaffAssignmentDTO> {
    const data = await prisma.staffAssignment.create({
      data: {
        propertyId: assignment.propertyId,
        employeeId: assignment.employeeId,
        role: assignment.role,
        shift: assignment.shift,
        startDate: assignment.startDate,
        endDate: assignment.endDate,
        isActive: assignment.isActive,
        notes: assignment.notes,
      },
      include: {
        employee: true,
      },
    });

    return this.mapToDomain(data);
  }

  /**
   * Posodobi assignment
   */
  async update(
    id: string,
    assignment: Partial<StaffAssignmentDTO>,
  ): Promise<void> {
    await prisma.staffAssignment.update({
      where: { id },
      data: {
        role: assignment.role,
        shift: assignment.shift,
        startDate: assignment.startDate,
        endDate: assignment.endDate,
        isActive: assignment.isActive,
        notes: assignment.notes,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Deaktiviraj assignment
   */
  async deactivate(id: string): Promise<void> {
    await prisma.staffAssignment.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Izbriši assignment
   */
  async delete(id: string): Promise<void> {
    await prisma.staffAssignment.delete({
      where: { id },
    });
  }

  /**
   * Pridobi trenutno aktivne assignments
   */
  async getCurrentAssignments(
    propertyId: string,
  ): Promise<StaffAssignmentDTO[]> {
    const now = new Date();

    const data = await prisma.staffAssignment.findMany({
      where: {
        propertyId,
        isActive: true,
        startDate: { lte: now },
        OR: [{ endDate: { gte: now } }, { endDate: null }],
      },
      include: {
        employee: true,
      },
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Pridobi statistiko assignments
   */
  async getStats(propertyId: string): Promise<{
    totalAssignments: number;
    activeAssignments: number;
    employeesByRole: { [key: string]: number };
    employeesByShift: { [key: string]: number };
  }> {
    const assignments = await this.findByProperty(propertyId);

    const totalAssignments = assignments.length;
    const activeAssignments = assignments.filter((a) => a.isActive).length;

    const employeesByRole: { [key: string]: number } = {};
    const employeesByShift: { [key: string]: number } = {};

    assignments.forEach((a) => {
      employeesByRole[a.role] = (employeesByRole[a.role] || 0) + 1;
      employeesByShift[a.shift] = (employeesByShift[a.shift] || 0) + 1;
    });

    return {
      totalAssignments,
      activeAssignments,
      employeesByRole,
      employeesByShift,
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Preslikaj Prisma data v Domain DTO
   */
  private mapToDomain(data: any): StaffAssignmentDTO {
    return {
      id: data.id,
      propertyId: data.propertyId,
      employeeId: data.employeeId,
      role: data.role,
      shift: data.shift as any,
      startDate: data.startDate,
      endDate: data.endDate,
      isActive: data.isActive,
      notes: data.notes,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
