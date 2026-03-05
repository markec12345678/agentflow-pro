import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getUserId } from '@/lib/auth-users';
import { prisma } from '@/database/schema';

export const dynamic = "force-dynamic";

/**
 * POST /api/settings/automation/cron-jobs/[id]/run
 * Manually trigger a cron job
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const jobId = resolvedParams.id;
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
      select: { role: true, name: true }
    });

    if (!currentUser || !['admin', 'director'].includes(currentUser.role)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin or Director access required' } },
        { status: 403 }
      );
    }

    // Get cron job details (in real implementation)
    const mockCronJob = {
      id: jobId,
      name: "Daily Revenue Report",
      schedule: "0 8 * * *",
      description: "Generate daily revenue report at 8 AM",
      enabled: true,
      agent: "analytics"
    };

    if (!mockCronJob) {
      return NextResponse.json(
        { success: false, error: { code: 'JOB_NOT_FOUND', message: 'Cron job not found' } },
        { status: 404 }
      );
    }

    if (!mockCronJob.enabled) {
      return NextResponse.json(
        { success: false, error: { code: 'JOB_DISABLED', message: 'Cron job is disabled' } },
        { status: 400 }
      );
    }

    // Execute the cron job (in real implementation)
    const jobResult = await executeCronJob(mockCronJob);

    // Log activity
    await logActivity(userId, "Cron Job Triggered", `Manually triggered cron job: ${mockCronJob.name}`, request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || "unknown");

    return NextResponse.json({
      success: true,
      data: {
        message: 'Cron job executed successfully',
        jobId,
        result: jobResult
      }
    });

  } catch (error) {
    console.error('Run cron job error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }

async function executeCronJob(job: any): Promise<any> {
  console.log(`Executing cron job: ${job.name} (${job.agent})`);
  
  // Simulate job execution
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // In real implementation, this would:
  // 1. Start the appropriate agent
  // 2. Execute the job logic
  // 3. Handle errors and retries
  // 4. Update job status and timestamps
  // 5. Send notifications if needed
  
  const jobResult = {
    status: 'completed',
    startTime: new Date().toISOString(),
    endTime: new Date().toISOString(),
    duration: 2000,
    output: {
      message: `Job ${job.name} completed successfully`,
      recordsProcessed: Math.floor(Math.random() * 1000) + 100,
      errors: 0
    }
  };

  console.log('Cron job result:', jobResult);
  return jobResult;
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
