/**
 * AuditLogger - HMAC-signed audit trail
 * 
 * Provides:
 * - Tamper-proof audit logs
 * - HMAC-SHA256 signatures
 * - Log verification
 * - Compliance reporting
 * 
 * Based on research showing signed audit trails
 * are required for enterprise compliance
 */

import { createHmac, randomBytes } from 'crypto';
import { PrismaClient } from '@prisma/client';

// ============================================================================
// INTERFACES
// ============================================================================

export interface AuditLogger {
  log(action: AuditAction): Promise<AuditLogEntry>;
  verify(entry: AuditLogEntry): Promise<boolean>;
  search(query: AuditQuery): Promise<AuditLogEntry[]>;
  getReport(options: ReportOptions): Promise<AuditReport>;
}

export interface AuditAction {
  eventType: string;
  agentId?: string;
  userId?: string;
  workflowId?: string;
  action: string;
  resource?: string;
  details?: Record<string, any>;
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    requestId?: string;
    duration?: number;
  };
}

export interface AuditLogEntry {
  id: string;
  eventType: string;
  agentId?: string;
  userId?: string;
  workflowId?: string;
  action: string;
  resource?: string;
  details?: Record<string, any>;
  metadata?: AuditAction['metadata'];
  timestamp: Date;
  signature: string;
  verified: boolean;
}

export interface AuditQuery {
  agentId?: string;
  userId?: string;
  eventType?: string;
  action?: string;
  startTime?: Date;
  endTime?: Date;
  limit?: number;
  offset?: number;
}

export interface ReportOptions {
  startTime: Date;
  endTime: Date;
  groupBy?: 'agent' | 'user' | 'eventType' | 'action';
  includeDetails?: boolean;
}

export interface AuditReport {
  period: {
    start: Date;
    end: Date;
  };
  summary: {
    totalEvents: number;
    uniqueAgents: number;
    uniqueUsers: number;
    eventTypes: Array<{ type: string; count: number }>;
  };
  details?: AuditLogEntry[];
  anomalies?: Array<{
    type: 'high_frequency' | 'unusual_action' | 'failed_verification';
    severity: 'low' | 'medium' | 'high';
    description: string;
    evidence: string[];
  }>;
  generatedAt: Date;
}

// ============================================================================
// AUDIT LOGGER IMPLEMENTATION
// ============================================================================

export class AuditLoggerImpl implements AuditLogger {
  private secretKey: string;
  private prisma: PrismaClient;
  private buffer: AuditLogEntry[] = [];
  private bufferSize = 100;
  private flushInterval: NodeJS.Timeout;

  constructor(secretKey?: string) {
    this.secretKey = secretKey || process.env.AUDIT_SECRET_KEY || randomBytes(32).toString('hex');
    this.prisma = new PrismaClient();
    
    // Auto-flush buffer every 5 seconds
    this.flushInterval = setInterval(() => this.flushBuffer(), 5000);
    
    console.log('[AuditLogger] Initialized with HMAC-SHA256 signing');
  }

  // ============================================================================
  // CORE LOGGING
  // ============================================================================

  /**
   * Log an audit event with HMAC signature
   */
  async log(action: AuditAction): Promise<AuditLogEntry> {
    const timestamp = new Date();
    
    const entry: AuditLogEntry = {
      id: this.generateId(),
      eventType: action.eventType,
      agentId: action.agentId,
      userId: action.userId,
      workflowId: action.workflowId,
      action: action.action,
      resource: action.resource,
      details: action.details,
      metadata: action.metadata,
      timestamp,
      signature: '',
      verified: false,
    };

    // Generate signature
    entry.signature = this.signEntry(entry);
    entry.verified = true;

    // Buffer for batch write
    this.buffer.push(entry);

    // Flush if buffer is full
    if (this.buffer.length >= this.bufferSize) {
      await this.flushBuffer();
    }

    return entry;
  }

  /**
   * Verify an audit log entry
   */
  async verify(entry: AuditLogEntry): Promise<boolean> {
    const expectedSignature = this.signEntry(entry);
    
    if (entry.signature !== expectedSignature) {
      console.warn('[AuditLogger] Signature verification failed for entry:', entry.id);
      return false;
    }

    return true;
  }

  /**
   * Search audit logs
   */
  async search(query: AuditQuery): Promise<AuditLogEntry[]> {
    try {
      const where: any = {};

      if (query.agentId) {
        where.agentId = query.agentId;
      }
      if (query.userId) {
        where.userId = query.userId;
      }
      if (query.eventType) {
        where.eventType = query.eventType;
      }
      if (query.action) {
        where.action = query.action;
      }
      if (query.startTime || query.endTime) {
        where.timestamp = {};
        if (query.startTime) where.timestamp.gte = query.startTime;
        if (query.endTime) where.timestamp.lte = query.endTime;
      }

      const logs = await this.prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: query.limit || 100,
        skip: query.offset || 0,
      });

