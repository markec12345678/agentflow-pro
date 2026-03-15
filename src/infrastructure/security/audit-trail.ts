/**
 * AgentFlow Pro - Audit Trail System
 * Comprehensive logging of all user and system actions
 */

export interface AuditLog {
  logId: string;
  timestamp: string;
  eventType: AuditEventType;
  severity: 'info' | 'warning' | 'error' | 'critical';
  actor: AuditActor;
  action: string;
  resource?: AuditResource;
  details: any;
  outcome: 'success' | 'failure' | 'partial';
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
    correlationId?: string;
  };
}

export interface AuditActor {
  type: 'user' | 'system' | 'agent';
  id: string;
  email?: string;
  name?: string;
  role?: string;
}

export interface AuditResource {
  type: string;
  id: string;
  name?: string;
  previousState?: any;
  newState?: any;
}

export type AuditEventType =
  | 'user.login'
  | 'user.logout'
  | 'user.create'
  | 'user.update'
  | 'user.delete'
  | 'user.password_reset'
  | 'role.assign'
  | 'role.revoke'
  | 'permission.deny'
  | 'agent.execute'
  | 'agent.approve'
  | 'agent.reject'
  | 'workflow.create'
  | 'workflow.update'
  | 'workflow.delete'
  | 'workflow.execute'
  | 'data.export'
  | 'data.delete'
  | 'data.access'
  | 'security.violation'
  | 'security.breach_attempt'
  | 'system.config_change'
  | 'system.maintenance'
  | 'api.key_create'
  | 'api.key_revoke'
  | 'api.key_rotate'
  | 'compliance.gdpr_export'
  | 'compliance.gdpr_delete'
  | 'compliance.audit_access';

export interface AuditQuery {
  eventType?: AuditEventType;
  actorId?: string;
  resourceId?: string;
  startTime?: string;
  endTime?: string;
  severity?: string;
  outcome?: string;
  limit?: number;
  offset?: number;
}

export interface AuditStats {
  totalLogs: number;
  logsByEventType: Record<string, number>;
  logsBySeverity: Record<string, number>;
  logsByOutcome: Record<string, number>;
  topActors: Array<{ actorId: string; count: number }>;
  securityEvents: number;
}

export class AuditTrailManager {
  private logs: AuditLog[] = [];
  private listeners: Array<(log: AuditLog) => void> = [];
  private retentionDays: number;

  constructor(retentionDays: number = 90) {
    this.retentionDays = retentionDays;
  }

