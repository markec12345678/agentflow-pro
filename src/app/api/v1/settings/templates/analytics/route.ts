/**
 * Template Analytics API
 * 
 * GET /api/templates/analytics - Get all analytics
 * GET /api/templates/analytics/usage - Get usage stats
 * GET /api/templates/analytics/performance - Get performance metrics
 * GET /api/templates/analytics/roi - Get ROI calculations
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/infrastructure/observability/logger';
import {
  getAllTemplateUsage,
  getTemplatePerformance,
  getTemplateDashboardData,
  trackTemplateUsage
} from '@/lib/templates/analytics';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';

    // Get specific analytics type
    switch (type) {
      case 'usage':
        const usage = await getAllTemplateUsage();
        return NextResponse.json({
          success: true,
          data: usage
        });

      case 'performance':
        const performance = await getTemplatePerformance();
        return NextResponse.json({
          success: true,
          data: performance
        });

      case 'roi':
        const dashboardData = await getTemplateDashboardData();
        return NextResponse.json({
          success: true,
          data: dashboardData.roi
        });

      case 'all':
      default:
        const allData = await getTemplateDashboardData();
        return NextResponse.json({
          success: true,
          data: allData
        });
    }
  } catch (error) {
    logger.error('[Templates Analytics API] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch analytics'
    }, { status: 500 });
  }
}

/**
 * POST /api/templates/analytics/track
 * Track template usage
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { templateId, system, renderTimeMs, success = true } = body;

    if (!templateId || !system) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: templateId, system'
      }, { status: 400 });
    }

    await trackTemplateUsage(templateId, system, renderTimeMs, success);

    return NextResponse.json({
      success: true,
      message: 'Usage tracked successfully'
    });
  } catch (error) {
    logger.error('[Templates Analytics API] POST Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to track usage'
    }, { status: 500 });
  }
}
