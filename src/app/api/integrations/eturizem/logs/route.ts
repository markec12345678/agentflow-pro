import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getUserId } from '@/lib/auth-users';
import { prisma } from '@/database/schema';

export const dynamic = "force-dynamic";

interface SyncLog {
  id: string;
  timestamp: string;
  type: "full" | "incremental" | "manual" | "error";
  status: "success" | "error" | "partial";
  propertiesProcessed: number;
  propertiesUpdated: number;
  propertiesCreated: number;
  propertiesFailed: number;
  duration: number;
  errorMessage?: string;
  details?: string;
}

/**
 * GET /api/integrations/eturizem/logs
 * Get eTurizem sync logs
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    // In a real implementation, logs would be stored in a database table
    // For now, we'll return mock data
    
    const mockLogs: SyncLog[] = [
      {
        id: "1",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        type: "incremental",
        status: "success",
        propertiesProcessed: 12,
        propertiesUpdated: 8,
        propertiesCreated: 2,
        propertiesFailed: 2,
        duration: 45,
        details: "Updated 8 properties, created 2 new properties"
      },
      {
        id: "2",
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        type: "manual",
        status: "partial",
        propertiesProcessed: 12,
        propertiesUpdated: 5,
        propertiesCreated: 0,
        propertiesFailed: 7,
        duration: 120,
        errorMessage: "API rate limit exceeded",
        details: "Failed to sync 7 properties due to rate limiting"
      },
      {
        id: "3",
        timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
        type: "full",
        status: "success",
        propertiesProcessed: 12,
        propertiesUpdated: 3,
        propertiesCreated: 9,
        propertiesFailed: 0,
        duration: 180,
        details: "Initial full sync completed successfully"
      },
      {
        id: "4",
        timestamp: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
        type: "incremental",
        status: "error",
        propertiesProcessed: 0,
        propertiesUpdated: 0,
        propertiesCreated: 0,
        propertiesFailed: 0,
        duration: 5,
        errorMessage: "API authentication failed",
        details: "Invalid API key"
      },
      {
        id: "5",
        timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
        type: "full",
        status: "success",
        propertiesProcessed: 10,
        propertiesUpdated: 2,
        propertiesCreated: 8,
        propertiesFailed: 0,
        duration: 165,
        details: "Full sync completed successfully"
      }
    ];

    // Filter logs
    let filteredLogs = mockLogs;
    
    if (type && type !== 'all') {
      filteredLogs = filteredLogs.filter(log => log.type === type);
    }
    
    if (status && status !== 'all') {
      filteredLogs = filteredLogs.filter(log => log.status === status);
    }

    // Sort by timestamp (newest first)
    filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

    return NextResponse.json({
      success: true,
      data: {
        logs: paginatedLogs,
        pagination: {
          page,
          limit,
          total: filteredLogs.length,
          pages: Math.ceil(filteredLogs.length / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get eTurizem logs error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/integrations/eturizem/logs
 * Create a new sync log entry
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
    const { log } = body;

    // Validate log data
    if (!log || typeof log !== 'object') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Invalid log data' } },
        { status: 400 }
      );
    }

    // Validate required fields
    const requiredFields = ['type', 'status', 'propertiesProcessed', 'duration'];
    for (const field of requiredFields) {
      if (!(field in log)) {
        return NextResponse.json(
          { success: false, error: { code: 'MISSING_FIELD', message: `Missing required field: ${field}` } },
          { status: 400 }
        );
      }
    }

    // Validate enum values
    const validTypes = ["full", "incremental", "manual", "error"];
    const validStatuses = ["success", "error", "partial"];
    
    if (!validTypes.includes(log.type)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_TYPE', message: 'Invalid sync type' } },
        { status: 400 }
      );
    }

    if (!validStatuses.includes(log.status)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_STATUS', message: 'Invalid sync status' } },
        { status: 400 }
      );
    }

    // In a real implementation, this would be stored in a database
    const newLog: SyncLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      type: log.type,
      status: log.status,
      propertiesProcessed: log.propertiesProcessed,
      propertiesUpdated: log.propertiesUpdated || 0,
      propertiesCreated: log.propertiesCreated || 0,
      propertiesFailed: log.propertiesFailed || 0,
      duration: log.duration,
      errorMessage: log.errorMessage,
      details: log.details
    };

    // console.log('New eTurizem sync log:', newLog);

    return NextResponse.json({
      success: true,
      data: { log: newLog }
    });

  } catch (error) {
    console.error('Create eTurizem log error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
