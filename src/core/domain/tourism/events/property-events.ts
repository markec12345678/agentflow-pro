/**
 * Property Domain Events
 */

import { BaseDomainEvent } from '../shared/events/domain-event'
import { Money } from '../shared/value-objects/money'

// ============================================================================
// Property Created
// ============================================================================

export class PropertyCreated extends BaseDomainEvent {
  constructor(
    public readonly propertyId: string,
    public readonly name: string,
    public readonly type: string,
    metadata?: Record<string, any>
  ) {
    super(propertyId, 'Property', metadata)
  }
}

// ============================================================================
// Property Updated
// ============================================================================

export class PropertyUpdated extends BaseDomainEvent {
  constructor(
    public readonly propertyId: string,
    public readonly changes: Record<string, any>,
    metadata?: Record<string, any>
  ) {
    super(propertyId, 'Property', metadata)
  }
}

// ============================================================================
// Property Deleted
// ============================================================================

export class PropertyDeleted extends BaseDomainEvent {
  constructor(
    public readonly propertyId: string,
    metadata?: Record<string, any>
  ) {
    super(propertyId, 'Property', metadata)
  }
}

// ============================================================================
// Property Availability Updated
// ============================================================================

export class PropertyAvailabilityUpdated extends BaseDomainEvent {
  constructor(
    public readonly propertyId: string,
    public readonly dates: Date[],
    public readonly status: 'available' | 'blocked' | 'maintenance',
    metadata?: Record<string, any>
  ) {
    super(propertyId, 'Property', metadata)
  }
}

// ============================================================================
// Property Rate Updated
// ============================================================================

export class PropertyRateUpdated extends BaseDomainEvent {
  constructor(
    public readonly propertyId: string,
    public readonly oldRate: Money,
    public readonly newRate: Money,
    public readonly dates: Date[],
    metadata?: Record<string, any>
  ) {
    super(propertyId, 'Property', metadata)
  }
}

// ============================================================================
// Type Union
// ============================================================================

export type PropertyEvent =
  | PropertyCreated
  | PropertyUpdated
  | PropertyDeleted
  | PropertyAvailabilityUpdated
  | PropertyRateUpdated
