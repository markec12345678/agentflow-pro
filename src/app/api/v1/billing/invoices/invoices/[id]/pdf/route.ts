/**
 * GET /api/invoices/[id]/pdf
 * Download invoice PDF
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/infrastructure/database/prisma';
import { generateInvoicePDF } from '@/lib/invoices/invoice-template';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
        reservation: {
          include: {
            guest: true,
            property: true,
            room: true,
          },
        },
      },
    });
    
    if (!invoice) {
      return new Response('Invoice not found', { status: 404 });
    }
    
    // Generate PDF
    const pdfBuffer = await generateInvoicePDF({
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate.toISOString(),
      dueDate: invoice.dueDate.toISOString(),
      
      // Supplier (Your company - replace with actual data)
      supplierName: 'AgentFlow Pro',
      supplierAddress: 'Griblje 70, 8332 Gradac, Slovenia',
      supplierRegistration: '', // TODO: Add your matična številka
      supplierVAT: '', // TODO: Add your DDV številka
      supplierEmail: 'robertpezdirc@gmail.com',
      supplierPhone: '+386 40 451 250',
      
      // Guest
      guestName: invoice.reservation.guest.name || 'Guest',
      guestAddress: invoice.reservation.guest.address || '',
      guestVAT: invoice.reservation.guest.vatNumber || undefined,
      
      // Stay details
      checkIn: invoice.checkIn.toISOString(),
      checkOut: invoice.checkOut.toISOString(),
      nights: invoice.reservation.nights,
      guests: invoice.reservation.guests,
      adults: invoice.reservation.adults || invoice.reservation.guests,
      children: invoice.reservation.guests - (invoice.reservation.adults || invoice.reservation.guests),
      roomName: invoice.reservation.room.name || 'Room',
      propertyName: invoice.reservation.property.name,
      
      // Items
      accommodation: Number(invoice.accommodation),
      touristTax: Number(invoice.touristTax),
      vatRate: Number(invoice.vatRate),
      
      // Totals
      subtotal: Number(invoice.accommodation) + Number(invoice.touristTax),
      vatAmount: Number(invoice.vatAmount),
      total: Number(invoice.total),
      
      // Additional
      notes: 'Hvala za vaš obisk! / Thank you for your visit!',
      paymentInstructions: 'Plačilo po predračunu / Payment by proforma invoice.\nTRR: SI56 0000 0000 0000 000 (Your bank account)',
    });
    
    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return new Response('Failed to generate PDF', { status: 500 });
  }
}
