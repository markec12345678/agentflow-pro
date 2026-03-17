import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/infrastructure/observability/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getUserId } from '@/lib/auth-users';
import { prisma } from '@/database/schema';

export const dynamic = "force-dynamic";

interface PaymentStatistics {
  totalRevenue: number;
  totalPayments: number;
  completedPayments: number;
  pendingPayments: number;
  failedPayments: number;
  refundedAmount: number;
  averagePaymentAmount: number;
  revenueByPaymentMethod: {
    [method: string]: number;
  };
  revenueByProperty: {
    [propertyId: string]: {
      propertyName: string;
      revenue: number;
    };
  };
  revenueByTimePeriod: {
    daily: { date: string; revenue: number }[];
    weekly: { week: string; revenue: number }[];
    monthly: { month: string; revenue: number }[];
  };
  paymentStatusBreakdown: {
    [status: string]: number;
  };
}

/**
 * GET /api/payments/statistics
 * Get payment statistics and analytics
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Check if user has access (receptor, director, admin)
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!currentUser || !['admin', 'director', 'receptor'].includes(currentUser.role)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Receptor, Director, or Admin access required' } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const period = searchParams.get('period') || '30'; // Default to last 30 days

    // Calculate date range
    const toDate = dateTo ? new Date(dateTo) : new Date();
    const fromDate = dateFrom ? new Date(dateFrom) : new Date(toDate.getTime() - parseInt(period) * 24 * 60 * 60 * 1000);

    // Generate mock statistics (in real implementation, this would query the database)
    const mockStatistics: PaymentStatistics = {
      totalRevenue: 15420.50,
      totalPayments: 45,
      completedPayments: 38,
      pendingPayments: 4,
      failedPayments: 3,
      refundedAmount: 1250.00,
      averagePaymentAmount: 342.68,
      revenueByPaymentMethod: {
        "credit_card": 8920.00,
        "bank_transfer": 3450.50,
        "paypal": 2050.00,
        "cash": 1000.00
      },
      revenueByProperty: {
        "prop_1": {
          propertyName: "Hotel Alpina",
          revenue: 9870.50
        },
        "prop_2": {
          propertyName: "Alpine Resort",
          revenue: 5550.00
        }
      },
      revenueByTimePeriod: {
        daily: generateDailyRevenue(fromDate, toDate),
        weekly: generateWeeklyRevenue(fromDate, toDate),
        monthly: generateMonthlyRevenue(fromDate, toDate)
      },
      paymentStatusBreakdown: {
        "completed": 38,
        "pending": 4,
        "failed": 3,
        "refunded": 0,
        "partially_refunded": 0
      }
    };

    return NextResponse.json({
      success: true,
      data: {
        statistics: mockStatistics,
        period: {
          from: fromDate.toISOString(),
          to: toDate.toISOString(),
          days: Math.ceil((toDate.getTime() - fromDate.getTime()) / (24 * 60 * 60 * 1000))
        }
      }
    });

  } catch (error) {
    logger.error('Get payment statistics error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }

function generateDailyRevenue(fromDate: Date, toDate: Date): { date: string; revenue: number }[] {
  const dailyData = [];
  const currentDate = new Date(fromDate);
  
  while (currentDate <= toDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const revenue = Math.random() * 1000 + 200; // Random revenue between 200-1200
    dailyData.push({ date: dateStr, revenue });
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dailyData;
}

function generateWeeklyRevenue(fromDate: Date, toDate: Date): { week: string; revenue: number }[] {
  const weeklyData = [];
  const currentDate = new Date(fromDate);
  
  while (currentDate <= toDate) {
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    const weekStr = `${weekStart.toISOString().split('T')[0]} - ${weekEnd.toISOString().split('T')[0]}`;
    const revenue = Math.random() * 5000 + 1000; // Random revenue between 1000-6000
    weeklyData.push({ week: weekStr, revenue });
    
    currentDate.setDate(currentDate.getDate() + 7);
  }
  
  return weeklyData;
}

function generateMonthlyRevenue(fromDate: Date, toDate: Date): { month: string; revenue: number }[] {
  const monthlyData = [];
  const currentDate = new Date(fromDate);
  
  while (currentDate <= toDate) {
    const monthStr = currentDate.toISOString().substring(0, 7); // YYYY-MM format
    const revenue = Math.random() * 20000 + 5000; // Random revenue between 5000-25000
    monthlyData.push({ month: monthStr, revenue });
    
    currentDate.setMonth(currentDate.getMonth() + 1);
    currentDate.setDate(1);
  }
  
  return monthlyData;
}
}
