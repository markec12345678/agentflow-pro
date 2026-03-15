/**
 * Infrastructure Implementation: Invoice Item Repository
 *
 * Implementacija InvoiceItemRepository interface-a z uporabo Prisma.
 */

import { prisma } from "@/infrastructure/database/prisma";
import { InvoiceItemRepository } from "@/core/ports/repositories";

export interface InvoiceItemDTO {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRate?: number;
  taxAmount?: number;
  type: "line_item" | "discount" | "tax" | "shipping";
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export class InvoiceItemRepositoryImpl implements InvoiceItemRepository {
  /**
   * Najdi invoice item po ID-ju
   */
  async findById(id: string): Promise<InvoiceItemDTO | null> {
    const data = await prisma.invoiceItem.findUnique({
      where: { id },
      include: {
        invoice: true,
      },
    });

    if (!data) {
      return null;
    }

    return this.mapToDomain(data);
  }

  /**
   * Najdi vse invoice items za invoice
   */
  async findByInvoice(invoiceId: string): Promise<InvoiceItemDTO[]> {
    const data = await prisma.invoiceItem.findMany({
      where: { invoiceId },
      include: {
        invoice: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return data.map((d) => this.mapToDomain(d));
  }

  /**
   * Ustvari nov invoice item
   */
  async create(
    item: Omit<InvoiceItemDTO, "id" | "createdAt" | "updatedAt">,
  ): Promise<InvoiceItemDTO> {
    const data = await prisma.invoiceItem.create({
      data: {
        invoiceId: item.invoiceId,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.amount,
        taxRate: item.taxRate,
        taxAmount: item.taxAmount,
        type: item.type,
        metadata: item.metadata,
      },
      include: {
        invoice: true,
      },
    });

    return this.mapToDomain(data);
  }

  /**
   * Posodobi invoice item
   */
  async update(id: string, item: Partial<InvoiceItemDTO>): Promise<void> {
    await prisma.invoiceItem.update({
      where: { id },
      data: {
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.amount,
        taxRate: item.taxRate,
        taxAmount: item.taxAmount,
        type: item.type,
        metadata: item.metadata,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Izbriši invoice item
   */
  async delete(id: string): Promise<void> {
    await prisma.invoiceItem.delete({
      where: { id },
    });
  }

  /**
   * Izbriši vse invoice items za invoice
   */
  async deleteByInvoice(invoiceId: string): Promise<void> {
    await prisma.invoiceItem.deleteMany({
      where: { invoiceId },
    });
  }

  /**
   * Pridobi statistiko invoice items
   */
  async getStats(invoiceId?: string): Promise<{
    totalItems: number;
    totalAmount: number;
    totalTaxAmount: number;
    itemsByType: { [key: string]: number };
    averageItemAmount: number;
  }> {
    const where = invoiceId ? { invoiceId } : {};

    const items = await prisma.invoiceItem.findMany({
      where,
    });

    const totalItems = items.length;
    const totalAmount = items.reduce((sum, i) => sum + i.amount, 0);
    const totalTaxAmount = items.reduce(
      (sum, i) => sum + (i.taxAmount || 0),
      0,
    );

    const itemsByType: { [key: string]: number } = {};
    items.forEach((i) => {
      itemsByType[i.type] = (itemsByType[i.type] || 0) + 1;
    });

    const averageItemAmount = totalItems > 0 ? totalAmount / totalItems : 0;

    return {
      totalItems,
      totalAmount,
      totalTaxAmount,
      itemsByType,
      averageItemAmount: Math.round(averageItemAmount * 100) / 100,
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Preslikaj Prisma data v Domain DTO
   */
  private mapToDomain(data: any): InvoiceItemDTO {
    return {
      id: data.id,
      invoiceId: data.invoiceId,
      description: data.description,
      quantity: data.quantity,
      unitPrice: data.unitPrice,
      amount: data.amount,
      taxRate: data.taxRate,
      taxAmount: data.taxAmount,
      type: data.type as any,
      metadata: data.metadata,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
