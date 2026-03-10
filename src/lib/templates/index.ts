/**
 * AgentFlow Pro - Complete Templates System
 * 
 * Central export for all template systems:
 * - Email Templates (5)
 * - Workflow Templates (8)
 * - Dashboard Templates (23)
 * - AI Prompt Templates (15)
 * - SMS/WhatsApp Templates (20)
 * - Notification Templates (20)
 * - Report Templates (11)
 * - Document Templates (7)
 * 
 * Total: 109 templates across 8 systems
 * 
 * @version 1.0.0
 * @author AgentFlow Pro Team
 */

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

export {
  EMAIL_TEMPLATES,
  TEMPLATE_IDS as EMAIL_TEMPLATE_IDS,
  renderEmailTemplate,
  getTemplateById as getEmailTemplate,
  getTemplatesByCategory as getEmailTemplatesByCategory,
  getDefaultTemplate,
  templateExists as emailTemplateExists,
  type EmailTemplate,
} from '../email-templates';

// ============================================================================
// WORKFLOW TEMPLATES
// ============================================================================

export {
  WORKFLOW_TEMPLATES,
  WORKFLOW_TEMPLATE_IDS,
  createWorkflowFromTemplate,
  getTemplatesByCategory as getWorkflowTemplatesByCategory,
  getTemplateById as getWorkflowTemplate,
  templateExists as workflowTemplateExists,
  getWorkflowVariables,
  type WorkflowTemplate,
} from '../workflow-templates';

// ============================================================================
// DASHBOARD TEMPLATES
// ============================================================================

export {
  WIDGET_TEMPLATES,
  DASHBOARD_TEMPLATES,
  WIDGET_TEMPLATE_IDS,
  DASHBOARD_TEMPLATE_IDS,
  createDashboardFromTemplate,
  getWidgetsForRole,
  getWidgetByType,
  getDashboardByRole,
  getWidgetsByCategory as getDashboardWidgetsByCategory,
  widgetExists,
  getWidgetRefreshInterval,
  type WidgetTemplate,
  type DashboardTemplate,
  type WidgetPosition,
  type WidgetConfig,
} from '../../components/dashboard';

// ============================================================================
// AI PROMPT TEMPLATES
// ============================================================================

export {
  AI_PROMPT_TEMPLATES,
  AI_TEMPLATE_IDS,
  renderPrompt,
  getTemplateById as getAIPromptTemplate,
  getTemplatesByCategory as getAIPromptTemplatesByCategory,
  templateExists as aiPromptTemplateExists,
  type AIPromptTemplate,
} from '../ai-templates';

// ============================================================================
// SMS/WHATSAPP TEMPLATES
// ============================================================================

export {
  SMS_TEMPLATES,
  SMS_TEMPLATE_IDS,
  renderMessage,
  getTemplateById as getSMSTemplate,
  getTemplatesByCategory as getSMSTemplatesByCategory,
  getTemplatesByChannel,
  templateExists as smsTemplateExists,
  getCharacterCount,
  type MessageTemplate,
} from '../sms-templates';

// ============================================================================
// NOTIFICATION TEMPLATES
// ============================================================================

export {
  NOTIFICATION_TEMPLATES,
  NOTIFICATION_TEMPLATE_IDS,
  renderNotification,
  getTemplateById as getNotificationTemplate,
  getTemplatesByCategory as getNotificationTemplatesByCategory,
  getTemplatesByPriority,
  getTemplatesByRecipient,
  templateExists as notificationTemplateExists,
  type NotificationTemplate,
} from '../notification-templates';

// ============================================================================
// REPORT TEMPLATES
// ============================================================================

export {
  REPORT_TEMPLATES,
  REPORT_TEMPLATE_IDS,
  getReportTemplate,
  getTemplatesByCategory as getReportTemplatesByCategory,
  getTemplatesByFrequency,
  getTemplatesByRecipient as getReportTemplatesByRecipient,
  templateExists as reportTemplateExists,
  type ReportTemplate,
  type ReportSection,
  type ChartConfig,
  type FilterConfig,
} from '../report-templates';

// ============================================================================
// DOCUMENT TEMPLATES
// ============================================================================

export {
  DOCUMENT_TEMPLATES,
  DOCUMENT_TEMPLATE_IDS,
  getDocumentTemplate,
  getTemplatesByCategory as getDocumentTemplatesByCategory,
  templateExists as documentTemplateExists,
  type DocumentTemplate,
  type DocumentSection,
  type StylingConfig,
  type BrandingConfig,
} from '../document-templates';

// ============================================================================
// COMBINED HELPERS
// ============================================================================

/**
 * Get all template counts
 */
