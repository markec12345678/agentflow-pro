/**
 * Invoice Repository Implementation
 * 
 * Prisma-based repository for Invoice entity.
 */

import { prisma } from '@/infrastructure/database/prisma'
import { Money } from '@/core/domain/shared/value-objects/money'
import type { InvoiceRepository } from '@/core/use-cases/invoice-management'

export class InvoiceRepositoryImpl implements InvoiceRepository {
  /**
   * Find invoice by ID
   */
  async findById(id: string): Promise<any | null> {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        reservation: true,
        guest: true,
        items: true,
        payments: true
      }
    })

    if (!invoice) return null

    return this.mapToDomain(invoice)
  }

  /**
   * Find invoices by reservation
   */
  async findByReservation(reservationId: string): Promise<any[]> {
    const invoices = await prisma.invoice.findMany({
      where: { reservationId },
      include: {
        reservation: true,
        items: true,
        payments: true
      }
    })

    return invoices.map(invoice => this.mapToDomain(invoice))
  }

  /**
   * Find invoices by guest
   */
  async findByGuest(guestId: string): Promise<any[]> {
    const invoices = await prisma.invoice.findMany({
      where: {
        reservation: {
          guestId
        }
      },
      include: {
        reservation: true,
        items: true,
        payments: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return invoices.map(invoice => this.mapToDomain(invoice))
  }

  /**
   * Find invoices by property
   */
  async findByProperty(propertyId: string, options?: any): Promise<any[]> {
    const invoices = await prisma.invoice.findMany({
      where: {
        reservation: {
          propertyId
        },
        ...(options?.status ? { status: options.status } : {}),
        ...(options?.startDate && options?.endDate ? {
          createdAt: {
            gte: options.startDate,
            lte: options.endDate
          }
        } : {})
      },
      include: {
        reservation: true,
        guest: true,
        items: true,
        payments: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return invoices.map(invoice => this.mapToDomain(invoice))
  }

  /**
   * Find unpaid invoices
   */
  async findUnpaid(propertyId?: string): Promise<any[]> {
    const invoices = await prisma.invoice.findMany({
      where: {
        ...(propertyId ? {
          reservation: {
            propertyId
          }
        } : {}),
        status: {
          in: ['sent', 'overdue']
        },
        dueDate: {
          lt: new Date()
        }
      },
      include: {
        reservation: true,
        guest: true,
        items: true
      }
    })

    return invoices.map(invoice => this.mapToDomain(invoice))
  }

  /**
   * Save invoice
   */
  async save(invoice: any): Promise<void> {
    const data = this.mapToPrisma(invoice)

    await prisma.invoice.upsert({
      where: { id: invoice.id },
      update: data,
      create: data
    })
  }

  /**
   * Mark invoice as paid
   */
  async markAsPaid(invoiceId: string, paymentId: string): Promise<void> {
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'paid',
        updatedAt: new Date()
      }
    })
  }

  /**
   * Mark invoice as overdue
   */
  async markAsOverdue(invoiceId: string): Promise<void> {
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'overdue',
        updatedAt: new Date()
      }
    })
  }

  /**
   * Cancel invoice
   */
  async cancel(invoiceId: string): Promise<void> {
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'cancelled',
        updatedAt: new Date()
      }
    })
  }

  /**
   * Delete invoice
   */
  async delete(id: string): Promise<void> {
    await prisma.invoice.delete({
      where: { id }
    })
  }

  /**
   * Get invoice statistics
   */
  async getStatistics(propertyId: string, startDate: Date, endDate: Date): Promise<any> {
    const invoices = await prisma.invoice.findMany({
      where: {
        reservation: {
          propertyId
        },
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        payments: true
      }
    })

    const totalInvoices = invoices.length
    const paidInvoices = invoices.filter(i => i.status === 'paid').length
    const unpaidInvoices = invoices.filter(i => ['sent', 'overdue'].includes(i.status)).length
    const totalRevenue = invoices.reduce((sum, i) => sum + i.totalAmount, 0)
    const paidRevenue = invoices
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + i.totalAmount, 0)
    const outstandingRevenue = totalRevenue - paidRevenue

    return {
      totalInvoices,
      paidInvoices,
      unpaidInvoices,
      totalRevenue,
      paidRevenue,
      outstandingRevenue,
      period: { startDate, endDate }
    }
  }

  /**
   * Map Prisma data to domain entity
   */
  private mapToDomain(prismaInvoice: any): any {
    return {
      id: prismaInvoice.id,
      reservationId: prismaInvoice.reservationId,
      guestId: prismaInvoice.guestId,
      propertyId: prismaInvoice.reservation?.propertyId,
      invoiceNumber: prismaInvoice.invoiceNumber,
      status: prismaInvoice.status,
      items: prismaInvoice.items.map((item: any) => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total
      })),
      subtotal: prismaInvoice.subtotal,
      taxes: prismaInvoice.taxes,
      discounts: prismaInvoice.discounts,
      totalAmount: prismaInvoice.totalAmount,
      dueDate: prismaInvoice.dueDate,
      createdAt: prismaInvoice.createdAt,
      updatedAt: prismaInvoice.updatedAt,
      payments: prismaInvoice.payments.map((p: any) => ({
        id: p.id,
        amount: p.amount,
        paymentMethod: p.paymentMethod,
        status: p.status,
        createdAt: p.createdAt
      }))
    }
  }

  /**
   * Map domain entity to Prisma data
   */
  private mapToPrisma(invoice: any): any {
    return {
      id: invoice.id,
      reservationId: invoice.reservationId,
      guestId: invoice.guestId,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      subtotal: invoice.subtotal,
      taxes: invoice.taxes,
      discounts: invoice.discounts,
      totalAmount: invoice.totalAmount,
      dueDate: invoice.dueDate,
      updatedAt: new Date()
    }
  }
}
