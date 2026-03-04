/**
 * React Hook for Analytics
 */

import { useState, useEffect, useCallback } from 'react';
import {
  AnalyticsDashboard,
  AnalyticsFilter,
  RevenueAnalytics,
  OccupancyAnalytics,
  GuestAnalytics,
  OperationalAnalytics,
  AnalyticsMetric,
  MetricCategory,
  AnalyticsReport,
  ReportType,
  AnalyticsWidget,
  AnalyticsEngine,
  AnalyticsAlert,
  AlertType,
} from '@/types/analytics';
import { AnalyticsEngineImpl } from '@/lib/analytics/AnalyticsEngine';
import { toast } from 'sonner';

interface UseAnalyticsOptions {
  propertyId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // in minutes
}

interface UseAnalyticsReturn {
  // State
  dashboard: AnalyticsDashboard | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  
  // Data
  metrics: AnalyticsMetric[];
  revenueAnalytics: RevenueAnalytics | null;
  occupancyAnalytics: OccupancyAnalytics | null;
  guestAnalytics: GuestAnalytics | null;
  operationalAnalytics: OperationalAnalytics | null;
  
  // Filters
  filters: AnalyticsFilter;
  setFilters: (filters: Partial<AnalyticsFilter>) => void;
  
  // Actions
  refreshData: () => Promise<void>;
  generateReport: (type: ReportType, format?: string) => Promise<AnalyticsReport>;
  exportData: (type: string, format?: string) => Promise<Blob>;
  forecastRevenue: () => Promise<number>;
  forecastOccupancy: () => Promise<number>;
  
  // Widgets
  widgets: AnalyticsWidget[];
  addWidget: (widget: Omit<AnalyticsWidget, 'id'>) => void;
  removeWidget: (widgetId: string) => void;
  updateWidget: (widgetId: string, updates: Partial<AnalyticsWidget>) => void;
  
  // Alerts
  alerts: AnalyticsAlert[];
  acknowledgeAlert: (alertId: string) => void;
  resolveAlert: (alertId: string) => void;
}

const defaultFilter: AnalyticsFilter = {
  dateRange: {
    start: new Date(new Date().setDate(new Date().getDate() - 30)), // 30 days ago
    end: new Date(),
  },
};

