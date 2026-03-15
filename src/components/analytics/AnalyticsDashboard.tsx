/**
 * Analytics Dashboard Component
 * Comprehensive analytics dashboard with real-time metrics and charts
 */

"use client";

import { useState, useEffect } from 'react';
import { logger } from '@/infrastructure/observability/logger';
import { useAnalytics } from '@/hooks/use-analytics';
import { AnalyticsWidget, WidgetType, ReportType } from '@/types/analytics';
import { format, subDays, subMonths } from 'date-fns';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';

// Lazy load recharts components (saves ~150KB on initial load)
const LineChart = dynamic(() => import('recharts').then(mod => mod.LineChart), { ssr: false, loading: () => <div className="h-64 flex items-center justify-center bg-gray-100 rounded">Loading chart...</div> });
const Line = dynamic(() => import('recharts').then(mod => mod.Line), { ssr: false });
const BarChart = dynamic(() => import('recharts').then(mod => mod.BarChart), { ssr: false, loading: () => <div className="h-64 flex items-center justify-center bg-gray-100 rounded">Loading chart...</div> });
const Bar = dynamic(() => import('recharts').then(mod => mod.Bar), { ssr: false });
const PieChart = dynamic(() => import('recharts').then(mod => mod.PieChart), { ssr: false, loading: () => <div className="h-64 flex items-center justify-center bg-gray-100 rounded">Loading chart...</div> });
const Pie = dynamic(() => import('recharts').then(mod => mod.Pie), { ssr: false });
const Cell = dynamic(() => import('recharts').then(mod => mod.Cell), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });
const Legend = dynamic(() => import('recharts').then(mod => mod.Legend), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false, loading: () => <div className="h-64 flex items-center justify-center bg-gray-100 rounded">Loading chart...</div> });

interface AnalyticsDashboardProps {
  propertyId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export default function AnalyticsDashboard({ 
  propertyId, 
  autoRefresh = true, 
  refreshInterval = 5 
}: AnalyticsDashboardProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [showFilters, setShowFilters] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState<ReportType>('revenue_summary');

  const {
    dashboard,
    isLoading,
    error,
    lastUpdated,
    metrics,
    revenueAnalytics,
    occupancyAnalytics,
    guestAnalytics,
    operationalAnalytics,
    filters,
    setFilters,
    refreshData,
    generateReport,
    exportData,
    forecastRevenue,
    forecastOccupancy,
    widgets,
    addWidget,
    removeWidget,
    updateWidget,
    alerts,
    acknowledgeAlert,
    resolveAlert,
  } = useAnalytics({ propertyId, autoRefresh, refreshInterval });

  // Update filters when time range changes
  useEffect(() => {
    const endDate = new Date();
    let startDate: Date;

    switch (selectedTimeRange) {
      case '7d':
        startDate = subDays(endDate, 7);
        break;
      case '30d':
        startDate = subDays(endDate, 30);
        break;
      case '90d':
        startDate = subDays(endDate, 90);
        break;
      case '1y':
        startDate = subMonths(endDate, 12);
        break;
      default:
        startDate = subDays(endDate, 30);
    }

    setFilters({ dateRange: { start: startDate, end: endDate } });
  }, [selectedTimeRange, setFilters]);

  const handleGenerateReport = async () => {
    try {
      await generateReport(selectedReportType, 'pdf');
      setShowReportModal(false);
    } catch (error) {
      logger.error('Failed to generate report:', error);
    }
  };

  const handleExportData = async (type: string) => {
    try {
      await exportData(type, 'csv');
    } catch (error) {
      logger.error('Failed to export data:', error);
    }
  };

  const renderMetricCard = (metric: any) => {
    const isPositive = metric.change > 0;
    const changeColor = isPositive ? 'text-green-600' : 'text-red-600';
    const changeIcon = isPositive ? '↑' : '↓';

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{metric.name}</p>
            <p className="text-2xl font-semibold text-gray-900">
              {metric.unit === '$' ? '$' : ''}
              {metric.value.toLocaleString()}
              {metric.unit === '%' ? '%' : ''}
            </p>
          </div>
          <div className={`text-right ${changeColor}`}>
            <div className="flex items-center">
              <span className="text-lg font-medium">{changeIcon}</span>
              <span className="ml-1 text-sm font-medium">
                {Math.abs(metric.change * 100).toFixed(1)}%
              </span>
            </div>
            <p className="text-xs">vs last period</p>
          </div>
        </div>
      </div>
    );
  };

