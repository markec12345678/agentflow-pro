/**
 * Workflow Versioning Service
 * Handles: Version creation, history tracking, rollback, comparison
 */

import { prisma } from '@/lib/prisma';

export interface VersionMetadata {
  changeSummary: string;
  changeType: 'major' | 'minor' | 'patch';
  createdBy: string;
}

export interface WorkflowVersionData {
  workflowId: string;
  name: string;
  description?: string;
  nodes: any[];
  edges: any[];
  metadata?: any;
}

export class WorkflowVersioningService {
  /**
   * Create new version of workflow
   */
  async createVersion(
    workflowId: string,
    data: WorkflowVersionData,
    metadata: VersionMetadata
  ): Promise<any> {
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
    });

    if (!workflow) {
      throw new Error('Workflow not found');
    }

    const currentVersion = workflow.versions[0];
    const newVersionNumber = currentVersion ? currentVersion.versionNumber + 1 : 1;

    // Deactivate current version
    if (currentVersion) {
      await prisma.workflowVersion.update({
        where: { id: currentVersion.id },
        data: { isCurrent: false },
      });
    }

    // Create new version
    const version = await prisma.workflowVersion.create({
      data: {
        workflowId,
        versionNumber: newVersionNumber,
        name: data.name,
        description: data.description,
        nodes: data.nodes,
        edges: data.edges,
        metadata: data.metadata,
        changeSummary: metadata.changeSummary,
        changeType: metadata.changeType,
        isCurrent: true,
        parentVersionId: currentVersion?.id || null,
        createdBy: metadata.createdBy,
      },
    });

    // Update workflow current version counter
    await prisma.workflow.update({
      where: { id: workflowId },
      data: {
        currentVersion: newVersionNumber,
        nodes: data.nodes,
        edges: data.edges,
        metadata: data.metadata,
      },
    });

    return version;
  }

  /**
   * Get all versions of workflow
   */
  async getVersions(workflowId: string): Promise<any[]> {
    return prisma.workflowVersion.findMany({
      where: { workflowId },
      orderBy: { versionNumber: 'desc' },
      include: {
        parentVersion: {
          select: {
            id: true,
            versionNumber: true,
            createdAt: true,
          },
        },
      },
    });
  }

  /**
   * Get specific version
   */
  async getVersion(workflowId: string, versionNumber: number): Promise<any> {
    return prisma.workflowVersion.findFirst({
      where: {
        workflowId,
        versionNumber,
      },
    });
  }

  /**
   * Rollback to previous version
   */
  async rollback(workflowId: string, targetVersionNumber: number, userId: string): Promise<any> {
    const targetVersion = await this.getVersion(workflowId, targetVersionNumber);

    if (!targetVersion) {
      throw new Error(`Version ${targetVersionNumber} not found`);
    }

    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      include: { versions: { where: { isCurrent: true } } },
    });

    if (!workflow) {
      throw new Error('Workflow not found');
    }

    const currentVersion = workflow.versions[0];

    // Create rollback version
    const rollbackVersion = await prisma.workflowVersion.create({
      data: {
        workflowId,
        versionNumber: currentVersion ? currentVersion.versionNumber + 1 : 1,
        name: `Rollback to v${targetVersionNumber}`,
        description: `Rolled back from v${currentVersion?.versionNumber || 1} to v${targetVersionNumber}`,
        nodes: targetVersion.nodes,
        edges: targetVersion.edges,
        metadata: targetVersion.metadata,
        changeSummary: `Rollback to version ${targetVersionNumber}`,
        changeType: 'major',
        isCurrent: true,
        parentVersionId: currentVersion?.id || null,
        createdBy: userId,
      },
    });

    // Update workflow
    await prisma.workflow.update({
      where: { id: workflowId },
      data: {
        currentVersion: rollbackVersion.versionNumber,
        nodes: targetVersion.nodes,
        edges: targetVersion.edges,
        metadata: targetVersion.metadata,
      },
    });

    // Deactivate previous current version
    if (currentVersion) {
      await prisma.workflowVersion.update({
        where: { id: currentVersion.id },
        data: { isCurrent: false },
      });
    }

    return rollbackVersion;
  }

  /**
   * Compare two versions
   */
  async compareVersions(
    workflowId: string,
    version1: number,
    version2: number
  ): Promise<{
    version1: any;
    version2: any;
    changes: {
      nodesAdded: number;
      nodesRemoved: number;
      edgesAdded: number;
      edgesRemoved: number;
      metadataChanged: boolean;
    };
  }> {
    const v1 = await this.getVersion(workflowId, version1);
    const v2 = await this.getVersion(workflowId, version2);

    if (!v1 || !v2) {
      throw new Error('One or both versions not found');
    }

    const nodes1 = Array.isArray(v1.nodes) ? v1.nodes : [];
    const nodes2 = Array.isArray(v2.nodes) ? v2.nodes : [];
    const edges1 = Array.isArray(v1.edges) ? v1.edges : [];
    const edges2 = Array.isArray(v2.edges) ? v2.edges : [];

    return {
      version1: v1,
      version2: v2,
      changes: {
        nodesAdded: nodes2.length - nodes1.length,
        nodesRemoved: nodes1.length - nodes2.length,
        edgesAdded: edges2.length - edges1.length,
        edgesRemoved: edges1.length - edges2.length,
        metadataChanged: JSON.stringify(v1.metadata) !== JSON.stringify(v2.metadata),
      },
    };
  }

  /**
   * Delete specific version
   */
  async deleteVersion(workflowId: string, versionNumber: number): Promise<void> {
    const version = await this.getVersion(workflowId, versionNumber);

    if (!version) {
      throw new Error(`Version ${versionNumber} not found`);
    }

    if (version.isCurrent) {
      throw new Error('Cannot delete current version');
    }

    await prisma.workflowVersion.delete({
      where: { id: version.id },
    });
  }

  /**
   * Get version history tree
   */
  async getVersionTree(workflowId: string): Promise<any> {
    const versions = await prisma.workflowVersion.findMany({
      where: { workflowId },
      orderBy: { versionNumber: 'asc' },
      select: {
        id: true,
        versionNumber: true,
        name: true,
        changeSummary: true,
        changeType: true,
        createdAt: true,
        createdBy: true,
        parentVersionId: true,
        isCurrent: true,
      },
    });

    // Build tree structure
    const tree: any[] = [];
    const versionMap = new Map<string, any>();

    versions.forEach(v => {
      versionMap.set(v.id, { ...v, children: [] });
    });

    versions.forEach(v => {
      if (v.parentVersionId) {
        const parent = versionMap.get(v.parentVersionId);
        if (parent) {
          parent.children.push(versionMap.get(v.id));
        } else {
          tree.push(versionMap.get(v.id));
        }
      } else {
        tree.push(versionMap.get(v.id));
      }
    });

    return tree;
  }

  /**
   * Auto-version on workflow update
   */
  async autoVersionOnUpdate(
    workflowId: string,
    changes: { nodes?: any[]; edges?: any[]; metadata?: any },
    userId: string
  ): Promise<any> {
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
    });

    if (!workflow) {
      throw new Error('Workflow not found');
    }

    // Determine change type
    let changeType: 'major' | 'minor' | 'patch' = 'minor';
    if (changes.nodes || changes.edges) {
      changeType = 'major';
    } else if (changes.metadata) {
      changeType = 'minor';
    }

    return this.createVersion(
      workflowId,
      {
        workflowId,
        name: workflow.name,
        description: workflow.description || undefined,
        nodes: changes.nodes || workflow.nodes as any[] || [],
        edges: changes.edges || workflow.edges as any[] || [],
        metadata: changes.metadata || workflow.metadata,
      },
      {
        changeSummary: 'Auto-versioned on update',
        changeType,
        createdBy: userId,
      }
    );
  }
}

export const workflowVersioningService = new WorkflowVersioningService();
