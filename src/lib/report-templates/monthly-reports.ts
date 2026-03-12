/**
 * Report Templates for AgentFlow Pro
 * 
 * Automated report templates for business intelligence:
 * - Monthly performance reports
 * - Occupancy reports
 * - Revenue reports
 * - Guest satisfaction reports
 * - Channel performance reports
 * - Staff efficiency reports
 * 
 * Each template includes:
 * - Report structure and sections
 * - Metrics and KPIs
 * - Charts and visualizations
 * - Delivery configuration
 * - Recipients and scheduling
 * 
 * @version 1.0.0
 * @author AgentFlow Pro Team
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: 'performance' | 'occupancy' | 'revenue' | 'guests' | 'operations' | 'staff';
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'on-demand';
  sections: ReportSection[];
  recipients: string[];
  delivery: 'email' | 'dashboard' | 'pdf' | 'excel';
  format?: 'A4' | 'Letter' | 'Auto';
  charts?: ChartConfig[];
  filters?: FilterConfig[];
}

export interface ReportSection {
  type: 'header' | 'summary' | 'metrics' | 'chart' | 'table' | 'analysis' | 'footer';
  title?: string;
  metrics?: string[];
  fields?: string[];
  content?: string;
}

export interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'area' | 'donut';
  title: string;
  data: string;
  x_axis?: string;
  y_axis?: string;
}

export interface FilterConfig {
  field: string;
  type: 'date_range' | 'dropdown' | 'multi_select' | 'text';
  label: string;
  default?: any;
  options?: string[];
}

// ============================================================================
// REPORT TEMPLATES
// ============================================================================

export const REPORT_TEMPLATES: Record<string, ReportTemplate> = {
  // ============================================================================
  // PERFORMANCE REPORTS
  // ============================================================================

  monthly_performance: {
    id: 'monthly_performance',
    name: 'Mesečno Poročilo',
    description: 'Comprehensive monthly performance report',
    category: 'performance',
    frequency: 'monthly',
    sections: [
      { type: 'header', title: 'Monthly Performance Report' },
      { type: 'summary', title: 'Executive Summary', metrics: ['revenue_mtd', 'occupancy_avg', 'adr', 'revpar'] },
      { type: 'metrics', title: 'Key Metrics', metrics: ['revenue_vs_budget', 'occupancy_vs_ly', 'adr_vs_ly', 'revpar_vs_ly'] },
      { type: 'chart', title: 'Revenue Trend' },
      { type: 'chart', title: 'Occupancy Trend' },
      { type: 'analysis', title: 'Key Achievements' },
      { type: 'analysis', title: 'Areas of Concern' },
      { type: 'analysis', title: 'Recommendations' },
      { type: 'footer' }
    ],
    recipients: ['owner', 'director', 'manager'],
    delivery: 'email',
    format: 'A4',
    charts: [
      { type: 'line', title: 'Revenue Trend (12 months)', data: 'revenue_monthly', x_axis: 'month', y_axis: 'revenue' },
      { type: 'bar', title: 'Occupancy by Month', data: 'occupancy_monthly', x_axis: 'month', y_axis: 'occupancy' },
      { type: 'donut', title: 'Revenue by Channel', data: 'revenue_by_channel' }
    ],
    filters: [
      { field: 'property_id', type: 'dropdown', label: 'Property' },
      { field: 'date_range', type: 'date_range', label: 'Period', default: 'last_month' }
    ]
  },

  quarterly_performance: {
    id: 'quarterly_performance',
    name: 'Četrtletno Poročilo',
    description: 'Quarterly business review report',
    category: 'performance',
    frequency: 'quarterly',
    sections: [
      { type: 'header', title: 'Quarterly Performance Report' },
      { type: 'summary', title: 'Quarter Highlights' },
      { type: 'metrics', title: 'Financial Performance', metrics: ['revenue_total', 'revenue_vs_budget', 'profit_margin', 'expenses'] },
      { type: 'metrics', title: 'Operational Performance', metrics: ['occupancy_avg', 'adr', 'revpar', 'guest_satisfaction'] },
      { type: 'chart', title: 'Quarterly Trends' },
      { type: 'analysis', title: 'Market Analysis' },
      { type: 'analysis', title: 'Next Quarter Goals' },
      { type: 'footer' }
    ],
    recipients: ['owner', 'director'],
    delivery: 'pdf',
    format: 'A4',
    charts: [
      { type: 'line', title: 'Quarterly Revenue Trend', data: 'revenue_quarterly', x_axis: 'quarter', y_axis: 'revenue' },
      { type: 'bar', title: 'Budget vs Actual', data: 'budget_variance', x_axis: 'category', y_axis: 'variance' }
    ],
    filters: [
      { field: 'property_id', type: 'dropdown', label: 'Property' },
      { field: 'quarter', type: 'dropdown', label: 'Quarter', options: ['Q1', 'Q2', 'Q3', 'Q4'] },
      { field: 'year', type: 'dropdown', label: 'Year', default: '2026' }
    ]
  },

  // ============================================================================
  // OCCUPANCY REPORTS
  // ============================================================================

  daily_occupancy: {
    id: 'daily_occupancy',
    name: 'Dnevno Poročilo Zasedenosti',
    description: 'Daily occupancy snapshot',
    category: 'occupancy',
    frequency: 'daily',
    sections: [
      { type: 'header', title: 'Daily Occupancy Report' },
      { type: 'summary', title: 'Today\'s Snapshot', metrics: ['occupancy_today', 'arrivals', 'departures', 'in_house'] },
      { type: 'metrics', title: 'Room Status', metrics: ['available', 'occupied', 'ooo', 'os'] },
      { type: 'table', title: 'Arrivals', fields: ['guest_name', 'room_type', 'time', 'special_requests'] },
      { type: 'table', title: 'Departures', fields: ['guest_name', 'room_number', 'time', 'status'] },
      { type: 'footer' }
    ],
    recipients: ['receptor', 'housekeeping', 'manager'],
    delivery: 'dashboard',
    charts: [
      { type: 'bar', title: 'Occupancy Last 7 Days', data: 'occupancy_daily', x_axis: 'date', y_axis: 'occupancy' }
    ],
    filters: [
      { field: 'property_id', type: 'dropdown', label: 'Property' },
      { field: 'date', type: 'date_range', label: 'Date', default: 'today' }
    ]
  },

  occupancy_forecast: {
    id: 'occupancy_forecast',
    name: 'Forecast Zasedenosti',
    description: '30-day occupancy forecast',
    category: 'occupancy',
    frequency: 'weekly',
    sections: [
      { type: 'header', title: 'Occupancy Forecast Report' },
      { type: 'summary', title: 'Forecast Summary', metrics: ['occupancy_next_7d', 'occupancy_next_30d', 'pickup_rate'] },
      { type: 'metrics', title: 'Key Metrics', metrics: ['on_books', 'pace', 'ly_pickup'] },
      { type: 'chart', title: '30-Day Forecast' },
      { type: 'chart', title: 'Pickup Trend' },
      { type: 'analysis', title: 'Recommendations' },
      { type: 'footer' }
    ],
    recipients: ['manager', 'director'],
    delivery: 'email',
    format: 'A4',
    charts: [
      { type: 'line', title: '30-Day Occupancy Forecast', data: 'occupancy_forecast_30d', x_axis: 'date', y_axis: 'occupancy' },
      { type: 'area', title: 'Pickup Pace', data: 'pickup_pace', x_axis: 'date', y_axis: 'rooms' }
    ],
    filters: [
      { field: 'property_id', type: 'dropdown', label: 'Property' },
      { field: 'forecast_days', type: 'dropdown', label: 'Forecast Period', options: ['7', '14', '30', '60'], default: '30' }
    ]
  },

  // ============================================================================
  // REVENUE REPORTS
  // ============================================================================

  revenue_analysis: {
    id: 'revenue_analysis',
    name: 'Analiza Prihodkov',
    description: 'Detailed revenue analysis report',
    category: 'revenue',
    frequency: 'monthly',
    sections: [
      { type: 'header', title: 'Revenue Analysis Report' },
      { type: 'summary', title: 'Revenue Summary', metrics: ['total_revenue', 'revenue_mtd', 'revenue_ytd', 'revenue_vs_budget'] },
      { type: 'metrics', title: 'Revenue Streams', metrics: ['room_revenue', 'fb_revenue', 'other_revenue'] },
      { type: 'chart', title: 'Revenue by Source' },
      { type: 'chart', title: 'Daily Revenue Trend' },
      { type: 'table', title: 'Revenue by Room Type', fields: ['room_type', 'rooms_sold', 'revenue', 'adr'] },
      { type: 'analysis', title: 'Revenue Opportunities' },
      { type: 'footer' }
    ],
    recipients: ['owner', 'director', 'manager'],
    delivery: 'excel',
    format: 'Auto',
    charts: [
      { type: 'donut', title: 'Revenue by Source', data: 'revenue_by_source' },
      { type: 'line', title: 'Daily Revenue Trend', data: 'revenue_daily', x_axis: 'date', y_axis: 'revenue' },
      { type: 'bar', title: 'Revenue by Room Type', data: 'revenue_by_room_type', x_axis: 'room_type', y_axis: 'revenue' }
    ],
    filters: [
      { field: 'property_id', type: 'dropdown', label: 'Property' },
      { field: 'date_range', type: 'date_range', label: 'Period', default: 'last_month' },
      { field: 'revenue_source', type: 'multi_select', label: 'Revenue Source', options: ['rooms', 'fb', 'other'] }
    ]
  },

  channel_performance: {
    id: 'channel_performance',
    name: 'Uspešnost Kanalov',
    description: 'OTA and direct channel performance',
    category: 'revenue',
    frequency: 'weekly',
    sections: [
      { type: 'header', title: 'Channel Performance Report' },
      { type: 'summary', title: 'Channel Summary', metrics: ['total_bookings', 'direct_percentage', 'ota_percentage'] },
      { type: 'metrics', title: 'By Channel', metrics: ['booking_com_revenue', 'airbnb_revenue', 'direct_revenue', 'expedia_revenue'] },
      { type: 'chart', title: 'Bookings by Channel' },
      { type: 'chart', title: 'Commission Cost' },
      { type: 'table', title: 'Channel Details', fields: ['channel', 'bookings', 'revenue', 'commission', 'net_revenue'] },
      { type: 'analysis', title: 'Channel Strategy' },
      { type: 'footer' }
    ],
    recipients: ['manager', 'director'],
    delivery: 'email',
    format: 'A4',
    charts: [
      { type: 'pie', title: 'Bookings by Channel', data: 'bookings_by_channel' },
      { type: 'bar', title: 'Commission by Channel', data: 'commission_by_channel', x_axis: 'channel', y_axis: 'commission' }
    ],
    filters: [
      { field: 'property_id', type: 'dropdown', label: 'Property' },
      { field: 'date_range', type: 'date_range', label: 'Period', default: 'last_week' }
    ]
  },

  // ============================================================================
  // GUEST REPORTS
  // ============================================================================

  guest_satisfaction: {
    id: 'guest_satisfaction',
    name: 'Zadovoljstvo Gostov',
    description: 'Guest satisfaction and reviews report',
    category: 'guests',
    frequency: 'monthly',
    sections: [
      { type: 'header', title: 'Guest Satisfaction Report' },
      { type: 'summary', title: 'Satisfaction Summary', metrics: ['nps_score', 'review_score_avg', 'total_reviews', 'complaints'] },
      { type: 'metrics', title: 'Review Scores', metrics: ['cleanliness_score', 'service_score', 'location_score', 'value_score'] },
      { type: 'chart', title: 'Review Score Trend' },
      { type: 'chart', title: 'Reviews by Platform' },
      { type: 'table', title: 'Recent Reviews', fields: ['guest_name', 'score', 'platform', 'date', 'status'] },
      { type: 'analysis', title: 'Common Themes' },
      { type: 'analysis', title: 'Action Items' },
      { type: 'footer' }
    ],
    recipients: ['manager', 'director', 'owner'],
    delivery: 'email',
    format: 'A4',
    charts: [
      { type: 'line', title: 'Review Score Trend (12 months)', data: 'review_score_monthly', x_axis: 'month', y_axis: 'score' },
      { type: 'donut', title: 'Reviews by Platform', data: 'reviews_by_platform' },
      { type: 'bar', title: 'Scores by Category', data: 'scores_by_category', x_axis: 'category', y_axis: 'score' }
    ],
    filters: [
      { field: 'property_id', type: 'dropdown', label: 'Property' },
      { field: 'platform', type: 'multi_select', label: 'Platform', options: ['booking.com', 'airbnb', 'google', 'tripadvisor'] },
      { field: 'date_range', type: 'date_range', label: 'Period', default: 'last_month' }
    ]
  },

  guest_demographics: {
    id: 'guest_demographics',
    name: 'Demografija Gostov',
    description: 'Guest demographics and behavior analysis',
    category: 'guests',
    frequency: 'quarterly',
    sections: [
      { type: 'header', title: 'Guest Demographics Report' },
      { type: 'summary', title: 'Guest Overview', metrics: ['total_guests', 'repeat_guests', 'avg_stay_length', 'avg_spend'] },
      { type: 'metrics', title: 'Demographics', metrics: ['domestic_percentage', 'international_percentage', 'business_percentage', 'leisure_percentage'] },
      { type: 'chart', title: 'Guests by Country' },
      { type: 'chart', title: 'Purpose of Stay' },
      { type: 'chart', title: 'Age Distribution' },
      { type: 'analysis', title: 'Guest Insights' },
      { type: 'footer' }
    ],
    recipients: ['manager', 'director'],
    delivery: 'pdf',
    format: 'A4',
    charts: [
      { type: 'pie', title: 'Guests by Country', data: 'guests_by_country' },
      { type: 'donut', title: 'Purpose of Stay', data: 'purpose_of_stay' },
      { type: 'bar', title: 'Age Distribution', data: 'age_distribution', x_axis: 'age_group', y_axis: 'guests' }
    ],
    filters: [
      { field: 'property_id', type: 'dropdown', label: 'Property' },
      { field: 'date_range', type: 'date_range', label: 'Period', default: 'last_quarter' }
    ]
  },

  // ============================================================================
  // OPERATIONS REPORTS
  // ============================================================================

  housekeeping_report: {
    id: 'housekeeping_report',
    name: 'Housekeeping Poročilo',
    description: 'Daily housekeeping performance report',
    category: 'operations',
    frequency: 'daily',
    sections: [
      { type: 'header', title: 'Housekeeping Report' },
      { type: 'summary', title: 'Today\'s Summary', metrics: ['rooms_cleaned', 'rooms_pending', 'avg_cleaning_time', 'inspections_passed'] },
      { type: 'metrics', title: 'Room Status', metrics: ['clean', 'dirty', 'inspected', 'ooo'] },
      { type: 'table', title: 'Cleaning Schedule', fields: ['room_number', 'assigned_to', 'status', 'start_time', 'end_time'] },
      { type: 'chart', title: 'Cleaning Progress' },
      { type: 'analysis', title: 'Issues & Notes' },
      { type: 'footer' }
    ],
    recipients: ['housekeeping', 'manager'],
    delivery: 'dashboard',
    charts: [
      { type: 'area', title: 'Cleaning Progress Today', data: 'cleaning_progress_hourly', x_axis: 'hour', y_axis: 'rooms' }
    ],
    filters: [
      { field: 'property_id', type: 'dropdown', label: 'Property' },
      { field: 'date', type: 'date_range', label: 'Date', default: 'today' },
      { field: 'floor', type: 'dropdown', label: 'Floor' }
    ]
  },

  maintenance_report: {
    id: 'maintenance_report',
    name: 'Vzdrževanje Poročilo',
    description: 'Maintenance tasks and issues report',
    category: 'operations',
    frequency: 'weekly',
    sections: [
      { type: 'header', title: 'Maintenance Report' },
      { type: 'summary', title: 'Weekly Summary', metrics: ['tasks_completed', 'tasks_pending', 'avg_response_time', 'cost_total'] },
      { type: 'metrics', title: 'Task Status', metrics: ['preventive_tasks', 'corrective_tasks', 'emergency_tasks'] },
      { type: 'table', title: 'Open Tasks', fields: ['location', 'issue', 'priority', 'assigned_to', 'due_date'] },
      { type: 'chart', title: 'Tasks by Type' },
      { type: 'analysis', title: 'Recurring Issues' },
      { type: 'footer' }
    ],
    recipients: ['maintenance', 'manager'],
    delivery: 'email',
    format: 'A4',
    charts: [
      { type: 'pie', title: 'Tasks by Type', data: 'tasks_by_type' },
      { type: 'bar', title: 'Tasks by Location', data: 'tasks_by_location', x_axis: 'location', y_axis: 'tasks' }
    ],
    filters: [
      { field: 'property_id', type: 'dropdown', label: 'Property' },
      { field: 'date_range', type: 'date_range', label: 'Period', default: 'last_week' },
      { field: 'priority', type: 'multi_select', label: 'Priority', options: ['low', 'medium', 'high', 'urgent'] }
    ]
  },

  // ============================================================================
  // STAFF REPORTS
  // ============================================================================

  staff_efficiency: {
    id: 'staff_efficiency',
    name: 'Efektivnost Osebja',
    description: 'Staff performance and efficiency report',
    category: 'staff',
    frequency: 'monthly',
    sections: [
      { type: 'header', title: 'Staff Efficiency Report' },
      { type: 'summary', title: 'Staff Overview', metrics: ['total_staff', 'hours_worked', 'labor_cost', 'productivity_score'] },
      { type: 'metrics', title: 'By Department', metrics: ['housekeeping_efficiency', 'reception_efficiency', 'maintenance_efficiency'] },
      { type: 'table', title: 'Staff Performance', fields: ['name', 'department', 'tasks_completed', 'avg_time', 'rating'] },
      { type: 'chart', title: 'Efficiency by Department' },
      { type: 'chart', title: 'Labor Cost Trend' },
      { type: 'analysis', title: 'Recommendations' },
      { type: 'footer' }
    ],
    recipients: ['manager', 'director', 'hr'],
    delivery: 'pdf',
    format: 'A4',
    charts: [
      { type: 'bar', title: 'Efficiency by Department', data: 'efficiency_by_dept', x_axis: 'department', y_axis: 'efficiency' },
      { type: 'line', title: 'Labor Cost Trend', data: 'labor_cost_monthly', x_axis: 'month', y_axis: 'cost' }
    ],
    filters: [
      { field: 'property_id', type: 'dropdown', label: 'Property' },
      { field: 'department', type: 'multi_select', label: 'Department', options: ['housekeeping', 'reception', 'maintenance', 'management'] },
      { field: 'date_range', type: 'date_range', label: 'Period', default: 'last_month' }
    ]
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get report template by ID
 */
export function getReportTemplate(templateId: string): ReportTemplate | undefined {
  return REPORT_TEMPLATES[templateId];
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: ReportTemplate['category']): ReportTemplate[] {
  return Object.values(REPORT_TEMPLATES).filter(
    (template) => template.category === category
  );
}

/**
 * Get templates by frequency
 */
export function getTemplatesByFrequency(frequency: ReportTemplate['frequency']): ReportTemplate[] {
  return Object.values(REPORT_TEMPLATES).filter(
    (template) => template.frequency === frequency
  );
}

/**
 * Get templates by recipient
 */
export function getTemplatesByRecipient(recipient: string): ReportTemplate[] {
  return Object.values(REPORT_TEMPLATES).filter(
    (template) => template.recipients.includes(recipient)
  );
}

/**
 * Check if template exists
 */
export function templateExists(templateId: string): boolean {
  return templateId in REPORT_TEMPLATES;
}

/**
 * Get all template IDs
 */
export const REPORT_TEMPLATE_IDS = Object.keys(REPORT_TEMPLATES);

// ============================================================================
// EXPORTS
// ============================================================================

export type { ReportTemplate, ReportSection, ChartConfig, FilterConfig };
export default REPORT_TEMPLATES;
