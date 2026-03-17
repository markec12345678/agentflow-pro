/**
 * AgentIdentity - Digital identity and mandate management
 * 
 * Provides:
 * - Agent identity with digital signature
 * - Mandate enforcement
 * - Permission verification
 * - Audit trail
 * 
 * Based on research showing identity-based governance
 * improves security and compliance
 */

import { createHmac, randomBytes } from 'crypto';

// ============================================================================
// INTERFACES
// ============================================================================

export interface AgentIdentity {
  agentId: string;
  mandate: string;
  allowedActions: string[];
  issuedBy: string;
  validFrom: Date;
  validUntil: Date;
  signature: string;
  publicKey?: string;
  metadata?: Record<string, any>;
}

export interface AgentIdentityInput {
  agentId: string;
  mandate: string;
  allowedActions: string[];
  issuedBy: string;
  validDays?: number;
  metadata?: Record<string, any>;
}

export interface AgentAction {
  agentId: string;
  action: string;
  resource?: string;
  context?: Record<string, any>;
  timestamp: Date;
}

export interface PermissionCheck {
  allowed: boolean;
  reason: string;
  mandate?: string;
  missingPermissions?: string[];
}

// ============================================================================
// AGENT IDENTITY MANAGER
// ============================================================================

export class AgentIdentityManager {
  private secretKey: string;
  private identityStore = new Map<string, AgentIdentity>();

  constructor(secretKey?: string) {
    this.secretKey = secretKey || process.env.AGENT_IDENTITY_SECRET || randomBytes(32).toString('hex');
    console.log('[AgentIdentity] Initialized');
  }

  // ============================================================================
  // IDENTITY MANAGEMENT
  // ============================================================================

  /**
   * Issue digital identity to an agent
   */
  async issueIdentity(input: AgentIdentityInput): Promise<AgentIdentity> {
    const validFrom = new Date();
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + (input.validDays || 365));

    const identity: AgentIdentity = {
      agentId: input.agentId,
      mandate: input.mandate,
      allowedActions: input.allowedActions,
      issuedBy: input.issuedBy,
      validFrom,
      validUntil,
      signature: '',
      publicKey: randomBytes(16).toString('hex'),
      metadata: input.metadata,
    };

    // Generate signature
    identity.signature = this.signIdentity(identity);

    // Store identity
    this.identityStore.set(input.agentId, identity);

