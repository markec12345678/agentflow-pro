import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/infrastructure/observability/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getUserId } from '@/lib/auth-users';
import { prisma } from '@/database/schema';

export const dynamic = "force-dynamic";

interface DataRequest {
  id: string;
  guestId: string;
  guestName: string;
  guestEmail: string;
  requestType: "export" | "deletion";
  status: "pending" | "processing" | "completed" | "failed";
  requestDate: string;
  completedDate?: string;
  processedBy?: string;
  notes?: string;
}

/**
 * GET /api/settings/security/data-requests
 * Get all data requests
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

    // Check if user is admin
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const requestType = searchParams.get('type');
    const status = searchParams.get('status');

    // Get data requests (in real implementation, this would fetch from database)
    const mockRequests: DataRequest[] = [
      {
        id: "1",
        guestId: "guest_1",
        guestName: "Janez Novak",
        guestEmail: "janez.novak@email.com",
        requestType: "export",
        status: "completed",
        requestDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        completedDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        processedBy: "Admin User",
        notes: "Data exported successfully"
      },
      {
        id: "2",
        guestId: "guest_2",
        guestName: "Maja Horvat",
        guestEmail: "maja.horvat@email.com",
        requestType: "deletion",
        status: "pending",
        requestDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "3",
        guestId: "guest_3",
        guestName: "Peter Kovačič",
        guestEmail: "peter.kovacic@email.com",
        requestType: "export",
        status: "processing",
        requestDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "4",
        guestId: "guest_4",
        guestName: "Ana Zupan",
        guestEmail: "ana.zupan@email.com",
        requestType: "deletion",
        status: "failed",
        requestDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        completedDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        processedBy: "Admin User",
        notes: "Failed to delete data - system error"
      }
    ];

    // Apply filters
    let filteredRequests = mockRequests;
    
    if (requestType) {
      filteredRequests = filteredRequests.filter(request => request.requestType === requestType);
    }
    
    if (status) {
      filteredRequests = filteredRequests.filter(request => request.status === status);
    }

    return NextResponse.json({
      success: true,
      data: { requests: filteredRequests }
    });

  } catch (error) {
    logger.error('Get data requests error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/settings/security/data-requests
 * Create new data request
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
    const { guestEmail, requestType } = body;

    if (!guestEmail || !requestType) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Guest email and request type are required' } },
        { status: 400 }
      );
    }

    // Validate request type
    const validTypes = ["export", "deletion"];
    if (!validTypes.includes(requestType)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_TYPE', message: 'Invalid request type' } },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(guestEmail)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_EMAIL', message: 'Invalid email format' } },
        { status: 400 }
      );
    }

    // Create data request (in real implementation)
    const newRequest: DataRequest = {
      id: `request_${Date.now()}`,
      guestId: `guest_${Date.now()}`,
      guestName: guestEmail.split('@')[0], // Extract name from email
      guestEmail,
      requestType,
      status: "pending",
      requestDate: new Date().toISOString()
    };

    logger.info('Created data request:', newRequest);

    // Log activity
    await logActivity(userId, "Data Request Created", `Created ${requestType} request for: ${guestEmail}`, request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || "unknown");

    return NextResponse.json({
      success: true,
      data: { request: newRequest }
    });

  } catch (error) {
    logger.error('Create data request error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }

async function logActivity(userId: string, action: string, details: string, ipAddress: string) {
  // In real implementation, this would be stored in database
  logger.info('Activity log:', {
    userId,
    action,
    details,
    ipAddress,
    timestamp: new Date().toISOString()
  });
}
}
