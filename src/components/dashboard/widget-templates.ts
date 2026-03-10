/**
 * Dashboard Widget Templates
 * 
 * Pre-built widget templates for dashboard personalization:
 * - Revenue widgets (MTD, ADR, RevPAR, Forecast)
 * - Operations widgets (Occupancy, Arrivals, Departures, Room Status)
 * - Guest widgets (Satisfaction, Requests, Demographics)
 * - Marketing widgets (Channel Performance)
 * 
 * Each widget includes:
 * - Size configuration (default, min)
 * - Data endpoint
 * - Refresh interval
 * - Category classification
 * 
 * @version 1.0.0
 * @author AgentFlow Pro Team
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface WidgetTemplate {
  type: string;
  title: string;
  description: string;
  defaultSize: { w: number; h: number };
  minSize: { w: number; h: number };
  dataEndpoint: string | null;
  refreshInterval: number; // in seconds (0 = no auto-refresh)
  category: 'revenue' | 'operations' | 'guests' | 'marketing';
  icon?: string;
  colorScheme?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}

export interface WidgetPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface WidgetConfig {
  type: string;
  position: WidgetPosition;
  settings?: Record<string, any>;
}

export interface DashboardTemplate {
  id: string;
  name: string;
  description: string;
  role: 'owner' | 'director' | 'receptor' | 'housekeeping' | 'manager';
  widgets: WidgetConfig[];
  layout?: 'grid' | 'flex';
  columns?: number;
}

// ============================================================================
// WIDGET TEMPLATES
// ============================================================================

export const WIDGET_TEMPLATES: Record<string, WidgetTemplate> = {
  // ============================================================================
  // REVENUE WIDGETS
  // ============================================================================

  revenue_mtd: {
    type: 'revenue_mtd',
    title: 'Prihodki Ta Mesec',
    description: 'MTD revenue z comparison na prejšnji mesec',
    defaultSize: { w: 3, h: 2 },
    minSize: { w: 2, h: 2 },
    dataEndpoint: '/api/analytics/revenue',
    refreshInterval: 300,
    category: 'revenue',
    icon: '💰',
    colorScheme: 'green',
  },

  adr_trend: {
    type: 'adr_trend',
    title: 'ADR Trend',
    description: 'Average Daily Rate trend',
    defaultSize: { w: 3, h: 2 },
    minSize: { w: 2, h: 2 },
    dataEndpoint: '/api/analytics/dashboard',
    refreshInterval: 600,
    category: 'revenue',
    icon: '📈',
    colorScheme: 'blue',
  },

  revpar: {
    type: 'revpar',
    title: 'RevPAR',
    description: 'Revenue Per Available Room',
    defaultSize: { w: 3, h: 2 },
    minSize: { w: 2, h: 2 },
    dataEndpoint: '/api/analytics/dashboard',
    refreshInterval: 600,
    category: 'revenue',
    icon: '📊',
    colorScheme: 'blue',
  },

  revenue_forecast: {
    type: 'revenue_forecast',
    title: 'Forecast Prihodkov',
    description: '30-day revenue forecast',
    defaultSize: { w: 4, h: 3 },
    minSize: { w: 3, h: 3 },
    dataEndpoint: '/api/analytics/forecast',
    refreshInterval: 3600,
    category: 'revenue',
    icon: '🔮',
    colorScheme: 'purple',
  },

  budget_vs_actual: {
    type: 'budget_vs_actual',
    title: 'Budžet vs Dejansko',
    description: 'Budget variance analysis',
    defaultSize: { w: 4, h: 3 },
    minSize: { w: 3, h: 3 },
    dataEndpoint: '/api/analytics/budget',
    refreshInterval: 3600,
    category: 'revenue',
    icon: '⚖️',
    colorScheme: 'orange',
  },

  occupancy_trend: {
    type: 'occupancy_trend',
    title: 'Trend Zasedenosti',
    description: '90-day occupancy trend',
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
    dataEndpoint: '/api/analytics/occupancy',
    refreshInterval: 900,
    category: 'revenue',
    icon: '📉',
    colorScheme: 'blue',
  },

  // ============================================================================
  // OPERATIONS WIDGETS
  // ============================================================================

  occupancy_rate: {
    type: 'occupancy_rate',
    title: 'Zasedenost',
    description: 'Trenutna zasedenost z forecast',
    defaultSize: { w: 3, h: 2 },
    minSize: { w: 2, h: 2 },
    dataEndpoint: '/api/analytics/occupancy',
    refreshInterval: 300,
    category: 'operations',
    icon: '🏨',
    colorScheme: 'blue',
  },

  today_arrivals: {
    type: 'today_arrivals',
    title: 'Prihodi Danes',
    description: 'Seznam gostov ki prihajajo danes',
    defaultSize: { w: 3, h: 2 },
    minSize: { w: 2, h: 2 },
    dataEndpoint: '/api/tourism/today-overview',
    refreshInterval: 60,
    category: 'operations',
    icon: '👋',
    colorScheme: 'green',
  },

  today_departures: {
    type: 'today_departures',
    title: 'Odhodi Danes',
    description: 'Seznam gostov ki odhajajo danes',
    defaultSize: { w: 3, h: 2 },
    minSize: { w: 2, h: 2 },
    dataEndpoint: '/api/tourism/today-overview',
    refreshInterval: 60,
    category: 'operations',
    icon: '🚪',
    colorScheme: 'orange',
  },

  room_status: {
    type: 'room_status',
    title: 'Status Sob',
    description: 'Real-time status vseh sob',
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
    dataEndpoint: '/api/rooms/status',
    refreshInterval: 30,
    category: 'operations',
    icon: '🚪',
    colorScheme: 'blue',
  },

  quick_actions: {
    type: 'quick_actions',
    title: 'Hitre Akcije',
    description: 'Najpogostejše akcije',
    defaultSize: { w: 6, h: 2 },
    minSize: { w: 4, h: 2 },
    dataEndpoint: null,
    refreshInterval: 0,
    category: 'operations',
    icon: '⚡',
    colorScheme: 'blue',
  },

  rooms_to_clean: {
    type: 'rooms_to_clean',
    title: 'Sobe Za Čiščenje',
    description: 'Housekeeping task list',
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
    dataEndpoint: '/api/housekeeping/tasks',
    refreshInterval: 60,
    category: 'operations',
    icon: '🧹',
    colorScheme: 'green',
  },

  cleaning_progress: {
    type: 'cleaning_progress',
    title: 'Napredek Čiščenja',
    description: 'Housekeeping progress tracking',
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
    dataEndpoint: '/api/housekeeping/progress',
    refreshInterval: 60,
    category: 'operations',
    icon: '✅',
    colorScheme: 'green',
  },

  staff_efficiency: {
    type: 'staff_efficiency',
    title: 'Efektivnost Osebja',
    description: 'Staff performance metrics',
    defaultSize: { w: 4, h: 3 },
    minSize: { w: 3, h: 3 },
    dataEndpoint: '/api/analytics/staff',
    refreshInterval: 900,
    category: 'operations',
    icon: '👥',
    colorScheme: 'blue',
  },

  // ============================================================================
  // GUEST WIDGETS
  // ============================================================================

  guest_satisfaction: {
    type: 'guest_satisfaction',
    title: 'Zadovoljstvo Gostov',
    description: 'Review scores in NPS',
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
    dataEndpoint: '/api/analytics/guests',
    refreshInterval: 900,
    category: 'guests',
    icon: '⭐',
    colorScheme: 'purple',
  },

  guest_requests: {
    type: 'guest_requests',
    title: 'Prošnje Gostov',
    description: 'Aktivne prošnje in taski',
    defaultSize: { w: 6, h: 3 },
    minSize: { w: 4, h: 3 },
    dataEndpoint: '/api/guests/requests',
    refreshInterval: 60,
    category: 'guests',
    icon: '📝',
    colorScheme: 'orange',
  },

  guest_demographics: {
    type: 'guest_demographics',
    title: 'Demografija Gostov',
    description: 'Guest country, age, purpose',
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
    dataEndpoint: '/api/analytics/guests',
    refreshInterval: 1800,
    category: 'guests',
    icon: '🌍',
    colorScheme: 'blue',
  },

  // ============================================================================
  // MARKETING WIDGETS
  // ============================================================================

  channel_performance: {
    type: 'channel_performance',
    title: 'Uspešnost Kanalov',
    description: 'Rezervacije po kanalih (Booking, Airbnb, Direct)',
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
    dataEndpoint: '/api/analytics/revenue',
    refreshInterval: 600,
    category: 'marketing',
    icon: '📊',
    colorScheme: 'purple',
  },
};

// ============================================================================
// DASHBOARD TEMPLATES BY ROLE
// ============================================================================

export const DASHBOARD_TEMPLATES: Record<string, DashboardTemplate> = {
  // ============================================================================
  // 1. OWNER DASHBOARD
  // ============================================================================
  owner: {
    id: 'owner',
    name: 'Owner Dashboard',
    description: 'Finančni KPI-ji in overview za lastnike',
    role: 'owner',
    widgets: [
      { type: 'revenue_mtd', position: { x: 0, y: 0, w: 3, h: 2 } },
      { type: 'occupancy_rate', position: { x: 3, y: 0, w: 3, h: 2 } },
      { type: 'adr_trend', position: { x: 6, y: 0, w: 3, h: 2 } },
      { type: 'revpar', position: { x: 9, y: 0, w: 3, h: 2 } },
      { type: 'channel_performance', position: { x: 0, y: 2, w: 6, h: 4 } },
      { type: 'guest_satisfaction', position: { x: 6, y: 2, w: 6, h: 4 } },
      { type: 'revenue_forecast', position: { x: 0, y: 6, w: 4, h: 3 } },
      { type: 'budget_vs_actual', position: { x: 4, y: 6, w: 4, h: 3 } },
      { type: 'staff_efficiency', position: { x: 8, y: 6, w: 4, h: 3 } },
    ],
    layout: 'grid',
    columns: 12,
  },

  // ============================================================================
  // 2. DIRECTOR DASHBOARD
  // ============================================================================
  director: {
    id: 'director',
    name: 'Director Dashboard',
    description: 'Operativni overview za direktorje',
    role: 'director',
    widgets: [
      { type: 'revenue_mtd', position: { x: 0, y: 0, w: 3, h: 2 } },
      { type: 'occupancy_rate', position: { x: 3, y: 0, w: 3, h: 2 } },
      { type: 'today_arrivals', position: { x: 6, y: 0, w: 3, h: 2 } },
      { type: 'today_departures', position: { x: 9, y: 0, w: 3, h: 2 } },
      { type: 'revenue_forecast', position: { x: 0, y: 2, w: 4, h: 3 } },
      { type: 'budget_vs_actual', position: { x: 4, y: 2, w: 4, h: 3 } },
      { type: 'staff_efficiency', position: { x: 8, y: 2, w: 4, h: 3 } },
      { type: 'occupancy_trend', position: { x: 0, y: 5, w: 6, h: 4 } },
      { type: 'guest_demographics', position: { x: 6, y: 5, w: 6, h: 4 } },
    ],
    layout: 'grid',
    columns: 12,
  },

  // ============================================================================
  // 3. RECEPTOR DASHBOARD
  // ============================================================================
  receptor: {
    id: 'receptor',
    name: 'Receptor Dashboard',
    description: 'Dnevne operacije za receptorje',
    role: 'receptor',
    widgets: [
      { type: 'today_arrivals', position: { x: 0, y: 0, w: 3, h: 2 } },
      { type: 'today_departures', position: { x: 3, y: 0, w: 3, h: 2 } },
      { type: 'room_status', position: { x: 6, y: 0, w: 6, h: 4 } },
      { type: 'quick_actions', position: { x: 0, y: 2, w: 6, h: 2 } },
      { type: 'guest_requests', position: { x: 6, y: 4, w: 6, h: 3 } },
      { type: 'occupancy_rate', position: { x: 0, y: 4, w: 3, h: 2 } },
      { type: 'adr_trend', position: { x: 3, y: 4, w: 3, h: 2 } },
    ],
    layout: 'grid',
    columns: 12,
  },

  // ============================================================================
  // 4. HOUSEKEEPING DASHBOARD
  // ============================================================================
  housekeeping: {
    id: 'housekeeping',
    name: 'Housekeeping Dashboard',
    description: 'Task management za hišno osebje',
    role: 'housekeeping',
    widgets: [
      { type: 'rooms_to_clean', position: { x: 0, y: 0, w: 6, h: 4 } },
      { type: 'cleaning_progress', position: { x: 6, y: 0, w: 6, h: 4 } },
      { type: 'room_status', position: { x: 0, y: 4, w: 12, h: 3 } },
      { type: 'guest_requests', position: { x: 0, y: 7, w: 12, h: 2 } },
    ],
    layout: 'grid',
    columns: 12,
  },

  // ============================================================================
  // 5. MANAGER DASHBOARD
  // ============================================================================
  manager: {
    id: 'manager',
    name: 'Manager Dashboard',
    description: 'Kombinirani overview za managerje',
    role: 'manager',
    widgets: [
      { type: 'revenue_mtd', position: { x: 0, y: 0, w: 3, h: 2 } },
      { type: 'occupancy_rate', position: { x: 3, y: 0, w: 3, h: 2 } },
      { type: 'today_arrivals', position: { x: 6, y: 0, w: 3, h: 2 } },
      { type: 'today_departures', position: { x: 9, y: 0, w: 3, h: 2 } },
      { type: 'room_status', position: { x: 0, y: 2, w: 6, h: 4 } },
      { type: 'guest_satisfaction', position: { x: 6, y: 2, w: 6, h: 4 } },
      { type: 'quick_actions', position: { x: 0, y: 6, w: 6, h: 2 } },
      { type: 'guest_requests', position: { x: 6, y: 6, w: 6, h: 3 } },
    ],
    layout: 'grid',
    columns: 12,
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create dashboard from template
 * 
 * @param templateId - Template ID from DASHBOARD_TEMPLATES
 * @param userId - User ID (dashboard owner)
 * @param propertyId - Optional property ID
 * @returns Created dashboard
 * 
 * @example
 * const dashboard = await createDashboardFromTemplate('owner', 'user-123', 'prop-456');
 */
