/**
 * SMS/WhatsApp Message Templates
 * 
 * Pre-built message templates for SMS and WhatsApp communication:
 * - Pre-arrival messages
 * - During-stay messages
 * - Post-stay messages
 * - Operational messages
 * - Emergency messages
 * 
 * Each template includes:
 * - Message body with variables
 * - Character count
 * - Estimated cost
 * - Recommended channel (SMS/WhatsApp)
 * - Timing recommendations
 * 
 * @version 1.0.0
 * @author AgentFlow Pro Team
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface MessageTemplate {
  id: string;
  name: string;
  body: string;
  variables: string[];
  category: 'pre-arrival' | 'during-stay' | 'post-stay' | 'operational' | 'emergency';
  channel: 'sms' | 'whatsapp' | 'both';
  characters: number;
  estimatedCost?: string;
  timing?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

// ============================================================================
// SMS/WHATSAPP TEMPLATES
// ============================================================================

export const SMS_TEMPLATES: Record<string, MessageTemplate> = {
  // ============================================================================
  // PRE-ARRIVAL MESSAGES
  // ============================================================================

  booking_confirmation: {
    id: 'booking_confirmation',
    name: 'Potrdilo Rezervacije',
    body: 'Potrjujemo vašo rezervacijo v {{property_name}}. Check-in: {{check_in_date}} ob 14:00. Hvala!',
    variables: ['property_name', 'check_in_date'],
    category: 'pre-arrival',
    channel: 'both',
    characters: 95,
    estimatedCost: '€0.05',
    timing: 'Immediately after booking',
    priority: 'high'
  },

  checkin_reminder: {
    id: 'checkin_reminder',
    name: 'Opomnik Za Check-in',
    body: 'Pozdravljeni {{guest_name}}! Danes vas pričakujemo v {{property_name}} ob 14:00. Veselimo se vašega obiska!',
    variables: ['guest_name', 'property_name'],
    category: 'pre-arrival',
    channel: 'both',
    characters: 110,
    estimatedCost: '€0.05',
    timing: 'Day of arrival, 9:00 AM',
    priority: 'high'
  },

  checkin_instructions: {
    id: 'checkin_instructions',
    name: 'Navodila Za Check-in',
    body: '{{property_name}}: Check-in na {{address}}. Koda za vrata: {{door_code}}. WiFi: {{wifi_password}}. Lep pozdrav!',
    variables: ['property_name', 'address', 'door_code', 'wifi_password'],
    category: 'pre-arrival',
    channel: 'whatsapp',
    characters: 120,
    estimatedCost: '€0.05',
    timing: '1 hour before arrival',
    priority: 'medium'
  },

  early_checkin_available: {
    id: 'early_checkin_available',
    name: 'Zgodnji Check-in Na Voljo',
    body: 'Dobra novost! Zgodnji check-in je možen od {{time}}. Veselimo se vašega prihoda! {{property_name}}',
    variables: ['property_name', 'time'],
    category: 'pre-arrival',
    channel: 'both',
    characters: 105,
    estimatedCost: '€0.05',
    timing: 'When early check-in becomes available',
    priority: 'low'
  },

  // ============================================================================
  // DURING-STAY MESSAGES
  // ============================================================================

  wifi_password: {
    id: 'wifi_password',
    name: 'WiFi Geslo',
    body: 'WiFi geslo za {{property_name}}: {{wifi_password}}. Omrežje: {{wifi_network}}. Lep pozdrav!',
    variables: ['property_name', 'wifi_password', 'wifi_network'],
    category: 'during-stay',
    channel: 'both',
    characters: 95,
    estimatedCost: '€0.05',
    timing: 'On request or at check-in',
    priority: 'medium'
  },

  breakfast_reminder: {
    id: 'breakfast_reminder',
    name: 'Opomnik Za Zajtrk',
    body: 'Dober tek! Zajtrk je na voljo od {{start_time}} do {{end_time}} v {{location}}. {{property_name}}',
    variables: ['property_name', 'start_time', 'end_time', 'location'],
    category: 'during-stay',
    channel: 'both',
    characters: 105,
    estimatedCost: '€0.05',
    timing: 'Day before, 8:00 PM',
    priority: 'low'
  },

  housekeeping_notification: {
    id: 'housekeeping_notification',
    name: 'Obvestilo O Čiščenju',
    body: 'Obveščamo vas, da bo čiščenje sobe {{room_number}} danes ob {{time}}. Hvala za razumevanje. {{property_name}}',
    variables: ['room_number', 'time', 'property_name'],
    category: 'during-stay',
    channel: 'both',
    characters: 120,
    estimatedCost: '€0.05',
    timing: 'Morning of cleaning day',
    priority: 'medium'
  },

  maintenance_followup: {
    id: 'maintenance_followup',
    name: 'Follow-up Vzdrževanja',
    body: 'Spoštovani, ali je bilo težava v sobi {{room_number}} odpravljena? Prosimo za povratno informacijo. {{property_name}}',
    variables: ['room_number', 'property_name'],
    category: 'during-stay',
    channel: 'both',
    characters: 125,
    estimatedCost: '€0.05',
    timing: 'After maintenance completed',
    priority: 'medium'
  },

  // ============================================================================
  // POST-STAY MESSAGES
  // ============================================================================

  checkout_reminder: {
    id: 'checkout_reminder',
    name: 'Opomnik Za Check-out',
    body: 'Opomnik: Check-out je danes do {{checkout_time}}. Hvala za obisk v {{property_name}}. Lep pozdrav!',
    variables: ['checkout_time', 'property_name'],
    category: 'post-stay',
    channel: 'both',
    characters: 100,
    estimatedCost: '€0.05',
    timing: 'Day of departure, 9:00 AM',
    priority: 'high'
  },

  thank_you: {
    id: 'thank_you',
    name: 'Hvala Za Obisk',
    body: 'Hvala za vaš obisk v {{property_name}}! Upamo, da ste uživali. Veselimo se ponovnega snidenja!',
    variables: ['property_name'],
    category: 'post-stay',
    channel: 'both',
    characters: 105,
    estimatedCost: '€0.05',
    timing: 'After checkout',
    priority: 'low'
  },

  review_request: {
    id: 'review_request',
    name: 'Prošnja Za Review',
    body: 'Hvala za obisk! Prosim pustite mnenje: {{review_link}}. Vaše mnenje nam veliko pomeni. {{property_name}}',
    variables: ['review_link', 'property_name'],
    category: 'post-stay',
    channel: 'both',
    characters: 110,
    estimatedCost: '€0.05',
    timing: '1 day after checkout',
    priority: 'medium'
  },

  discount_offer: {
    id: 'discount_offer',
    name: 'Ponudba Popusta',
    body: 'Posebno za vas: {{discount}}% popust na naslednjo rezervacijo! Koda: {{code}}. Velja do {{expiry}}. {{property_name}}',
    variables: ['discount', 'code', 'expiry', 'property_name'],
    category: 'post-stay',
    channel: 'both',
    characters: 125,
    estimatedCost: '€0.05',
    timing: '7 days after checkout',
    priority: 'low'
  },

  // ============================================================================
  // OPERATIONAL MESSAGES
  // ============================================================================

  payment_received: {
    id: 'payment_received',
    name: 'Plačilo Prejeto',
    body: 'Potrjujemo prejem plačila €{{amount}} za rezervacijo {{reservation_id}}. Hvala! {{property_name}}',
    variables: ['amount', 'reservation_id', 'property_name'],
    category: 'operational',
    channel: 'both',
    characters: 100,
    estimatedCost: '€0.05',
    timing: 'After payment received',
    priority: 'medium'
  },

  payment_reminder: {
    id: 'payment_reminder',
    name: 'Opomnik Plačila',
    body: 'Opomnik: Plačilo €{{amount}} za rezervacijo {{reservation_id}} še ni prejeto. Prosimo poravnajte do {{due_date}}.',
    variables: ['amount', 'reservation_id', 'due_date'],
    category: 'operational',
    channel: 'both',
    characters: 125,
    estimatedCost: '€0.05',
    timing: '7 days before check-in',
    priority: 'high'
  },

  reservation_modified: {
    id: 'reservation_modified',
    name: 'Sprememba Rezervacije',
    body: 'Vaša rezervacija je bila spremenjena. Novi datumi: {{new_dates}}. Za podrobnosti: {{link}}. {{property_name}}',
    variables: ['new_dates', 'link', 'property_name'],
    category: 'operational',
    channel: 'both',
    characters: 120,
    estimatedCost: '€0.05',
    timing: 'After modification',
    priority: 'high'
  },

  room_ready: {
    id: 'room_ready',
    name: 'Soba Pripravljena',
    body: 'Vaša soba {{room_number}} je pripravljena za check-in. Veselimo se vašega prihoda! {{property_name}}',
    variables: ['room_number', 'property_name'],
    category: 'operational',
    channel: 'both',
    characters: 105,
    estimatedCost: '€0.05',
    timing: 'When room is ready for early check-in',
    priority: 'medium'
  },

  // ============================================================================
  // EMERGENCY MESSAGES
  // ============================================================================

  emergency_alert: {
    id: 'emergency_alert',
    name: 'Nujno Obvestilo',
    body: 'NUJNO: {{message}}. Prosimo sledite navodilom osebja. Za pomoč: {{emergency_phone}}. {{property_name}}',
    variables: ['message', 'emergency_phone', 'property_name'],
    category: 'emergency',
    channel: 'both',
    characters: 110,
    estimatedCost: '€0.05',
    timing: 'During emergency',
    priority: 'urgent'
  },

  weather_alert: {
    id: 'weather_alert',
    name: 'Vremensko Opozorilo',
    body: 'Opozorilo: {{weather_warning}}. Prosimo bodite previdni. Za informacije: {{phone}}. {{property_name}}',
    variables: ['weather_warning', 'phone', 'property_name'],
    category: 'emergency',
    channel: 'both',
    characters: 110,
    estimatedCost: '€0.05',
    timing: 'When weather warning issued',
    priority: 'urgent'
  },

  evacuation_notice: {
    id: 'evacuation_notice',
    name: 'Evakuacijsko Obvestilo',
    body: 'EVAKUACIJA: Prosimo nemudoma zapustite stavbo. Zbirno mesto: {{location}}. Sledite navodilom. {{property_name}}',
    variables: ['location', 'property_name'],
    category: 'emergency',
    channel: 'both',
    characters: 120,
    estimatedCost: '€0.05',
    timing: 'During evacuation',
    priority: 'urgent'
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Render message with variables
 * 
 * @param templateId - Template ID
 * @param variables - Variable values
 * @returns Rendered message
 * 
 * @example
 * const message = renderMessage('checkin_reminder', {
 *   guest_name: 'John',
 *   property_name: 'Villa Bled'
 * });
 */
