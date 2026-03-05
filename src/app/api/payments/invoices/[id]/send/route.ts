import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getUserId } from '@/lib/auth-users';
import { prisma } from '@/database/schema';

export const dynamic = "force-dynamic";

/**
 * POST /api/payments/invoices/[id]/send
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

    // Check if user has access (receptor, director, admin)
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, name: true }
    });

    if (!currentUser || !['admin', 'director', 'receptor'].includes(currentUser.role)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Receptor, Director, or Admin access required' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, subject, message } = body;

    // Get invoice details (in real implementation)
    const mockInvoice = {
      id: invoiceId,
      invoiceNumber: "INV-2024-001",
      reservationId: "res_123",
      guestName: "Janez Novak",
      guestEmail: "janez.novak@email.com",
      amount: 450.00,
      currency: "EUR",
      status: "draft",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      items: [
        {
          description: "Deluxe Room - 3 nights",
          quantity: 3,
          unitPrice: 150.00,
          total: 450.00
        }
      ]
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
    const sendResult = await sendInvoiceEmail(mockInvoice, recipientEmail, subject, message, currentUser.name || undefined);

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

async function sendInvoiceEmail(invoice: any, recipientEmail: string, subject?: string, message?: string, sentBy?: string) {
  // In real implementation, this would:
  // 1. Generate PDF invoice
  // 2. Send email with invoice attachment
  // 3. Track email delivery
  // 4. Update invoice status in database
  
  console.log('Sending invoice email:', {
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    recipientEmail,
    subject: subject || `Invoice ${invoice.invoiceNumber}`,
    sentBy
  });

  // Generate invoice PDF (in real implementation)
  const pdfUrl = await generateInvoicePDF(invoice);

  // Send email (in real implementation, use email service)
  const emailContent = {
    to: recipientEmail,
    subject: subject || `Invoice ${invoice.invoiceNumber} from AgentFlow Pro`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Invoice ${invoice.invoiceNumber}</h2>
        <p>Dear ${invoice.guestName},</p>
        <p>Please find your invoice attached to this email.</p>
        
        <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 5px;">
          <h3 style="margin-top: 0;">Invoice Summary</h3>
          <p><strong>Amount:</strong> €${invoice.amount.toFixed(2)}</p>
          <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
          <p><strong>Status:</strong> ${invoice.status}</p>
        </div>
        
        ${message ? `<div style="margin: 20px 0;"><p>${message}</p></div>` : ''}
        
        <p>Thank you for your business!</p>
        <p>Best regards,<br>${sentBy || 'The Team'}<br>AgentFlow Pro</p>
      </div>
    `,
    attachments: [
      {
        filename: `${invoice.invoiceNumber}.pdf`,
        url: pdfUrl
      }
    ]
  };

  console.log('Email content prepared:', emailContent);

  // Simulate email sending
  await new Promise(resolve => setTimeout(resolve, 2000));

  const sendResult = {
    messageId: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
    status: "sent",
    sentAt: new Date().toISOString(),
    pdfUrl
  };

  console.log('Invoice sent successfully:', sendResult);
  return sendResult;
}

async function generateInvoicePDF(invoice: any): Promise<string> {
  // In real implementation, this would:
  // 1. Generate a professional PDF invoice
  // 2. Include company branding
  // 3. Add invoice details and items
  // 4. Store PDF securely
  // 5. Return secure URL
  
  console.log('Generating PDF for invoice:', invoice.invoiceNumber);
  
  // Simulate PDF generation
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const pdfUrl = `https://storage.example.com/invoices/${invoice.invoiceNumber}.pdf`;
  console.log('PDF generated:', pdfUrl);
  
  return pdfUrl;
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