export async function createDashboardFromTemplate(
  templateId: string,
  userId: string,
  propertyId?: string
): Promise<any> {
  const template = DASHBOARD_TEMPLATES[templateId];

  if (!template) {
    throw new Error(`Template ${templateId} not found`);
  }

  // Import Prisma client
  const { prisma } = await import('@/database/schema');

  const dashboard = await prisma.dashboard.create({
    data: {
      name: template.name,
      description: template.description,
      role: template.role,
      widgets: template.widgets as any,
      userId,
      propertyId,
      isTemplate: false,
    },
  });

  console.log(`✅ Dashboard created from template: ${templateId}`);
  return dashboard;
}

/**
 * Get available widgets for a role
 * 
 * @param role - User role
 * @returns Array of widget templates
 * 
 * @example
 * const widgets = getWidgetsForRole('receptor');
 */
export function getWidgetsForRole(role: string): WidgetTemplate[] {
  const template = DASHBOARD_TEMPLATES[role];
  if (!template) return [];

  return template.widgets.map((widget) => WIDGET_TEMPLATES[widget.type]).filter(Boolean);
}

/**
 * Get widget template by type
 * 
 * @param widgetType - Widget type
 * @returns Widget template or undefined
 * 
 * @example
 * const widget = getWidgetByType('revenue_mtd');
 */