export function renderMessage(
  templateId: string,
  variables: Record<string, string>
): string {
  const template = SMS_TEMPLATES[templateId];

  if (!template) {
    throw new Error(`Template ${templateId} not found`);
  }

  let message = template.body;

  // Replace all variables
  for (const [key, value] of Object.entries(variables)) {
    message = message.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }

  return message;
}

/**
 * Get template by ID
 */
export function getTemplateById(templateId: string): MessageTemplate | undefined {
  return SMS_TEMPLATES[templateId];
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: MessageTemplate['category']): MessageTemplate[] {
  return Object.values(SMS_TEMPLATES).filter(
    (template) => template.category === category
  );
}

/**
 * Get templates by channel
 */
export function getTemplatesByChannel(channel: 'sms' | 'whatsapp' | 'both'): MessageTemplate[] {
  return Object.values(SMS_TEMPLATES).filter(
    (template) => template.channel === channel || template.channel === 'both'
  );
}

/**
 * Check if template exists
 */
export function templateExists(templateId: string): boolean {
  return templateId in SMS_TEMPLATES;
}

/**
 * Get estimated character count
 */
export function getCharacterCount(templateId: string, variables?: Record<string, string>): number {
  const template = SMS_TEMPLATES[templateId];
  if (!template) return 0;

  if (!variables) return template.characters;

  const rendered = renderMessage(templateId, variables);
  return rendered.length;
}

/**
 * Get all template IDs
 */
export const SMS_TEMPLATE_IDS = Object.keys(SMS_TEMPLATES);

// ============================================================================
// EXPORTS
// ============================================================================

export type { MessageTemplate };
export default SMS_TEMPLATES;
