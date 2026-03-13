/**
 * Communication Repository Implementation
 * 
 * Prisma-based repository for GuestCommunication entity.
 */

import { prisma } from '@/infrastructure/database/prisma'
import type { CommunicationRepository } from '@/core/use-cases/create-guest-communication'

export class CommunicationRepositoryImpl implements CommunicationRepository {
  /**
   * Find communication by ID
   */
  async findById(id: string): Promise<any | null> {
    const communication = await prisma.guestCommunication.findUnique({
      where: { id },
      include: {
        guest: true,
        reservation: true
      }
    })

    if (!communication) return null

    return this.mapToDomain(communication)
  }

  /**
   * Find communications by guest
   */
  async findByGuest(guestId: string, options?: any): Promise<any[]> {
    const communications = await prisma.guestCommunication.findMany({
      where: {
        guestId,
        ...(options?.type ? { type: options.type } : {}),
        ...(options?.channel ? { channel: options.channel } : {})
      },
      include: {
        guest: true,
        reservation: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return communications.map(comm => this.mapToDomain(comm))
  }

  /**
   * Find communications by property
   */
  async findByProperty(propertyId: string, options?: any): Promise<any[]> {
    const communications = await prisma.guestCommunication.findMany({
      where: {
        reservation: {
          propertyId
        },
        ...(options?.type ? { type: options.type } : {}),
        ...(options?.channel ? { channel: options.channel } : {})
      },
      include: {
        guest: true,
        reservation: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return communications.map(comm => this.mapToDomain(comm))
  }

  /**
   * Find communications by type
   */
  async findByType(type: string, propertyId?: string): Promise<any[]> {
    const communications = await prisma.guestCommunication.findMany({
      where: {
        type,
        ...(propertyId ? {
          reservation: {
            propertyId
          }
        } : {})
      },
      include: {
        guest: true,
        reservation: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return communications.map(comm => this.mapToDomain(comm))
  }

  /**
   * Find unread communications
   */
  async findUnread(guestId?: string): Promise<any[]> {
    const communications = await prisma.guestCommunication.findMany({
      where: {
        read: false,
        ...(guestId ? { guestId } : {})
      },
      include: {
        guest: true,
        reservation: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return communications.map(comm => this.mapToDomain(comm))
  }

  /**
   * Save communication
   */
  async save(communication: any): Promise<void> {
    const data = this.mapToPrisma(communication)

    await prisma.guestCommunication.upsert({
      where: { id: communication.id },
      update: data,
      create: data
    })
  }

  /**
   * Mark communication as sent
   */
  async markAsSent(id: string, sentAt?: Date): Promise<void> {
    await prisma.guestCommunication.update({
      where: { id },
      data: {
        status: 'sent',
        sentAt: sentAt || new Date(),
        updatedAt: new Date()
      }
    })
  }

  /**
   * Mark communication as failed
   */
  async markAsFailed(id: string, error?: string): Promise<void> {
    await prisma.guestCommunication.update({
      where: { id },
      data: {
        status: 'failed',
        error,
        updatedAt: new Date()
      }
    })
  }

  /**
   * Mark communication as read
   */
  async markAsRead(id: string): Promise<void> {
    await prisma.guestCommunication.update({
      where: { id },
      data: {
        read: true,
        readAt: new Date(),
        updatedAt: new Date()
      }
    })
  }

  /**
   * Delete communication
   */
  async delete(id: string): Promise<void> {
    await prisma.guestCommunication.delete({
      where: { id }
    })
  }

  /**
   * Get communication statistics
   */
  async getStatistics(propertyId: string, startDate: Date, endDate: Date): Promise<any> {
    const communications = await prisma.guestCommunication.findMany({
      where: {
        reservation: {
          propertyId
        },
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    const total = communications.length
    const sent = communications.filter(c => c.status === 'sent').length
    const failed = communications.filter(c => c.status === 'failed').length
    const pending = communications.filter(c => c.status === 'pending').length

    const byChannel = communications.reduce((acc, c) => {
      acc[c.channel] = (acc[c.channel] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const byType = communications.reduce((acc, c) => {
      acc[c.type] = (acc[c.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      total,
      sent,
      failed,
      pending,
      byChannel,
      byType,
      period: { startDate, endDate }
    }
  }

  /**
   * Map Prisma data to domain entity
   */
  private mapToDomain(prismaComm: any): any {
    return {
      id: prismaComm.id,
      guestId: prismaComm.guestId,
      reservationId: prismaComm.reservationId,
      userId: prismaComm.userId,
      channel: prismaComm.channel,
      type: prismaComm.type,
      subject: prismaComm.subject,
      message: prismaComm.message,
      metadata: prismaComm.metadata,
      status: prismaComm.status,
      sentAt: prismaComm.sentAt,
      read: prismaComm.read,
      readAt: prismaComm.readAt,
      error: prismaComm.error,
      createdAt: prismaComm.createdAt,
      updatedAt: prismaComm.updatedAt
    }
  }

  /**
   * Map domain entity to Prisma data
   */
  private mapToPrisma(communication: any): any {
    return {
      id: communication.id,
      guestId: communication.guestId,
      reservationId: communication.reservationId,
      userId: communication.userId,
      channel: communication.channel,
      type: communication.type,
      subject: communication.subject,
      message: communication.message,
      metadata: communication.metadata,
      status: communication.status,
      sentAt: communication.sentAt,
      read: communication.read,
      readAt: communication.readAt,
      error: communication.error,
      updatedAt: new Date()
    }
  }
}
