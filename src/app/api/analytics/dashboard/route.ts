/**
 * API Route for Analytics Dashboard
 * Provides comprehensive analytics data for the dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { AnalyticsFilter, AnalyticsDashboard } from '@/types/analytics';
import { z } from 'zod';

// Zod schema for analytics filters
const analyticsFilterSchema = z.object({
  dateRange: z.object({
    start: z.date().or(z.string()),
    end: z.date().or(z.string()),
  }),
  propertyId: z.string().optional(),
  category: z.string().optional(),
});

// Zod schema for dashboard actions
const dashboardActionSchema = z.object({
  filters: analyticsFilterSchema,
  action: z.enum(['refresh', 'export', 'reset']),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const propertyId = searchParams.get('propertyId');
    const category = searchParams.get('category');

    // Validate required parameters
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required query parameters: startDate, endDate' },
        { status: 400 }
      );
    }

    // Parse dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    if (start >= end) {
      return NextResponse.json(
        { error: 'Start date must be before end date' },
        { status: 400 }
      );
    }

    // Create filter object
    const filters: AnalyticsFilter = {
      dateRange: { start, end },
      propertyId: propertyId || undefined,
    };

    // Generate mock analytics data
    const dashboardData = await generateMockDashboardData(filters);

    return NextResponse.json({
      success: true,
      data: dashboardData,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Analytics dashboard error:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to load analytics data',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate with Zod
    const validatedData = dashboardActionSchema.parse(body);
    const { filters, action } = validatedData;
    
    const start = new Date(filters.dateRange.start);
    const end = new Date(filters.dateRange.end);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format in filters' },
        { status: 400 }
      );
    }

    // Handle different actions
    switch (action) {
      case 'refresh':
        const dashboardData = await generateMockDashboardData(filters);
        return NextResponse.json({
          success: true,
          data: dashboardData,
          timestamp: new Date().toISOString(),
        });

      case 'export':
        // Handle data export
        const exportData = await generateExportData(filters);
        return NextResponse.json({
          success: true,
          data: exportData,
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Analytics dashboard POST error:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to process request',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * Generate mock dashboard data
 * In production, this would query the actual database
 */
