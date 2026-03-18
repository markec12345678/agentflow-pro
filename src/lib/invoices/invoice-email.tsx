/**
 * Invoice Email Sender
 * 
 * Sends invoices via email with PDF attachment.
 * Uses Resend for email delivery.
 * 
 * Dependencies:
 *   npm install resend @react-email/components @react-email/render
 */

import { Resend } from 'resend';
import { render } from '@react-email/render';
import { prisma } from '@/lib/prisma';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY || 're_test_key');

interface InvoiceEmailData {
  invoiceNumber: string;
  invoiceAmount: number;
  dueDate: string;
  propertyName: string;
  customerName: string;
  customerEmail: string;
  pdfUrl: string;
  pdfFilename: string;
  bankIban?: string;
  bankName?: string;
  paymentReference?: string;
  customerNotes?: string;
}

/**
 * Invoice Email Template
 */
export const InvoiceEmailTemplate: React.FC<{ data: InvoiceEmailData }> = ({
  data,
}) => {
  return (
    <div
      style={{
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        color: '#333',
        maxWidth: '600px',
        margin: '0 auto',
        padding: '20px',
      }}
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: '#1a73e8',
          color: 'white',
          padding: '20px',
          borderRadius: '8px 8px 0 0',
          textAlign: 'center',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '24px' }}>{data.propertyName}</h1>
        <p style={{ margin: '10px 0 0 0', opacity: 0.9 }}>Invoice / Račun</p>
      </div>

      {/* Body */}
      <div
        style={{
          backgroundColor: '#ffffff',
          padding: '30px',
          border: '1px solid #e0e0e0',
          borderTop: 'none',
        }}
      >
        {/* Greeting */}
        <p style={{ marginBottom: '20px' }}>
          Spoštovani {data.customerName},<br />
          Dear {data.customerName},
        </p>

        {/* Invoice Info */}
        <div
          style={{
            backgroundColor: '#f5f5f5',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px',
          }}
        >
          <h2 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#1a73e8' }}>
            Invoice Details / Podatki o računu
          </h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td
                  style={{
                    padding: '8px 0',
                    borderBottom: '1px solid #ddd',
                    fontWeight: 'bold',
                  }}
                >
                  Invoice Number / Številka računa:
                </td>
                <td
                  style={{
                    padding: '8px 0',
                    borderBottom: '1px solid #ddd',
                    textAlign: 'right',
                  }}
                >
                  {data.invoiceNumber}
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    padding: '8px 0',
                    borderBottom: '1px solid #ddd',
                    fontWeight: 'bold',
                  }}
                >
                  Amount / Znesek:
                </td>
                <td
                  style={{
                    padding: '8px 0',
                    borderBottom: '1px solid #ddd',
                    textAlign: 'right',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: '#1a73e8',
                  }}
                >
                  €{data.invoiceAmount.toFixed(2)}
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    padding: '8px 0',
                    fontWeight: 'bold',
                  }}
                >
                  Due Date / Datum zapadlosti:
                </td>
                <td
                  style={{
                    padding: '8px 0',
                    textAlign: 'right',
                  }}
                >
                  {data.dueDate}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* PDF Attachment Info */}
        <div
          style={{
            backgroundColor: '#fff9e6',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #ffc107',
          }}
        >
          <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>
            📎 Invoice PDF attached / Priložen PDF račun
          </p>
          <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>
            Please find your invoice attached as a PDF file. You can download and
            save it for your records.
            <br />
            Prosimo, najdete prilagojen račun v PDF obliki. Lahko ga prenesete in
            shranite za svoje evidence.
          </p>
        </div>

        {/* Payment Instructions */}
        <div
          style={{
            backgroundColor: '#e8f5e9',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #4caf50',
          }}
        >
          <h3
            style={{
              margin: '0 0 15px 0',
              fontSize: '16px',
              color: '#2e7d32',
            }}
          >
            Payment Instructions / Navodila za plačilo
          </h3>
          {data.bankName && (
            <p style={{ margin: '5px 0' }}>
              <strong>Bank / Banka:</strong> {data.bankName}
            </p>
          )}
          {data.bankIban && (
            <p style={{ margin: '5px 0' }}>
              <strong>IBAN:</strong> {data.bankIban}
            </p>
          )}
          {data.paymentReference && (
            <p style={{ margin: '5px 0' }}>
              <strong>Reference / Sklic:</strong> {data.paymentReference}
            </p>
          )}
          <p style={{ margin: '15px 0 0 0', fontSize: '13px', color: '#666' }}>
            Please use the payment reference when making the transfer.
            <br />
            Prosimo, uporabite sklic pri plačilu.
          </p>
        </div>

        {/* Customer Notes */}
        {data.customerNotes && (
          <div
            style={{
              backgroundColor: '#f5f5f5',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '20px',
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: '13px',
                color: '#666',
                fontStyle: 'italic',
              }}
            >
              {data.customerNotes}
            </p>
          </div>
        )}

        {/* Closing */}
        <p style={{ marginBottom: '30px' }}>
          Hvala za vaše gostovanje!<br />
          Thank you for your stay!
        </p>

        <p style={{ marginBottom: '10px' }}>
          Lep pozdrav / Best regards,
          <br />
          <strong>{data.propertyName}</strong>
        </p>
      </div>

      {/* Footer */}
      <div
        style={{
          backgroundColor: '#f5f5f5',
          padding: '20px',
          borderRadius: '0 0 8px 8px',
          textAlign: 'center',
          fontSize: '12px',
          color: '#999',
        }}
      >
        <p style={{ margin: '0 0 10px 0' }}>
          This is an automated message. Please do not reply to this email.
        </p>
        <p style={{ margin: 0 }}>
          To je avtomatsko sporočilo. Prosimo, ne odgovarjajte na ta email.
        </p>
      </div>
    </div>
  );
};

