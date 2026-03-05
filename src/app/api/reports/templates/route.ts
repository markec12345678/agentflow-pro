import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getUserId } from '@/lib/auth-users';
import { prisma } from '@/database/schema';

export const dynamic = "force-dynamic";

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: "daily" | "weekly" | "monthly" | "custom";
  category: "revenue" | "occupancy" | "performance" | "comparison";
  metrics: string[];
  properties: string[];
  enabled: boolean;
  schedule?: {
    enabled: boolean;
    frequency: "daily" | "weekly" | "monthly";
    recipients: string[];
    time: string;
  };
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * GET /api/reports/templates
 * Get all report templates for the user
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

    // Get user's report templates (in real implementation, these would be stored in database)
    // For now, return default templates
    const defaultTemplates: ReportTemplate[] = [
      {
        id: "daily-revenue",
        name: "Daily Revenue Report",
        description: "Daily revenue and occupancy summary",
        type: "daily",
        category: "revenue",
        metrics: ["revenue", "occupancy", "adr", "revpar"],
        properties: ["all"],
        enabled: true,
        schedule: {
          enabled: true,
          frequency: "daily",
          recipients: ["director@company.com", "manager@company.com"],
          time: "08:00"
        },
        userId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "weekly-performance",
        name: "Weekly Performance Report",
        description: "Comprehensive weekly performance metrics",
        type: "weekly",
        category: "performance",
        metrics: ["revenue", "occupancy", "adr", "revpar", "booking_channels", "guest_demographics"],
        properties: ["all"],
        enabled: true,
        schedule: {
          enabled: true,
          frequency: "weekly",
          recipients: ["director@company.com"],
          time: "09:00"
        },
        userId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "monthly-summary",
        name: "Monthly Summary Report",
        description: "Detailed monthly business summary",
        type: "monthly",
        category: "revenue",
        metrics: ["revenue", "occupancy", "adr", "revpar", "channel_breakdown", "demographics"],
        properties: ["all"],
        enabled: true,
        schedule: {
          enabled: true,
          frequency: "monthly",
          recipients: ["director@company.com", "investors@company.com"],
          time: "10:00"
        },
        userId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    return NextResponse.json({
      success: true,
      data: { templates: defaultTemplates }
    });

  } catch (error) {
    console.error('Get report templates error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reports/templates
 * Create a new report template
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
    const { template } = body;

    if (!template || !template.name || !template.metrics || template.metrics.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Name and metrics are required' } },
        { status: 400 }
      );
    }

    // Validate template data
    const validTypes = ["daily", "weekly", "monthly", "custom"];
    const validCategories = ["revenue", "occupancy", "performance", "comparison"];
    const validMetrics = ["revenue", "occupancy", "adr", "revpar", "booking_channels", "guest_demographics", "auto_approval_rate"];

    if (!validTypes.includes(template.type)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_TYPE', message: 'Invalid template type' } },
        { status: 400 }
      );
    }

    if (!validCategories.includes(template.category)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_CATEGORY', message: 'Invalid template category' } },
        { status: 400 }
      );
    }

    for (const metric of template.metrics) {
      if (!validMetrics.includes(metric)) {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_METRIC', message: `Invalid metric: ${metric}` } },
          { status: 400 }
        );
      }
    }

    // Create new template (in real implementation, this would be stored in database)
    const newTemplate: ReportTemplate = {
      id: `template_${Date.now()}`,
      name: template.name,
      description: template.description || "",
      type: template.type,
      category: template.category,
      metrics: template.metrics,
      properties: template.properties || ["all"],
      enabled: template.enabled !== false,
      schedule: template.schedule,
      userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('Created new report template:', newTemplate);

    return NextResponse.json({
      success: true,
      data: { template: newTemplate }
    });

  } catch (error) {
    console.error('Create report template error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
