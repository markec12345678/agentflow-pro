import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/infrastructure/observability/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getUserId } from '@/lib/auth-users';
import { prisma } from '@/database/schema';

export const dynamic = "force-dynamic";

interface SendReportRequest {
  reportId: string;
  recipients: string[];
  subject?: string;
  message?: string;
  includeReport: boolean;
}

/**
 * POST /api/reports/send
 * Send a generated report via email
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { reportId, recipients, subject, message, includeReport } = body as SendReportRequest;

    if (!reportId || !recipients || recipients.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Report ID and recipients are required' } },
        { status: 400 }
      );
    }

    // Validate email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const recipient of recipients) {
      if (!emailRegex.test(recipient)) {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_EMAIL', message: `Invalid email address: ${recipient}` } },
          { status: 400 }
        );
      }
    }

    // Get report details (in real implementation, this would fetch from database)
    const report = await getReportDetails(reportId, userId);
    
    if (!report) {
      return NextResponse.json(
        { success: false, error: { code: 'REPORT_NOT_FOUND', message: 'Report not found' } },
        { status: 404 }
      );
    }

    // Send email
    const emailResult = await sendReportEmail({
      report,
      recipients,
      subject: subject || `Report: ${report.name}`,
      message: message || `Please find the attached report: ${report.name}`,
      includeReport
    });

    // Log the send action
    logger.info('Report sent:', {
      reportId,
      reportName: report.name,
      recipients,
      sentAt: new Date().toISOString(),
      emailResult
    });

    return NextResponse.json({
      success: true,
      data: {
        message: 'Report sent successfully',
        sentAt: new Date().toISOString(),
        recipients,
        emailId: emailResult.emailId
      }
    });

  } catch (error) {
    logger.error('Send report error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

async function getReportDetails(reportId: string, userId: string) {
  // In a real implementation, this would fetch from database
  // For now, return mock data
  const mockReports = [
    {
      id: "1",
      name: "Daily Revenue Report",
      generatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      period: {
        start: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      status: "completed",
      fileUrl: "/reports/daily-revenue-2026-03-01.pdf",
      fileSize: 245760,
      userId
    },
    {
      id: "2",
      name: "Weekly Performance Report",
      generatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      period: {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      status: "completed",
      fileUrl: "/reports/weekly-performance-2026-w09.pdf",
      fileSize: 524288,
      userId
    }
  ];

  return mockReports.find(r => r.id === reportId);
}

async function sendReportEmail(params: {
  report: any;
  recipients: string[];
  subject: string;
  message: string;
  includeReport: boolean;
}) {
  // In a real implementation, this would use an email service like SendGrid, Resend, etc.
  // For now, we'll simulate the email sending
  
  logger.info('Sending email with params:', {
    recipients: params.recipients,
    subject: params.subject,
    message: params.message,
    includeReport: params.includeReport,
    reportFile: params.report.fileUrl
  });

  // Simulate email sending delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Simulate email sending result
  const emailResult = {
    emailId: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    status: "sent",
    sentAt: new Date().toISOString(),
    recipients: params.recipients,
    attachments: params.includeReport ? [
      {
        filename: `${params.report.name.replace(/\s+/g, '_')}.pdf`,
        url: params.report.fileUrl,
        size: params.report.fileSize
      }
    ] : []
  };

  // In a real implementation, you would:
  // 1. Use an email service API (SendGrid, Resend, etc.)
  // 2. Create HTML email template
  // 3. Attach the report file if includeReport is true
  // 4. Handle email delivery errors
  // 5. Log the email delivery status

  return emailResult;
}

/**
 * GET /api/reports/send/history
 * Get email sending history for reports
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get('reportId');
    const limit = parseInt(searchParams.get('limit') || '20');

    // In a real implementation, this would fetch from database
    const emailHistory = [
      {
        id: "email_1",
        reportId: "1",
        reportName: "Daily Revenue Report",
        recipients: ["director@company.com", "manager@company.com"],
        subject: "Daily Revenue Report - 2026-03-01",
        sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        status: "sent",
        attachments: [
          {
            filename: "daily_revenue_2026-03-01.pdf",
            size: 245760
          }
        ]
      },
      {
        id: "email_2",
        reportId: "2",
        reportName: "Weekly Performance Report",
        recipients: ["director@company.com"],
        subject: "Weekly Performance Report - Week 9",
        sentAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        status: "sent",
        attachments: [
          {
            filename: "weekly_performance_2026-w09.pdf",
            size: 524288
          }
        ]
      },
      {
        id: "email_3",
        reportId: "1",
        reportName: "Daily Revenue Report",
        recipients: ["investors@company.com"],
        subject: "Daily Revenue Report - 2026-02-28",
        sentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        status: "failed",
        error: "Email service temporarily unavailable",
        attachments: []
      }
    ];

    const filteredHistory = reportId 
      ? emailHistory.filter(email => email.reportId === reportId)
      : emailHistory;

    return NextResponse.json({
      success: true,
      data: {
        history: filteredHistory.slice(0, limit),
        total: filteredHistory.length
      }
    });

  } catch (error) {
    logger.error('Get email history error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
