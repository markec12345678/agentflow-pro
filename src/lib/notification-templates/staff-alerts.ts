/**
 * Notification Templates for AgentFlow Pro
 * 
 * In-app notification templates for staff communication:
 * - Staff alerts (VIP arrivals, maintenance, requests)
 * - Operational notifications (room status, tasks, updates)
 * - System notifications (bookings, changes, alerts)
 * 
 * Each template includes:
 * - Title and body with variables
 * - Priority level
 * - Target recipients
 * - Icon and color coding
 * - Action buttons
 * 
 * @version 1.0.0
 * @author AgentFlow Pro Team
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface NotificationTemplate {
  id: string;
  name: string;
  title: string;
  body: string;
  variables: string[];
  category: 'staff-alert' | 'operational' | 'system' | 'emergency';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  recipients: string[];
  icon: string;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  sound?: 'default' | 'urgent' | 'silent';
  actions?: Array<{
    label: string;
    action: string;
    type: 'navigate' | 'action' | 'dismiss';
  }>;
}

// ============================================================================
// NOTIFICATION TEMPLATES
// ============================================================================

export const NOTIFICATION_TEMPLATES: Record<string, NotificationTemplate> = {
  // ============================================================================
  // STAFF ALERTS
  // ============================================================================

  vip_arrival: {
    id: 'vip_arrival',
    name: 'VIP Gost Prihaja',
    title: '⭐ VIP Gost Prihaja',
    body: '{{guest_name}} ({{loyalty_tier}}) prihaja danes ob {{check_in_time}}. Pripravi posebno dobrodošlico!',
    variables: ['guest_name', 'loyalty_tier', 'check_in_time', 'room_number'],
    category: 'staff-alert',
    priority: 'high',
    recipients: ['receptor', 'housekeeping', 'manager'],
    icon: '⭐',
    color: 'purple',
    sound: 'default',
    actions: [
      { label: 'Odpri Profil', action: '/guests/{{guest_id}}', type: 'navigate' },
      { label: 'Pripravi Sob', action: 'prepare_vip_room', type: 'action' }
    ]
  },

  vip_checkout: {
    id: 'vip_checkout',
    name: 'VIP Gost Odhaja',
    title: '👋 VIP Gost Odhaja',
    body: '{{guest_name}} odhaja danes. Preveri sobo {{room_number}} in pripravi račun.',
    variables: ['guest_name', 'room_number', 'checkout_time'],
    category: 'staff-alert',
    priority: 'medium',
    recipients: ['receptor', 'housekeeping'],
    icon: '👋',
    color: 'blue',
    sound: 'default',
    actions: [
      { label: 'Preveri Račun', action: '/billing/{{reservation_id}}', type: 'navigate' }
    ]
  },

  maintenance_request: {
    id: 'maintenance_request',
    name: 'Zahtevek Za Vzdrževanje',
    title: '🔧 Vzdrževanje Potrebno',
    body: 'Soba {{room_number}}: {{issue_description}}. Prioriteta: {{priority}}.',
    variables: ['room_number', 'issue_description', 'priority', 'reported_by'],
    category: 'staff-alert',
    priority: 'medium',
    recipients: ['maintenance'],
    icon: '🔧',
    color: 'yellow',
    sound: 'default',
    actions: [
      { label: 'Sprejmi', action: 'accept_task', type: 'action' },
      { label: 'Zavrni', action: 'reject_task', type: 'action' }
    ]
  },

  early_checkin: {
    id: 'early_checkin',
    name: 'Zgodnji Check-in',
    title: '⏰ Zgodnji Check-in',
    body: '{{guest_name}} želi check-in ob {{time}}. Ali je mogoče?',
    variables: ['guest_name', 'time', 'room_number'],
    category: 'staff-alert',
    priority: 'low',
    recipients: ['receptor', 'housekeeping'],
    icon: '⏰',
    color: 'blue',
    sound: 'silent',
    actions: [
      { label: 'Potrdi', action: 'approve_early_checkin', type: 'action' },
      { label: 'Zavrni', action: 'reject_early_checkin', type: 'action' }
    ]
  },

  special_request: {
    id: 'special_request',
    name: 'Posebna Zahteva',
    title: '📝 Posebna Zahteva',
    body: '{{guest_name}} zahteva: {{request_description}}. Rok: {{deadline}}.',
    variables: ['guest_name', 'request_description', 'deadline', 'room_number'],
    category: 'staff-alert',
    priority: 'medium',
    recipients: ['receptor', 'manager'],
    icon: '📝',
    color: 'blue',
    sound: 'default',
    actions: [
      { label: 'Izpolni', action: 'fulfill_request', type: 'action' }
    ]
  },

  // ============================================================================
  // OPERATIONAL NOTIFICATIONS
  // ============================================================================

  room_ready: {
    id: 'room_ready',
    name: 'Soba Pripravljena',
    title: '✅ Soba Pripravljena',
    body: 'Soba {{room_number}} je pripravljena za check-in. Status: {{status}}.',
    variables: ['room_number', 'status', 'cleaned_by'],
    category: 'operational',
    priority: 'low',
    recipients: ['receptor'],
    icon: '✅',
    color: 'green',
    sound: 'silent',
    actions: [
      { label: 'Odpri Sob', action: '/rooms/{{room_number}}', type: 'navigate' }
    ]
  },

  room_dirty: {
    id: 'room_dirty',
    name: 'Soba Umazana',
    title: '🧹 Soba Za Čiščenje',
    body: 'Soba {{room_number}} je umazana. Check-out: {{checkout_time}}. Čiščenje potrebno.',
    variables: ['room_number', 'checkout_time', 'guest_name'],
    category: 'operational',
    priority: 'medium',
    recipients: ['housekeeping'],
    icon: '🧹',
    color: 'yellow',
    sound: 'default',
    actions: [
      { label: 'Začni Čiščenje', action: 'start_cleaning', type: 'action' }
    ]
  },

  task_assigned: {
    id: 'task_assigned',
    name: 'Naloga Dodeljena',
    title: '📋 Nova Naloga',
    body: 'Dodeljena naloga: {{task_description}}. Rok: {{deadline}}. Prioriteta: {{priority}}.',
    variables: ['task_description', 'deadline', 'priority', 'assigned_by'],
    category: 'operational',
    priority: 'medium',
    recipients: ['all_staff'],
    icon: '📋',
    color: 'blue',
    sound: 'default',
    actions: [
      { label: 'Sprejmi', action: 'accept_task', type: 'action' },
      { label: 'Zavrni', action: 'reject_task', type: 'action' }
    ]
  },

  task_completed: {
    id: 'task_completed',
    name: 'Naloga Zaključena',
    title: '✅ Naloga Zaključena',
    body: '{{assigned_to}} je zaključil nalogo: {{task_description}}.',
    variables: ['assigned_to', 'task_description', 'completed_at'],
    category: 'operational',
    priority: 'low',
    recipients: ['manager', 'assigned_by'],
    icon: '✅',
    color: 'green',
    sound: 'silent',
    actions: [
      { label: 'Odpri', action: '/tasks/{{task_id}}', type: 'navigate' }
    ]
  },

  low_occupancy: {
    id: 'low_occupancy',
    name: 'Nizka Zasedenost',
    title: '⚠️ Nizka Zasedenost',
    body: 'Zasedenost naslednjih 7 dni: {{occupancy}}%. Razmisli o promociji.',
    variables: ['occupancy', 'available_rooms', 'dates'],
    category: 'operational',
    priority: 'medium',
    recipients: ['manager', 'director'],
    icon: '⚠️',
    color: 'yellow',
    sound: 'default',
    actions: [
      { label: 'Ustvari Promocijo', action: '/promotions/create', type: 'navigate' }
    ]
  },

  // ============================================================================
  // SYSTEM NOTIFICATIONS
  // ============================================================================

  new_booking: {
    id: 'new_booking',
    name: 'Nova Rezervacija',
    title: '📅 Nova Rezervacija',
    body: '{{guest_name}} je rezerviral sobo {{room_type}} od {{check_in}} do {{check_out}}.',
    variables: ['guest_name', 'room_type', 'check_in', 'check_out', 'total_amount'],
    category: 'system',
    priority: 'low',
    recipients: ['receptor', 'manager'],
    icon: '📅',
    color: 'blue',
    sound: 'silent',
    actions: [
      { label: 'Odpri', action: '/reservations/{{reservation_id}}', type: 'navigate' }
    ]
  },

  booking_cancelled: {
    id: 'booking_cancelled',
    name: 'Preklic Rezervacije',
    title: '❌ Rezervacija Preklicana',
    body: '{{guest_name}} je preklical rezervacijo. Razlog: {{cancellation_reason}}.',
    variables: ['guest_name', 'cancellation_reason', 'refund_amount'],
    category: 'system',
    priority: 'medium',
    recipients: ['receptor', 'manager'],
    icon: '❌',
    color: 'red',
    sound: 'default',
    actions: [
      { label: 'Odpri', action: '/reservations/{{reservation_id}}', type: 'navigate' }
    ]
  },

  payment_received: {
    id: 'payment_received',
    name: 'Plačilo Prejeto',
    title: '💰 Plačilo Prejeto',
    body: 'Prejeli smo plačilo €{{amount}} od {{guest_name}}.',
    variables: ['amount', 'guest_name', 'payment_method'],
    category: 'system',
    priority: 'low',
    recipients: ['receptor', 'manager'],
    icon: '💰',
    color: 'green',
    sound: 'silent',
    actions: [
      { label: 'Odpri Račun', action: '/billing/{{reservation_id}}', type: 'navigate' }
    ]
  },

  review_received: {
    id: 'review_received',
    name: 'Prejet Review',
    title: '⭐ Nov Review',
    body: '{{guest_name}} je ocenil bivanje z {{score}}/10. "{{review_excerpt}}"',
    variables: ['guest_name', 'score', 'review_excerpt', 'platform'],
    category: 'system',
    priority: 'medium',
    recipients: ['manager', 'director'],
    icon: '⭐',
    color: 'yellow',
    sound: 'default',
    actions: [
      { label: 'Odgovori', action: '/reviews/{{review_id}}/respond', type: 'navigate' },
      { label: 'Odpri', action: '/reviews/{{review_id}}', type: 'navigate' }
    ]
  },

  system_update: {
    id: 'system_update',
    name: 'Posodobitev Sistema',
    title: '🔄 Posodobitev Sistema',
    body: '{{update_description}}. Načrtovano: {{scheduled_time}}.',
    variables: ['update_description', 'scheduled_time', 'expected_downtime'],
    category: 'system',
    priority: 'low',
    recipients: ['all_staff'],
    icon: '🔄',
    color: 'blue',
    sound: 'silent',
    actions: [
      { label: 'Več Info', action: '/system/updates', type: 'navigate' }
    ]
  },

  // ============================================================================
  // EMERGENCY NOTIFICATIONS
  // ============================================================================

  emergency_evacuation: {
    id: 'emergency_evacuation',
    name: 'Evakuacija',
    title: '🚨 EVAKUACIJA',
    body: 'Nemudoma zapustite stavbo. Zbirno mesto: {{assembly_point}}. Sledite navodilom.',
    variables: ['assembly_point', 'emergency_type'],
    category: 'emergency',
    priority: 'urgent',
    recipients: ['all_staff', 'all_guests'],
    icon: '🚨',
    color: 'red',
    sound: 'urgent',
    actions: [
      { label: 'Potrdi Prejem', action: 'acknowledge_emergency', type: 'action' }
    ]
  },

  fire_alarm: {
    id: 'fire_alarm',
    name: 'Požarni Alarm',
    title: '🔥 POŽARNI ALARM',
    body: 'Detektiran dim/ogenj v {{location}}. Aktivirana evakuacija.',
    variables: ['location', 'floor', 'severity'],
    category: 'emergency',
    priority: 'urgent',
    recipients: ['all_staff', 'all_guests'],
    icon: '🔥',
    color: 'red',
    sound: 'urgent',
    actions: [
      { label: 'Potrdi', action: 'acknowledge_fire', type: 'action' }
    ]
  },

  medical_emergency: {
    id: 'medical_emergency',
    name: 'Zdravstvena Nujnost',
    title: '🚑 ZDRAVSTVENA NUJNOST',
    body: 'Zdravstvena pomoč potrebna v {{location}}. Pokliči 112.',
    variables: ['location', 'description', 'severity'],
    category: 'emergency',
    priority: 'urgent',
    recipients: ['manager', 'security', 'receptor'],
    icon: '🚑',
    color: 'red',
    sound: 'urgent',
    actions: [
      { label: 'Pokliči 112', action: 'tel:112', type: 'action' },
      { label: 'Potrdi', action: 'acknowledge_medical', type: 'action' }
    ]
  },

  security_alert: {
    id: 'security_alert',
    name: 'Varnostno Opozorilo',
    title: '👮 VARNOSTNO OPOZORILO',
    body: 'Varnostni incident v {{location}}. {{description}}.',
    variables: ['location', 'description', 'severity'],
    category: 'emergency',
    priority: 'urgent',
    recipients: ['manager', 'security'],
    icon: '👮',
    color: 'red',
    sound: 'urgent',
    actions: [
      { label: 'Odpri', action: '/security/{{incident_id}}', type: 'navigate' },
      { label: 'Potrdi', action: 'acknowledge_security', type: 'action' }
    ]
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Render notification with variables
 * 
 * @param templateId - Template ID
 * @param variables - Variable values
 * @returns Rendered notification
 * 
 * @example
 * const notification = renderNotification('vip_arrival', {
 *   guest_name: 'John Doe',
 *   loyalty_tier: 'Gold',
 *   check_in_time: '14:00'
 * });
 */
