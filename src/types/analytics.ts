/**
 * Analytics Types and Interfaces
 */

export interface AnalyticsMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  trend: number[];
  previousValue: number;
  targetValue?: number;
  category: MetricCategory;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export type MetricCategory = 
  | 'revenue'
  | 'occupancy'
  | 'guests'
  | 'operations'
  | 'marketing'
  | 'finance'
  | 'staff'
  | 'maintenance';

export interface RevenueAnalytics {
  totalRevenue: number;
  roomRevenue: number;
  extraRevenue: number;
  averageDailyRate: number;
  revenuePerAvailableRoom: number;
  revenueGrowth: number;
  revenueByChannel: ChannelRevenue[];
  revenueByRoomType: RoomTypeRevenue[];
  revenueByMonth: MonthlyRevenue[];
  forecastedRevenue: number;
  forecastAccuracy: number;
}

export interface ChannelRevenue {
  channel: string;
  revenue: number;
  percentage: number;
  bookings: number;
  averageBookingValue: number;
  growth: number;
}

export interface RoomTypeRevenue {
  roomType: string;
  revenue: number;
  percentage: number;
  occupancyRate: number;
  averageRate: number;
  nightsSold: number;
  growth: number;
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
  target: number;
  variance: number;
  occupancyRate: number;
  averageRate: number;
}

export interface OccupancyAnalytics {
  overallOccupancyRate: number;
  roomTypeOccupancy: RoomTypeOccupancy[];
  dailyOccupancy: DailyOccupancy[];
  weeklyOccupancy: WeeklyOccupancy[];
  monthlyOccupancy: MonthlyOccupancy[];
  forecastedOccupancy: number;
  occupancyTrend: 'increasing' | 'decreasing' | 'stable';
  peakOccupancyDays: string[];
  lowOccupancyDays: string[];
}

export interface RoomTypeOccupancy {
  roomType: string;
  occupancyRate: number;
  availableRooms: number;
  occupiedRooms: number;
  averageRate: number;
  revenue: number;
}

export interface DailyOccupancy {
  date: string;
  occupancyRate: number;
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  averageRate: number;
  revenue: number;
}

export interface WeeklyOccupancy {
  week: string;
  occupancyRate: number;
  averageRate: number;
  revenue: number;
  trend: 'up' | 'down' | 'stable';
}

export interface MonthlyOccupancy {
  month: string;
  occupancyRate: number;
  averageRate: number;
  revenue: number;
  targetOccupancy: number;
  variance: number;
}

export interface GuestAnalytics {
  totalGuests: number;
  newGuests: number;
  returningGuests: number;
  guestSatisfaction: number;
  averageStayDuration: number;
  guestDemographics: GuestDemographics;
  guestOrigin: GuestOrigin[];
  guestLoyalty: GuestLoyalty;
  guestFeedback: GuestFeedback;
  repeatBookingRate: number;
  cancellationRate: number;
}

export interface GuestDemographics {
  ageGroups: AgeGroup[];
  genderDistribution: GenderDistribution;
  nationalities: Nationality[];
  purposeOfStay: PurposeOfStay[];
}

export interface AgeGroup {
  range: string;
  count: number;
  percentage: number;
}

export interface GenderDistribution {
  gender: string;
  count: number;
  percentage: number;
}

export interface Nationality {
  country: string;
  count: number;
  percentage: number;
}

export interface PurposeOfStay {
  purpose: string;
  count: number;
  percentage: number;
}

export interface GuestOrigin {
  source: string;
  guests: number;
  percentage: number;
  growth: number;
}

export interface GuestLoyalty {
  tier: string;
  guests: number;
  percentage: number;
  averageRevenue: number;
  retentionRate: number;
}

export interface GuestFeedback {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: RatingDistribution[];
  commonIssues: FeedbackIssue[];
  positiveHighlights: FeedbackHighlight[];
  responseRate: number;
  averageResponseTime: number;
}

export interface RatingDistribution {
  rating: number;
  count: number;
  percentage: number;
}

export interface FeedbackIssue {
  category: string;
  count: number;
  percentage: number;
  trend: 'improving' | 'worsening' | 'stable';
}

export interface FeedbackHighlight {
  category: string;
  count: number;
  percentage: number;
  examples: string[];
}

export interface OperationalAnalytics {
  staffEfficiency: StaffEfficiency;
  housekeepingMetrics: HousekeepingMetrics;
  maintenanceMetrics: MaintenanceMetrics;
  checkInMetrics: CheckInMetrics;
  checkOutMetrics: CheckOutMetrics;
  energyConsumption: EnergyConsumption;
  operationalCosts: OperationalCosts;
}

export interface StaffEfficiency {
  totalStaff: number;
  staffPerRoom: number;
  laborCostPerRoom: number;
  staffUtilization: number;
  overtimeHours: number;
  staffSatisfaction: number;
  turnoverRate: number;
}

export interface HousekeepingMetrics {
  averageCleaningTime: number;
  cleaningCostPerRoom: number;
  roomsCleanedPerDay: number;
  cleaningQualityScore: number;
  supplyCosts: number;
  staffProductivity: number;
  delayRate: number;
}

export interface MaintenanceMetrics {
  totalRequests: number;
  averageResolutionTime: number;
  preventiveMaintenanceRate: number;
  emergencyMaintenanceRate: number;
  maintenanceCosts: number;
  equipmentUptime: number;
  staffResponseTime: number;
}

export interface CheckInMetrics {
  averageCheckInTime: number;
  checkInSatisfaction: number;
  lateCheckIns: number;
  checkInErrors: number;
  staffPerformance: number;
  guestWaitTime: number;
}