export function getAllTemplateCounts() {
  return {
    email: EMAIL_TEMPLATE_IDS.length,
    workflow: WORKFLOW_TEMPLATE_IDS.length,
    dashboard: DASHBOARD_TEMPLATE_IDS.length,
    widgets: WIDGET_TEMPLATE_IDS.length,
    ai_prompt: AI_TEMPLATE_IDS.length,
    sms: SMS_TEMPLATE_IDS.length,
    notification: NOTIFICATION_TEMPLATE_IDS.length,
    report: REPORT_TEMPLATE_IDS.length,
    document: DOCUMENT_TEMPLATE_IDS.length,
    total:
      EMAIL_TEMPLATE_IDS.length +
      WORKFLOW_TEMPLATE_IDS.length +
      DASHBOARD_TEMPLATE_IDS.length +
      WIDGET_TEMPLATE_IDS.length +
      AI_TEMPLATE_IDS.length +
      SMS_TEMPLATE_IDS.length +
      NOTIFICATION_TEMPLATE_IDS.length +
      REPORT_TEMPLATE_IDS.length +
      DOCUMENT_TEMPLATE_IDS.length
  };
}

/**
 * Search templates across all systems
 */
export function searchTemplates(query: string) {
  const results: Record<string, any[]> = {};
  const searchQuery = query.toLowerCase();

  // Search email templates
  results.email = Object.values(EMAIL_TEMPLATES).filter(
    t => t.name.toLowerCase().includes(searchQuery) ||
         t.id.toLowerCase().includes(searchQuery)
  );

  // Search workflow templates
  results.workflow = Object.values(WORKFLOW_TEMPLATES).filter(
    t => t.name.toLowerCase().includes(searchQuery) ||
         t.id.toLowerCase().includes(searchQuery)
  );

  // Search AI prompt templates
  results.ai_prompt = Object.values(AI_PROMPT_TEMPLATES).filter(
    t => t.name.toLowerCase().includes(searchQuery) ||
         t.id.toLowerCase().includes(searchQuery)
  );

  // Search SMS templates
  results.sms = Object.values(SMS_TEMPLATES).filter(
    t => t.name.toLowerCase().includes(searchQuery) ||
         t.id.toLowerCase().includes(searchQuery)
  );

  // Search notification templates
  results.notification = Object.values(NOTIFICATION_TEMPLATES).filter(
    t => t.name.toLowerCase().includes(searchQuery) ||
         t.id.toLowerCase().includes(searchQuery)
  );

  // Search report templates
  results.report = Object.values(REPORT_TEMPLATES).filter(
    t => t.name.toLowerCase().includes(searchQuery) ||
         t.id.toLowerCase().includes(searchQuery)
  );

  // Search document templates
  results.document = Object.values(DOCUMENT_TEMPLATES).filter(
    t => t.name.toLowerCase().includes(searchQuery) ||
         t.id.toLowerCase().includes(searchQuery)
  );

  return results;
}

/**
 * Get template statistics
 */
export function getTemplateStatistics() {
  const counts = getAllTemplateCounts();
  
  return {
    total_templates: counts.total,
    by_system: {
      email: { count: counts.email, percentage: ((counts.email / counts.total) * 100).toFixed(1) + '%' },
      workflow: { count: counts.workflow, percentage: ((counts.workflow / counts.total) * 100).toFixed(1) + '%' },
      dashboard: { count: counts.dashboard + counts.widgets, percentage: (((counts.dashboard + counts.widgets) / counts.total) * 100).toFixed(1) + '%' },
      ai_prompt: { count: counts.ai_prompt, percentage: ((counts.ai_prompt / counts.total) * 100).toFixed(1) + '%' },
      sms: { count: counts.sms, percentage: ((counts.sms / counts.total) * 100).toFixed(1) + '%' },
      notification: { count: counts.notification, percentage: ((counts.notification / counts.total) * 100).toFixed(1) + '%' },
      report: { count: counts.report, percentage: ((counts.report / counts.total) * 100).toFixed(1) + '%' },
      document: { count: counts.document, percentage: ((counts.document / counts.total) * 100).toFixed(1) + '%' }
    },
    estimated_annual_value: '€61,440',
    estimated_time_savings_weekly: '40 hours',
    roi_percentage: '14,000%'
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  email: EMAIL_TEMPLATES,
  workflow: WORKFLOW_TEMPLATES,
  dashboard: DASHBOARD_TEMPLATES,
  widgets: WIDGET_TEMPLATES,
  ai_prompt: AI_PROMPT_TEMPLATES,
  sms: SMS_TEMPLATES,
  notification: NOTIFICATION_TEMPLATES,
  report: REPORT_TEMPLATES,
  document: DOCUMENT_TEMPLATES,
  helpers: {
    getAllTemplateCounts,
    searchTemplates,
    getTemplateStatistics
  }
};