export function renderNotification(
  templateId: string,
  variables: Record<string, string>
): { title: string; body: string } {
  const template = NOTIFICATION_TEMPLATES[templateId];

  if (!template) {
    throw new Error(`Template ${templateId} not found`);
  }

  let title = template.title;
  let body = template.body;

  // Replace all variables
  for (const [key, value] of Object.entries(variables)) {
    title = title.replace(new RegExp(`{{${key}}}`, 'g'), value);
    body = body.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }

  return { title, body };
}

/**
 * Get template by ID
 */
export function getTemplateById(templateId: string): NotificationTemplate | undefined {
  return NOTIFICATION_TEMPLATES[templateId];
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: NotificationTemplate['category']): NotificationTemplate[] {
  return Object.values(NOTIFICATION_TEMPLATES).filter(
    (template) => template.category === category
  );
}

/**
 * Get templates by priority
 */
export function getTemplatesByPriority(priority: NotificationTemplate['priority']): NotificationTemplate[] {
  return Object.values(NOTIFICATION_TEMPLATES).filter(
    (template) => template.priority === priority
  );
}

/**
 * Get templates by recipient
 */
export function getTemplatesByRecipient(recipient: string): NotificationTemplate[] {
  return Object.values(NOTIFICATION_TEMPLATES).filter(
    (template) => template.recipients.includes(recipient) || template.recipients.includes('all_staff')
  );
}

/**
 * Check if template exists
 */
export function templateExists(templateId: string): boolean {
  return templateId in NOTIFICATION_TEMPLATES;
}

/**
 * Get all template IDs
 */
export const NOTIFICATION_TEMPLATE_IDS = Object.keys(NOTIFICATION_TEMPLATES);

// ============================================================================
// EXPORTS
// ============================================================================

export type { NotificationTemplate };
export default NOTIFICATION_TEMPLATES;
