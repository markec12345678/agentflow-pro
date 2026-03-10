/**
 * Template Integration Helpers
 * 
 * Helper functions for integrating templates into existing systems:
 * - Communication Agent integration
 * - Workflow Engine integration
 * - Dashboard integration
 * - Email service integration
 * - SMS service integration
 * - Notification service integration
 * 
 * @version 1.0.0
 * @author AgentFlow Pro Team
 */

import {
  renderEmailTemplate,
  renderMessage,
  renderNotification,
  renderPrompt,
  getDocumentTemplate,
  getReportTemplate,
  createWorkflowFromTemplate,
  createDashboardFromTemplate
} from '@/lib/templates';

// ============================================================================
// COMMUNICATION AGENT INTEGRATION
// ============================================================================

/**
 * Send email using template
 */
export async function sendTemplateEmail(
  templateId: string,
  variables: Record<string, string>,
  to: string,
  options?: {
    cc?: string;
    bcc?: string;
    attachments?: Array<{ filename: string; path: string }>;
  }
) {
  const { subject, body } = renderEmailTemplate(templateId, variables);

  // Integrate with your email service (SendGrid, Resend, etc.)
  const emailService = await import('@/lib/email-service');
  
  return await emailService.sendEmail({
    to,
    subject,
    html: body,
    ...options
  });
}

/**
 * Send SMS using template
 */
export async function sendTemplateSMS(
  templateId: string,
  variables: Record<string, string>,
  to: string
) {
  const message = renderMessage(templateId, variables);

  // Integrate with SMS service (Twilio, etc.)
  const smsService = await import('@/lib/sms-service');
  
  return await smsService.sendSMS({
    to,
    message
  });
}

/**
 * Send WhatsApp using template
 */
export async function sendTemplateWhatsApp(
  templateId: string,
  variables: Record<string, string>,
  to: string
) {
  const message = renderMessage(templateId, variables);

  // Integrate with WhatsApp service (Twilio, etc.)
  const whatsappService = await import('@/lib/whatsapp-service');
  
  return await whatsappService.sendWhatsApp({
    to,
    message
  });
}

/**
 * Send notification using template
 */
export async function sendTemplateNotification(
  templateId: string,
  variables: Record<string, string>,
  userId: string
) {
  const { title, body } = renderNotification(templateId, variables);

  // Integrate with notification service
  const notificationService = await import('@/lib/notification-service');
  
  return await notificationService.sendNotification({
    userId,
    title,
    body
  });
}

// ============================================================================
// AI AGENT INTEGRATION
// ============================================================================

/**
 * Generate AI content using template
 */
export async function generateAIContent(
  templateId: string,
  variables: Record<string, string>,
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
) {
  const prompt = renderPrompt(templateId, variables);

  // Integrate with AI service (OpenAI, Anthropic, etc.)
  const aiService = await import('@/lib/ai-service');
  
  return await aiService.generate({
    prompt,
    ...options
  });
}

// ============================================================================
// WORKFLOW INTEGRATION
// ============================================================================

/**
 * Create and activate workflow from template
 */
export async function createAndActivateWorkflow(
  templateId: string,
  propertyId: string,
  userId: string,
  options?: {
    isActive?: boolean;
    customName?: string;
    customDescription?: string;
  }
) {
  const workflow = await createWorkflowFromTemplate(
    templateId,
    propertyId,
    userId
  );

  // Activate if requested
  if (options?.isActive) {
    const workflowService = await import('@/lib/workflow-service');
    await workflowService.activateWorkflow(workflow.id);
  }

  return workflow;
}

// ============================================================================
// DASHBOARD INTEGRATION
// ============================================================================

/**
 * Create dashboard from template
 */
export async function createAndConfigureDashboard(
  templateId: string,
  userId: string,
  propertyId?: string,
  options?: {
    isDefault?: boolean;
    customName?: string;
    shareWithTeam?: boolean;
  }
) {
  const dashboard = await createDashboardFromTemplate(
    templateId,
    userId,
    propertyId
  );

  // Configure as default if requested
  if (options?.isDefault) {
    const dashboardService = await import('@/lib/dashboard-service');
    await dashboardService.setDefaultDashboard(userId, dashboard.id);
  }

  // Share with team if requested
  if (options?.shareWithTeam) {
    const dashboardService = await import('@/lib/dashboard-service');
    await dashboardService.shareWithTeam(dashboard.id);
  }

  return dashboard;
}

// ============================================================================
// DOCUMENT GENERATION
// ============================================================================

/**
 * Generate PDF document from template
 */
export async function generateTemplateDocument(
  templateId: string,
  variables: Record<string, string>,
  options?: {
    format?: 'pdf' | 'html';
    save?: boolean;
    send?: boolean;
    recipientEmail?: string;
  }
) {
  const template = getDocumentTemplate(templateId);

  if (!template) {
    throw new Error(`Document template ${templateId} not found`);
  }

  // Render template with variables
  const documentService = await import('@/lib/document-service');
  const document = await documentService.renderTemplate(template, variables);

  // Generate PDF
  if (options?.format === 'pdf') {
    const pdf = await documentService.generatePDF(document);
    
    // Save if requested
    if (options?.save) {
      await documentService.saveDocument(pdf);
    }

    // Send if requested
    if (options?.send && options.recipientEmail) {
      await sendTemplateEmail(
        'document_delivery',
        {
          document_name: template.name,
          ...variables
        },
        options.recipientEmail,
        {
          attachments: [{ filename: `${template.id}.pdf`, path: pdf }]
        }
      );
    }

    return pdf;
  }

  return document;
}

// ============================================================================
// REPORT GENERATION
// ============================================================================

/**
 * Generate report from template
 */
export async function generateTemplateReport(
  templateId: string,
  filters: Record<string, any>,
  options?: {
    format?: 'pdf' | 'excel' | 'html';
    schedule?: boolean;
    scheduleConfig?: {
      frequency: string;
      recipients: string[];
    };
  }
) {
  const template = getReportTemplate(templateId);

  if (!template) {
    throw new Error(`Report template ${templateId} not found`);
  }

  // Generate report data
  const reportService = await import('@/lib/report-service');
  const report = await reportService.generateReport(template, filters);

  // Export in requested format
  if (options?.format) {
    return await reportService.exportReport(report, options.format);
  }

  // Schedule if requested
  if (options?.schedule && options.scheduleConfig) {
    await reportService.scheduleReport(templateId, filters, options.scheduleConfig);
  }

  return report;
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Send batch emails using template
 */
export async function sendBatchTemplateEmails(
  templateId: string,
  recipients: Array<{
    email: string;
    variables: Record<string, string>;
  }>,
  options?: {
    delayBetween?: number; // ms
    batchSize?: number;
  }
) {
  const results = await Promise.allSettled(
    recipients.map(async (recipient, index) => {
      // Add delay if requested
      if (options?.delayBetween) {
        await new Promise(resolve => setTimeout(resolve, options.delayBetween! * index));
      }

      try {
        await sendTemplateEmail(
          templateId,
          recipient.variables,
          recipient.email
        );
        return { success: true, email: recipient.email };
      } catch (error) {
        return {
          success: false,
          email: recipient.email,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    })
  );

  const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
  const failCount = results.length - successCount;

  return {
    total: recipients.length,
    success: successCount,
    failed: failCount,
    results
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  sendTemplateEmail,
  sendTemplateSMS,
  sendTemplateWhatsApp,
  sendTemplateNotification,
  generateAIContent,
  createAndActivateWorkflow,
  createAndConfigureDashboard,
  generateTemplateDocument,
  generateTemplateReport,
  sendBatchTemplateEmails
};