export interface CheckOutMetrics {
  averageCheckOutTime: number;
  checkOutSatisfaction: number;
  lateCheckOuts: number;
  roomInspectionTime: number;
  staffPerformance: number;
  guestWaitTime: number;
}

export interface EnergyConsumption {
  totalConsumption: number;
  costPerRoom: number;
  consumptionPerGuest: number;
  efficiencyScore: number;
  peakHours: string[];
  savingsOpportunities: SavingsOpportunity[];
}

export interface SavingsOpportunity {
  area: string;
  potentialSavings: number;
  implementation: string;
  priority: 'low' | 'medium' | 'high';
}

export interface OperationalCosts {
  totalCosts: number;
  costPerRoom: number;
  costPerGuest: number;
  costBreakdown: CostBreakdown[];
  trend: 'increasing' | 'decreasing' | 'stable';
  budgetVariance: number;
}

export interface CostBreakdown {
  category: string;
  amount: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

export interface AnalyticsDashboard {
  metrics: AnalyticsMetric[];
  revenueAnalytics: RevenueAnalytics;
  occupancyAnalytics: OccupancyAnalytics;
  guestAnalytics: GuestAnalytics;
  operationalAnalytics: OperationalAnalytics;
  lastUpdated: Date;
  dataRange: {
    start: Date;
    end: Date;
  };
  propertyId: string;
}

export interface AnalyticsFilter {
  dateRange: {
    start: Date;
    end: Date;
  };
  propertyId?: string;
  roomType?: string;
  channel?: string;
  guestType?: string;
  staffDepartment?: string;
}

export interface AnalyticsReport {
  id: string;
  title: string;
  type: ReportType;
  data: any;
  generatedAt: Date;
  generatedBy: string;
  filters: AnalyticsFilter;
  format: 'pdf' | 'excel' | 'csv';
  scheduled: boolean;
  recipients: string[];
}

export type ReportType = 
  | 'revenue_summary'
  | 'occupancy_report'
  | 'guest_analytics'
  | 'operational_efficiency'
  | 'financial_summary'
  | 'marketing_performance'
  | 'staff_performance'
  | 'maintenance_report';

export interface AnalyticsConfig {
  refreshInterval: number; // in minutes
  defaultDateRange: 'today' | 'week' | 'month' | 'quarter' | 'year';
  enableForecasting: boolean;
  enableRealTimeUpdates: boolean;
  enableComparisons: boolean;
  enableDrillDown: boolean;
  exportFormats: string[];
  scheduledReports: ScheduledReport[];
}

export interface ScheduledReport {
  id: string;
  name: string;
  type: ReportType;
  schedule: string; // cron expression
  recipients: string[];
  filters: AnalyticsFilter;
  format: 'pdf' | 'excel' | 'csv';
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

export interface AnalyticsEngine {
  getDashboard: (filters: AnalyticsFilter) => Promise<AnalyticsDashboard>;
  getRevenueAnalytics: (filters: AnalyticsFilter) => Promise<RevenueAnalytics>;
  getOccupancyAnalytics: (filters: AnalyticsFilter) => Promise<OccupancyAnalytics>;
  getGuestAnalytics: (filters: AnalyticsFilter) => Promise<GuestAnalytics>;
  getOperationalAnalytics: (filters: AnalyticsFilter) => Promise<OperationalAnalytics>;
  generateReport: (type: ReportType, filters: AnalyticsFilter, format: string) => Promise<AnalyticsReport>;
  forecastRevenue: (filters: AnalyticsFilter) => Promise<number>;
  forecastOccupancy: (filters: AnalyticsFilter) => Promise<number>;
  getMetrics: (category?: MetricCategory) => Promise<AnalyticsMetric[]>;
  exportData: (type: string, filters: AnalyticsFilter, format: string) => Promise<Blob>;
}

export interface AnalyticsWidget {
  id: string;
  type: WidgetType;
  title: string;
  size: WidgetSize;
  position: WidgetPosition;
  config: WidgetConfig;
  data: any;
  refreshInterval: number;
}

export type WidgetType = 
  | 'metric_card'
  | 'chart'
  | 'table'
  | 'gauge'
  | 'progress'
  | 'list'
  | 'map'
  | 'calendar';

export type WidgetSize = 'small' | 'medium' | 'large' | 'full';

export interface WidgetPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WidgetConfig {
  metric?: string;
  chartType?: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
  dataSource?: string;
  filters?: AnalyticsFilter;
  colors?: string[];
  showLegend?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;
}

export interface AnalyticsAlert {
  id: string;
  type: AlertType;
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  threshold: number;
  currentValue: number;
  triggeredAt: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
}

export type AlertType = 
  | 'occupancy_low'
  | 'occupancy_high'
  | 'revenue_decline'
  | 'cost_increase'
  | 'guest_satisfaction_low'
  | 'staff_shortage'
  | 'maintenance_overdue'
  | 'energy_high';

export interface AnalyticsSettings {
  dashboard: {
    widgets: AnalyticsWidget[];
    layout: 'grid' | 'flexible';
    autoRefresh: boolean;
    refreshInterval: number;
  };
  alerts: {
    enabled: boolean;
    thresholds: Record<AlertType, number>;
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
  };
  reports: {
    autoGenerate: boolean;
    schedule: string;
    recipients: string[];
    formats: string[];
  };
  privacy: {
    anonymizeData: boolean;
    dataRetention: number; // in days
    exportRestrictions: string[];
  };
}
