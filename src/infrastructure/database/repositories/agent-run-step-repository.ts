/**
 * Infrastructure Implementation: Agent Run Step Repository
 *
 * Implementacija AgentRunStepRepository interface-a z uporabo Prisma.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { AgentRunStepRepository } from "@/core/ports/repositories";

export interface AgentRunStepDTO {
  id: string;
  runId: string;
  name: string;
  status: "pending" | "running" | "completed" | "failed";
  input?: any;
  result?: any;
  error?: string;
  duration: number; // milliseconds
  tokensUsed: number;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}

export class AgentRunStepRepositoryImpl implements AgentRunStepRepository {
  /**
   * Najdi step po ID-ju
   */
  async findById(id: string): Promise<AgentRunStepDTO | null> {
    const data = await prisma.agentRunStep.findUnique({
      where: { id },
      include: {
        run: true,
      },
    });

    if (!data) {
      return null;
    }

    return this.mapToDomain(data);
  }

  /**
   * Najdi vse step-e za run
   */
  async findByRun(runId: string): Promise<AgentRunStepDTO[]> {
    const data = await prisma.agentRunStep.findMany({
      where: { runId },
      include: {
        run: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Ustvari nov step
   */
  async create(
    step: Omit<AgentRunStepDTO, "id" | "createdAt">,
  ): Promise<AgentRunStepDTO> {
    const data = await prisma.agentRunStep.create({
      data: {
        runId: step.runId,
        name: step.name,
        status: step.status,
        input: step.input,
        result: step.result,
        error: step.error,
        duration: step.duration,
        tokensUsed: step.tokensUsed,
        startedAt: step.startedAt,
        completedAt: step.completedAt,
      },
      include: {
        run: true,
      },
    });

    return this.mapToDomain(data);
  }

  /**
   * Posodobi step
   */
  async update(id: string, step: Partial<AgentRunStepDTO>): Promise<void> {
    await prisma.agentRunStep.update({
      where: { id },
      data: {
        name: step.name,
        status: step.status,
        input: step.input,
        result: step.result,
        error: step.error,
        duration: step.duration,
        tokensUsed: step.tokensUsed,
        startedAt: step.startedAt,
        completedAt: step.completedAt,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Označi step kot completed
   */
  async markAsCompleted(
    id: string,
    result: any,
    duration: number,
    tokensUsed: number,
  ): Promise<void> {
    await prisma.agentRunStep.update({
      where: { id },
      data: {
        status: "completed",
        result,
        duration,
        tokensUsed,
        completedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Označi step kot failed
   */
  async markAsFailed(id: string, error: string): Promise<void> {
    await prisma.agentRunStep.update({
      where: { id },
      data: {
        status: "failed",
        error,
        completedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Izbriši vse step-e za run
   */
  async deleteByRun(runId: string): Promise<void> {
    await prisma.agentRunStep.deleteMany({
      where: { runId },
    });
  }

  /**
   * Pridobi statistiko step-ov
   */
  async getStats(runId?: string): Promise<{
    totalSteps: number;
    completedSteps: number;
    failedSteps: number;
    pendingSteps: number;
    averageDuration: number;
    averageTokensUsed: number;
    successRate: number;
  }> {
    const where = runId ? { runId } : {};

    const steps = await prisma.agentRunStep.findMany({
      where,
    });

    const totalSteps = steps.length;
    const completedSteps = steps.filter((s) => s.status === "completed").length;
    const failedSteps = steps.filter((s) => s.status === "failed").length;
    const pendingSteps = steps.filter((s) => s.status === "pending").length;

    const successRate =
      totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

    const completedWithDuration = steps.filter((s) => s.duration > 0);
    const totalDuration = completedWithDuration.reduce(
      (sum, s) => sum + s.duration,
      0,
    );
    const averageDuration =
      completedWithDuration.length > 0
        ? totalDuration / completedWithDuration.length
        : 0;

    const completedWithTokens = steps.filter((s) => s.tokensUsed > 0);
    const totalTokens = completedWithTokens.reduce(
      (sum, s) => sum + s.tokensUsed,
      0,
    );
    const averageTokensUsed =
      completedWithTokens.length > 0
        ? totalTokens / completedWithTokens.length
        : 0;

    return {
      totalSteps,
      completedSteps,
      failedSteps,
      pendingSteps,
      averageDuration: Math.round(averageDuration),
      averageTokensUsed: Math.round(averageTokensUsed),
      successRate: Math.round(successRate * 100) / 100,
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Preslikaj Prisma data v Domain DTO
   */
  private mapToDomain(data: any): AgentRunStepDTO {
    return {
      id: data.id,
      runId: data.runId,
      name: data.name,
      status: data.status as any,
      input: data.input,
      result: data.result,
      error: data.error,
      duration: data.duration,
      tokensUsed: data.tokensUsed,
      startedAt: data.startedAt,
      completedAt: data.completedAt,
      createdAt: data.createdAt,
    };
  }
}
