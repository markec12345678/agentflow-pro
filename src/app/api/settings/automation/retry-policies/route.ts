import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getUserId } from '@/lib/auth-users';
import { prisma } from '@/database/schema';

export const dynamic = "force-dynamic";

interface FallbackRule {
  id: string;
  name: string;
  triggerCondition: string;
  fallbackAction: string;
  priority: number;
  enabled: boolean;
  description: string;
  conditions: {
    errorType?: string;
    statusCode?: number;
    maxRetries?: number;
    timeoutExceeded?: boolean;
  };
}

/**
 * GET /api/settings/automation/fallback-rules
 * Get all fallback rules
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

    // Get fallback rules (in real implementation, this would fetch from database)
    const mockFallbackRules: FallbackRule[] = [
      {
        id: "1",
        name: "AI Agent Fallback",
        triggerCondition: "ai_agent_failure",
        fallbackAction: "use_manual_processing",
        priority: 1,
        enabled: true,
        description: "Switch to manual processing if AI agent fails",
        conditions: {
          errorType: "agent_failure",
          maxRetries: 3,
          timeoutExceeded: true
        }
      },
      {
        id: "2",
        name: "Payment Gateway Fallback",
        triggerCondition: "payment_gateway_failure",
        fallbackAction: "use_backup_gateway",
        priority: 2,
        enabled: true,
        description: "Use backup payment gateway if primary fails",
        conditions: {
          errorType: "payment_error",
          statusCode: 500,
          maxRetries: 2
        }
      },
      {
        id: "3",
        name: "Email Service Fallback",
        triggerCondition: "email_service_failure",
        fallbackAction: "use_backup_email_service",
        priority: 3,
        enabled: true,
        description: "Use backup email service if primary fails",
        conditions: {
          errorType: "smtp_error",
          maxRetries: 5
        }
      },
      {
        id: "4",
        name: "Database Connection Fallback",
        triggerCondition: "database_connection_failure",
        fallbackAction: "use_readonly_replica",
        priority: 4,
        enabled: false,
        description: "Switch to read-only replica if primary database fails",
        conditions: {
          errorType: "connection_error",
          maxRetries: 1
        }
      }
    ];

    return NextResponse.json({
      success: true,
      data: { rules: mockFallbackRules }
    });

  } catch (error) {
    console.error('Get fallback rules error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/settings/automation/fallback-rules
 * Update fallback rules
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
    const { rules } = body;

    if (!rules || !Array.isArray(rules)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Rules array is required' } },
        { status: 400 }
      );
    }

    // Validate fallback rules
    const validationResult = validateFallbackRules(rules);
    if (!validationResult.valid) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: validationResult.message } },
        { status: 400 }
      );
    }

    // Update fallback rules (in real implementation)
    // console.log('Updated fallback rules:', rules);

    // Log activity
    await logActivity(userId, "Fallback Rules Updated", `Updated ${rules.length} fallback rules`, request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || "unknown");

    return NextResponse.json({
      success: true,
      data: { 
        message: 'Fallback rules updated successfully',
        rules
      }
    });

  } catch (error) {
    console.error('Update fallback rules error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }

function validateFallbackRules(rules: any[]): { valid: boolean; message?: string } {
  for (const rule of rules) {
    if (!rule.id || !rule.name || !rule.triggerCondition || !rule.fallbackAction) {
      return { valid: false, message: 'Each rule must have id, name, triggerCondition, and fallbackAction' };
    }

    if (typeof rule.priority !== 'number' || rule.priority < 1 || rule.priority > 10) {
      return { valid: false, message: 'Priority must be between 1 and 10' };
    }

    // Validate trigger condition
    const validTriggers = [
      "ai_agent_failure",
      "payment_gateway_failure", 
      "email_service_failure",
      "database_connection_failure",
      "api_timeout",
      "rate_limit_exceeded"
    ];
    
    if (!validTriggers.includes(rule.triggerCondition)) {
      return { valid: false, message: 'Invalid trigger condition' };
    }

    // Validate fallback action
    const validActions = [
      "use_manual_processing",
      "use_backup_gateway",
      "use_backup_email_service",
      "use_readonly_replica",
      "queue_for_retry",
      "notify_admin"
    ];
    
    if (!validActions.includes(rule.fallbackAction)) {
      return { valid: false, message: 'Invalid fallback action' };
    }
  }

  return { valid: true };
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
