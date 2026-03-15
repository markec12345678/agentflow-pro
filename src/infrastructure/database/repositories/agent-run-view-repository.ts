/**
 * Infrastructure Implementation: Agent Run View Repository
 *
 * Implementacija AgentRunViewRepository interface-a z uporabo Prisma.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { AgentRunViewRepository } from "@/core/ports/repositories";

export interface AgentRunViewDTO {
  id: string;
  workflowId: string;
  status: "pending" | "running" | "completed" | "failed";
  inputData?: any;
  result?: any;
  error?: string;
  errorType?: string;
  totalSteps: number;
  totalDuration: number; // milliseconds
  totalTokensUsed: number;
  userId?: string;
  startedAt?: Date;
  completedAt?: Date;
  failedAtStep?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class AgentRunViewRepositoryImpl implements AgentRunViewRepository {
  /**
   * Najdi run po ID-ju
   */
  async findById(id: string): Promise<AgentRunViewDTO | null> {
    const data = await prisma.agentRunView.findUnique({
      where: { id },
      include: {
        steps: true,
      },
    });

    if (!data) {
      return null;
    }

    return this.mapToDomain(data);
  }

  /**
   * Najdi run-e po workflow-u
   */
  async findByWorkflow(
    workflowId: string,
    status?: string,
    limit?: number,
  ): Promise<AgentRunViewDTO[]> {
    const where: any = { workflowId };

    if (status) {
      where.status = status;
    }

    const data = await prisma.agentRunView.findMany({
      where,
      include: {
        steps: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit || 50,
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Najdi run-e po user-ju
   */
  async findByUser(userId: string, limit?: number): Promise<AgentRunViewDTO[]> {
    const data = await prisma.agentRunView.findMany({
      where: { userId },
      include: {
        steps: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit || 50,
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Najdi trenutno running run-e
   */
  async findRunning(): Promise<AgentRunViewDTO[]> {
    const data = await prisma.agentRunView.findMany({
      where: { status: "running" },
      include: {
        steps: true,
      },
      orderBy: { startedAt: "asc" },
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Ustvari nov run
   */
  async create(
    run: Omit<AgentRunViewDTO, "id" | "createdAt" | "updatedAt">,
  ): Promise<AgentRunViewDTO> {
    const data = await prisma.agentRunView.create({
      data: {
        workflowId: run.workflowId,
        status: run.status,
        inputData: run.inputData,
        result: run.result,
        error: run.error,
        errorType: run.errorType,
        totalSteps: run.totalSteps,
        totalDuration: run.totalDuration,
        totalTokensUsed: run.totalTokensUsed,
        userId: run.userId,
        startedAt: run.startedAt,
        completedAt: run.completedAt,
        failedAtStep: run.failedAtStep,
      },
      include: {
        steps: true,
      },
    });

    return this.mapToDomain(data);
  }

  /**
   * Posodobi run
   */
  async update(id: string, run: Partial<AgentRunViewDTO>): Promise<void> {
    await prisma.agentRunView.update({
      where: { id },
      data: {
        status: run.status,
        result: run.result,
        error: run.error,
        errorType: run.errorType,
        totalSteps: run.totalSteps,
        totalDuration: run.totalDuration,
        totalTokensUsed: run.totalTokensUsed,
        completedAt: run.completedAt,
        failedAtStep: run.failedAtStep,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Označi run kot completed
   */
  async markAsCompleted(
    id: string,
    result: any,
    duration: number,
    tokensUsed: number,
  ): Promise<void> {
    await prisma.agentRunView.update({
      where: { id },
      data: {
        status: "completed",
        result,
        totalDuration: duration,
        totalTokensUsed: tokensUsed,
        completedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Označi run kot failed
   */
  async markAsFailed(
    id: string,
    error: string,
    errorType: string,
    failedAtStep?: string,
  ): Promise<void> {
    await prisma.agentRunView.update({
      where: { id },
      data: {
        status: "failed",
        error,
        errorType,
        failedAtStep,
        completedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Pridobi statistiko agent run-ov
   */
  async getStats(
    workflowId?: string,
    days: number = 30,
  ): Promise<{
    totalRuns: number;
    completedRuns: number;
    failedRuns: number;
    runningRuns: number;
    pendingRuns: number;
    successRate: number;
    averageDuration: number;
    averageTokensUsed: number;
  }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const where: any = {
      createdAt: {
        gte: cutoffDate,
      },
    };

    if (workflowId) {
      where.workflowId = workflowId;
    }

    const runs = await prisma.agentRunView.findMany({
      where,
    });

    const totalRuns = runs.length;
    const completedRuns = runs.filter((r) => r.status === "completed").length;
    const failedRuns = runs.filter((r) => r.status === "failed").length;
    const runningRuns = runs.filter((r) => r.status === "running").length;
    const pendingRuns = runs.filter((r) => r.status === "pending").length;

    const successRate = totalRuns > 0 ? (completedRuns / totalRuns) * 100 : 0;

    const completedWithDuration = runs.filter((r) => r.totalDuration > 0);
    const totalDuration = completedWithDuration.reduce(
      (sum, r) => sum + r.totalDuration,
      0,
    );
    const averageDuration =
      completedWithDuration.length > 0
        ? totalDuration / completedWithDuration.length
        : 0;

    const completedWithTokens = runs.filter((r) => r.totalTokensUsed > 0);
    const totalTokens = completedWithTokens.reduce(
      (sum, r) => sum + r.totalTokensUsed,
      0,
    );
    const averageTokensUsed =
      completedWithTokens.length > 0
        ? totalTokens / completedWithTokens.length
        : 0;

    return {
      totalRuns,
      completedRuns,
      failedRuns,
      runningRuns,
      pendingRuns,
      successRate: Math.round(successRate * 100) / 100,
      averageDuration: Math.round(averageDuration),
      averageTokensUsed: Math.round(averageTokensUsed),
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Preslikaj Prisma data v Domain DTO
   */
  private mapToDomain(data: any): AgentRunViewDTO {
    return {
      id: data.id,
      workflowId: data.workflowId,
      status: data.status as any,
      inputData: data.inputData,
      result: data.result,
      error: data.error,
      errorType: data.errorType,
      totalSteps: data.totalSteps,
      totalDuration: data.totalDuration,
      totalTokensUsed: data.totalTokensUsed,
      userId: data.userId,
      startedAt: data.startedAt,
      completedAt: data.completedAt,
      failedAtStep: data.failedAtStep,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
