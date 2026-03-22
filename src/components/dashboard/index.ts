/**
 * Dashboard Components Index
 * 
 * Central export for all dashboard components and templates
 */

export {
  WIDGET_TEMPLATES,
  DASHBOARD_TEMPLATES,
  WIDGET_TEMPLATE_IDS,
  DASHBOARD_TEMPLATE_IDS,
  createDashboardFromTemplate,
  getWidgetsForRole,
  getWidgetByType,
  getDashboardByRole,
  getWidgetsByCategory,
  widgetExists,
  getWidgetRefreshInterval,
  type WidgetTemplate,
  type DashboardTemplate,
  type WidgetPosition,
  type WidgetConfig,
} from './widget-templates';

// Future component exports
// export { DashboardGrid } from './DashboardGrid';
// export { WidgetCard } from './WidgetCard';
// export { DashboardEditor } from './DashboardEditor';