export function useAnalytics({ 
  propertyId, 
  autoRefresh = true, 
  refreshInterval = 5 
}: UseAnalyticsOptions = {}): UseAnalyticsReturn {
  const [dashboard, setDashboard] = useState<AnalyticsDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [filters, setFilters] = useState<AnalyticsFilter>(defaultFilter);
  const [widgets, setWidgets] = useState<AnalyticsWidget[]>([]);
  const [alerts, setAlerts] = useState<AnalyticsAlert[]>([]);
  const [analyticsEngine] = useState<AnalyticsEngine | null>(null);

  // Initialize analytics engine
  useEffect(() => {
    const engine = new AnalyticsEngineImpl();
    setAnalyticsEngine(engine);
    
    // Initialize default widgets
    const defaultWidgets: AnalyticsWidget[] = [
      {
        id: 'revenue_card',
        type: 'metric_card',
        title: 'Total Revenue',
        size: 'medium',
        position: { x: 0, y: 0, width: 2, height: 1 },
        config: {
          metric: 'total_revenue',
          colors: ['#10b981'],
        },
        data: null,
        refreshInterval: 5,
      },
      {
        id: 'occupancy_card',
        type: 'metric_card',
        title: 'Occupancy Rate',
        size: 'medium',
        position: { x: 2, y: 0, width: 2, height: 1 },
        config: {
          metric: 'occupancy_rate',
          colors: ['#3b82f6'],
        },
        data: null,
        refreshInterval: 5,
      },
      {
        id: 'revenue_chart',
        type: 'chart',
        title: 'Revenue Trend',
        size: 'large',
        position: { x: 0, y: 1, width: 4, height: 2 },
        config: {
          chartType: 'line',
          dataSource: 'revenue',
          colors: ['#10b981', '#3b82f6', '#f59e0b'],
          showLegend: true,
          showGrid: true,
        },
        data: null,
        refreshInterval: 15,
      },
      {
        id: 'occupancy_chart',
        type: 'chart',
        title: 'Occupancy by Room Type',
        size: 'large',
        position: { x: 0, y: 3, width: 4, height: 2 },
        config: {
          chartType: 'bar',
          dataSource: 'occupancy',
          colors: ['#3b82f6', '#10b981', '#f59e0b'],
          showLegend: true,
          showGrid: false,
        },
        data: null,
        refreshInterval: 15,
      },
    ];
    setWidgets(defaultWidgets);
    
    // Initialize default alerts
    const defaultAlerts: AnalyticsAlert[] = [
      {
        id: 'low_occupancy',
        type: 'occupancy_low',
        severity: 'warning',
        title: 'Low Occupancy Alert',
        message: 'Occupancy rate is below 60% for the next 7 days',
        threshold: 60,
        currentValue: 55,
        triggeredAt: new Date(),
        acknowledged: false,
        resolved: false,
      },
    ];
    setAlerts(defaultAlerts);
  }, []);

  // Load initial data
  useEffect(() => {
    if (analyticsEngine) {
      refreshData();
    }
  }, [analyticsEngine, filters]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !analyticsEngine) return;

    const interval = setInterval(() => {
      refreshData();
    }, refreshInterval * 60 * 1000); // Convert minutes to milliseconds

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, analyticsEngine]);

  // Update filters
  const handleSetFilters = useCallback((newFilters: Partial<AnalyticsFilter>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Refresh data
  const refreshData = useCallback(async () => {
    if (!analyticsEngine) return;

    setIsLoading(true);
    setError(null);

    try {
      const currentFilters = propertyId 
        ? { ...filters, propertyId }
        : filters;

      const dashboardData = await analyticsEngine.getDashboard(currentFilters);
      
      setDashboard(dashboardData);
      setLastUpdated(dashboardData.lastUpdated);
      
      // Update widgets with new data
      const updatedWidgets = widgets.map(widget => ({
        ...widget,
        data: getWidgetData(widget, dashboardData),
      }));
      setWidgets(updatedWidgets);
      
      // Check for alerts
      await checkAlerts(dashboardData);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load analytics data';
      setError(errorMessage);
      toast.error('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  }, [analyticsEngine, filters, widgets, propertyId]);

  // Generate report
  const generateReport = useCallback(async (
    type: ReportType, 
    format: string = 'pdf'
  ): Promise<AnalyticsReport> => {
    if (!analyticsEngine) {
      throw new Error('Analytics engine not initialized');
    }

    try {
      const currentFilters = propertyId 
        ? { ...filters, propertyId }
        : filters;

      const report = await analyticsEngine.generateReport(type, currentFilters, format);
      
      toast.success(`Report "${report.title}" generated successfully`);
      return report;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate report';
      toast.error('Failed to generate report');
      throw err;
    }
  }, [analyticsEngine, filters, propertyId]);

  // Export data
  const exportData = useCallback(async (
    type: string, 
    format: string = 'csv'
  ): Promise<Blob> => {
    if (!analyticsEngine) {
      throw new Error('Analytics engine not initialized');
    }

    try {
      const currentFilters = propertyId 
        ? { ...filters, propertyId }
        : filters;

      const blob = await analyticsEngine.exportData(type, currentFilters, format);
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_analytics.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`Data exported successfully as ${format.toUpperCase()}`);
      return blob;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export data';
      toast.error('Failed to export data');
      throw err;
    }
  }, [analyticsEngine, filters, propertyId]);

  // Forecast revenue
  const forecastRevenue = useCallback(async (): Promise<number> => {
    if (!analyticsEngine) {
      throw new Error('Analytics engine not initialized');
    }

    try {
      const currentFilters = propertyId 
        ? { ...filters, propertyId }
        : filters;

      const forecast = await analyticsEngine.forecastRevenue(currentFilters);
      toast.success(`Revenue forecast: $${forecast.toFixed(2)}`);
      return forecast;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to forecast revenue';
      toast.error('Failed to forecast revenue');
      throw err;
    }
  }, [analyticsEngine, filters, propertyId]);

  // Forecast occupancy
  const forecastOccupancy = useCallback(async (): Promise<number> => {
    if (!analyticsEngine) {
      throw new Error('Analytics engine not initialized');
    }

    try {
      const currentFilters = propertyId 
        ? { ...filters, propertyId }
        : filters;

      const forecast = await analyticsEngine.forecastOccupancy(currentFilters);
      toast.success(`Occupancy forecast: ${(forecast * 100).toFixed(1)}%`);
      return forecast;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to forecast occupancy';
      toast.error('Failed to forecast occupancy');
      throw err;
    }
  }, [analyticsEngine, filters, propertyId]);

  // Widget management
  const addWidget = useCallback((widget: Omit<AnalyticsWidget, 'id'>) => {
    const newWidget: AnalyticsWidget = {
      ...widget,
      id: `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      data: dashboard ? getWidgetData(widget, dashboard) : null,
    };
    
    setWidgets(prev => [...prev, newWidget]);
    toast.success('Widget added successfully');
  }, [dashboard]);

  const removeWidget = useCallback((widgetId: string) => {
    setWidgets(prev => prev.filter(w => w.id !== widgetId));
    toast.success('Widget removed successfully');
  }, []);

  const updateWidget = useCallback((widgetId: string, updates: Partial<AnalyticsWidget>) => {
    setWidgets(prev => prev.map(widget => 
      widget.id === widgetId 
        ? { ...widget, ...updates, data: dashboard ? getWidgetData({ ...widget, ...updates }, dashboard) : widget.data }
        : widget
    ));
    toast.success('Widget updated successfully');
  }, [dashboard]);

  // Alert management
  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, acknowledged: true, acknowledgedAt: new Date() }
        : alert
    ));
    toast.success('Alert acknowledged');
  }, []);

  const resolveAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, resolved: true, resolvedAt: new Date() }
        : alert
    ));
    toast.success('Alert resolved');
  }, []);

  // Helper functions
  const getWidgetData = (widget: AnalyticsWidget, dashboard: AnalyticsDashboard): any => {
    switch (widget.config.dataSource) {
      case 'revenue':
        return dashboard.revenueAnalytics;
      case 'occupancy':
        return dashboard.occupancyAnalytics;
      case 'guests':
        return dashboard.guestAnalytics;
      case 'operations':
        return dashboard.operationalAnalytics;
      default:
        return dashboard.metrics.find(m => m.id === widget.config.metric);
    }
  };

  const checkAlerts = async (dashboardData: AnalyticsDashboard) => {
    const newAlerts: AnalyticsAlert[] = [];

    // Check occupancy alert
    if (dashboardData.occupancyAnalytics.overallOccupancyRate < 0.6) {
      newAlerts.push({
        id: 'low_occupancy',
        type: 'occupancy_low',
        severity: 'warning',
        title: 'Low Occupancy Alert',
        message: 'Occupancy rate is below 60%',
        threshold: 60,
        currentValue: dashboardData.occupancyAnalytics.overallOccupancyRate * 100,
        triggeredAt: new Date(),
        acknowledged: false,
        resolved: false,
      });
    }

    // Check revenue alert
    const revenueGrowth = dashboardData.revenueAnalytics.revenueGrowth;
    if (revenueGrowth < 0) {
      newAlerts.push({
        id: 'revenue_decline',
        type: 'revenue_decline',
        severity: 'error',
        title: 'Revenue Decline Alert',
        message: `Revenue declined by ${(revenueGrowth * 100).toFixed(1)}%`,
        threshold: 0,
        currentValue: revenueGrowth * 100,
        triggeredAt: new Date(),
        acknowledged: false,
        resolved: false,
      });
    }

    // Check guest satisfaction alert
    if (dashboardData.guestAnalytics.guestSatisfaction < 4.0) {
      newAlerts.push({
        id: 'guest_satisfaction_low',
        type: 'guest_satisfaction_low',
        severity: 'warning',
        title: 'Guest Satisfaction Alert',
        message: 'Guest satisfaction is below 4.0',
        threshold: 4.0,
        currentValue: dashboardData.guestAnalytics.guestSatisfaction,
        triggeredAt: new Date(),
        acknowledged: false,
        resolved: false,
      });
    }

    setAlerts(newAlerts);
  };

  return {
    // State
    dashboard,
    isLoading,
    error,
    lastUpdated,
    
    // Data
    metrics: dashboard?.metrics || [],
    revenueAnalytics: dashboard?.revenueAnalytics || null,
    occupancyAnalytics: dashboard?.occupancyAnalytics || null,
    guestAnalytics: dashboard?.guestAnalytics || null,
    operationalAnalytics: dashboard?.operationalAnalytics || null,
    
    // Filters
    filters,
    setFilters: handleSetFilters,
    
    // Actions
    refreshData,
    generateReport,
    exportData,
    forecastRevenue,
    forecastOccupancy,
    
    // Widgets
    widgets,
    addWidget,
    removeWidget,
    updateWidget,
    
    // Alerts
    alerts,
    acknowledgeAlert,
    resolveAlert,
  };
}
