import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getUserId } from '@/lib/auth-users';
import { prisma } from '@/database/schema';

export const dynamic = "force-dynamic";

/**
 * POST /api/invoices/[id]/send
 * Send an invoice to the guest
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const invoiceId = resolvedParams.id;
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Check if user has access (receptor, admin)
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, name: true }
    });

    if (!currentUser || !['admin', 'receptor'].includes(currentUser.role)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Receptor or Admin access required' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, subject, message, attachPDF = true } = body;

    // Get invoice details (in real implementation)
    const mockInvoice = {
      id: invoiceId,
      invoiceNumber: "INV-2024-001",
      reservationId: "res_123",
      guestName: "Janez Novak",
      guestEmail: "janez.novak@email.com",
      guestPhone: "+386 1 234 5678",
      guestAddress: {
        street: "Cankarjeva ulica 5",
        city: "Ljubljana",
        country: "Slovenia",
        postalCode: "1000"
      },
      amount: 450.00,
      currency: "EUR",
      taxAmount: 94.50,
      totalAmount: 544.50,
      status: "draft",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      items: [
        {
          id: "item_1",
          description: "Deluxe Room - 3 nights",
          quantity: 3,
          unitPrice: 150.00,
          taxRate: 21,
          total: 450.00
        }
      ],
      template: "standard",
      taxRate: 21,
      notes: "Payment due within 7 days. Thank you for your business!",
      paymentTerms: "Net 7"
    };

    if (!mockInvoice) {
      return NextResponse.json(
        { success: false, error: { code: 'INVOICE_NOT_FOUND', message: 'Invoice not found' } },
        { status: 404 }
      );
    }

    if (mockInvoice.status !== "draft") {
      return NextResponse.json(
        { success: false, error: { code: 'INVOICE_ALREADY_SENT', message: 'Invoice has already been sent' } },
        { status: 400 }
      );
    }

    // Use provided email or default to guest email
    const recipientEmail = email || mockInvoice.guestEmail;

    // Send invoice (in real implementation)
    const sendResult = await sendInvoiceEmail(mockInvoice, recipientEmail, subject, message, attachPDF, currentUser.name || undefined);

    // Update invoice status to "sent"
    console.log(`Invoice ${invoiceId} marked as sent`);

    // Log activity
    await logActivity(userId, "Invoice Sent", `Sent invoice ${mockInvoice.invoiceNumber} to ${recipientEmail}`, request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || "unknown");

    return NextResponse.json({
      success: true,
      data: {
        message: 'Invoice sent successfully',
        invoiceId,
        recipientEmail,
        sentAt: new Date().toISOString(),
        sendResult
      }
    });

  } catch (error) {
    console.error('Send invoice error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }

async function sendInvoiceEmail(invoice: any, recipientEmail: string, subject?: string, message?: string, attachPDF: boolean = true, sentBy?: string) {
  // In real implementation, this would:
  // 1. Generate PDF invoice if requested
  // 2. Send email with invoice details
  // 3. Attach PDF if requested
  // 4. Track email delivery
  // 5. Update invoice status in database
  
  console.log('Sending invoice email:', {
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    recipientEmail,
    subject: subject || `Invoice ${invoice.invoiceNumber} from Hotel Alpina`,
    attachPDF,
    sentBy
  });

  // Generate PDF if requested
  let pdfUrl = null;
  if (attachPDF) {
    pdfUrl = await generateInvoicePDF(invoice);
  }

  // Send email (in real implementation, use email service)
  const emailContent = {
    to: recipientEmail,
    subject: subject || `Invoice ${invoice.invoiceNumber} from Hotel Alpina`,
    html: generateInvoiceEmailHTML(invoice, message, sentBy),
    attachments: attachPDF && pdfUrl ? [
      {
        filename: `${invoice.invoiceNumber}.pdf`,
        url: pdfUrl
      }
    ] : []
  };

  console.log('Email content prepared:', emailContent);

  // Simulate email sending
  await new Promise(resolve => setTimeout(resolve, 2000));

  const sendResult = {
    messageId: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
    status: "sent",
    sentAt: new Date().toISOString(),
    recipientEmail,
    pdfAttached: attachPDF,
    pdfUrl
  };

  console.log('Invoice sent successfully:', sendResult);
  return sendResult;
}

async function generateInvoicePDF(invoice: any): Promise<string> {
  // In real implementation, this would generate a PDF invoice
  console.log('Generating PDF for invoice:', invoice.invoiceNumber);
  
  // Simulate PDF generation
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const pdfUrl = `https://storage.example.com/invoices/${invoice.invoiceNumber}.pdf`;
  console.log('PDF generated:', pdfUrl);
  
  return pdfUrl;
}

function generateInvoiceEmailHTML(invoice: any, customMessage?: string, sentBy?: string): string {
  const companyInfo = {
    name: "Hotel Alpina",
    address: "Cankarjeva ulica 5, 1000 Ljubljana",
    phone: "+386 1 234 5678",
    email: "info@hotel-alpina.si",
    taxId: "SI12345678"
  };

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h1 style="color: #333; margin: 0; font-size: 24px;">${companyInfo.name}</h1>
        <p style="margin: 5px 0; color: #666;">${companyInfo.address}</p>
        <p style="margin: 5px 0; color: #666;">Phone: ${companyInfo.phone} | Email: ${companyInfo.email}</p>
        <p style="margin: 5px 0; color: #666;">Tax ID: ${companyInfo.taxId}</p>
      </div>
      
      <div style="background: white; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px;">
        <h2 style="color: #333; margin-top: 0;">Invoice ${invoice.invoiceNumber}</h2>
        
        <div style="display: flex; justify-content: space-between; margin: 20px 0;">
          <div>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(invoice.createdAt).toLocaleDateString()}</p>
            <p style="margin: 5px 0;"><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
            <p style="margin: 5px 0;"><strong>Status:</strong> ${invoice.status}</p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 5px 0;"><strong>Invoice To:</strong></p>
            <p style="margin: 5px 0;">${invoice.guestName}</p>
            <p style="margin: 5px 0;">${invoice.guestEmail}</p>
            ${invoice.guestPhone ? `<p style="margin: 5px 0;">${invoice.guestPhone}</p>` : ''}
            ${invoice.guestAddress ? `
              <p style="margin: 5px 0;">${invoice.guestAddress.street}</p>
              <p style="margin: 5px 0;">${invoice.guestAddress.postalCode} ${invoice.guestAddress.city}</p>
              <p style="margin: 5px 0;">${invoice.guestAddress.country}</p>
            ` : ''}
          </div>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background: #f8f9fa;">
              <th style="padding: 10px; text-align: left; border: 1px solid #dee2e6;">Description</th>
              <th style="padding: 10px; text-align: right; border: 1px solid #dee2e6;">Quantity</th>
              <th style="padding: 10px; text-align: right; border: 1px solid #dee2e6;">Unit Price</th>
              <th style="padding: 10px; text-align: right; border: 1px solid #dee2e6;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items.map((item: any) => `
              <tr>
                <td style="padding: 10px; border: 1px solid #dee2e6;">${item.description}</td>
                <td style="padding: 10px; text-align: right; border: 1px solid #dee2e6;">${item.quantity}</td>
                <td style="padding: 10px; text-align: right; border: 1px solid #dee2e6;">€${item.unitPrice.toFixed(2)}</td>
                <td style="padding: 10px; text-align: right; border: 1px solid #dee2e6;">€${item.total.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div style="text-align: right; margin-top: 20px;">
          <p style="margin: 5px 0;"><strong>Subtotal:</strong> €${invoice.amount.toFixed(2)}</p>
          <p style="margin: 5px 0;"><strong>Tax (${invoice.taxRate}%):</strong> €${invoice.taxAmount.toFixed(2)}</p>
          <p style="margin: 5px 0; font-size: 18px; color: #333;"><strong>Total:</strong> €${invoice.totalAmount.toFixed(2)}</p>
        </div>
        
        ${invoice.notes ? `
          <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 5px;">
            <p style="margin: 0;"><strong>Notes:</strong></p>
            <p style="margin: 5px 0;">${invoice.notes}</p>
          </div>
        ` : ''}
        
        ${invoice.paymentTerms ? `
          <div style="margin-top: 10px; padding: 15px; background: #e3f2fd; border-radius: 5px;">
            <p style="margin: 0;"><strong>Payment Terms:</strong></p>
            <p style="margin: 5px 0;">${invoice.paymentTerms}</p>
          </div>
        ` : ''}
      </div>
      
      ${customMessage ? `
        <div style="margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 5px;">
          <p style="margin: 0;">${customMessage}</p>
        </div>
      ` : ''}
      
      <div style="margin-top: 20px; padding: 15px; text-align: center; color: #666;">
        <p style="margin: 0;">Thank you for choosing ${companyInfo.name}!</p>
        <p style="margin: 5px 0;">Best regards,<br>${sentBy || 'The Team'}<br>${companyInfo.name}</p>
      </div>
    </div>
  `;
}

async function logActivity(userId: string, action: string, details: string, ipAddress: string) {
  // In real implementation, this would be stored in database
  console.log('Activity log:', {
    userId,
    action,
    details,
    ipAddress,
    timestamp: new Date().toISOString()
  });
}
}
