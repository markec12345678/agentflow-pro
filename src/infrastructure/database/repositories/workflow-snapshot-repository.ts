/**
 * Infrastructure Implementation: Workflow Snapshot Repository
 *
 * Implementacija WorkflowSnapshotRepository interface-a z uporabo Prisma.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { WorkflowSnapshotRepository } from "@/core/ports/repositories";

export interface WorkflowSnapshotDTO {
  id: string;
  aggregateId: string;
  version: number;
  state: any;
  createdAt: Date;
  updatedAt: Date;
}

export class WorkflowSnapshotRepositoryImpl implements WorkflowSnapshotRepository {
  /**
   * Najdi snapshot po ID-ju
   */
  async findById(id: string): Promise<WorkflowSnapshotDTO | null> {
    const data = await prisma.workflowSnapshot.findUnique({
      where: { id },
    });

    if (!data) {
      return null;
    }

    return this.mapToDomain(data);
  }

  /**
   * Najdi snapshot po aggregate ID-ju
   */
  async findByAggregateId(
    aggregateId: string,
  ): Promise<WorkflowSnapshotDTO | null> {
    const data = await prisma.workflowSnapshot.findFirst({
      where: { aggregateId },
      orderBy: { version: "desc" },
    });

    if (!data) {
      return null;
    }

    return this.mapToDomain(data);
  }

  /**
   * Shrani snapshot (create ali update)
   */
  async save(
    snapshot: Omit<WorkflowSnapshotDTO, "id" | "createdAt" | "updatedAt">,
  ): Promise<WorkflowSnapshotDTO> {
    const data = await prisma.workflowSnapshot.upsert({
      where: {
        aggregateId: snapshot.aggregateId,
      },
      update: {
        version: snapshot.version,
        state: snapshot.state,
        updatedAt: new Date(),
      },
      create: {
        aggregateId: snapshot.aggregateId,
        version: snapshot.version,
        state: snapshot.state,
      },
    });

    return this.mapToDomain(data);
  }

  /**
   * Izbriši snapshot
   */
  async delete(aggregateId: string): Promise<void> {
    await prisma.workflowSnapshot.deleteMany({
      where: { aggregateId },
    });
  }

  /**
   * Pridobi vse snapshote
   */
  async findAll(limit?: number): Promise<WorkflowSnapshotDTO[]> {
    const data = await prisma.workflowSnapshot.findMany({
      orderBy: { updatedAt: "desc" },
      take: limit || 50,
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Pridobi statistiko snapshot-ov
   */
  async getStats(): Promise<{
    totalSnapshots: number;
    aggregatesWithSnapshots: number;
    averageVersion: number;
    newestSnapshotAt?: Date;
    oldestSnapshotAt?: Date;
  }> {
    const snapshots = await prisma.workflowSnapshot.findMany({
      select: {
        aggregateId: true,
        version: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const totalSnapshots = snapshots.length;
    const aggregates = new Set(snapshots.map((s) => s.aggregateId));
    const aggregatesWithSnapshots = aggregates.size;

    const totalVersion = snapshots.reduce((sum, s) => sum + s.version, 0);
    const averageVersion =
      totalSnapshots > 0 ? totalVersion / totalSnapshots : 0;

    let newestSnapshotAt: Date | undefined;
    let oldestSnapshotAt: Date | undefined;

    snapshots.forEach((s) => {
      if (!newestSnapshotAt || s.updatedAt > newestSnapshotAt) {
        newestSnapshotAt = s.updatedAt;
      }

      if (!oldestSnapshotAt || s.createdAt < oldestSnapshotAt) {
        oldestSnapshotAt = s.createdAt;
      }
    });

    return {
      totalSnapshots,
      aggregatesWithSnapshots,
      averageVersion: Math.round(averageVersion * 10) / 10,
      newestSnapshotAt,
      oldestSnapshotAt,
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Preslikaj Prisma data v Domain DTO
   */
  private mapToDomain(data: any): WorkflowSnapshotDTO {
    return {
      id: data.id,
      aggregateId: data.aggregateId,
      version: data.version,
      state: data.state,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
