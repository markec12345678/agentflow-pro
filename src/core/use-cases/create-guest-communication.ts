/**
 * Use Case: Create Guest Communication
 * 
 * Send communication to guest (email, SMS, WhatsApp).
 */

import { CommunicationRepositoryImpl } from '@/infrastructure/database/repositories/communication-repository'
import { GuestRepositoryImpl } from '@/infrastructure/database/repositories/guest-repository'

// ============================================================================
// Input/Output DTOs
// ============================================================================

export interface CreateGuestCommunicationInput {
  guestId: string
  userId: string
  channel: 'email' | 'sms' | 'whatsapp'
  type: 'booking_confirmation' | 'check_in_instructions' | 'check_out_instructions' | 'promotional' | 'other'
  subject?: string
  message: string
  metadata?: Record<string, any>
}

export interface CreateGuestCommunicationOutput {
  success: boolean
  communicationId: string
  status: 'sent' | 'failed' | 'pending'
  sentAt?: Date
}

// ============================================================================
// Use Case Class
// ============================================================================

export class CreateGuestCommunication {
  constructor(
    private guestRepository: GuestRepository = new GuestRepositoryImpl(),
    private communicationRepository: CommunicationRepository = new CommunicationRepositoryImpl(),
    private emailService: EmailService = {} as EmailService,
    private smsService: SmsService = {} as SmsService,
    private whatsappService: WhatsappService = {} as WhatsappService
  ) {}

  /**
   * Send communication to guest
   */
  async execute(input: CreateGuestCommunicationInput): Promise<CreateGuestCommunicationOutput> {
    const { guestId, userId, channel, type, subject, message, metadata } = input

    // 1. Get guest
    const guest = await this.guestRepository.findById(guestId)
    if (!guest) {
      throw new Error('Guest not found')
    }

    // 2. Create communication record
    const communication = {
      id: `comm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      guestId,
      userId,
      channel,
      type,
      subject,
      message,
      metadata,
      status: 'pending' as const,
      createdAt: new Date()
    }

    await this.communicationRepository.save(communication)

    // 3. Send via channel
    try {
      let sentAt: Date | undefined

      switch (channel) {
        case 'email':
          await this.emailService.send({
            to: guest.email,
            subject: subject || 'Message from Property',
            body: message
          })
          sentAt = new Date()
          break

        case 'sms':
          if (!guest.phone) {
            throw new Error('Guest phone number not available')
          }
          await this.smsService.send({
            to: guest.phone,
            message
          })
          sentAt = new Date()
          break

        case 'whatsapp':
          if (!guest.phone) {
            throw new Error('Guest phone number not available')
          }
          await this.whatsappService.send({
            to: guest.phone,
            message
          })
          sentAt = new Date()
          break
      }

      // 4. Update communication status
      communication.status = 'sent'
      communication.sentAt = sentAt
      await this.communicationRepository.save(communication)

      return {
        success: true,
        communicationId: communication.id,
        status: 'sent',
        sentAt
      }
    } catch (error: any) {
      // 5. Handle error
      communication.status = 'failed'
      communication.metadata = {
        ...communication.metadata,
        error: error.message
      }
      await this.communicationRepository.save(communication)

      return {
        success: false,
        communicationId: communication.id,
        status: 'failed'
      }
    }
  }
}

// ============================================================================
// Repository/Service Interfaces
// ============================================================================

export interface GuestRepository {
  findById(id: string): Promise<any | null>
}

export interface CommunicationRepository {
  save(communication: any): Promise<void>
}

export interface EmailService {
  send(data: { to: string; subject: string; body: string }): Promise<void>
}

export interface SmsService {
  send(data: { to: string; message: string }): Promise<void>
}

export interface WhatsappService {
  send(data: { to: string; message: string }): Promise<void>
}
