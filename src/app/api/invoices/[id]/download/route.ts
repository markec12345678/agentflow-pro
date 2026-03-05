import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getUserId } from '@/lib/auth-users';
import { prisma } from '@/database/schema';

export const dynamic = "force-dynamic";

/**
 * GET /api/invoices/[id]/download
 * Download invoice PDF
 */
export async function GET(
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
      select: { role: true }
    });

    if (!currentUser || !['admin', 'receptor'].includes(currentUser.role)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Receptor or Admin access required' } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'pdf';

    // Get invoice details (in real implementation)
    const mockInvoice = {
      id: invoiceId,
      invoiceNumber: "INV-2024-001",
      reservationId: "res_123",
      guestName: "Janez Novak",
      guestEmail: "janez.novak@email.com",
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
      taxRate: 21
    };

    if (!mockInvoice) {
      return NextResponse.json(
        { success: false, error: { code: 'INVOICE_NOT_FOUND', message: 'Invoice not found' } },
        { status: 404 }
      );
    }

    // Download invoice (in real implementation)
    const downloadResult = await downloadInvoicePDF(mockInvoice, format);

    // Log activity
    await logActivity(userId, "Invoice Downloaded", `Downloaded invoice ${mockInvoice.invoiceNumber} (${format})`, request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || "unknown");

    // Return PDF file
    if (format === 'pdf' && downloadResult.pdfBuffer) {
      const pdfBuffer = downloadResult.pdfBuffer as unknown as ArrayBuffer;
      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${mockInvoice.invoiceNumber}.pdf"`,
          'Content-Length': pdfBuffer.byteLength.toString()
        }
      });
    }

    // Fallback to URL response
    return NextResponse.json({
      success: true,
      data: {
        message: 'Invoice download ready',
        invoiceId,
        downloadUrl: downloadResult.downloadUrl,
        format,
        downloadedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Download invoice error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }

async function downloadInvoicePDF(invoice: any, format: string) {
  // In real implementation, this would:
  // 1. Check if PDF already exists
  // 2. Generate PDF if not exists
  // 3. Return PDF buffer or download URL
  // 4. Track download statistics
  
  console.log('Downloading invoice:', {
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    format
  });

  // Simulate PDF generation/retrieval
  await new Promise(resolve => setTimeout(resolve, 1000));

  // In real implementation, this would return actual PDF buffer
  // For now, we'll return a mock response
  const pdfUrl = `https://storage.example.com/invoices/${invoice.invoiceNumber}.pdf`;
  
  const downloadResult = {
    downloadUrl: pdfUrl,
    format,
    fileSize: "245KB",
    pageCount: 1,
    downloadedAt: new Date().toISOString(),
    pdfBuffer: null // In real implementation, this would be the actual PDF buffer
  };

  console.log('Invoice download ready:', downloadResult);
  return downloadResult;
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
