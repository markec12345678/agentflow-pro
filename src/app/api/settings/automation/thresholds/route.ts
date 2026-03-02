import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getUserId } from '@/lib/auth-users';
import { prisma } from '@/database/schema';

export const dynamic = "force-dynamic";

interface AutoApproveThreshold {
  id: string;
  name: string;
  type: "price" | "risk_score" | "occupancy" | "revenue";
  minValue: number;
  maxValue: number;
  unit: string;
  enabled: boolean;
  description: string;
}

/**
 * GET /api/settings/automation/thresholds
 * Get all auto-approve thresholds
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

    // Get thresholds (in real implementation, this would fetch from database)
    const mockThresholds: AutoApproveThreshold[] = [
      {
        id: "1",
        name: "Price Threshold",
        type: "price",
        minValue: 50,
        maxValue: 5000,
        unit: "EUR",
        enabled: true,
        description: "Auto-approve bookings within this price range"
      },
      {
        id: "2",
        name: "Risk Score Threshold",
        type: "risk_score",
        minValue: 0,
        maxValue: 70,
        unit: "score",
        enabled: true,
        description: "Auto-approve bookings with risk score below this value"
      },
      {
        id: "3",
        name: "Occupancy Threshold",
        type: "occupancy",
        minValue: 0,
        maxValue: 90,
        unit: "%",
        enabled: true,
        description: "Auto-approve when occupancy is below this percentage"
      },
      {
        id: "4",
        name: "Revenue Threshold",
        type: "revenue",
        minValue: 100,
        maxValue: 10000,
        unit: "EUR",
        enabled: false,
        description: "Auto-approve bookings with expected revenue in this range"
      }
    ];

    return NextResponse.json({
      success: true,
      data: { thresholds: mockThresholds }
    });

  } catch (error) {
    console.error('Get thresholds error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/settings/automation/thresholds
 * Update auto-approve thresholds
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
    const { thresholds } = body;

    if (!thresholds || !Array.isArray(thresholds)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Thresholds array is required' } },
        { status: 400 }
      );
    }

    // Validate thresholds
    const validationResult = validateThresholds(thresholds);
    if (!validationResult.valid) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: validationResult.message } },
        { status: 400 }
      );
    }

    // Update thresholds (in real implementation)
    console.log('Updated thresholds:', thresholds);

    // Log activity
    await logActivity(userId, "Thresholds Updated", `Updated ${thresholds.length} auto-approve thresholds`, request.ip || "unknown");

    return NextResponse.json({
      success: true,
      data: { 
        message: 'Auto-approve thresholds updated successfully',
        thresholds
      }
    });

  } catch (error) {
    console.error('Update thresholds error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }

function validateThresholds(thresholds: any[]): { valid: boolean; message?: string } {
  for (const threshold of thresholds) {
    if (!threshold.id || !threshold.name || !threshold.type) {
      return { valid: false, message: 'Each threshold must have id, name, and type' };
    }

    if (typeof threshold.minValue !== 'number' || typeof threshold.maxValue !== 'number') {
      return { valid: false, message: 'Min and max values must be numbers' };
    }

    if (threshold.minValue >= threshold.maxValue) {
      return { valid: false, message: 'Min value must be less than max value' };
    }

    if (threshold.minValue < 0) {
      return { valid: false, message: 'Min value must be non-negative' };
    }

    const validTypes = ["price", "risk_score", "occupancy", "revenue"];
    if (!validTypes.includes(threshold.type)) {
      return { valid: false, message: 'Invalid threshold type' };
    }

    // Type-specific validations
    if (threshold.type === "risk_score" && threshold.maxValue > 100) {
      return { valid: false, message: 'Risk score must be between 0 and 100' };
    }

    if (threshold.type === "occupancy" && threshold.maxValue > 100) {
      return { valid: false, message: 'Occupancy percentage must be between 0 and 100' };
    }
  }

  return { valid: true };
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
