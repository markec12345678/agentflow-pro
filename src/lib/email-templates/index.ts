/**
 * Email Templates Index
 * 
 * Central export for all email templates
 * Includes guest templates, notification templates, and marketing templates
 * 
 * @version 1.0.0
 * @author AgentFlow Pro Team
 */

// ============================================================================
// MAIN EXPORTS
// ============================================================================

export {
  EMAIL_TEMPLATES,
  renderEmailTemplate,
  TEMPLATE_IDS,
  getTemplatesByCategory,
  getTemplateById,
  type EmailTemplate
} from './guest-templates';

// Export TEMPLATE_IDS separately for tests
export { TEMPLATE_IDS as GUEST_TEMPLATE_IDS } from './guest-templates';

// Future template exports (create these files when needed)
// export { NOTIFICATION_TEMPLATES } from './notification-templates';
// export { MARKETING_TEMPLATES } from './marketing-templates';

// ============================================================================
// TEMPLATE CATEGORIES
// ============================================================================

/**
 * Template categories for organized access
 * Use these to group templates by guest journey stage
 */
export const TEMPLATE_CATEGORIES = {
  PRE_ARRIVAL: ['welcome', 'pre_arrival', 'payment_confirmation'] as const,
  DURING_STAY: ['concierge', 'upsell', 'maintenance'] as const,
  POST_STAY: ['post_stay', 'review_request', 'return_offer'] as const,
  BOOKING: ['booking_confirmation', 'cancellation', 'modification'] as const,
  PAYMENT: ['payment_confirmation', 'payment_reminder', 'refund'] as const,
} as const;

// ============================================================================
// DEFAULT TEMPLATES
// ============================================================================

/**
 * Default template for each category
 * Use these as fallbacks when no specific template is selected
 */
export const DEFAULT_TEMPLATES = {
  booking: 'welcome',
  pre_arrival: 'pre_arrival',
  post_stay: 'post_stay',
  payment: 'payment_confirmation',
} as const;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type TemplateCategory = keyof typeof TEMPLATE_CATEGORIES;
export type DefaultTemplateKey = keyof typeof DEFAULT_TEMPLATES;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get template category by template ID
 * 
 * @param templateId - Template ID to lookup
 * @returns Category name or undefined if not found
 * 
 * @example
 * const category = getTemplateCategory('welcome');
 * // Returns: 'PRE_ARRIVAL'
 */
export function getTemplateCategory(templateId: string): TemplateCategory | undefined {
  for (const [category, templates] of Object.entries(TEMPLATE_CATEGORIES)) {
    if (templates.includes(templateId as any)) {
      return category as TemplateCategory;
    }
  }
  return undefined;
}

/**
 * Get default template for category
 * 
 * @param category - Template category
 * @returns Default template ID
 * 
 * @example
 * const defaultTemplate = getDefaultTemplate('booking');
 * // Returns: 'welcome'
 */
export function getDefaultTemplate(category: string): string {
  const key = category.toLowerCase().replace(/-/g, '_') as DefaultTemplateKey;
  return DEFAULT_TEMPLATES[key] || 'welcome';
}

/**
 * Get all templates in category
 * 
 * @param category - Category name
 * @returns Array of template IDs
 * 
 * @example
 * const templates = getTemplatesInCategory('PRE_ARRIVAL');
 * // Returns: ['welcome', 'pre_arrival', 'payment_confirmation']
 */
export function getTemplatesInCategory(category: TemplateCategory): readonly string[] {
  return TEMPLATE_CATEGORIES[category];
}

/**
 * Check if template exists
 * 
 * @param templateId - Template ID to check
 * @returns True if template exists
 * 
 * @example
 * const exists = templateExists('welcome');
 * // Returns: true
 */
export function templateExists(templateId: string): boolean {
  return TEMPLATE_IDS.includes(templateId);
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * All available template IDs
 */
export const ALL_TEMPLATE_IDS = [
  ...TEMPLATE_IDS,
  // Add future template IDs here
  // ...NOTIFICATION_TEMPLATE_IDS,
  // ...MARKETING_TEMPLATE_IDS,
] as const;

/**
 * Template metadata
 */
export const TEMPLATE_METADATA = {
  version: '1.0.0',
  lastUpdated: '2026-03-09',
  totalTemplates: TEMPLATE_IDS.length,
  supportedLanguages: ['sl', 'en', 'de', 'it'],
  defaultLanguage: 'sl',
} as const;

// ============================================================================
// EXPORTS
// ============================================================================

export type { EmailTemplate as GuestEmailTemplate } from './guest-templates';

export default {
  EMAIL_TEMPLATES,
  TEMPLATE_CATEGORIES,
  DEFAULT_TEMPLATES,
  TEMPLATE_METADATA,
  renderEmailTemplate,
  getTemplateCategory,
  getDefaultTemplate,
  getTemplatesInCategory,
  templateExists,
};
