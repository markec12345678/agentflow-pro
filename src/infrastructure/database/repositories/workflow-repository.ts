/**
 * Infrastructure Implementation: Workflow Repository
 *
 * Implementacija WorkflowRepository interface-a z uporabo Prisma.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { WorkflowRepository } from "@/core/ports/repositories";

export interface WorkflowDTO {
  id: string;
  name: string;
  description?: string;
  userId: string;
  propertyId?: string;
  type: "automation" | "approval" | "notification" | "integration" | "custom";
  status: "draft" | "active" | "paused" | "archived";
  definition: any;
  triggers: any[];
  actions: any[];
  conditions: any[];
  variables: any[];
  settings: any;
  isPublished: boolean;
  publishedAt?: Date;
  lastExecutedAt?: Date;
  executionCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export class WorkflowRepositoryImpl implements WorkflowRepository {
  /**
   * Najdi workflow po ID-ju
   */
  async findById(id: string): Promise<WorkflowDTO | null> {
    const data = await prisma.workflow.findUnique({
      where: { id },
      include: {
        user: true,
        property: true,
      },
    });

    if (!data) {
      return null;
    }

    return this.mapToDomain(data);
  }

  /**
   * Najdi vse workflow-e za user-ja
   */
  async findByUser(userId: string, status?: string): Promise<WorkflowDTO[]> {
    const where: any = { userId };

    if (status) {
      where.status = status;
    }

    const data = await prisma.workflow.findMany({
      where,
      include: {
        property: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Najdi workflow-e za property
   */
  async findByProperty(propertyId: string): Promise<WorkflowDTO[]> {
    const data = await prisma.workflow.findMany({
      where: { propertyId },
      include: {
        user: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Ustvari nov workflow
   */
  async create(
    workflow: Omit<
      WorkflowDTO,
      "id" | "createdAt" | "updatedAt" | "executionCount"
    >,
  ): Promise<WorkflowDTO> {
    const data = await prisma.workflow.create({
      data: {
        name: workflow.name,
        description: workflow.description,
        userId: workflow.userId,
        propertyId: workflow.propertyId,
        type: workflow.type,
        status: workflow.status,
        definition: workflow.definition,
        triggers: workflow.triggers,
        actions: workflow.actions,
        conditions: workflow.conditions,
        variables: workflow.variables,
        settings: workflow.settings,
        isPublished: workflow.isPublished,
        publishedAt: workflow.publishedAt,
      },
      include: {
        property: true,
      },
    });

    return this.mapToDomain(data);
  }

  /**
   * Posodobi workflow
   */
  async update(id: string, workflow: Partial<WorkflowDTO>): Promise<void> {
    await prisma.workflow.update({
      where: { id },
      data: {
        name: workflow.name,
        description: workflow.description,
        type: workflow.type,
        status: workflow.status,
        definition: workflow.definition,
        triggers: workflow.triggers,
        actions: workflow.actions,
        conditions: workflow.conditions,
        variables: workflow.variables,
        settings: workflow.settings,
        isPublished: workflow.isPublished,
        publishedAt: workflow.publishedAt,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Izbriši workflow
   */
  async delete(id: string): Promise<void> {
    await prisma.workflow.update({
      where: { id },
      data: {
        status: "archived",
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Aktiviraj workflow
   */
  async activate(id: string): Promise<void> {
    await prisma.workflow.update({
      where: { id },
      data: {
        status: "active",
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Pavziraj workflow
   */
  async pause(id: string): Promise<void> {
    await prisma.workflow.update({
      where: { id },
      data: {
        status: "paused",
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Objavi workflow
   */
  async publish(id: string): Promise<void> {
    await prisma.workflow.update({
      where: { id },
      data: {
        isPublished: true,
        publishedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Posodobi execution count
   */
  async incrementExecutionCount(id: string): Promise<void> {
    await prisma.workflow.update({
      where: { id },
      data: {
        executionCount: { increment: 1 },
        lastExecutedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Pridobi statistiko workflow-ov
   */
  async getStats(userId?: string): Promise<{
    totalWorkflows: number;
    activeWorkflows: number;
    publishedWorkflows: number;
    workflowsByType: { [key: string]: number };
    totalExecutions: number;
    averageExecutionsPerWorkflow: number;
  }> {
    const where = userId ? { userId } : {};

    const workflows = await prisma.workflow.findMany({
      where,
    });

    const totalWorkflows = workflows.length;
    const activeWorkflows = workflows.filter(
      (w) => w.status === "active",
    ).length;
    const publishedWorkflows = workflows.filter((w) => w.isPublished).length;

    const workflowsByType: { [key: string]: number } = {};
    workflows.forEach((w) => {
      workflowsByType[w.type] = (workflowsByType[w.type] || 0) + 1;
    });

    const totalExecutions = workflows.reduce(
      (sum, w) => sum + w.executionCount,
      0,
    );
    const averageExecutionsPerWorkflow =
      totalWorkflows > 0 ? totalExecutions / totalWorkflows : 0;

    return {
      totalWorkflows,
      activeWorkflows,
      publishedWorkflows,
      workflowsByType,
      totalExecutions,
      averageExecutionsPerWorkflow:
        Math.round(averageExecutionsPerWorkflow * 10) / 10,
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Preslikaj Prisma data v Domain DTO
   */
  private mapToDomain(data: any): WorkflowDTO {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      userId: data.userId,
      propertyId: data.propertyId,
      type: data.type as any,
      status: data.status as any,
      definition: data.definition,
      triggers: data.triggers,
      actions: data.actions,
      conditions: data.conditions,
      variables: data.variables,
      settings: data.settings,
      isPublished: data.isPublished,
      publishedAt: data.publishedAt,
      lastExecutedAt: data.lastExecutedAt,
      executionCount: data.executionCount,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
