/**
 * Workflow Domain Events
 * 
 * Vsi eventi povezani z Workflow lifecycle.
 */

import { BaseDomainEvent } from './domain-event'

// ============================================================================
// Workflow Created
// ============================================================================

export class WorkflowCreated extends BaseDomainEvent {
  constructor(
    public readonly workflowId: string,
    public readonly name: string,
    public readonly description: string,
    public readonly steps: any[],
    public readonly createdBy: string,
    metadata?: Record<string, any>
  ) {
    super(workflowId, 'Workflow', metadata)
  }
}

// ============================================================================
// Workflow Updated
// ============================================================================

export class WorkflowUpdated extends BaseDomainEvent {
  constructor(
    public readonly workflowId: string,
    public readonly changes: Record<string, any>,
    public readonly updatedBy: string,
    metadata?: Record<string, any>
  ) {
    super(workflowId, 'Workflow', metadata)
  }
}

// ============================================================================
// Workflow Published
// ============================================================================

export class WorkflowPublished extends BaseDomainEvent {
  constructor(
    public readonly workflowId: string,
    public readonly version: string,
    public readonly publishedBy: string,
    metadata?: Record<string, any>
  ) {
    super(workflowId, 'Workflow', metadata)
  }
}

// ============================================================================
// Workflow Deprecated
// ============================================================================

export class WorkflowDeprecated extends BaseDomainEvent {
  constructor(
    public readonly workflowId: string,
    public readonly reason: string,
    public readonly deprecatedBy: string,
    metadata?: Record<string, any>
  ) {
    super(workflowId, 'Workflow', metadata)
  }
}

// ============================================================================
// Workflow Deleted
// ============================================================================

export class WorkflowDeleted extends BaseDomainEvent {
  constructor(
    public readonly workflowId: string,
    public readonly deletedBy: string,
    metadata?: Record<string, any>
  ) {
    super(workflowId, 'Workflow', metadata)
  }
}

// ============================================================================
// Type Union
// ============================================================================

export type WorkflowEvent =
  | WorkflowCreated
  | WorkflowUpdated
  | WorkflowPublished
  | WorkflowDeprecated
  | WorkflowDeleted
