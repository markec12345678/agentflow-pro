/**
 * Domain Entity: GuestMessage
 * 
 * Sporočilo med gostom in concierge/hotel staff.
 * Podpira AI odgovore in escalation na staff.
 */

import { Money } from '../shared/value-objects/money'

export type MessageChannel = 'chat' | 'sms' | 'whatsapp' | 'email' | 'voice'
export type MessageDirection = 'inbound' | 'outbound'
export type MessageStatus = 'sent' | 'delivered' | 'read' | 'failed'
export type MessagePriority = 'normal' | 'high' | 'urgent'
export type MessageType = 'question' | 'request' | 'complaint' | 'feedback' | 'recommendation' | 'booking'

export interface GuestMessageData {
  id: string
  reservationId?: string
  guestId: string
  propertyId: string
  channel: MessageChannel
  direction: MessageDirection
  type: MessageType
  priority: MessagePriority
  status: MessageStatus
  subject?: string
  content: string
  aiResponse?: string
  aiConfidence?: number
  escalatedTo?: string // Staff ID
  escalatedAt?: Date
  resolvedAt?: Date
  response?: string
  respondedBy?: string // Staff ID
  respondedAt?: Date
  metadata?: Record<string, any>
  cost?: Money // For SMS/WhatsApp
}

export class GuestMessage {
  public readonly id: string
  public readonly reservationId?: string
  public readonly guestId: string
  public readonly propertyId: string
  public readonly channel: MessageChannel
  public readonly direction: MessageDirection
  public readonly type: MessageType
  public priority: MessagePriority
  public status: MessageStatus
  public subject?: string
  public content: string
  public aiResponse?: string
  public aiConfidence?: number
  public escalatedTo?: string
  public escalatedAt?: Date
  public resolvedAt?: Date
  public response?: string
  public respondedBy?: string
  public respondedAt?: Date
  public metadata?: Record<string, any>
  public cost?: Money

  constructor(data: GuestMessageData) {
    this.id = data.id
    this.reservationId = data.reservationId
    this.guestId = data.guestId
    this.propertyId = data.propertyId
    this.channel = data.channel
    this.direction = data.direction
    this.type = data.type
    this.priority = data.priority
    this.status = data.status
    this.subject = data.subject
    this.content = data.content
    this.aiResponse = data.aiResponse
    this.aiConfidence = data.aiConfidence
    this.escalatedTo = data.escalatedTo
    this.escalatedAt = data.escalatedAt
    this.resolvedAt = data.resolvedAt
    this.response = data.response
    this.respondedBy = data.respondedBy
    this.respondedAt = data.respondedAt
    this.metadata = data.metadata
    this.cost = data.cost
  }

  /**
   * Nastavi AI odgovor
   */
  setAIResponse(response: string, confidence: number): void {
    this.aiResponse = response
    this.aiConfidence = confidence

    // Auto-send if confidence is high
    if (confidence >= 0.85 && this.direction === 'inbound') {
      this.status = 'sent'
    }
  }

  /**
   * Escalate na staff
   */
  escalateTo(staffId: string): void {
    this.escalatedTo = staffId
    this.escalatedAt = new Date()
    this.priority = 'high'
    this.status = 'sent'
  }

  /**
   * Odgovori na sporočilo
   */
  respond(response: string, respondedBy: string): void {
    this.response = response
    this.respondedBy = respondedBy
    this.respondedAt = new Date()
    this.status = 'sent'
    this.resolvedAt = new Date()
  }

  /**
   * Označi kot prebrano
   */
  markAsRead(): void {
    this.status = 'read'
  }

  /**
   * Označi kot dostavljeno
   */
  markAsDelivered(): void {
    this.status = 'delivered'
  }

  /**
   * Označi kot neuspešno
   */
  markAsFailed(error?: string): void {
    this.status = 'failed'
    if (error) {
      this.metadata = { ...this.metadata, error }
    }
  }

  /**
   * Označi kot rešeno
   */
  resolve(): void {
    this.resolvedAt = new Date()
    this.status = 'read'
  }

  /**
   * Preveri ali je sporočilo urgentno
   */
  isUrgent(): boolean {
    return this.priority === 'urgent' || this.type === 'complaint'
  }

  /**
   * Preveri ali potrebuje human escalation
   */
  needsEscalation(): boolean {
    // Escalate if AI confidence is low
    if (this.aiConfidence && this.aiConfidence < 0.6) {
      return true
    }

    // Escalate complaints
    if (this.type === 'complaint') {
      return true
    }

    // Escalate if no response after 30 minutes
    if (this.direction === 'inbound' && !this.response) {
      const messageTime = new Date(this.id.split('_')[1]) // Extract timestamp from ID
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)
      if (messageTime < thirtyMinutesAgo) {
        return true
      }
    }

    return false
  }

  /**
   * Izračunaj strošek sporočila (za SMS/WhatsApp)
   */
  calculateCost(): Money {
    if (this.channel === 'sms') {
      // €0.05 per SMS
      const segments = Math.ceil(this.content.length / 160)
      this.cost = new Money(0.05 * segments, 'EUR')
    } else if (this.channel === 'whatsapp') {
      // €0.01 per WhatsApp message
      this.cost = new Money(0.01, 'EUR')
    } else {
      this.cost = Money.zero('EUR')
    }
    return this.cost
  }

  /**
   * Pretvori v Plain Object
   */
  toObject(): GuestMessageData {
    return {
      id: this.id,
      reservationId: this.reservationId,
      guestId: this.guestId,
      propertyId: this.propertyId,
      channel: this.channel,
      direction: this.direction,
      type: this.type,
      priority: this.priority,
      status: this.status,
      subject: this.subject,
      content: this.content,
      aiResponse: this.aiResponse,
      aiConfidence: this.aiConfidence,
      escalatedTo: this.escalatedTo,
      escalatedAt: this.escalatedAt,
      resolvedAt: this.resolvedAt,
      response: this.response,
      respondedBy: this.respondedBy,
      respondedAt: this.respondedAt,
      metadata: this.metadata,
      cost: this.cost
    }
  }

  /**
   * Pretvori v JSON
   */
  toJSON(): any {
    return {
      ...this.toObject(),
      cost: this.cost?.toJSON(),
      escalatedAt: this.escalatedAt?.toISOString(),
      resolvedAt: this.resolvedAt?.toISOString(),
      respondedAt: this.respondedAt?.toISOString()
    }
  }

  /**
   * Ustvari iz JSON
   */
  static fromJSON(json: any): GuestMessage {
    return new GuestMessage({
      ...json,
      cost: json.cost ? Money.fromJSON(json.cost) : undefined,
      escalatedAt: json.escalatedAt ? new Date(json.escalatedAt) : undefined,
      resolvedAt: json.resolvedAt ? new Date(json.resolvedAt) : undefined,
      respondedAt: json.respondedAt ? new Date(json.respondedAt) : undefined
    })
  }

  /**
   * Ustvari novo sporočilo
   */
  static create(data: Omit<GuestMessageData, 'id' | 'status'>): GuestMessage {
    return new GuestMessage({
      ...data,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'sent'
    })
  }

  /**
   * Ustvari inbound sporočilo od gosta
   */
  static createInbound(
    guestId: string,
    propertyId: string,
    channel: MessageChannel,
    content: string,
    reservationId?: string
  ): GuestMessage {
    return GuestMessage.create({
      reservationId,
      guestId,
      propertyId,
      channel,
      direction: 'inbound',
      type: 'question',
      priority: 'normal',
      status: 'sent',
      content
    })
  }
}