    console.log('[AgentIdentity] Issued identity to agent:', input.agentId);
    return identity;
  }

  /**
   * Verify agent identity signature
   */
  async verifyIdentity(identity: AgentIdentity): Promise<boolean> {
    // Check signature
    const expectedSignature = this.signIdentity(identity);
    if (identity.signature !== expectedSignature) {
      console.warn('[AgentIdentity] Invalid signature for agent:', identity.agentId);
      return false;
    }

    // Check expiration
    const now = new Date();
    if (now < identity.validFrom || now > identity.validUntil) {
      console.warn('[AgentIdentity] Expired identity for agent:', identity.agentId);
      return false;
    }

    return true;
  }

  /**
   * Get identity for an agent
   */
  getIdentity(agentId: string): AgentIdentity | null {
    return this.identityStore.get(agentId) || null;
  }

  /**
   * Revoke agent identity
   */
  revokeIdentity(agentId: string): void {
    this.identityStore.delete(agentId);
    console.log('[AgentIdentity] Revoked identity for agent:', agentId);
  }

  // ============================================================================
  // PERMISSION CHECKS
  // ============================================================================

  /**
   * Check if agent is allowed to perform an action
   */
  async checkPermission(agentId: string, action: string, resource?: string): Promise<PermissionCheck> {
    const identity = this.getIdentity(agentId);

    if (!identity) {
      return {
        allowed: false,
        reason: 'No identity found for agent',
      };
    }

    // Verify identity is valid
    const isValid = await this.verifyIdentity(identity);
    if (!isValid) {
      return {
        allowed: false,
        reason: 'Invalid or expired agent identity',
      };
    }

    // Check if action is allowed
    const actionAllowed = identity.allowedActions.some(allowed => {
      // Exact match
      if (allowed === action) return true;
      
      // Wildcard match (e.g., "content:*" matches "content:generate")
      if (allowed.endsWith('*')) {
        const prefix = allowed.slice(0, -1);
        return action.startsWith(prefix);
      }
      
      return false;
    });

    if (!actionAllowed) {
      return {
        allowed: false,
        reason: `Action "${action}" not in agent mandate`,
        mandate: identity.mandate,
        missingPermissions: [action],
      };
    }

    return {
      allowed: true,
      reason: 'Action authorized',
      mandate: identity.mandate,
    };
  }

  /**
   * Check multiple permissions at once
   */
  async checkPermissions(agentId: string, actions: string[]): Promise<PermissionCheck> {
    const missingPermissions: string[] = [];

    for (const action of actions) {
      const result = await this.checkPermission(agentId, action);
      if (!result.allowed && result.missingPermissions) {
        missingPermissions.push(...result.missingPermissions);
      }
    }

    if (missingPermissions.length > 0) {
      return {
        allowed: false,
        reason: `${missingPermissions.length} action(s) not authorized`,
        missingPermissions,
      };
    }

    return {
      allowed: true,
      reason: 'All actions authorized',
    };
  }

  // ============================================================================
  // AUDIT LOGGING
  // ============================================================================

  /**
   * Log agent action for audit trail
   */
  async logAction(action: AgentAction): Promise<AuditLogEntry> {
    const identity = this.getIdentity(action.agentId);
    
    const logEntry: AuditLogEntry = {
      id: this.generateId(),
      agentId: action.agentId,
      action: action.action,
      resource: action.resource,
      context: action.context,
      timestamp: action.timestamp,
      mandate: identity?.mandate,
      signature: this.signAction(action),
    };

    console.log('[AgentIdentity] Logged action:', action.agentId, action.action);
    return logEntry;
  }

  /**
   * Verify audit log entry
   */
  async verifyLogEntry(entry: AuditLogEntry): Promise<boolean> {
    const action: AgentAction = {
      agentId: entry.agentId,
      action: entry.action,
      resource: entry.resource,
      context: entry.context,
      timestamp: entry.timestamp,
    };

    const expectedSignature = this.signAction(action);
    return entry.signature === expectedSignature;
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private signIdentity(identity: AgentIdentity): string {
    const data = JSON.stringify({
      agentId: identity.agentId,
      mandate: identity.mandate,
      allowedActions: identity.allowedActions,
      issuedBy: identity.issuedBy,
      validFrom: identity.validFrom.toISOString(),
      validUntil: identity.validUntil.toISOString(),
      publicKey: identity.publicKey,
    });

    return createHmac('sha256', this.secretKey).update(data).digest('hex');
  }

  private signAction(action: AgentAction): string {
    const data = JSON.stringify({
      agentId: action.agentId,
      action: action.action,
      resource: action.resource,
      context: action.context,
      timestamp: action.timestamp.toISOString(),
    });

    return createHmac('sha256', this.secretKey).update(data).digest('hex');
  }

  private generateId(): string {
    return `audit_${Date.now()}_${randomBytes(8).toString('hex')}`;
  }

  /**
   * Get all active identities
   */
  getAllIdentities(): AgentIdentity[] {
    return Array.from(this.identityStore.values());
  }

  /**
   * Clean up expired identities
   */
  cleanupExpiredIdentities(): number {
    const now = new Date();
    let count = 0;

    for (const [agentId, identity] of this.identityStore.entries()) {
      if (now > identity.validUntil) {
        this.identityStore.delete(agentId);
        count++;
      }
    }

    if (count > 0) {
      console.log('[AgentIdentity] Cleaned up', count, 'expired identities');
    }

    return count;
  }
}

// ============================================================================
// AUDIT LOG TYPES
// ============================================================================

export interface AuditLogEntry {
  id: string;
  agentId: string;
  action: string;
  resource?: string;
  context?: Record<string, any>;
  timestamp: Date;
  mandate?: string;
  signature: string;
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

let identityManagerInstance: AgentIdentityManager | null = null;

export const getAgentIdentityManager = (secretKey?: string): AgentIdentityManager => {
  if (!identityManagerInstance) {
    identityManagerInstance = new AgentIdentityManager(secretKey);
  }
  return identityManagerInstance;
};

export default AgentIdentityManager;