  /**
   * Log an audit event
   */
  async log(event: Omit<AuditLog, 'logId' | 'timestamp'>): Promise<AuditLog> {
    const log: AuditLog = {
      ...event,
      logId: `audit_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      timestamp: new Date().toISOString(),
    };

    this.logs.push(log);
    this.notifyListeners(log);

    // Auto-cleanup old logs
    if (this.logs.length % 1000 === 0) {
      this.cleanupOldLogs();
    }

    return log;
  }

  /**
   * Log user action
   */
  async logUserAction(
    userId: string,
    action: string,
    resource?: AuditResource,
    details?: any,
    outcome: 'success' | 'failure' | 'partial' = 'success'
  ): Promise<AuditLog> {
    return this.log({
      eventType: this.inferEventType(action),
      severity: outcome === 'failure' ? 'warning' : 'info',
      actor: {
        type: 'user',
        id: userId,
      },
      action,
      resource,
      details,
      outcome,
      metadata: {},
    });
  }

  /**
   * Log agent execution
   */
  async logAgentExecution(
    agentId: string,
    action: string,
    input?: any,
    output?: any,
    error?: string
  ): Promise<AuditLog> {
    return this.log({
      eventType: 'agent.execute',
      severity: error ? 'error' : 'info',
      actor: {
        type: 'agent',
        id: agentId,
      },
      action,
      details: { input, output, error },
      outcome: error ? 'failure' : 'success',
      metadata: {},
    });
  }

  /**
   * Log security event
   */
  async logSecurityEvent(
    eventType: 'security.violation' | 'security.breach_attempt',
    actorId: string,
    details: any,
    severity: 'warning' | 'error' | 'critical' = 'warning'
  ): Promise<AuditLog> {
    return this.log({
      eventType,
      severity,
      actor: {
        type: 'user',
        id: actorId,
      },
      action: eventType,
      details,
      outcome: 'failure',
      metadata: {},
    });
  }

  /**
   * Query audit logs
   */
  queryLogs(query: AuditQuery): AuditLog[] {
    let results = [...this.logs];

    // Filter by event type
    if (query.eventType) {
      results = results.filter(log => log.eventType === query.eventType);
    }

    // Filter by actor
    if (query.actorId) {
      results = results.filter(log => log.actor.id === query.actorId);
    }

    // Filter by resource
    if (query.resourceId) {
      results = results.filter(log => log.resource?.id === query.resourceId);
    }

    // Filter by time range
    if (query.startTime) {
      results = results.filter(log => log.timestamp >= query.startTime!);
    }
    if (query.endTime) {
      results = results.filter(log => log.timestamp <= query.endTime!);
    }

    // Filter by severity
    if (query.severity) {
      results = results.filter(log => log.severity === query.severity);
    }

    // Filter by outcome
    if (query.outcome) {
      results = results.filter(log => log.outcome === query.outcome);
    }

    // Sort by timestamp (newest first)
    results.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    // Apply pagination
    const offset = query.offset || 0;
    const limit = query.limit || 100;
    results = results.slice(offset, offset + limit);

    return results;
  }

  /**
   * Get audit statistics
   */
  getStats(timeRange?: { startTime: string; endTime: string }): AuditStats {
    let logs = this.logs;

    if (timeRange) {
      logs = logs.filter(
        log => log.timestamp >= timeRange.startTime && log.timestamp <= timeRange.endTime
      );
    }

    const logsByEventType: Record<string, number> = {};
    const logsBySeverity: Record<string, number> = {};
    const logsByOutcome: Record<string, number> = {};
    const actorCounts: Map<string, number> = new Map();

    let securityEvents = 0;

    logs.forEach(log => {
      // Count by event type
      logsByEventType[log.eventType] = (logsByEventType[log.eventType] || 0) + 1;

      // Count by severity
      logsBySeverity[log.severity] = (logsBySeverity[log.severity] || 0) + 1;

      // Count by outcome
      logsByOutcome[log.outcome] = (logsByOutcome[log.outcome] || 0) + 1;

      // Count by actor
      actorCounts.set(log.actor.id, (actorCounts.get(log.actor.id) || 0) + 1);

      // Count security events
      if (log.eventType.startsWith('security.')) {
        securityEvents++;
      }
    });

    const topActors = Array.from(actorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([actorId, count]) => ({ actorId, count }));

    return {
      totalLogs: logs.length,
      logsByEventType,
      logsBySeverity,
      logsByOutcome,
      topActors,
      securityEvents,
    };
  }

  /**
   * Get logs for specific resource
   */
  getResourceHistory(resourceType: string, resourceId: string): AuditLog[] {
    return this.queryLogs({
      resourceId,
      limit: 100,
    }).filter(log => log.resource?.type === resourceType);
  }

  /**
   * Get logs for specific user
   */
  getUserActivity(userId: string, limit: number = 50): AuditLog[] {
    return this.queryLogs({
      actorId: userId,
      limit,
    });
  }

  /**
   * Export audit logs (for compliance)
   */
  exportLogs(query: AuditQuery, format: 'json' | 'csv' = 'json'): string {
    const logs = this.queryLogs(query);

    if (format === 'json') {
      return JSON.stringify(logs, null, 2);
    }

    // CSV export
    const headers = [
      'logId', 'timestamp', 'eventType', 'severity', 'actorId', 'action',
      'resourceType', 'resourceId', 'outcome', 'details'
    ];

    const rows = logs.map(log => [
      log.logId,
      log.timestamp,
      log.eventType,
      log.severity,
      log.actor.id,
      log.action,
      log.resource?.type || '',
      log.resource?.id || '',
      log.outcome,
      JSON.stringify(log.details).replace(/"/g, '""'),
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  /**
   * Subscribe to audit log events
   */
  onLog(callback: (log: AuditLog) => void): () => void {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Clean up old logs
   */
  private cleanupOldLogs(): number {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - this.retentionDays);

    const initialLength = this.logs.length;
    this.logs = this.logs.filter(log => new Date(log.timestamp) > cutoff);

    return initialLength - this.logs.length;
  }

  /**
   * Infer event type from action string
   */
  private inferEventType(action: string): AuditEventType {
    const actionLower = action.toLowerCase();

    if (actionLower.includes('login')) return 'user.login';
    if (actionLower.includes('logout')) return 'user.logout';
    if (actionLower.includes('create')) return 'user.create';
    if (actionLower.includes('update')) return 'user.update';
    if (actionLower.includes('delete')) return 'user.delete';
    if (actionLower.includes('execute')) return 'agent.execute';
    if (actionLower.includes('approve')) return 'agent.approve';
    if (actionLower.includes('reject')) return 'agent.reject';
    if (actionLower.includes('export')) return 'data.export';
    if (actionLower.includes('key')) return 'api.key_create';

    return 'system.config_change';
  }

  /**
   * Notify listeners of new log
   */
  private notifyListeners(log: AuditLog): void {
    this.listeners.forEach(callback => {
      try {
        callback(log);
      } catch (error) {
        logger.error('Audit listener error:', error);
      }
    });
  }
}

export const auditTrailManager = new AuditTrailManager();
