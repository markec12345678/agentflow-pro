/**
 * Workflow Templates for Tourism Automation
 * 
 * Pre-built workflow templates for common tourism automation scenarios:
 * - Guest communication automation
 * - Operations automation
 * - Revenue management
 * - Compliance automation
 * 
 * Each template includes:
 * - Trigger configuration (scheduled, event, webhook)
 * - Action sequences
 * - Conditions and filters
 * - Estimated time savings
 * 
 * @version 1.0.0
 * @author AgentFlow Pro Team
 */

import type { Workflow, WorkflowAction, WorkflowTrigger } from '@prisma/client';
import { logger } from '@/infrastructure/observability/logger';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'guest-communication' | 'operations' | 'revenue' | 'compliance';
  trigger: {
    type: 'scheduled' | 'event' | 'webhook';
    schedule?: string; // Cron expression
    event?: string;
    condition?: string;
  };
  actions: Array<{
    type: string;
    config: Record<string, any>;
  }>;
  estimatedTimeSaved: string;
  difficulty: 'easy' | 'medium' | 'hard';
  variables?: string[];
}

// ============================================================================
// WORKFLOW TEMPLATES
// ============================================================================

export const WORKFLOW_TEMPLATES: Record<string, WorkflowTemplate> = {
  // ============================================================================
  // 1. AUTO CHECK-IN REMINDER
  // ============================================================================
  auto_checkin_reminder: {
    id: 'auto_checkin_reminder',
    name: 'Avtomatski Check-in Opomnik',
    description: 'Pošlji opomnik 1 dan pred check-in z navodili',
    category: 'guest-communication',
    trigger: {
      type: 'scheduled',
      schedule: '0 10 * * *', // Vsak dan ob 10:00
      condition: 'reservation.checkIn_tomorrow AND reservation.status == "confirmed"',
    },
    actions: [
      {
        type: 'send_email',
        config: {
          template: 'pre_arrival',
          to: '{{guest.email}}',
          subject: 'Vaš obisk v {{property.name}} je jutri! 🏨',
        },
      },
      {
        type: 'send_sms',
        config: {
          message: 'Pozdravljeni {{guest.name}}! Jutri vas pričakujemo v {{property.name}}. Check-in od 14:00. Hvala!',
          to: '{{guest.phone}}',
        },
      },
      {
        type: 'create_task',
        config: {
          assignee: 'receptor',
          task: 'Pripravi sobo {{reservation.roomNumber}} za {{guest.name}}',
          dueDate: '{{reservation.checkIn}} - 2 hours',
          priority: 'medium',
        },
      },
    ],
    estimatedTimeSaved: '15 min na rezervacijo',
    difficulty: 'easy',
    variables: ['guest.email', 'guest.name', 'guest.phone', 'property.name', 'reservation.roomNumber', 'reservation.checkIn'],
  },

  // ============================================================================
  // 2. AUTO REVIEW REQUEST
  // ============================================================================
  auto_review_request: {
    id: 'auto_review_request',
    name: 'Avtomatska Prošnja Za Review',
    description: 'Pošlji prošnjo za review 1 dan po check-out',
    category: 'guest-communication',
    trigger: {
      type: 'scheduled',
      schedule: '0 11 * * *', // Vsak dan ob 11:00
      condition: 'reservation.checkout_yesterday AND reservation.status == "checked_out"',
    },
    actions: [
      {
        type: 'send_email',
        config: {
          template: 'post_stay',
          to: '{{guest.email}}',
          subject: 'Hvala za vaš obisk v {{property.name}}! ⭐',
        },
      },
      {
        type: 'send_whatsapp',
        config: {
          message: 'Hvala za obisk! Prosim pustite mnenje: {{reviewLink}}',
          to: '{{guest.phone}}',
        },
      },
      {
        type: 'update_guest_profile',
        config: {
          guestId: '{{guest.id}}',
          data: {
            lastReviewRequestSent: '{{now}}',
          },
        },
      },
    ],
    estimatedTimeSaved: '10 min na gost',
    difficulty: 'easy',
    variables: ['guest.email', 'guest.phone', 'guest.id', 'property.name', 'reviewLink'],
  },

  // ============================================================================
  // 3. LOW OCCUPANCY ALERT
  // ============================================================================
  low_occupancy_alert: {
    id: 'low_occupancy_alert',
    name: 'Alert Za Nizko Zasedenost',
    description: 'Obvesti direktorja če je zasedenost <30% v naslednjih 7 dneh',
    category: 'revenue',
    trigger: {
      type: 'scheduled',
      schedule: '0 8 * * *', // Vsak dan ob 8:00
      condition: 'occupancy.next_7_days < 30',
    },
    actions: [
      {
        type: 'send_notification',
        config: {
          to: 'director',
          priority: 'high',
          message: '⚠️ Zasedenost je samo {{occupancy.next_7_days}}% v naslednjih 7 dneh. Razmislite o promociji!',
        },
      },
      {
        type: 'send_email',
        config: {
          to: '{{director.email}}',
          subject: '⚠️ Nizka zasedenost - {{property.name}}',
          body: `
            <p>Zasedenost v naslednjih 7 dneh: <strong>{{occupancy.next_7_days}}%</strong></p>
            <p>Proste sobe: {{rooms.available}}</p>
            <p>Priporočilo: Aktivirajte last-minute promocijo.</p>
          `,
        },
      },
      {
        type: 'create_workflow',
        config: {
          workflowId: 'last_minute_promotion',
          data: {
            discount: 15,
            days: 7,
          },
        },
      },
    ],
    estimatedTimeSaved: '30 min dnevno',
    difficulty: 'medium',
    variables: ['occupancy.next_7_days', 'rooms.available', 'director.email', 'property.name'],
  },

  // ============================================================================
  // 4. VIP GUEST ALERT
  // ============================================================================
  vip_guest_alert: {
    id: 'vip_guest_alert',
    name: 'VIP Gost Alert',
    description: 'Obvesti osebje ko pride VIP gost (Gold/Platinum loyalty)',
    category: 'operations',
    trigger: {
      type: 'event',
      event: 'reservation.created',
      condition: 'guest.loyaltyTier == "gold" OR guest.loyaltyTier == "platinum"',
    },
    actions: [
      {
        type: 'send_notification',
        config: {
          to: 'receptor',
          priority: 'high',
          message: '⭐ VIP gost: {{guest.name}} ({{guest.loyaltyTier}}). Pripravi posebno dobrodošlico!',
        },
      },
      {
        type: 'send_notification',
        config: {
          to: 'housekeeping',
          priority: 'medium',
          message: '🧹 VIP soba: {{reservation.roomNumber}} za {{guest.name}}',
        },
      },
      {
        type: 'create_task',
        config: {
          assignee: 'receptor',
          task: 'Pripravi VIP welcome paket za {{guest.name}}',
          dueDate: '{{reservation.checkIn}}',
          priority: 'high',
        },
      },
      {
        type: 'create_task',
        config: {
          assignee: 'housekeeping',
          task: 'Posebno čiščenje VIP sobe {{reservation.roomNumber}}',
          dueDate: '{{reservation.checkIn}} - 1 hour',
          priority: 'high',
        },
      },
    ],
    estimatedTimeSaved: '20 min na VIP gosta',
    difficulty: 'easy',
    variables: ['guest.name', 'guest.loyaltyTier', 'reservation.roomNumber', 'reservation.checkIn'],
  },

  // ============================================================================
  // 5. PAYMENT REMINDER
  // ============================================================================
  payment_reminder: {
    id: 'payment_reminder',
    name: 'Opomnik Za Plačilo',
    description: 'Opomnik za neporavnana plačila 7 dni pred check-in',
    category: 'revenue',
    trigger: {
      type: 'scheduled',
      schedule: '0 9 * * *', // Vsak dan ob 9:00
      condition: 'reservation.paymentStatus == "pending" AND reservation.daysUntilCheckIn == 7',
    },
    actions: [
      {
        type: 'send_email',
        config: {
          template: 'payment_reminder',
          to: '{{guest.email}}',
          subject: 'Opomnik: Plačilo za rezervacijo {{reservation.id}}',
        },
      },
      {
        type: 'send_sms',
        config: {
          message: 'Opomnik: Plačilo za rezervacijo {{reservation.id}} še ni prejeto. Hvala! {{paymentLink}}',
          to: '{{guest.phone}}',
        },
      },
      {
        type: 'update_reservation',
        config: {
          reservationId: '{{reservation.id}}',
          data: {
            paymentReminderSent: true,
            paymentReminderSentAt: '{{now}}',
          },
        },
      },
    ],
    estimatedTimeSaved: '15 min na rezervacijo',
    difficulty: 'easy',
    variables: ['guest.email', 'guest.phone', 'reservation.id', 'paymentLink'],
  },

  // ============================================================================
  // 6. ETURIZEM AUTO-SYNC
  // ============================================================================
  eturizem_auto_sync: {
    id: 'eturizem_auto_sync',
    name: 'Avtomatska eTurizem Sinhronizacija',
    description: 'Sinhroniziraj vse rezervacije z eTurizem vsako uro',
    category: 'compliance',
    trigger: {
      type: 'scheduled',
      schedule: '0 * * * *', // Vsako uro
      condition: 'property.eturizemEnabled == true',
    },
    actions: [
      {
        type: 'sync_eturizem',
        config: {
          propertyId: '{{property.id}}',
          syncType: 'full',
        },
      },
      {
        type: 'log_activity',
        config: {
          action: 'eturizem_sync',
          propertyId: '{{property.id}}',
          status: 'success',
        },
      },
      {
        type: 'send_notification',
        config: {
          to: 'admin',
          priority: 'low',
          message: '✅ eTurizem sync uspešen za {{property.name}}',
          onlyOnError: true,
        },
      },
    ],
    estimatedTimeSaved: '1 ura tedensko',
    difficulty: 'medium',
    variables: ['property.id', 'property.name'],
  },

  // ============================================================================
  // 7. HOUSEKEEPING TASK ASSIGNMENT
  // ============================================================================
  housekeeping_task_assignment: {
    id: 'housekeeping_task_assignment',
    name: 'Avtomatska Dodelitev Housekeeping Taskov',
    description: 'Dodeli housekeeping taske po check-outu',
    category: 'operations',
    trigger: {
      type: 'event',
      event: 'reservation.checked_out',
      condition: 'true',
    },
    actions: [
      {
        type: 'update_room_status',
        config: {
          roomId: '{{reservation.roomId}}',
          status: 'dirty',
        },
      },
      {
        type: 'create_task',
        config: {
          assignee: 'housekeeping',
          task: 'Čiščenje sobe {{reservation.roomNumber}}',
          dueDate: '{{now}} + 2 hours',
          priority: 'medium',
          roomId: '{{reservation.roomId}}',
        },
      },
      {
        type: 'send_notification',
        config: {
          to: 'housekeeping',
          priority: 'medium',
          message: '🧹 Nova soba za čiščenje: {{reservation.roomNumber}}',
        },
      },
    ],
    estimatedTimeSaved: '10 min na check-out',
    difficulty: 'easy',
    variables: ['reservation.roomId', 'reservation.roomNumber'],
  },

  // ============================================================================
  // 8. DYNAMIC PRICE ADJUSTMENT
  // ============================================================================
  dynamic_price_adjustment: {
    id: 'dynamic_price_adjustment',
    name: 'Dinamično Prilagajanje Cen',
    description: 'Prilagodi cene glede na povpraševanje in konkurenco',
    category: 'revenue',
    trigger: {
      type: 'scheduled',
      schedule: '0 6 * * *', // Vsak dan ob 6:00
      condition: 'property.dynamicPricingEnabled == true',
    },
    actions: [
      {
        type: 'analyze_demand',
        config: {
          propertyId: '{{property.id}}',
          daysAhead: 30,
        },
      },
      {
        type: 'check_competitor_prices',
        config: {
          propertyId: '{{property.id}}',
          competitors: '{{property.competitors}}',
        },
      },
      {
        type: 'adjust_prices',
        config: {
          propertyId: '{{property.id}}',
          strategy: 'demand_based',
          maxChange: 15, // Max 15% change
        },
      },
      {
        type: 'sync_channels',
        config: {
          propertyId: '{{property.id}}',
          channels: ['booking.com', 'airbnb', 'eturizem'],
        },
      },
    ],
    estimatedTimeSaved: '2 uri tedensko',
    difficulty: 'hard',
    variables: ['property.id', 'property.competitors'],
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create workflow from template
 * 
 * @param templateId - Template ID from WORKFLOW_TEMPLATES
 * @param propertyId - Property ID to associate workflow with
 * @param userId - User ID (workflow owner)
 * @returns Created workflow
 * 
 * @example
 * const workflow = await createWorkflowFromTemplate('auto_checkin_reminder', 'prop-123', 'user-456');
 */
export async function createWorkflowFromTemplate(
  templateId: string,
  propertyId: string,
  userId: string
): Promise<Workflow> {
  const template = WORKFLOW_TEMPLATES[templateId];

  if (!template) {
    throw new Error(`Template ${templateId} not found`);
  }

  // Import Prisma client
  const { prisma } = await import('@/database/schema');

  const workflow = await prisma.workflow.create({
    data: {
      name: template.name,
      description: template.description,
      category: template.category,
      trigger: template.trigger as any,
      actions: template.actions as any,
      propertyId,
      userId,
      isActive: true,
      estimatedTimeSaved: template.estimatedTimeSaved,
      difficulty: template.difficulty,
    },
  });

  logger.info(`✅ Workflow created from template: ${templateId}`);
  return workflow;
}

/**
 * Get all template IDs
 */
export const WORKFLOW_TEMPLATE_IDS = Object.keys(WORKFLOW_TEMPLATES);

/**
 * Get templates by category
 * 
 * @param category - Template category
 * @returns Array of templates in category
 * 
 * @example
 * const guestCommTemplates = getTemplatesByCategory('guest-communication');
 */
export function getTemplatesByCategory(category: WorkflowTemplate['category']): WorkflowTemplate[] {
  return Object.values(WORKFLOW_TEMPLATES).filter(
    (template) => template.category === category
  );
}

/**
 * Get template by ID
 * 
 * @param templateId - Template ID
 * @returns Template or undefined
 * 
 * @example
 * const template = getTemplateById('vip_guest_alert');
 */
export function getTemplateById(templateId: string): WorkflowTemplate | undefined {
  return WORKFLOW_TEMPLATES[templateId];
}

/**
 * Check if template exists
 * 
 * @param templateId - Template ID
 * @returns True if template exists
 */
export function templateExists(templateId: string): boolean {
  return templateId in WORKFLOW_TEMPLATES;
}

/**
 * Get workflow variables from template
 * 
 * @param templateId - Template ID
 * @returns Array of variable names
 */
export function getWorkflowVariables(templateId: string): string[] {
  const template = WORKFLOW_TEMPLATES[templateId];
  return template?.variables || [];
}

/**
 * Validate workflow template
 * 
 * @param template - Template to validate
 * @returns True if template is valid
 */
export function validateTemplate(template: Partial<WorkflowTemplate>): boolean {
  if (!template.id || !template.name || !template.trigger || !template.actions) {
    return false;
  }

  if (template.trigger.type === 'scheduled' && !template.trigger.schedule) {
    return false;
  }

  if (template.trigger.type === 'event' && !template.trigger.event) {
    return false;
  }

  if (!template.actions.length) {
    return false;
  }

  return true;
}

// ============================================================================
// EXPORTS
// ============================================================================

export type { WorkflowTemplate };
export default WORKFLOW_TEMPLATES;