      return logs.map(log => ({
        id: log.id,
        eventType: log.eventType,
        agentId: log.agentId || undefined,
        userId: log.userId || undefined,
        workflowId: log.workflowId || undefined,
        action: log.action,
        resource: log.resource || undefined,
        details: (log.details as any) || undefined,
        metadata: (log.metadata as any) || undefined,
        timestamp: log.timestamp,
        signature: log.signature,
        verified: log.verified,
      }));
    } catch (error) {
      console.error('[AuditLogger] Search failed:', error);
      return [];
    }
  }

  /**
   * Generate audit report
   */
  async getReport(options: ReportOptions): Promise<AuditReport> {
    try {
      const logs = await this.search({
        startTime: options.startTime,
        endTime: options.endTime,
        limit: 10000,
      });

      // Calculate summary statistics
      const uniqueAgents = new Set(logs.map(l => l.agentId).filter(Boolean));
      const uniqueUsers = new Set(logs.map(l => l.userId).filter(Boolean));

      const eventTypeCounts = new Map<string, number>();
      for (const log of logs) {
        eventTypeCounts.set(log.eventType, (eventTypeCounts.get(log.eventType) || 0) + 1);
      }

      const eventTypes = Array.from(eventTypeCounts.entries()).map(([type, count]) => ({
        type,
        count,
      }));

      // Detect anomalies
      const anomalies = this.detectAnomalies(logs);

      // Group details if requested
      let details: AuditLogEntry[] | undefined;
      if (options.includeDetails) {
        details = logs;
        
        if (options.groupBy) {
          details = logs.sort((a, b) => {
            const aKey = a[options.groupBy!] || '';
            const bKey = b[options.groupBy!] || '';
            return aKey.localeCompare(bKey);
          });
        }
      }

      return {
        period: {
          start: options.startTime,
          end: options.endTime,
        },
        summary: {
          totalEvents: logs.length,
          uniqueAgents: uniqueAgents.size,
          uniqueUsers: uniqueUsers.size,
          eventTypes,
        },
        details,
        anomalies,
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error('[AuditLogger] Report generation failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // BATCH OPERATIONS
  // ============================================================================

  /**
   * Flush buffer to database
   */
  private async flushBuffer(): Promise<void> {
    if (this.buffer.length === 0) {
      return;
    }

    try {
      const entries = [...this.buffer];
      this.buffer = [];

      await this.prisma.auditLog.createMany({
        data: entries.map(entry => ({
          id: entry.id,
          eventType: entry.eventType,
          agentId: entry.agentId,
          userId: entry.userId,
          workflowId: entry.workflowId,
          action: entry.action,
          resource: entry.resource,
          details: entry.details,
          metadata: entry.metadata,
          timestamp: entry.timestamp,
          signature: entry.signature,
          verified: entry.verified,
        })),
      });

      console.log('[AuditLogger] Flushed', entries.length, 'entries to database');
    } catch (error) {
      console.error('[AuditLogger] Failed to flush buffer:', error);
      // Re-add to buffer for retry
      this.buffer.unshift(...this.buffer);
    }
  }

  // ============================================================================
  // ANOMALY DETECTION
  // ============================================================================

  /**
   * Detect anomalies in audit logs
   */
  private detectAnomalies(logs: AuditLogEntry[]): AuditReport['anomalies'] {
    const anomalies: AuditReport['anomalies'] = [];

    // 1. High frequency detection
    const agentFrequency = new Map<string, number>();
    for (const log of logs) {
      if (log.agentId) {
        agentFrequency.set(log.agentId, (agentFrequency.get(log.agentId) || 0) + 1);
      }
    }

    for (const [agentId, count] of agentFrequency.entries()) {
      if (count > 1000) {
        anomalies.push({
          type: 'high_frequency',
          severity: 'medium',
          description: `Agent ${agentId} has unusually high activity (${count} events)`,
          evidence: [`Event count: ${count}`],
        });
      }
    }

    // 2. Failed verification detection
    const failedVerifications = logs.filter(log => !log.verified);
    if (failedVerifications.length > 0) {
      anomalies.push({
        type: 'failed_verification',
        severity: 'high',
        description: `${failedVerifications.length} audit log entries failed verification`,
        evidence: failedVerifications.slice(0, 5).map(l => l.id),
      });
    }

    // 3. Unusual action detection
    const actionCounts = new Map<string, number>();
    for (const log of logs) {
      actionCounts.set(log.action, (actionCounts.get(log.action) || 0) + 1);
    }

    const avgCount = logs.length / Math.max(1, actionCounts.size);
    for (const [action, count] of actionCounts.entries()) {
      if (count < avgCount * 0.1 && count < 5) {
        anomalies.push({
          type: 'unusual_action',
          severity: 'low',
          description: `Unusual action detected: ${action} (only ${count} occurrences)`,
          evidence: [`Action: ${action}`, `Count: ${count}`],
        });
      }
    }

    return anomalies;
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private signEntry(entry: AuditLogEntry): string {
    const data = JSON.stringify({
      id: entry.id,
      eventType: entry.eventType,
      agentId: entry.agentId,
      userId: entry.userId,
      workflowId: entry.workflowId,
      action: entry.action,
      resource: entry.resource,
      details: entry.details,
      timestamp: entry.timestamp.toISOString(),
    });

    return createHmac('sha256', this.secretKey).update(data).digest('hex');
  }

  private generateId(): string {
    return `audit_${Date.now()}_${randomBytes(8).toString('hex')}`;
  }

  /**
   * Disconnect and cleanup
   */
  async disconnect(): Promise<void> {
    clearInterval(this.flushInterval);
    await this.flushBuffer();
    await this.prisma.$disconnect();
    console.log('[AuditLogger] Disconnected');
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

let auditLoggerInstance: AuditLoggerImpl | null = null;

export const getAuditLogger = (secretKey?: string): AuditLogger => {
  if (!auditLoggerInstance) {
    auditLoggerInstance = new AuditLoggerImpl(secretKey);
  }
  return auditLoggerInstance;
};

export default AuditLoggerImpl;
