/**
 * Use Case: Get Guest Communications
 * 
 * Get communication history for guest.
 */

import { CommunicationRepositoryImpl } from '@/infrastructure/database/repositories/communication-repository'

// ============================================================================
// Input/Output DTOs
// ============================================================================

export interface GetGuestCommunicationsInput {
  guestId: string
  userId: string
  limit?: number
  offset?: number
  channel?: string
  type?: string
}

export interface GetGuestCommunicationsOutput {
  communications: CommunicationDTO[]
  total: number
  hasMore: boolean
}

export interface CommunicationDTO {
  id: string
  guestId: string
  channel: string
  type: string
  subject?: string
  message: string
  status: 'sent' | 'failed' | 'pending'
  sentAt?: Date
  createdAt: Date
}

// ============================================================================
// Use Case Class
// ============================================================================

export class GetGuestCommunications {
  constructor(
    private communicationRepository: CommunicationRepository = new CommunicationRepositoryImpl()
  ) {}

  /**
   * Get guest communications
   */
  async execute(input: GetGuestCommunicationsInput): Promise<GetGuestCommunicationsOutput> {
    const { guestId, limit = 20, offset = 0, channel, type } = input

    // 1. Get communications
    const communications = await this.communicationRepository.findByGuest(guestId, {
      limit,
      offset,
      channel,
      type
    })

    // 2. Get total count
    const total = await this.communicationRepository.countByGuest(guestId, {
      channel,
      type
    })

    // 3. Map to DTO
    const communicationDTOs = communications.map(this.mapToDTO)

    return {
      communications: communicationDTOs,
      total,
      hasMore: offset + communications.length < total
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private mapToDTO(communication: any): CommunicationDTO {
    return {
      id: communication.id,
      guestId: communication.guestId,
      channel: communication.channel,
      type: communication.type,
      subject: communication.subject,
      message: communication.message,
      status: communication.status,
      sentAt: communication.sentAt,
      createdAt: communication.createdAt
    }
  }
}

// ============================================================================
// Repository Interface
// ============================================================================

export interface CommunicationRepository {
  findByGuest(
    guestId: string,
    options?: {
      limit?: number
      offset?: number
      channel?: string
      type?: string
    }
  ): Promise<any[]>

  countByGuest(
    guestId: string,
    options?: {
      channel?: string
      type?: string
    }
  ): Promise<number>
}
