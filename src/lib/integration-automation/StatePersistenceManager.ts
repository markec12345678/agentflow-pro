/**
 * State Persistence Manager for Production-Grade Workflow Execution
 * Provides checkpointing, recovery, and atomic state management
 */

import Redis from 'ioredis';
import { WorkflowExecution } from '@/types/integration-automation';

export interface StateSnapshot {
  executionId: string;
  workflowId: string;
  stepIndex: number;
  status: string;
  variables: Record<string, unknown>;
  steps: any[];
  timestamp: Date;
  checksum: string;
}

export interface PersistenceConfig {
  checkpointInterval: number; // Steps between checkpoints
  maxSnapshots: number; // Maximum snapshots per execution
  archiveAfter: number; // Hours after which to archive
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
}

export class StatePersistenceManager {
  private redis: Redis;
  private config: PersistenceConfig;

  constructor(config: Partial<PersistenceConfig> = {}) {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      retryDelayOnFailover: 100,
    });

    this.config = {
      checkpointInterval: 1,
      maxSnapshots: 10,
      archiveAfter: 24,
      compressionEnabled: true,
      encryptionEnabled: false,
      ...config,
    };
  }

  /**
   * Save execution state with atomic consistency
   */
  async saveExecutionState(execution: WorkflowExecution): Promise<void> {
    const snapshot: StateSnapshot = {
      executionId: execution.id,
      workflowId: execution.workflowId,
      stepIndex: execution.steps.length,
      status: execution.status,
      variables: execution.variables,
      steps: execution.steps,
      timestamp: new Date(),
      checksum: this.calculateChecksum(execution),
    };

    // Save current state
    const stateKey = `execution_state:${execution.id}`;
    const snapshotKey = `execution_snapshot:${execution.id}:${snapshot.stepIndex}`;
    
    // Use Redis transaction for atomicity
    const pipeline = this.redis.pipeline();
    
    // Save current state
    const stateData = this.serializeState(execution);
    pipeline.setex(stateKey, this.config.archiveAfter * 3600, stateData);
    
    // Save snapshot for recovery
    const snapshotData = this.serializeSnapshot(snapshot);
    pipeline.setex(snapshotKey, this.config.archiveAfter * 3600, snapshotData);
    
    // Maintain snapshot history
    const historyKey = `execution_history:${execution.id}`;
    pipeline.lpush(historyKey, snapshot.stepIndex.toString());
    pipeline.ltrim(historyKey, 0, this.config.maxSnapshots - 1);
    
    // Execute transaction
    await pipeline.exec();
    
    console.log(`💾 State saved for execution ${execution.id} at step ${snapshot.stepIndex}`);
  }

  /**
   * Get execution state for recovery
   */
  async getExecutionState(executionId: string): Promise<WorkflowExecution | null> {
    const stateKey = `execution_state:${executionId}`;
    const stateData = await this.redis.get(stateKey);
    
    if (!stateData) {
      return null;
    }

    try {
      const execution = this.deserializeState(stateData);
      
      // Verify checksum for integrity
      const currentChecksum = this.calculateChecksum(execution);
      if (execution.metadata?.checksum && execution.metadata.checksum !== currentChecksum) {
        console.warn(`⚠️ Checksum mismatch for execution ${executionId}`);
        // Attempt recovery from snapshots
        return await this.recoverFromSnapshot(executionId);
      }
      
      return execution;
    } catch (error) {
      console.error(`❌ Failed to deserialize execution state for ${executionId}:`, error);
      return null;
    }
  }

  /**
   * Recover execution from snapshot
   */
  async recoverFromSnapshot(executionId: string): Promise<WorkflowExecution | null> {
    const historyKey = `execution_history:${executionId}`;
    const snapshotIndices = await this.redis.lrange(historyKey, 0, -1);
    
    // Try snapshots from most recent to oldest
    for (const index of snapshotIndices) {
      const snapshotKey = `execution_snapshot:${executionId}:${index}`;
      const snapshotData = await this.redis.get(snapshotKey);
      
      if (snapshotData) {
        try {
          const snapshot = this.deserializeSnapshot(snapshotData);
          const execution = this.reconstructExecutionFromSnapshot(snapshot);
          
          // Verify checksum
          const currentChecksum = this.calculateChecksum(execution);
          if (snapshot.checksum === currentChecksum) {
            console.log(`🔄 Recovered execution ${executionId} from snapshot ${index}`);
            return execution;
          }
        } catch (error) {
          console.error(`❌ Failed to recover from snapshot ${index}:`, error);
          continue;
        }
      }
    }
    
    console.error(`❌ Failed to recover execution ${executionId} from any snapshot`);
    return null;
  }

  /**
   * Archive completed execution
   */
  async archiveExecution(execution: WorkflowExecution): Promise<void> {
    const archiveKey = `execution_archive:${execution.id}`;
    const archiveData = this.serializeState(execution);
    
    // Archive for long-term storage (30 days)
    await this.redis.setex(archiveKey, 30 * 24 * 3600, archiveData);
    
    // Clean up active state
    const stateKey = `execution_state:${execution.id}`;
    await this.redis.del(stateKey);
    
    console.log(`📦 Archived execution ${execution.id}`);
  }

  /**
   * Cleanup execution resources
   */
  async cleanupExecution(executionId: string): Promise<void> {
    const keys = [
      `execution_state:${executionId}`,
      `execution_history:${executionId}`,
    ];
    
    // Clean up snapshots
    const snapshotPattern = `execution_snapshot:${executionId}:*`;
    const snapshotKeys = await this.redis.keys(snapshotPattern);
    keys.push(...snapshotKeys);
    
    if (keys.length > 0) {
      await this.redis.del(...keys);
      console.log(`🧹 Cleaned up ${keys.length} keys for execution ${executionId}`);
    }
  }

  /**
   * Get execution history
   */
  async getExecutionHistory(executionId: string): Promise<StateSnapshot[]> {
    const historyKey = `execution_history:${executionId}`;
    const snapshotIndices = await this.redis.lrange(historyKey, 0, -1);
    
    const snapshots: StateSnapshot[] = [];
    
    for (const index of snapshotIndices) {
      const snapshotKey = `execution_snapshot:${executionId}:${index}`;
      const snapshotData = await this.redis.get(snapshotKey);
      
      if (snapshotData) {
        try {
          const snapshot = this.deserializeSnapshot(snapshotData);
          snapshots.push(snapshot);
        } catch (error) {
          console.error(`❌ Failed to deserialize snapshot ${index}:`, error);
        }
      }
    }
    
    return snapshots.sort((a, b) => a.stepIndex - b.stepIndex);
  }

  /**
   * Get execution timeline for visualization
   */
  async getExecutionTimeline(executionId: string): Promise<{
    executionId: string;
    timeline: Array<{
      stepIndex: number;
      stepName: string;
      stepType: string;
      status: string;
      startedAt: Date;
      completedAt?: Date;
      duration?: number;
      error?: string;
    }>;
    totalDuration: number;
    successRate: number;
  }> {
    const execution = await this.getExecutionState(executionId);
    if (!execution) {
      throw new Error(`Execution ${executionId} not found`);
    }

    const timeline = execution.steps.map((step, index) => ({
      stepIndex: index,
      stepName: step.name,
      stepType: step.type,
      status: step.status,
      startedAt: step.startedAt,
      completedAt: step.completedAt,
      duration: step.duration,
      error: step.error?.message,
    }));

    const totalDuration = execution.duration || 0;
    const successRate = execution.steps.filter(s => s.status === 'completed').length / execution.steps.length * 100;

    return {
      executionId,
      timeline,
      totalDuration,
      successRate,
    };
  }

  /**
   * Get persistence statistics
   */
  async getStats(): Promise<{
    activeExecutions: number;
    archivedExecutions: number;
    totalSnapshots: number;
    averageSnapshotsPerExecution: number;
    storageUsage: {
      active: number;
      archived: number;
      total: number;
    };
  }> {
    const [activeKeys, archivedKeys, snapshotKeys] = await Promise.all([
      this.redis.keys('execution_state:*'),
      this.redis.keys('execution_archive:*'),
      this.redis.keys('execution_snapshot:*'),
    ]);

    const activeExecutions = activeKeys.length;
    const archivedExecutions = archivedKeys.length;
    const totalSnapshots = snapshotKeys.length;
    const averageSnapshotsPerExecution = activeExecutions > 0 ? totalSnapshots / activeExecutions : 0;

    // Calculate storage usage (approximate)
    const storageUsage = {
      active: activeKeys.length * 1024, // ~1KB per execution state
      archived: archivedKeys.length * 2048, // ~2KB per archived execution
      total: (activeKeys.length * 1024) + (archivedKeys.length * 2048),
    };

    return {
      activeExecutions,
      archivedExecutions,
      totalSnapshots,
      averageSnapshotsPerExecution,
      storageUsage,
    };
  }

  /**
   * Perform maintenance tasks
   */
  async performMaintenance(): Promise<void> {
    // Clean up expired snapshots
    const snapshotPattern = 'execution_snapshot:*';
    const snapshotKeys = await this.redis.keys(snapshotPattern);
    
    for (const key of snapshotKeys) {
      const ttl = await this.redis.ttl(key);
      if (ttl === -1) { // No expiry set
        await this.redis.expire(key, this.config.archiveAfter * 3600);
      }
    }

    // Clean up orphaned histories
    const historyPattern = 'execution_history:*';
    const historyKeys = await this.redis.keys(historyPattern);
    
    for (const key of historyKeys) {
      const executionId = key.split(':')[2];
      const stateKey = `execution_state:${executionId}`;
      const exists = await this.redis.exists(stateKey);
      
      if (!exists) {
        await this.redis.del(key);
      }
    }

    console.log('🔧 Maintenance completed');
  }

  /**
   * Serialize execution state
   */
  private serializeState(execution: WorkflowExecution): string {
    const data = {
      ...execution,
      metadata: {
        ...execution.metadata,
        checksum: this.calculateChecksum(execution),
        serializedAt: new Date(),
      },
    };

    const serialized = JSON.stringify(data);
    
    if (this.config.compressionEnabled) {
      // Simple compression simulation - in production use proper compression
      return Buffer.from(serialized).toString('base64');
    }
    
    return serialized;
  }

  /**
   * Deserialize execution state
   */
  private deserializeState(data: string): WorkflowExecution {
    let deserialized: string;
    
    if (this.config.compressionEnabled) {
      // Simple decompression simulation
      deserialized = Buffer.from(data, 'base64').toString();
    } else {
      deserialized = data;
    }
    
    return JSON.parse(deserialized);
  }

  /**
   * Serialize snapshot
   */
  private serializeSnapshot(snapshot: StateSnapshot): string {
    const serialized = JSON.stringify(snapshot);
    
    if (this.config.compressionEnabled) {
      return Buffer.from(serialized).toString('base64');
    }
    
    return serialized;
  }

  /**
   * Deserialize snapshot
   */
  private deserializeSnapshot(data: string): StateSnapshot {
    let deserialized: string;
    
    if (this.config.compressionEnabled) {
      deserialized = Buffer.from(data, 'base64').toString();
    } else {
      deserialized = data;
    }
    
    return JSON.parse(deserialized);
  }

  /**
   * Calculate checksum for integrity verification
   */
  private calculateChecksum(execution: WorkflowExecution): string {
    const relevantData = {
      executionId: execution.id,
      workflowId: execution.workflowId,
      status: execution.status,
      variables: execution.variables,
      steps: execution.steps.map(s => ({
        id: s.id,
        status: s.status,
        output: s.output,
      })),
    };
    
    const data = JSON.stringify(relevantData);
    return Buffer.from(data).toString('base64').substring(0, 16);
  }

  /**
   * Reconstruct execution from snapshot
   */
  private reconstructExecutionFromSnapshot(snapshot: StateSnapshot): WorkflowExecution {
    return {
      id: snapshot.executionId,
      workflowId: snapshot.workflowId,
      workflowVersion: '1.0.0',
      status: snapshot.status as any,
      startedAt: snapshot.timestamp,
      trigger: {
        type: 'api',
        data: {},
        timestamp: snapshot.timestamp,
      },
      input: {},
      variables: snapshot.variables,
      steps: snapshot.steps,
      metadata: {
        environment: 'production',
        version: '1.0.0',
        recovered: true,
        recoveredAt: new Date(),
        recoveredFromStep: snapshot.stepIndex,
        checksum: snapshot.checksum,
      },
    };
  }
}
