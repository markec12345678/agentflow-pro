/**
 * Use Case: Send Message
 * 
 * Send chat message.
 */

// ============================================================================
// Input/Output DTOs
// ============================================================================

export interface SendMessageInput {
  userId: string
  conversationId: string
  content: string
  type?: 'text' | 'image' | 'file'
  metadata?: Record<string, any>
}

export interface SendMessageOutput {
  success: boolean
  messageId: string
  timestamp: Date
}

// ============================================================================
// Use Case Class
// ============================================================================

export class SendMessage {
  constructor(
    private messageRepository: MessageRepository,
    private conversationRepository: ConversationRepository
  ) {}

  /**
   * Send message
   */
  async execute(input: SendMessageInput): Promise<SendMessageOutput> {
    const { userId, conversationId, content, type = 'text', metadata } = input

    // 1. Verify conversation exists and user is participant
    const conversation = await this.conversationRepository.findById(conversationId)
    if (!conversation) {
      throw new Error('Conversation not found')
    }

    if (!conversation.participants.includes(userId)) {
      throw new Error('Not a participant of this conversation')
    }

    // 2. Create message
    const message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      conversationId,
      senderId: userId,
      content,
      type,
      metadata,
      createdAt: new Date(),
      read: false
    }

    // 3. Save message
    await this.messageRepository.save(message)

    return {
      success: true,
      messageId: message.id,
      timestamp: message.createdAt
    }
  }
}

// ============================================================================
// Repository Interfaces
// ============================================================================

export interface MessageRepository {
  save(message: any): Promise<void>
}

export interface ConversationRepository {
  findById(id: string): Promise<any | null>
}