/**
 * Send invoice email
 */
export async function sendInvoiceEmail(
  invoiceId: string,
  pdfUrl: string,
  pdfFilename: string
): Promise<{
  success: boolean;
  emailId?: string;
  error?: string;
}> {
  try {
    // Fetch invoice data
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        property: true,
      },
    });

    if (!invoice) {
      return {
        success: false,
        error: 'Invoice not found',
      };
    }

    if (!invoice.customerEmail) {
      return {
        success: false,
        error: 'Customer email not provided',
      };
    }

    // Prepare email data
    const emailData: InvoiceEmailData = {
      invoiceNumber: invoice.invoiceNumber,
      invoiceAmount: Number(invoice.totalAmount),
      dueDate: new Date(invoice.dueDate).toLocaleDateString('sl-SI'),
      propertyName: invoice.property.name,
      customerName: invoice.customerName,
      customerEmail: invoice.customerEmail,
      pdfUrl,
      pdfFilename,
      bankIban: invoice.property.bankIban,
      bankName: invoice.property.bankName,
      paymentReference: `SI00 ${invoice.invoiceNumber.replace(/-/g, '')}`,
      customerNotes: invoice.customerNotes || undefined,
    };

    // Render email HTML
    const html = await render(<InvoiceEmailTemplate data={emailData} />);

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: `${invoice.property.name} <noreply@${process.env.RESEND_DOMAIN || 'agentflow.pro'}>`,
      to: [invoice.customerEmail],
      subject: `Invoice ${invoice.invoiceNumber} - ${invoice.property.name}`,
      html,
      attachments: [
        {
          filename: pdfFilename,
          path: pdfUrl,
        },
      ],
    });

    if (error) {
      throw error;
    }

    // Update invoice status
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        emailSent: true,
        emailSentAt: new Date(),
        status: 'SENT',
      },
    });

    return {
      success: true,
      emailId: data?.id,
    };
  } catch (error) {
    console.error('Failed to send invoice email:', error);

    // Update invoice with error
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        emailError: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

/**
 * Send invoice email with retry logic
 */
export async function sendInvoiceEmailWithRetry(
  invoiceId: string,
  pdfUrl: string,
  pdfFilename: string,
  maxRetries = 3
): Promise<{
  success: boolean;
  emailId?: string;
  error?: string;
}> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await sendInvoiceEmail(invoiceId, pdfUrl, pdfFilename);

    if (result.success) {
      return result;
    }

    lastError = new Error(result.error);

    // Wait before retry (exponential backoff)
    if (attempt < maxRetries) {
      const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s...
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return {
    success: false,
    error: lastError?.message || 'Failed to send email after retries',
  };
}

/**
 * Send bulk invoice emails
 */
export async function sendBulkInvoiceEmails(
  invoiceIds: string[],
  getPDFUrl: (invoiceId: string) => Promise<{ url: string; filename: string }>
): Promise<{
  total: number;
  success: number;
  failed: number;
  results: Array<{
    invoiceId: string;
    success: boolean;
    error?: string;
  }>;
}> {
  const results = [];
  let successCount = 0;
  let failedCount = 0;

  for (const invoiceId of invoiceIds) {
    try {
      const { url, filename } = await getPDFUrl(invoiceId);
      const result = await sendInvoiceEmailWithRetry(invoiceId, url, filename);

      results.push({
        invoiceId,
        success: result.success,
        error: result.error,
      });

      if (result.success) {
        successCount++;
      } else {
        failedCount++;
      }
    } catch (error) {
      results.push({
        invoiceId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      failedCount++;
    }

    // Rate limiting: wait 100ms between emails
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return {
    total: invoiceIds.length,
    success: successCount,
    failed: failedCount,
    results,
  };
}
