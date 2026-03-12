/**
 * Template Usage Analytics
 * 
 * Tracks template usage, performance, and ROI:
 * - Template usage counts
 * - Render times
 * - Error rates
 * - ROI calculations
 * - Cost savings
 * 
 * @version 1.0.0
 * @author AgentFlow Pro Team
 */

import { prisma } from '@/database/schema';

// ============================================================================
// TYPES
// ============================================================================

export interface TemplateUsage {
  templateId: string;
  system: string;
  count: number;
  lastUsed: Date;
  avgRenderTime: number;
  errorRate: number;
}

export interface TemplateROI {
  system: string;
  timeSavedHours: number;
  costSavings: number;
  valueGenerated: number;
}

export interface TemplateAnalytics {
  totalUsage: number;
  bySystem: Record<string, number>;
  topTemplates: TemplateUsage[];
  performance: {
    avgRenderTime: number;
    errorRate: number;
  };
  roi: {
    totalValue: number;
    bySystem: TemplateROI[];
  };
}

// ============================================================================
// USAGE TRACKING
// ============================================================================

/**
 * Track template usage
 */
export async function trackTemplateUsage(
  templateId: string,
  system: string,
  renderTimeMs: number,
  success: boolean
) {
  await prisma.templateUsage.upsert({
    where: {
      templateId_system: {
        templateId,
        system
      }
    },
    update: {
      count: { increment: 1 },
      lastUsed: new Date(),
      totalRenderTime: { increment: renderTimeMs },
      errorCount: { increment: success ? 0 : 1 }
    },
    create: {
      templateId,
      system,
      count: 1,
      lastUsed: new Date(),
      totalRenderTime: renderTimeMs,
      errorCount: success ? 0 : 1
    }
  });
}

/**
 * Get template usage statistics
 */
export async function getTemplateUsage(templateId: string, system: string): Promise<TemplateUsage | null> {
  const usage = await prisma.templateUsage.findUnique({
    where: {
      templateId_system: {
        templateId,
        system
      }
    }
  });

  if (!usage) return null;

  return {
    templateId: usage.templateId,
    system: usage.system,
    count: usage.count,
    lastUsed: usage.lastUsed,
    avgRenderTime: usage.totalRenderTime / usage.count,
    errorRate: usage.errorCount / usage.count
  };
}

/**
 * Get all template usage
 */
export async function getAllTemplateUsage(): Promise<TemplateAnalytics> {
  const allUsage = await prisma.templateUsage.findMany();

  // Group by system
  const bySystem: Record<string, number> = {};
  allUsage.forEach(usage => {
    bySystem[usage.system] = (bySystem[usage.system] || 0) + usage.count;
  });

  // Calculate top templates
  const topTemplates = allUsage
    .map(usage => ({
      templateId: usage.templateId,
      system: usage.system,
      count: usage.count,
      lastUsed: usage.lastUsed,
      avgRenderTime: usage.totalRenderTime / usage.count,
      errorRate: usage.errorCount / usage.count
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Calculate performance
  const totalUsage = allUsage.reduce((sum, u) => sum + u.count, 0);
  const totalErrors = allUsage.reduce((sum, u) => sum + u.errorCount, 0);
  const totalRenderTime = allUsage.reduce((sum, u) => sum + u.totalRenderTime, 0);

  // Calculate ROI
  const roi = calculateROI(bySystem);

  return {
    totalUsage,
    bySystem,
    topTemplates,
    performance: {
      avgRenderTime: totalRenderTime / totalUsage,
      errorRate: totalErrors / totalUsage
    },
    roi
  };
}

// ============================================================================
// ROI CALCULATION
// ============================================================================

/**
 * Calculate ROI for template systems
 */
function calculateROI(bySystem: Record<string, number>): {
  totalValue: number;
  bySystem: TemplateROI[];
} {
  // Hourly rate assumption: €50/hour
  const HOURLY_RATE = 50;

  // Time saved per template use (in minutes)
  const TIME_SAVED: Record<string, number> = {
    email: 5,
    workflow: 15,
    ai_prompt: 10,
    sms: 2,
    notification: 1,
    report: 30,
    document: 20,
    dashboard: 5
  };

  const bySystemROI: TemplateROI[] = Object.entries(bySystem).map(([system, count]) => {
    const timeSavedMinutes = count * (TIME_SAVED[system] || 5);
    const timeSavedHours = timeSavedMinutes / 60;
    const costSavings = timeSavedHours * HOURLY_RATE;
    const valueGenerated = costSavings * 2; // Assume 2x value from improved quality

    return {
      system,
      timeSavedHours,
      costSavings,
      valueGenerated
    };
  });

  const totalValue = bySystemROI.reduce((sum, r) => sum + r.valueGenerated, 0);

  return {
    totalValue,
    bySystem: bySystemROI
  };
}

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

/**
 * Get template performance metrics
 */
export async function getTemplatePerformance(system?: string) {
  const query = system
    ? { where: { system } }
    : {};

  const usage = await prisma.templateUsage.findMany(query);

  const totalUsage = usage.reduce((sum, u) => sum + u.count, 0);
  const totalErrors = usage.reduce((sum, u) => sum + u.errorCount, 0);
  const totalRenderTime = usage.reduce((sum, u) => sum + u.totalRenderTime, 0);

  return {
    totalUsage,
    avgRenderTime: totalRenderTime / totalUsage,
    errorRate: totalErrors / totalUsage,
    byTemplate: usage.map(u => ({
      templateId: u.templateId,
      system: u.system,
      avgRenderTime: u.totalRenderTime / u.count,
      errorRate: u.errorCount / u.count,
      usage: u.count
    }))
  };
}

// ============================================================================
// ALERTS
// ============================================================================

/**
 * Check for high error rates
 */
export async function checkHighErrorRates(threshold = 0.05) {
  const usage = await prisma.templateUsage.findMany();

  const highErrorTemplates = usage.filter(u => {
    const errorRate = u.errorCount / u.count;
    return errorRate > threshold;
  });

  if (highErrorTemplates.length > 0) {
    console.warn('⚠️ High error rates detected:', highErrorTemplates);
    
    // Send alert
    await sendErrorAlert(highErrorTemplates);
  }

  return highErrorTemplates;
}

/**
 * Send error alert
 */
async function sendErrorAlert(templates: any[]) {
  // Integrate with your alerting system (Slack, email, etc.)
  // Note: Alert service not implemented yet - logging to console
  console.error('[Template Analytics] High error rates detected:', templates);
  
  // TODO: Implement alert service integration
  // const alertService = await import('@/lib/alert-service');
  // await alertService.sendAlert({
  //   type: 'template_error',
  //   priority: 'high',
  //   title: 'High Template Error Rates',
  //   message: `${templates.length} templates have error rates above threshold`,
  //   data: templates
  // });
}

// ============================================================================
// DASHBOARD DATA
// ============================================================================

/**
 * Get dashboard data for template analytics
 */
export async function getTemplateDashboardData() {
  const [usage, performance, roi] = await Promise.all([
    getAllTemplateUsage(),
    getTemplatePerformance(),
    calculateROI({}) // Will be calculated from usage
  ]);

  return {
    usage,
    performance,
    roi,
    lastUpdated: new Date()
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  trackTemplateUsage,
  getTemplateUsage,
  getAllTemplateUsage,
  getTemplatePerformance,
  checkHighErrorRates,
  getTemplateDashboardData
};
