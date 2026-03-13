/**
 * Payment Repository Implementation
 * 
 * Prisma-based repository for Payment entity.
 */

import { prisma } from '@/infrastructure/database/prisma'
import { Money } from '@/core/domain/shared/value-objects/money'
import type { PaymentRepository } from '@/core/use-cases/process-payment'

export class PaymentRepositoryImpl implements PaymentRepository {
  /**
   * Find payment by ID
   */
  async findById(id: string): Promise<any | null> {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        invoice: true,
        reservation: true
      }
    })

    if (!payment) return null

    return this.mapToDomain(payment)
  }

  /**
   * Find payments by invoice
   */
  async findByInvoice(invoiceId: string): Promise<any[]> {
    const payments = await prisma.payment.findMany({
      where: { invoiceId },
      include: {
        invoice: true
      }
    })

    return payments.map(payment => this.mapToDomain(payment))
  }

  /**
   * Find payments by reservation
   */
  async findByReservation(reservationId: string): Promise<any[]> {
    const payments = await prisma.payment.findMany({
      where: { reservationId },
      include: {
        reservation: true
      }
    })

    return payments.map(payment => this.mapToDomain(payment))
  }

  /**
   * Find payments by user
   */
  async findByUser(userId: string, options?: any): Promise<any[]> {
    const payments = await prisma.payment.findMany({
      where: {
        ...(options?.invoiceId ? { invoiceId: options.invoiceId } : {}),
        ...(options?.reservationId ? { reservationId: options.reservationId } : {})
      },
      include: {
        invoice: true,
        reservation: {
          include: {
            guest: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return payments.map(payment => this.mapToDomain(payment))
  }

  /**
   * Save payment
   */
  async save(payment: any): Promise<void> {
    const data = this.mapToPrisma(payment)

    await prisma.payment.upsert({
      where: { id: payment.id },
      update: data,
      create: data
    })
  }

  /**
   * Mark payment as refunded
   */
  async markAsRefunded(
    paymentId: string,
    refundId: string,
    amount: number
  ): Promise<void> {
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'refunded',
        updatedAt: new Date()
      }
    })

    // Create refund record
    await prisma.refund.create({
      data: {
        id: refundId,
        paymentId,
        amount,
        status: 'completed',
        createdAt: new Date(),
        processedAt: new Date()
      }
    })
  }

  /**
   * Get payment statistics
   */
  async getStatistics(propertyId: string, startDate: Date, endDate: Date): Promise<any> {
    const payments = await prisma.payment.findMany({
      where: {
        reservation: {
          propertyId
        },
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        status: 'completed'
      },
      include: {
        reservation: true
      }
    })

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0)
    const totalPayments = payments.length
    const avgPayment = totalPayments > 0 ? totalRevenue / totalPayments : 0

    return {
      totalRevenue,
      totalPayments,
      avgPayment,
      period: { startDate, endDate }
    }
  }

  /**
   * Map Prisma data to domain entity
   */
  private mapToDomain(prismaPayment: any): any {
    return {
      id: prismaPayment.id,
      invoiceId: prismaPayment.invoiceId,
      reservationId: prismaPayment.reservationId,
      userId: prismaPayment.userId,
      amount: new Money(prismaPayment.amount, prismaPayment.currency || 'EUR'),
      paymentMethod: prismaPayment.paymentMethod,
      status: prismaPayment.status,
      transactionId: prismaPayment.transactionId,
      metadata: prismaPayment.metadata,
      createdAt: prismaPayment.createdAt,
      processedAt: prismaPayment.processedAt
    }
  }

  /**
   * Map domain entity to Prisma data
   */
  private mapToPrisma(payment: any): any {
    return {
      id: payment.id,
      invoiceId: payment.invoiceId,
      reservationId: payment.reservationId,
      userId: payment.userId,
      amount: payment.amount.amount,
      currency: payment.amount.currency,
      paymentMethod: payment.paymentMethod,
      status: payment.status,
      transactionId: payment.transactionId,
      metadata: payment.metadata,
      processedAt: payment.processedAt,
      updatedAt: new Date()
    }
  }
}