async function generateMockDashboardData(filters: AnalyticsFilter): Promise<AnalyticsDashboard> {
  const days = Math.ceil((filters.dateRange.end.getTime() - filters.dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
  
  // Generate mock metrics
  const metrics = [
    {
      id: 'total_revenue',
      name: 'Total Revenue',
      value: 125000 + Math.random() * 50000,
      unit: '$',
      change: 0.05 + Math.random() * 0.1,
      changeType: 'increase' as const,
      trend: Array.from({ length: 7 }, (_, i) => 100000 + i * 5000 + Math.random() * 10000),
      previousValue: 115741,
      category: 'revenue' as const,
      priority: 'high' as const,
    },
    {
      id: 'occupancy_rate',
      name: 'Occupancy Rate',
      value: 75 + Math.random() * 20,
      unit: '%',
      change: -0.02 + Math.random() * 0.08,
      changeType: 'increase' as const,
      trend: Array.from({ length: 7 }, (_, i) => 70 + i * 1 + Math.random() * 5),
      previousValue: 76.2,
      category: 'occupancy' as const,
      priority: 'high' as const,
    },
    {
      id: 'guest_satisfaction',
      name: 'Guest Satisfaction',
      value: 4.0 + Math.random() * 0.8,
      unit: '★',
      change: 0.01 + Math.random() * 0.05,
      changeType: 'increase' as const,
      trend: Array.from({ length: 7 }, (_, i) => 4.0 + i * 0.02 + Math.random() * 0.1),
      previousValue: 4.09,
      category: 'guests' as const,
      priority: 'medium' as const,
    },
    {
      id: 'staff_efficiency',
      name: 'Staff Efficiency',
      value: 80 + Math.random() * 15,
      unit: '%',
      change: -0.05 + Math.random() * 0.1,
      changeType: 'decrease' as const,
      trend: Array.from({ length: 7 }, (_, i) => 82 + i * -0.5 + Math.random() * 3),
      previousValue: 86.9,
      category: 'operations' as const,
      priority: 'medium' as const,
    },
  ];

  // Generate mock revenue analytics
  const revenueAnalytics = {
    totalRevenue: 125000 + Math.random() * 50000,
    roomRevenue: 100000 + Math.random() * 40000,
    extraRevenue: 25000 + Math.random() * 10000,
    averageDailyRate: 150 + Math.random() * 50,
    revenuePerAvailableRoom: 120 + Math.random() * 40,
    revenueGrowth: 0.05 + Math.random() * 0.1,
    revenueByChannel: [
      { channel: 'direct', revenue: 50000, percentage: 0.4, bookings: 200, averageBookingValue: 250, growth: 0.08 },
      { channel: 'booking.com', revenue: 37500, percentage: 0.3, bookings: 150, averageBookingValue: 250, growth: 0.05 },
      { channel: 'airbnb', revenue: 25000, percentage: 0.2, bookings: 100, averageBookingValue: 250, growth: 0.12 },
      { channel: 'expedia', revenue: 12500, percentage: 0.1, bookings: 50, averageBookingValue: 250, growth: 0.03 },
    ],
    revenueByRoomType: [
      { roomType: 'standard', revenue: 50000, percentage: 0.4, occupancyRate: 0.75, averageRate: 100, nightsSold: 500, growth: 0.06 },
      { roomType: 'deluxe', revenue: 50000, percentage: 0.4, occupancyRate: 0.80, averageRate: 150, nightsSold: 333, growth: 0.08 },
      { roomType: 'suite', revenue: 25000, percentage: 0.2, occupancyRate: 0.85, averageRate: 200, nightsSold: 125, growth: 0.10 },
    ],
    revenueByMonth: generateMonthlyRevenue(filters.dateRange),
    forecastedRevenue: 130000 + Math.random() * 50000,
    forecastAccuracy: 0.85 + Math.random() * 0.1,
  };

  // Generate mock occupancy analytics
  const occupancyAnalytics = {
    overallOccupancyRate: 0.75 + Math.random() * 0.2,
    roomTypeOccupancy: [
      { roomType: 'standard', occupancyRate: 0.70 + Math.random() * 0.15, availableRooms: 50, occupiedRooms: 38, averageRate: 100, revenue: 3800 },
      { roomType: 'deluxe', occupancyRate: 0.75 + Math.random() * 0.15, availableRooms: 30, occupiedRooms: 24, averageRate: 150, revenue: 3600 },
      { roomType: 'suite', occupancyRate: 0.80 + Math.random() * 0.15, availableRooms: 20, occupiedRooms: 17, averageRate: 200, revenue: 3400 },
    ],
    dailyOccupancy: generateDailyOccupancy(filters.dateRange),
    weeklyOccupancy: generateWeeklyOccupancy(filters.dateRange),
    monthlyOccupancy: generateMonthlyOccupancy(filters.dateRange),
    forecastedOccupancy: 0.78 + Math.random() * 0.12,
    occupancyTrend: ['increasing', 'decreasing', 'stable'][Math.floor(Math.random() * 3)] as any,
    peakOccupancyDays: ['2024-01-15', '2024-01-20', '2024-01-25'],
    lowOccupancyDays: ['2024-01-10', '2024-01-22', '2024-01-30'],
  };

  // Generate mock guest analytics
  const guestAnalytics = {
    totalGuests: 1000 + Math.floor(Math.random() * 500),
    newGuests: 600 + Math.floor(Math.random() * 200),
    returningGuests: 400 + Math.floor(Math.random() * 200),
    guestSatisfaction: 4.2 + Math.random() * 0.6,
    averageStayDuration: 2.5 + Math.random() * 1.5,
    guestDemographics: {
      ageGroups: [
        { range: '18-25', count: 150, percentage: 0.15 },
        { range: '26-35', count: 300, percentage: 0.30 },
        { range: '36-45', count: 250, percentage: 0.25 },
        { range: '46-55', count: 200, percentage: 0.20 },
        { range: '56+', count: 100, percentage: 0.10 },
      ],
      genderDistribution: [
        { gender: 'male', count: 520, percentage: 0.52 },
        { gender: 'female', count: 480, percentage: 0.48 },
      ],
      nationalities: [
        { country: 'United States', count: 400, percentage: 0.40 },
        { country: 'United Kingdom', count: 200, percentage: 0.20 },
        { country: 'Germany', count: 150, percentage: 0.15 },
        { country: 'France', count: 100, percentage: 0.10 },
        { country: 'Other', count: 150, percentage: 0.15 },
      ],
      purposeOfStay: [
        { purpose: 'business', count: 400, percentage: 0.40 },
        { purpose: 'leisure', count: 350, percentage: 0.35 },
        { purpose: 'family', count: 150, percentage: 0.15 },
        { purpose: 'other', count: 100, percentage: 0.10 },
      ],
    },
    guestOrigin: [
      { source: 'direct', guests: 400, percentage: 0.40, growth: 0.08 },
      { source: 'booking.com', guests: 300, percentage: 0.30, growth: 0.05 },
      { source: 'airbnb', guests: 200, percentage: 0.20, growth: 0.12 },
      { source: 'expedia', guests: 100, percentage: 0.10, growth: 0.03 },
    ],
    guestLoyalty: [
      { tier: 'bronze', guests: 500, percentage: 0.50, averageRevenue: 200, retentionRate: 0.60 },
      { tier: 'silver', guests: 300, percentage: 0.30, averageRevenue: 300, retentionRate: 0.75 },
      { tier: 'gold', guests: 150, percentage: 0.15, averageRevenue: 500, retentionRate: 0.85 },
      { tier: 'platinum', guests: 50, percentage: 0.05, averageRevenue: 800, retentionRate: 0.95 },
    ],
    guestFeedback: {
      averageRating: 4.3 + Math.random() * 0.4,
      totalReviews: 450 + Math.floor(Math.random() * 100),
      ratingDistribution: [
        { rating: 5, count: 200, percentage: 0.44 },
        { rating: 4, count: 150, percentage: 0.33 },
        { rating: 3, count: 80, percentage: 0.18 },
        { rating: 2, count: 15, percentage: 0.03 },
        { rating: 1, count: 5, percentage: 0.01 },
      ],
      commonIssues: [
        { category: 'cleanliness', count: 20, percentage: 0.04, trend: 'improving' as const },
        { category: 'noise', count: 15, percentage: 0.03, trend: 'stable' as const },
        { category: 'service', count: 10, percentage: 0.02, trend: 'worsening' as const },
      ],
      positiveHighlights: [
        { category: 'location', count: 100, percentage: 0.22, examples: ['Great location', 'Close to attractions'] },
        { category: 'staff', count: 80, percentage: 0.18, examples: ['Friendly staff', 'Helpful service'] },
        { category: 'cleanliness', count: 60, percentage: 0.13, examples: ['Very clean', 'Well maintained'] },
      ],
      responseRate: 0.85 + Math.random() * 0.1,
      averageResponseTime: 2.5 + Math.random() * 2,
    },
    repeatBookingRate: 0.35 + Math.random() * 0.15,
    cancellationRate: 0.08 + Math.random() * 0.04,
  };

  // Generate mock operational analytics
  const operationalAnalytics = {
    staffEfficiency: {
      totalStaff: 25,
      staffPerRoom: 0.25,
      laborCostPerRoom: 35 + Math.random() * 10,
      staffUtilization: 0.85 + Math.random() * 0.1,
      overtimeHours: 40 + Math.floor(Math.random() * 20),
      staffSatisfaction: 4.0 + Math.random() * 0.5,
      turnoverRate: 0.15 + Math.random() * 0.1,
    },
    housekeepingMetrics: {
      averageCleaningTime: 25 + Math.random() * 10,
      cleaningCostPerRoom: 15 + Math.random() * 5,
      roomsCleanedPerDay: 20 + Math.floor(Math.random() * 10),
      cleaningQualityScore: 4.5 + Math.random() * 0.3,
      supplyCosts: 500 + Math.random() * 200,
      staffProductivity: 0.90 + Math.random() * 0.08,
      delayRate: 0.05 + Math.random() * 0.03,
    },
    maintenanceMetrics: {
      totalRequests: 50 + Math.floor(Math.random() * 20),
      averageResolutionTime: 2.5 + Math.random() * 1.5,
      preventiveMaintenanceRate: 0.70 + Math.random() * 0.15,
      emergencyMaintenanceRate: 0.10 + Math.random() * 0.05,
      maintenanceCosts: 5000 + Math.random() * 2000,
      equipmentUptime: 0.95 + Math.random() * 0.03,
      staffResponseTime: 0.5 + Math.random() * 0.5,
    },
    checkInMetrics: {
      averageCheckInTime: 8 + Math.random() * 4,
      checkInSatisfaction: 4.3 + Math.random() * 0.4,
      lateCheckIns: 5 + Math.floor(Math.random() * 5),
      checkInErrors: 2 + Math.floor(Math.random() * 3),
      staffPerformance: 4.2 + Math.random() * 0.3,
      guestWaitTime: 3 + Math.random() * 2,
    },
    checkOutMetrics: {
      averageCheckOutTime: 6 + Math.random() * 3,
      checkOutSatisfaction: 4.4 + Math.random() * 0.3,
      lateCheckOuts: 8 + Math.floor(Math.random() * 5),
      roomInspectionTime: 15 + Math.random() * 5,
      staffPerformance: 4.3 + Math.random() * 0.3,
      guestWaitTime: 2 + Math.random() * 2,
    },
    energyConsumption: {
      totalConsumption: 15000 + Math.random() * 5000,
      costPerRoom: 25 + Math.random() * 10,
      consumptionPerGuest: 15 + Math.random() * 5,
      efficiencyScore: 0.80 + Math.random() * 0.15,
      peakHours: ['18:00', '19:00', '20:00'],
      savingsOpportunities: [
        { area: 'Lighting', potentialSavings: 500, implementation: 'LED upgrade', priority: 'high' as const },
        { area: 'HVAC', potentialSavings: 800, implementation: 'Smart thermostat', priority: 'medium' as const },
      ],
    },
    operationalCosts: {
      totalCosts: 50000 + Math.random() * 10000,
      costPerRoom: 50 + Math.random() * 10,
      costPerGuest: 45 + Math.random() * 8,
      costBreakdown: [
        { category: 'staff', amount: 20000, percentage: 0.40, trend: 'up' as const },
        { category: 'maintenance', amount: 8000, percentage: 0.16, trend: 'stable' as const },
        { category: 'utilities', amount: 12000, percentage: 0.24, trend: 'down' as const },
        { category: 'supplies', amount: 5000, percentage: 0.10, trend: 'stable' as const },
        { category: 'other', amount: 5000, percentage: 0.10, trend: 'up' as const },
      ],
      trend: ['increasing', 'decreasing', 'stable'][Math.floor(Math.random() * 3)] as any,
      budgetVariance: 0.05 + Math.random() * 0.1,
    },
  };

  return {
    metrics,
    revenueAnalytics,
    occupancyAnalytics,
    guestAnalytics,
    operationalAnalytics,
    lastUpdated: new Date(),
    dataRange: filters.dateRange,
    propertyId: filters.propertyId || 'all',
  };
}

/**
 * Generate export data
 */
async function generateExportData(filters: AnalyticsFilter): Promise<any> {
  const dashboardData = await generateMockDashboardData(filters);
  
  return {
    metrics: dashboardData.metrics,
    revenueAnalytics: dashboardData.revenueAnalytics,
    occupancyAnalytics: dashboardData.occupancyAnalytics,
    guestAnalytics: dashboardData.guestAnalytics,
    operationalAnalytics: dashboardData.operationalAnalytics,
    exportDate: new Date().toISOString(),
    filters,
  };
}

/**
 * Helper functions for generating mock data
 */
function generateMonthlyRevenue(dateRange: { start: Date; end: Date }): any[] {
  const months = [];
  const current = new Date(dateRange.start);
  
  while (current <= dateRange.end) {
    const revenue = 10000 + Math.random() * 5000;
    const target = 9500 + Math.random() * 3000;
    
    months.push({
      month: current.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      revenue,
      target,
      variance: (revenue - target) / target,
      occupancyRate: 0.75 + Math.random() * 0.15,
      averageRate: 120 + Math.random() * 40,
    });
    
    current.setMonth(current.getMonth() + 1);
  }
  
  return months;
}

function generateDailyOccupancy(dateRange: { start: Date; end: Date }): any[] {
  const days = [];
  const current = new Date(dateRange.start);
  
  while (current <= dateRange.end) {
    const occupancyRate = 0.70 + Math.random() * 0.25;
    const totalRooms = 100;
    const occupiedRooms = Math.floor(totalRooms * occupancyRate);
    
    days.push({
      date: current.toISOString().split('T')[0],
      occupancyRate,
      totalRooms,
      occupiedRooms,
      availableRooms: totalRooms - occupiedRooms,
      averageRate: 120 + Math.random() * 40,
      revenue: occupiedRooms * (120 + Math.random() * 40),
    });
    
    current.setDate(current.getDate() + 1);
  }
  
  return days;
}

function generateWeeklyOccupancy(dateRange: { start: Date; end: Date }): any[] {
  const weeks = [];
  const current = new Date(dateRange.start);
  
  while (current <= dateRange.end) {
    const weekNumber = Math.ceil(current.getDate() / 7);
    const occupancyRate = 0.70 + Math.random() * 0.25;
    
    weeks.push({
      week: `Week ${weekNumber}`,
      occupancyRate,
      averageRate: 120 + Math.random() * 40,
      revenue: 5000 + Math.random() * 2000,
      trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as any,
    });
    
    current.setDate(current.getDate() + 7);
  }
  
  return weeks;
}

function generateMonthlyOccupancy(dateRange: { start: Date; end: Date }): any[] {
  const months = [];
  const current = new Date(dateRange.start);
  
  while (current <= dateRange.end) {
    const occupancyRate = 0.70 + Math.random() * 0.25;
    const targetOccupancy = 0.75 + Math.random() * 0.15;
    
    months.push({
      month: current.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      occupancyRate,
      averageRate: 120 + Math.random() * 40,
      revenue: 15000 + Math.random() * 5000,
      targetOccupancy,
      variance: (occupancyRate - targetOccupancy) / targetOccupancy,
    });
    
    current.setMonth(current.getMonth() + 1);
  }
  
  return months;
}
