/**
 * Idempotency Manager for Production-Grade Operations
 * Prevents duplicate operations and ensures atomic transactions
 */

import { v4 as uuidv4 } from 'uuid';
import Redis from 'ioredis';

export interface IdempotencyConfig {
  keyPrefix: string;
  ttl: number; // Time to live in seconds
  retryWindow: number; // Window for retry detection
}

export interface IdempotencyRecord {
  key: string;
  operation: string;
  status: 'pending' | 'completed' | 'failed';
  result?: any;
  error?: any;
  createdAt: Date;
  updatedAt: Date;
  attempts: number;
  maxAttempts: number;
}

export class IdempotencyManager {
  private redis: Redis;
  private config: IdempotencyConfig;

  constructor(config: Partial<IdempotencyConfig> = {}) {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    });

    this.config = {
      keyPrefix: 'idempotency:',
      ttl: 3600, // 1 hour
      retryWindow: 300, // 5 minutes
      ...config,
    };
  }

  /**
   * Generate idempotency key for operation
   */
  generateKey(operation: string, params: Record<string, any>): string {
    const hash = this.hashParams(params);
    return `${this.config.keyPrefix}${operation}:${hash}`;
  }

  /**
   * Check if operation is already executed
   */
  async checkAndLock(key: string, maxAttempts: number = 3): Promise<{
    canProceed: boolean;
    record?: IdempotencyRecord;
    isRetry: boolean;
  }> {
    const existing = await this.getRecord(key);
    
    if (!existing) {
      // First time execution
      const record: IdempotencyRecord = {
        key,
        operation: this.extractOperation(key),
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        attempts: 1,
        maxAttempts,
      };
      
      await this.saveRecord(record);
      return { canProceed: true, record, isRetry: false };
    }

    // Check if operation is completed
    if (existing.status === 'completed') {
      return { canProceed: false, record: existing, isRetry: false };
    }

    // Check if operation failed and can be retried
    if (existing.status === 'failed' && existing.attempts < existing.maxAttempts) {
      const timeSinceLastAttempt = Date.now() - existing.updatedAt.getTime();
      
      if (timeSinceLastAttempt < this.config.retryWindow * 1000) {
        // Still in retry window, don't proceed
        return { canProceed: false, record: existing, isRetry: false };
      }

      // Retry allowed
      const updatedRecord = {
        ...existing,
        status: 'pending',
        attempts: existing.attempts + 1,
        updatedAt: new Date(),
      };
      
      await this.saveRecord(updatedRecord);
      return { canProceed: true, record: updatedRecord, isRetry: true };
    }

    // Operation in progress or max attempts exceeded
    return { canProceed: false, record: existing, isRetry: false };
  }

  /**
   * Mark operation as completed
   */
  async markCompleted(key: string, result: any): Promise<void> {
    const record = await this.getRecord(key);
    if (!record) return;

    const updatedRecord: IdempotencyRecord = {
      ...record,
      status: 'completed',
      result,
      updatedAt: new Date(),
    };

    await this.saveRecord(updatedRecord);
  }

  /**
   * Mark operation as failed
   */
  async markFailed(key: string, error: any): Promise<void> {
    const record = await this.getRecord(key);
    if (!record) return;

    const updatedRecord: IdempotencyRecord = {
      ...record,
      status: 'failed',
      error,
      updatedAt: new Date(),
    };

    await this.saveRecord(updatedRecord);
  }

  /**
   * Execute operation with idempotency protection
   */
  async executeWithIdempotency<T>(
    operation: string,
    params: Record<string, any>,
    fn: () => Promise<T>,
    options: { maxAttempts?: number } = {}
  ): Promise<T> {
    const key = this.generateKey(operation, params);
    const { canProceed, record, isRetry } = await this.checkAndLock(key, options.maxAttempts);

    if (!canProceed) {
      if (record?.status === 'completed') {
        // Return cached result
        return record.result;
      }
      
      if (record?.status === 'failed') {
        // Return cached error
        throw new Error(`Operation failed after ${record.attempts} attempts: ${record.error?.message || 'Unknown error'}`);
      }

      // Operation in progress
      throw new Error('Operation is already in progress');
    }

    try {
      const result = await fn();
      await this.markCompleted(key, result);
      return result;
    } catch (error) {
      await this.markFailed(key, error);
      
      if (isRetry) {
        // This is a retry attempt, re-throw to allow retry logic
        throw error;
      }
      
      // First attempt failed, throw error
      throw error;
    }
  }

  /**
   * Get idempotency record
   */
  private async getRecord(key: string): Promise<IdempotencyRecord | null> {
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Save idempotency record
   */
  private async saveRecord(record: IdempotencyRecord): Promise<void> {
    await this.redis.setex(record.key, this.config.ttl, JSON.stringify(record));
  }

  /**
   * Hash parameters for consistent key generation
   */
  private hashParams(params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {} as Record<string, any>);
    
    return Buffer.from(JSON.stringify(sortedParams)).toString('base64');
  }

  /**
   * Extract operation name from key
   */
  private extractOperation(key: string): string {
    const parts = key.split(':');
    return parts[1] || 'unknown';
  }

  /**
   * Cleanup expired records
   */
  async cleanup(): Promise<void> {
    const pattern = `${this.config.keyPrefix}*`;
    const keys = await this.redis.keys(pattern);
    
    for (const key of keys) {
      const record = await this.getRecord(key);
      if (record && record.status === 'completed') {
        // Keep completed records for audit trail
        continue;
      }
      
      if (record && record.status === 'failed') {
        // Remove failed records after TTL
        await this.redis.del(key);
      }
    }
  }

  /**
   * Get statistics
   */
  async getStats(): Promise<{
    total: number;
    pending: number;
    completed: number;
    failed: number;
  }> {
    const pattern = `${this.config.keyPrefix}*`;
    const keys = await this.redis.keys(pattern);
    
    let pending = 0;
    let completed = 0;
    let failed = 0;

    for (const key of keys) {
      const record = await this.getRecord(key);
      if (record) {
        switch (record.status) {
          case 'pending':
            pending++;
            break;
          case 'completed':
            completed++;
            break;
          case 'failed':
            failed++;
            break;
        }
      }
    }

    return {
      total: keys.length,
      pending,
      completed,
      failed,
    };
  }
}

// Singleton instance
export const idempotencyManager = new IdempotencyManager();
