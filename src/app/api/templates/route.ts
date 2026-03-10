/**
 * Templates API
 * 
 * GET /api/templates - List all templates
 * GET /api/templates?system=email - List templates by system
 * GET /api/templates/search?q=welcome - Search templates
 * GET /api/templates/stats - Get template statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getAllTemplateCounts,
  searchTemplates,
  getTemplateStatistics,
  EMAIL_TEMPLATES,
  WORKFLOW_TEMPLATES,
  AI_PROMPT_TEMPLATES,
  SMS_TEMPLATES,
  NOTIFICATION_TEMPLATES,
  REPORT_TEMPLATES,
  DOCUMENT_TEMPLATES,
  WIDGET_TEMPLATES,
  DASHBOARD_TEMPLATES
} from '@/lib/templates';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const system = searchParams.get('system');
    const search = searchParams.get('q');
    const stats = searchParams.get('stats');

    // Get statistics
    if (stats === 'true') {
      return NextResponse.json({
        success: true,
        data: getTemplateStatistics()
      });
    }

    // Search templates
    if (search) {
      const results = searchTemplates(search);
      return NextResponse.json({
        success: true,
        data: results,
        query: search
      });
    }

    // Get specific system
    if (system) {
      let templates: any = {};
      
      switch (system) {
        case 'email':
          templates = EMAIL_TEMPLATES;
          break;
        case 'workflow':
          templates = WORKFLOW_TEMPLATES;
          break;
        case 'ai_prompt':
          templates = AI_PROMPT_TEMPLATES;
          break;
        case 'sms':
          templates = SMS_TEMPLATES;
          break;
        case 'notification':
          templates = NOTIFICATION_TEMPLATES;
          break;
        case 'report':
          templates = REPORT_TEMPLATES;
          break;
        case 'document':
          templates = DOCUMENT_TEMPLATES;
          break;
        case 'dashboard':
          templates = DASHBOARD_TEMPLATES;
          break;
        case 'widgets':
          templates = WIDGET_TEMPLATES;
          break;
        default:
          return NextResponse.json({
            success: false,
            error: 'Invalid system. Valid options: email, workflow, ai_prompt, sms, notification, report, document, dashboard, widgets'
          }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        data: templates,
        system,
        count: Object.keys(templates).length
      });
    }

    // Get all template counts
    const counts = getAllTemplateCounts();

    return NextResponse.json({
      success: true,
      data: {
        counts,
        systems: ['email', 'workflow', 'ai_prompt', 'sms', 'notification', 'report', 'document', 'dashboard', 'widgets']
      }
    });
  } catch (error) {
    console.error('[Templates API] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch templates'
    }, { status: 500 });
  }
}