  const renderRevenueChart = () => {
    if (!revenueAnalytics?.revenueByMonth) return null;

    const data = revenueAnalytics.revenueByMonth.map(item => ({
      month: item.month,
      revenue: item.revenue,
      target: item.target,
      occupancy: item.occupancyRate * 100,
    }));

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue & Occupancy Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Revenue" />
            <Line yAxisId="left" type="monotone" dataKey="target" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" name="Target" />
            <Line yAxisId="right" type="monotone" dataKey="occupancy" stroke="#3b82f6" strokeWidth={2} name="Occupancy %" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderOccupancyChart = () => {
    if (!occupancyAnalytics?.roomTypeOccupancy) return null;

    const data = occupancyAnalytics.roomTypeOccupancy.map(item => ({
      roomType: item.roomType,
      occupancy: item.occupancyRate * 100,
      revenue: item.revenue,
    }));

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Occupancy by Room Type</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="roomType" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="occupancy" fill="#3b82f6" name="Occupancy %" />
            <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderGuestAnalytics = () => {
    if (!guestAnalytics) return null;

    const satisfactionData = guestAnalytics.guestFeedback.ratingDistribution.map(item => ({
      rating: `${item.rating}★`,
      count: item.count,
      percentage: item.percentage * 100,
    }));

    const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#6b7280'];

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Guest Satisfaction</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-center mb-4">
              <p className="text-3xl font-bold text-gray-900">{guestAnalytics.guestFeedback.averageRating.toFixed(1)}</p>
              <p className="text-sm text-gray-600">Average Rating</p>
              <p className="text-xs text-gray-500">Based on {guestAnalytics.guestFeedback.totalReviews} reviews</p>
            </div>
          </div>
          <div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={satisfactionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ percentage }) => `${percentage.toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {satisfactionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  const renderOperationalMetrics = () => {
    if (!operationalAnalytics) return null;

    const staffData = [
      { name: 'Staff Efficiency', value: operationalAnalytics.staffEfficiency.staffUtilization * 100 },
      { name: 'Housekeeping Quality', value: operationalAnalytics.housekeepingMetrics.cleaningQualityScore * 25 },
      { name: 'Maintenance Response', value: 100 - (operationalAnalytics.maintenanceMetrics.averageResolutionTime * 10) },
      { name: 'Check-in Satisfaction', value: operationalAnalytics.checkInMetrics.checkInSatisfaction * 20 },
    ];

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Operational Performance</h3>
        <div className="space-y-4">
          {staffData.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{item.name}</span>
                  <span className="text-sm text-gray-600">{item.value.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${Math.min(100, item.value)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (isLoading && !dashboard) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Analytics</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={refreshData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Analytics Dashboard</h1>
              {lastUpdated && (
                <span className="ml-4 text-sm text-gray-500">
                  Last updated: {format(lastUpdated, 'MMM d, yyyy HH:mm')}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Time Range Selector */}
              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                {(['7d', '30d', '90d', '1y'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setSelectedTimeRange(range)}
                    className={`px-3 py-1 text-sm font-medium rounded ${
                      selectedTimeRange === range
                        ? 'bg-white text-blue-600 shadow'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : '1 Year'}
                  </button>
                ))}
              </div>

              {/* Actions */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-2 hover:bg-gray-100 rounded-lg"
                title="Filters"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </button>

              <button
                onClick={refreshData}
                className="p-2 hover:bg-gray-100 rounded-lg"
                title="Refresh"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>

              <button
                onClick={() => setShowReportModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Generate Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="space-y-2">
            {alerts.filter(alert => !alert.acknowledged).map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border ${
                  alert.severity === 'critical' ? 'bg-red-50 border-red-200' :
                  alert.severity === 'error' ? 'bg-red-50 border-red-200' :
                  alert.severity === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <svg className={`w-5 h-5 mr-2 ${
                      alert.severity === 'critical' || alert.severity === 'error' ? 'text-red-500' :
                      alert.severity === 'warning' ? 'text-yellow-500' :
                      'text-blue-500'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{alert.title}</h4>
                      <p className="text-sm text-gray-600">{alert.message}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => acknowledgeAlert(alert.id)}
                      className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
                    >
                      Acknowledge
                    </button>
                    <button
                      onClick={() => resolveAlert(alert.id)}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Resolve
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metrics.slice(0, 4).map((metric) => (
            <div key={metric.id}>
              {renderMetricCard(metric)}
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {renderRevenueChart()}
          {renderOccupancyChart()}
        </div>

        {/* Additional Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {renderGuestAnalytics()}
          {renderOperationalMetrics()}
        </div>

        {/* Export Options */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Data</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleExportData('revenue')}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Export Revenue Data
            </button>
            <button
              onClick={() => handleExportData('occupancy')}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Export Occupancy Data
            </button>
            <button
              onClick={() => handleExportData('guests')}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Export Guest Data
            </button>
            <button
              onClick={() => handleExportData('operations')}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Export Operations Data
            </button>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">Generate Report</h3>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
                  <select
                    value={selectedReportType}
                    onChange={(e) => setSelectedReportType(e.target.value as ReportType)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="revenue_summary">Revenue Summary</option>
                    <option value="occupancy_report">Occupancy Report</option>
                    <option value="guest_analytics">Guest Analytics</option>
                    <option value="operational_efficiency">Operational Efficiency</option>
                    <option value="financial_summary">Financial Summary</option>
                    <option value="marketing_performance">Marketing Performance</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-200 px-6 py-4">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateReport}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Generate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
