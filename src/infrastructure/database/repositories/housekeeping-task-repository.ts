/**
 * Infrastructure Implementation: Housekeeping Task Repository
 *
 * Implementacija HousekeepingTaskRepository interface-a z uporabo Prisma.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { HousekeepingTaskRepository } from "@/core/ports/repositories";

export interface HousekeepingTaskDTO {
  id: string;
  propertyId: string;
  roomId?: string;
  title: string;
  description?: string;
  type: "cleaning" | "maintenance" | "inspection" | "restock" | "other";
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in_progress" | "completed" | "cancelled";
  assignedTo?: string;
  dueDate?: Date;
  completedAt?: Date;
  completedBy?: string;
  notes?: string;
  photos?: string[];
  estimatedDuration: number; // minutes
  actualDuration?: number; // minutes
  createdAt: Date;
  updatedAt: Date;
}

export class HousekeepingTaskRepositoryImpl implements HousekeepingTaskRepository {
  /**
   * Najdi task po ID-ju
   */
  async findById(id: string): Promise<HousekeepingTaskDTO | null> {
    const data = await prisma.housekeepingTask.findUnique({
      where: { id },
      include: {
        property: true,
        room: true,
        assignedEmployee: true,
      },
    });

    if (!data) {
      return null;
    }

    return this.mapToDomain(data);
  }

  /**
   * Najdi vse tasks za property
   */
  async findByProperty(
    propertyId: string,
    status?: string,
  ): Promise<HousekeepingTaskDTO[]> {
    const where: any = { propertyId };

    if (status) {
      where.status = status;
    }

    const data = await prisma.housekeepingTask.findMany({
      where,
      include: {
        room: true,
        assignedEmployee: true,
      },
      orderBy: [{ dueDate: "asc" }, { priority: "desc" }],
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Najdi tasks dodeljene employee-ju
   */
  async findByEmployee(
    employeeId: string,
    status?: string,
  ): Promise<HousekeepingTaskDTO[]> {
    const where: any = { assignedTo: employeeId };

    if (status) {
      where.status = status;
    }

    const data = await prisma.housekeepingTask.findMany({
      where,
      include: {
        room: true,
      },
      orderBy: { dueDate: "asc" },
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Ustvari nov task
   */
  async create(
    task: Omit<HousekeepingTaskDTO, "id" | "createdAt" | "updatedAt">,
  ): Promise<HousekeepingTaskDTO> {
    const data = await prisma.housekeepingTask.create({
      data: {
        propertyId: task.propertyId,
        roomId: task.roomId,
        title: task.title,
        description: task.description,
        type: task.type,
        priority: task.priority,
        status: task.status,
        assignedTo: task.assignedTo,
        dueDate: task.dueDate,
        notes: task.notes,
        photos: task.photos,
        estimatedDuration: task.estimatedDuration,
      },
      include: {
        room: true,
      },
    });

    return this.mapToDomain(data);
  }

  /**
   * Posodobi task
   */
  async update(id: string, task: Partial<HousekeepingTaskDTO>): Promise<void> {
    await prisma.housekeepingTask.update({
      where: { id },
      data: {
        title: task.title,
        description: task.description,
        type: task.type,
        priority: task.priority,
        status: task.status,
        assignedTo: task.assignedTo,
        dueDate: task.dueDate,
        notes: task.notes,
        photos: task.photos,
        estimatedDuration: task.estimatedDuration,
        actualDuration: task.actualDuration,
        completedAt: task.completedAt,
        completedBy: task.completedBy,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Dodeli task employee-ju
   */
  async assignTo(id: string, employeeId: string): Promise<void> {
    await prisma.housekeepingTask.update({
      where: { id },
      data: {
        assignedTo: employeeId,
        status: "in_progress",
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Označi task kot completed
   */
  async markAsCompleted(
    id: string,
    completedBy: string,
    actualDuration?: number,
  ): Promise<void> {
    await prisma.housekeepingTask.update({
      where: { id },
      data: {
        status: "completed",
        completedBy,
        completedAt: new Date(),
        actualDuration: actualDuration,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Prekliči task
   */
  async cancel(id: string): Promise<void> {
    await prisma.housekeepingTask.update({
      where: { id },
      data: {
        status: "cancelled",
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Izbriši task
   */
  async delete(id: string): Promise<void> {
    await prisma.housekeepingTask.delete({
      where: { id },
    });
  }

  /**
   * Pridobi statistiko tasks
   */
  async getStats(
    propertyId: string,
    days: number = 7,
  ): Promise<{
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    inProgressTasks: number;
    averageCompletionTime: number; // minutes
    overdueTasks: number;
  }> {
    const tasks = await this.findByProperty(propertyId);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const recentTasks = tasks.filter((t) => t.createdAt >= cutoffDate);
    const totalTasks = recentTasks.length;
    const completedTasks = recentTasks.filter(
      (t) => t.status === "completed",
    ).length;
    const pendingTasks = recentTasks.filter(
      (t) => t.status === "pending",
    ).length;
    const inProgressTasks = recentTasks.filter(
      (t) => t.status === "in_progress",
    ).length;
    const overdueTasks = recentTasks.filter(
      (t) => t.dueDate && t.dueDate < new Date() && t.status !== "completed",
    ).length;

    const completedWithTime = recentTasks.filter(
      (t) => t.completedAt && t.estimatedDuration,
    );
    const totalCompletionTime = completedWithTime.reduce(
      (sum, t) => sum + (t.actualDuration || t.estimatedDuration),
      0,
    );
    const averageCompletionTime =
      completedWithTime.length > 0
        ? totalCompletionTime / completedWithTime.length
        : 0;

    return {
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      averageCompletionTime: Math.round(averageCompletionTime),
      overdueTasks,
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Preslikaj Prisma data v Domain DTO
   */
  private mapToDomain(data: any): HousekeepingTaskDTO {
    return {
      id: data.id,
      propertyId: data.propertyId,
      roomId: data.roomId,
      title: data.title,
      description: data.description,
      type: data.type as any,
      priority: data.priority as any,
      status: data.status as any,
      assignedTo: data.assignedTo,
      dueDate: data.dueDate,
      completedAt: data.completedAt,
      completedBy: data.completedBy,
      notes: data.notes,
      photos: data.photos,
      estimatedDuration: data.estimatedDuration,
      actualDuration: data.actualDuration,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
