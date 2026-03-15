/**
 * Infrastructure Implementation: Employee Repository
 *
 * Implementacija EmployeeRepository interface-a z uporabo Prisma.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { EmployeeRepository } from "@/core/ports/repositories";

export interface EmployeeDTO {
  id: string;
  propertyId: string;
  userId?: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  department?: string;
  status: "active" | "inactive" | "suspended" | "terminated";
  hireDate?: Date;
  terminationDate?: Date;
  permissions?: any;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export class EmployeeRepositoryImpl implements EmployeeRepository {
  /**
   * Najdi employee-ja po ID-ju
   */
  async findById(id: string): Promise<EmployeeDTO | null> {
    const data = await prisma.employee.findUnique({
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
   * Najdi vse employee-je za property
   */
  async findByProperty(
    propertyId: string,
    status?: string,
  ): Promise<EmployeeDTO[]> {
    const where: any = { propertyId };

    if (status) {
      where.status = status;
    }

    const data = await prisma.employee.findMany({
      where,
      include: {
        property: true,
      },
      orderBy: { name: "asc" },
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Najdi employee-je po user-ju
   */
  async findByUserId(userId: string): Promise<EmployeeDTO[]> {
    const data = await prisma.employee.findMany({
      where: { userId },
      include: {
        property: true,
      },
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Ustvari novega employee-ja
   */
  async create(
    employee: Omit<EmployeeDTO, "id" | "createdAt" | "updatedAt">,
  ): Promise<EmployeeDTO> {
    const data = await prisma.employee.create({
      data: {
        propertyId: employee.propertyId,
        userId: employee.userId,
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        role: employee.role,
        department: employee.department,
        status: employee.status,
        hireDate: employee.hireDate,
        terminationDate: employee.terminationDate,
        permissions: employee.permissions,
        metadata: employee.metadata,
      },
      include: {
        property: true,
      },
    });

    return this.mapToDomain(data);
  }

  /**
   * Posodobi employee-ja
   */
  async update(id: string, employee: Partial<EmployeeDTO>): Promise<void> {
    await prisma.employee.update({
      where: { id },
      data: {
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        role: employee.role,
        department: employee.department,
        status: employee.status,
        hireDate: employee.hireDate,
        terminationDate: employee.terminationDate,
        permissions: employee.permissions,
        metadata: employee.metadata,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Izbriši employee-ja (soft delete)
   */
  async delete(id: string): Promise<void> {
    await prisma.employee.update({
      where: { id },
      data: {
        status: "terminated",
        terminationDate: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Aktiviraj employee-ja
   */
  async activate(id: string): Promise<void> {
    await prisma.employee.update({
      where: { id },
      data: {
        status: "active",
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Deaktiviraj employee-ja
   */
  async deactivate(id: string): Promise<void> {
    await prisma.employee.update({
      where: { id },
      data: {
        status: "inactive",
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Pridobi statistiko employee-jev
   */
  async getStats(propertyId?: string): Promise<{
    totalEmployees: number;
    activeEmployees: number;
    inactiveEmployees: number;
    employeesByRole: { [key: string]: number };
    employeesByDepartment: { [key: string]: number };
  }> {
    const where = propertyId ? { propertyId } : {};

    const employees = await prisma.employee.findMany({
      where,
    });

    const totalEmployees = employees.length;
    const activeEmployees = employees.filter(
      (e) => e.status === "active",
    ).length;
    const inactiveEmployees = employees.filter(
      (e) => e.status !== "active",
    ).length;

    const employeesByRole: { [key: string]: number } = {};
    const employeesByDepartment: { [key: string]: number } = {};

    employees.forEach((e) => {
      employeesByRole[e.role] = (employeesByRole[e.role] || 0) + 1;
      employeesByDepartment[e.department || "unknown"] =
        (employeesByDepartment[e.department || "unknown"] || 0) + 1;
    });

    return {
      totalEmployees,
      activeEmployees,
      inactiveEmployees,
      employeesByRole,
      employeesByDepartment,
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Preslikaj Prisma data v Domain DTO
   */
  private mapToDomain(data: any): EmployeeDTO {
    return {
      id: data.id,
      propertyId: data.propertyId,
      userId: data.userId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role,
      department: data.department,
      status: data.status as any,
      hireDate: data.hireDate,
      terminationDate: data.terminationDate,
      permissions: data.permissions,
      metadata: data.metadata,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