export function getWidgetByType(widgetType: string): WidgetTemplate | undefined {
  return WIDGET_TEMPLATES[widgetType];
}

/**
 * Get dashboard template by role
 * 
 * @param role - User role
 * @returns Dashboard template or undefined
 * 
 * @example
 * const dashboard = getDashboardByRole('owner');
 */
export function getDashboardByRole(role: string): DashboardTemplate | undefined {
  return DASHBOARD_TEMPLATES[role];
}

/**
 * Get widgets by category
 * 
 * @param category - Widget category
 * @returns Array of widget templates in category
 * 
 * @example
 * const revenueWidgets = getWidgetsByCategory('revenue');
 */
export function getWidgetsByCategory(category: WidgetTemplate['category']): WidgetTemplate[] {
  return Object.values(WIDGET_TEMPLATES).filter(
    (widget) => widget.category === category
  );
}

/**
 * Check if widget exists
 * 
 * @param widgetType - Widget type
 * @returns True if widget exists
 */
export function widgetExists(widgetType: string): boolean {
  return widgetType in WIDGET_TEMPLATES;
}

/**
 * Get widget refresh interval in milliseconds
 * 
 * @param widgetType - Widget type
 * @returns Refresh interval in ms (0 = no auto-refresh)
 */
export function getWidgetRefreshInterval(widgetType: string): number {
  const widget = WIDGET_TEMPLATES[widgetType];
  return widget ? widget.refreshInterval * 1000 : 0;
}

// ============================================================================
// EXPORTS
// ============================================================================

export const WIDGET_TEMPLATE_IDS = Object.keys(WIDGET_TEMPLATES);
export const DASHBOARD_TEMPLATE_IDS = Object.keys(DASHBOARD_TEMPLATES);

export type { WidgetTemplate, DashboardTemplate, WidgetPosition, WidgetConfig };
export default { WIDGET_TEMPLATES, DASHBOARD_TEMPLATES };
