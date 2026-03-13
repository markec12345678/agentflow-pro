/**
 * Guest Domain Events
 */

import { BaseDomainEvent } from '../shared/events/domain-event'

// ============================================================================
// Guest Registered
// ============================================================================

export class GuestRegistered extends BaseDomainEvent {
  constructor(
    public readonly guestId: string,
    public readonly email: string,
    public readonly firstName: string,
    public readonly lastName: string,
    metadata?: Record<string, any>
  ) {
    super(guestId, 'Guest', metadata)
  }
}

// ============================================================================
// Guest Profile Updated
// ============================================================================

export class GuestProfileUpdated extends BaseDomainEvent {
  constructor(
    public readonly guestId: string,
    public readonly changes: Record<string, any>,
    metadata?: Record<string, any>
  ) {
    super(guestId, 'Guest', metadata)
  }
}

// ============================================================================
// Guest Loyalty Points Updated
// ============================================================================

export class GuestLoyaltyPointsUpdated extends BaseDomainEvent {
  constructor(
    public readonly guestId: string,
    public readonly oldPoints: number,
    public readonly newPoints: number,
    public readonly reason: string,
    metadata?: Record<string, any>
  ) {
    super(guestId, 'Guest', metadata)
  }
}

// ============================================================================
// Guest Communication Sent
// ============================================================================

export class GuestCommunicationSent extends BaseDomainEvent {
  constructor(
    public readonly guestId: string,
    public readonly channel: 'email' | 'sms' | 'whatsapp',
    public readonly type: string,
    public readonly success: boolean,
    metadata?: Record<string, any>
  ) {
    super(guestId, 'Guest', metadata)
  }
}

// ============================================================================
// Type Union
// ============================================================================

export type GuestEvent =
  | GuestRegistered
  | GuestProfileUpdated
  | GuestLoyaltyPointsUpdated
  | GuestCommunicationSent
