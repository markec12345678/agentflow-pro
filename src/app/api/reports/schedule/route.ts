import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/infrastructure/observability/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getUserId } from '@/lib/auth-users';
import { prisma } from '@/database/schema';

export const dynamic = "force-dynamic";

interface ScheduleConfig {
  enabled: boolean;
  frequency: "daily" | "weekly" | "monthly";
  recipients: string[];
  time: string;
  templateId: string;
}

/**
 * POST /api/reports/schedule
 * Schedule automatic report generation and sending
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
    const { templateId, schedule } = body;

    if (!templateId || !schedule) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Template ID and schedule are required' } },
        { status: 400 }
      );
    }

    // Validate schedule configuration
    if (!schedule.recipients || schedule.recipients.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_RECIPIENTS', message: 'At least one recipient is required' } },
        { status: 400 }
      );
    }

    // Validate email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const recipient of schedule.recipients) {
      if (!emailRegex.test(recipient)) {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_EMAIL', message: `Invalid email address: ${recipient}` } },
          { status: 400 }
        );
      }
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(schedule.time)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_TIME', message: 'Time must be in HH:MM format' } },
        { status: 400 }
      );
    }

    // In a real implementation, this would be stored in database
    const scheduleConfig: ScheduleConfig = {
      enabled: schedule.enabled,
      frequency: schedule.frequency,
      recipients: schedule.recipients,
      time: schedule.time,
      templateId
    };

    logger.info('Updated report schedule:', scheduleConfig);

    // If enabled, set up the scheduled job
    if (schedule.enabled) {
      await setupScheduledJob(templateId, scheduleConfig);
    }

    return NextResponse.json({
      success: true,
      data: { 
        message: 'Schedule updated successfully',
        schedule: scheduleConfig
      }
    });

  } catch (error) {
    logger.error('Schedule report error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

async function setupScheduledJob(templateId: string, schedule: ScheduleConfig) {
  // In a real implementation, this would set up a cron job or use a job scheduler
  // For now, we'll just log the configuration
  
  logger.info(`Setting up scheduled job for template ${templateId}:`);
  logger.info(`- Frequency: ${schedule.frequency}`);
  logger.info(`- Time: ${schedule.time}`);
  logger.info(`- Recipients: ${schedule.recipients.join(', ')}`);
  
  // Calculate next run time
  const now = new Date();
  const [hours, minutes] = schedule.time.split(':').map(Number);
  
  let nextRun = new Date();
  nextRun.setHours(hours, minutes, 0, 0);
  
  // If the time has passed today, schedule for tomorrow/next week/next month
  if (nextRun <= now) {
    switch (schedule.frequency) {
      case 'daily':
        nextRun.setDate(nextRun.getDate() + 1);
        break;
      case 'weekly':
        nextRun.setDate(nextRun.getDate() + 7);
        break;
      case 'monthly':
        nextRun.setMonth(nextRun.getMonth() + 1);
        break;
    }
  }
  
  logger.info(`Next run time: ${nextRun.toISOString()}`);
  
  // In a real implementation, you would:
  // 1. Store the job configuration in a database
  // 2. Set up a cron job or use a job scheduler like Bull Queue
  // 3. Create a worker that processes the jobs
  // 4. Handle email sending when the job runs
  
  return nextRun;
}

/**
 * GET /api/reports/schedule
 * Get all scheduled reports for the user
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

    // In a real implementation, this would fetch from database
    const scheduledReports = [
      {
        templateId: "daily-revenue",
        templateName: "Daily Revenue Report",
        schedule: {
          enabled: true,
          frequency: "daily" as const,
          recipients: ["director@company.com", "manager@company.com"],
          time: "08:00"
        },
        nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        templateId: "weekly-performance",
        templateName: "Weekly Performance Report",
        schedule: {
          enabled: true,
          frequency: "weekly" as const,
          recipients: ["director@company.com"],
          time: "09:00"
        },
        nextRun: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        lastRun: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      },
      {
        templateId: "monthly-summary",
        templateName: "Monthly Summary Report",
        schedule: {
          enabled: true,
          frequency: "monthly" as const,
          recipients: ["director@company.com", "investors@company.com"],
          time: "10:00"
        },
        nextRun: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        lastRun: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    return NextResponse.json({
      success: true,
      data: { scheduledReports }
    });

  } catch (error) {
    logger.error('Get scheduled reports error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
