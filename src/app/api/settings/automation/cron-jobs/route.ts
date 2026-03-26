import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getUserId } from '@/lib/auth-users';
import { prisma } from '@/database/schema';

export const dynamic = "force-dynamic";

interface CronJob {
  id: string;
  name: string;
  schedule: string;
  description: string;
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
  status: "idle" | "running" | "completed" | "failed";
  agent: string;
}

/**
 * GET /api/settings/automation/cron-jobs
 * Get all cron jobs
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Check if user is admin or director
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!currentUser || !['admin', 'director'].includes(currentUser.role)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin or Director access required' } },
        { status: 403 }
      );
    }

    // Get cron jobs (in real implementation, this would fetch from database)
    const mockCronJobs: CronJob[] = [
      {
        id: "1",
        name: "Daily Revenue Report",
        schedule: "0 8 * * *",
        description: "Generate daily revenue report at 8 AM",
        enabled: true,
        lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        nextRun: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString(),
        status: "completed",
        agent: "analytics"
      },
      {
        id: "2",
        name: "Guest Email Cleanup",
        schedule: "0 2 * * 0",
        description: "Clean up old guest emails on Sundays at 2 AM",
        enabled: true,
        lastRun: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        nextRun: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
        status: "idle",
        agent: "cleanup"
      },
      {
        id: "3",
        name: "Property Sync",
        schedule: "*/30 * * * *",
        description: "Sync property data every 30 minutes",
        enabled: true,
        lastRun: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        nextRun: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        status: "running",
        agent: "sync"
      },
      {
        id: "4",
        name: "Monthly Analytics",
        schedule: "0 9 1 * *",
        description: "Generate monthly analytics report on 1st of each month",
        enabled: false,
        lastRun: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        nextRun: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        status: "idle",
        agent: "analytics"
      },
      {
        id: "5",
        name: "Backup Database",
        schedule: "0 3 * * *",
        description: "Daily database backup at 3 AM",
        enabled: true,
        lastRun: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        nextRun: new Date(Date.now() + 19 * 60 * 60 * 1000).toISOString(),
        status: "completed",
        agent: "backup"
      }
    ];

    return NextResponse.json({
      success: true,
      data: { cronJobs: mockCronJobs }
    });

  } catch (error) {
    console.error('Get cron jobs error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/settings/automation/cron-jobs
 * Create or update cron jobs
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

    // Check if user is admin or director
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!currentUser || !['admin', 'director'].includes(currentUser.role)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin or Director access required' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { cronJobs } = body;

    if (!cronJobs || !Array.isArray(cronJobs)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Cron jobs array is required' } },
        { status: 400 }
      );
    }

    // Validate cron jobs
    const validationResult = validateCronJobs(cronJobs);
    if (!validationResult.valid) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: validationResult.message } },
        { status: 400 }
      );
    }

    // Update cron jobs (in real implementation)
    // console.log('Updated cron jobs:', cronJobs);

    // Log activity
    await logActivity(userId, "Cron Jobs Updated", `Updated ${cronJobs.length} cron jobs`, request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || "unknown");

    return NextResponse.json({
      success: true,
      data: { 
        message: 'Cron jobs updated successfully',
        cronJobs
      }
    });

  } catch (error) {
    console.error('Update cron jobs error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }

function validateCronJobs(cronJobs: CronJob[]): { valid: boolean; message?: string } {
  for (const job of cronJobs) {
    if (!job.id || !job.name || !job.schedule) {
      return { valid: false, message: 'Each cron job must have id, name, and schedule' };
    }

    if (!job.agent || typeof job.agent !== 'string') {
      return { valid: false, message: 'Each cron job must have a valid agent' };
    }

    // Validate cron schedule format (basic validation)
    const cronParts = job.schedule.split(' ');
    if (cronParts.length !== 5) {
      return { valid: false, message: 'Invalid cron schedule format' };
    }

    // Basic validation of cron parts
    const [minute, hour, dayOfMonth, month, dayOfWeek] = cronParts;
    
    if (!isValidCronField(minute, 0, 59) || 
        !isValidCronField(hour, 0, 23) || 
        !isValidCronField(dayOfMonth, 1, 31) || 
        !isValidCronField(month, 1, 12) || 
        !isValidCronField(dayOfWeek, 0, 6)) {
      return { valid: false, message: 'Invalid cron schedule values' };
    }
  }

  return { valid: true };
}

function isValidCronField(field: string, min: number, max: number): boolean {
  if (field === '*') return true;
  
  // Handle ranges (e.g., 1-5)
  if (field.includes('-')) {
    const [start, end] = field.split('-');
    const startNum = parseInt(start);
    const endNum = parseInt(end);
    return !isNaN(startNum) && !isNaN(endNum) && startNum >= min && endNum <= max && startNum <= endNum;
  }
  
  // Handle step values (e.g., */5)
  if (field.startsWith('*/')) {
    const step = parseInt(field.substring(2));
    return !isNaN(step) && step > 0;
  }
  
  // Handle comma-separated values (e.g., 1,3,5)
  if (field.includes(',')) {
    const values = field.split(',');
    return values.every(v => {
      const num = parseInt(v);
      return !isNaN(num) && num >= min && num <= max;
    });
  }
  
  // Handle single value
  const num = parseInt(field);
  return !isNaN(num) && num >= min && num <= max;
}

async function logActivity(userId: string, action: string, details: string, ipAddress: string) {
  // In real implementation, this would be stored in database
  // console.log('Activity log:', {
    userId,
    action,
    details,
    ipAddress,
    timestamp: new Date().toISOString()
  });
}
}
