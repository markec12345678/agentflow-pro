import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getUserId } from '@/lib/auth-users';
import { prisma } from '@/database/schema';

export const dynamic = "force-dynamic";

interface FeatureFlag {
  id: string;
  name: string;
  key: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  environment: "development" | "staging" | "production";
  lastModified: string;
  modifiedBy: string;
  conditions?: {
    userId?: string[];
    userRole?: string[];
    propertyId?: string[];
    customRules?: string[];
  };
}

/**
 * GET /api/settings/automation/feature-flags
 * Get all feature flags
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

    const { searchParams } = new URL(request.url);
    const environment = searchParams.get('environment');
    const enabled = searchParams.get('enabled');

    // Get feature flags (in real implementation, this would fetch from database)
    const mockFeatureFlags: FeatureFlag[] = [
      {
        id: "1",
        name: "AI Content Generation",
        key: "ai_content_generation",
        description: "Enable AI-powered content generation",
        enabled: true,
        rolloutPercentage: 100,
        environment: "production",
        lastModified: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        modifiedBy: "Admin User",
        conditions: {
          userRole: ["admin", "director", "receptor"]
        }
      },
      {
        id: "2",
        name: "Advanced Analytics",
        key: "advanced_analytics",
        description: "Enable advanced analytics dashboard",
        enabled: false,
        rolloutPercentage: 0,
        environment: "production",
        lastModified: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        modifiedBy: "Admin User"
      },
      {
        id: "3",
        name: "Smart Pricing",
        key: "smart_pricing",
        description: "Enable AI-powered dynamic pricing",
        enabled: true,
        rolloutPercentage: 50,
        environment: "staging",
        lastModified: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        modifiedBy: "Director User",
        conditions: {
          userRole: ["admin", "director"],
          propertyId: ["prop_1", "prop_2"]
        }
      },
      {
        id: "4",
        name: "Automated Check-in",
        key: "automated_checkin",
        description: "Enable automated guest check-in process",
        enabled: true,
        rolloutPercentage: 75,
        environment: "production",
        lastModified: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        modifiedBy: "Admin User"
      },
      {
        id: "5",
        name: "Multi-language Support",
        key: "multi_language_support",
        description: "Enable multi-language support for guest communications",
        enabled: true,
        rolloutPercentage: 100,
        environment: "production",
        lastModified: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        modifiedBy: "Admin User",
        conditions: {
          userRole: ["admin", "director", "receptor"]
        }
      },
      {
        id: "6",
        name: "Beta Dashboard",
        key: "beta_dashboard",
        description: "Enable beta version of the dashboard",
        enabled: false,
        rolloutPercentage: 10,
        environment: "development",
        lastModified: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        modifiedBy: "Admin User",
        conditions: {
          userId: ["user_1", "user_2", "user_3"]
        }
      }
    ];

    // Apply filters
    let filteredFlags = mockFeatureFlags;
    
    if (environment) {
      filteredFlags = filteredFlags.filter(flag => flag.environment === environment);
    }
    
    if (enabled !== null) {
      const isEnabled = enabled === 'true';
      filteredFlags = filteredFlags.filter(flag => flag.enabled === isEnabled);
    }

    return NextResponse.json({
      success: true,
      data: { flags: filteredFlags }
    });

  } catch (error) {
    console.error('Get feature flags error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/settings/automation/feature-flags
 * Update feature flags
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
      select: { role: true, name: true }
    });

    if (!currentUser || !['admin', 'director'].includes(currentUser.role)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin or Director access required' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { flags } = body;

    if (!flags || !Array.isArray(flags)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Flags array is required' } },
        { status: 400 }
      );
    }

    // Validate feature flags
    const validationResult = validateFeatureFlags(flags);
    if (!validationResult.valid) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: validationResult.message } },
        { status: 400 }
      );
    }

    // Update feature flags (in real implementation)
    const updatedFlags = flags.map(flag => ({
      ...flag,
      lastModified: new Date().toISOString(),
      modifiedBy: currentUser.name
    }));

    console.log('Updated feature flags:', updatedFlags);

    // Log activity
    await logActivity(userId, "Feature Flags Updated", `Updated ${flags.length} feature flags`, request.ip || "unknown");

    return NextResponse.json({
      success: true,
      data: { 
        message: 'Feature flags updated successfully',
        flags: updatedFlags
      }
    });

  } catch (error) {
    console.error('Update feature flags error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }

function validateFeatureFlags(flags: any[]): { valid: boolean; message?: string } {
  for (const flag of flags) {
    if (!flag.id || !flag.name || !flag.key) {
      return { valid: false, message: 'Each flag must have id, name, and key' };
    }

    if (typeof flag.enabled !== 'boolean') {
      return { valid: false, message: 'Enabled must be a boolean' };
    }

    if (typeof flag.rolloutPercentage !== 'number' || flag.rolloutPercentage < 0 || flag.rolloutPercentage > 100) {
      return { valid: false, message: 'Rollout percentage must be between 0 and 100' };
    }

    const validEnvironments = ["development", "staging", "production"];
    if (!validEnvironments.includes(flag.environment)) {
      return { valid: false, message: 'Invalid environment' };
    }

    // Validate key format (alphanumeric with underscores)
    const keyRegex = /^[a-zA-Z0-9_]+$/;
    if (!keyRegex.test(flag.key)) {
      return { valid: false, message: 'Feature flag key must contain only alphanumeric characters and underscores' };
    }

    // Check for duplicate keys
    const keys = flags.map(f => f.key);
    const uniqueKeys = new Set(keys);
    if (keys.length !== uniqueKeys.size) {
      return { valid: false, message: 'Feature flag keys must be unique' };
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
