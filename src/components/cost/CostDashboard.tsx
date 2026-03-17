'use client';

import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, PieChart, BarChart3, Clock } from 'lucide-react';

interface BudgetStatus {
  budget: number;
  spent: number;
  remaining: number;
  percentageUsed: number;
  status: 'ok' | 'warning' | 'critical' | 'exceeded';
  daysRemaining: number;
  recommendedDailySpend: number;
}

interface CostReport {
  totalCost: number;
  totalTokens: {
    input: number;
    output: number;
    total: number;
  };
  byModel: Array<{
    model: string;
    cost: number;
    percentage: number;
  }>;
  dailyTrend: Array<{
    date: string;
    cost: number;
    tokens: number;
  }>;
}

interface CacheStats {
  hitRate: number;
  savings: number;
  projectedMonthly: number;
}

interface CostDashboardProps {
  userId?: string;
  apiEndpoint?: string;
}

export const CostDashboard: React.FC<CostDashboardProps> = ({
  userId,
  apiEndpoint = '/api/v1/business/dashboard',
}) => {
  const [loading, setLoading] = useState(true);
  const [budget, setBudget] = useState<BudgetStatus | null>(null);
  const [report, setReport] = useState<CostReport | null>(null);
  const [cache, setCache] = useState<CacheStats | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    fetchDashboard();
  }, [timeRange, userId]);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiEndpoint}?range=${timeRange}&userId=${userId || ''}`);
      const data = await response.json();
      setBudget(data.budget);
      setReport(data.costs);
      setCache(data.cache);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'exceeded': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok': return <CheckCircle className="w-6 h-6" />;
      case 'warning': return <AlertTriangle className="w-6 h-6" />;
      case 'critical': return <AlertTriangle className="w-6 h-6" />;
      case 'exceeded': return <AlertTriangle className="w-6 h-6" />;
      default: return <CheckCircle className="w-6 h-6" />;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Cost Dashboard</h1>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setTimeRange('7d')}
            className={`px-3 py-1 rounded ${timeRange === '7d' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
          >
            7 Days
          </button>
          <button
            onClick={() => setTimeRange('30d')}
            className={`px-3 py-1 rounded ${timeRange === '30d' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
          >
            30 Days
          </button>
          <button
            onClick={() => setTimeRange('90d')}
            className={`px-3 py-1 rounded ${timeRange === '90d' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
          >
            90 Days
          </button>
        </div>
      </div>

      {/* Budget Status Card */}
      {budget && (
        <div className={`p-6 rounded-lg border-2 ${getStatusColor(budget.status)}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              {getStatusIcon(budget.status)}
              <div>
                <h2 className="text-lg font-semibold">Budget Status</h2>
                <p className="text-sm opacity-80 capitalize">{budget.status}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{formatCurrency(budget.spent)}</div>
              <div className="text-sm opacity-80">of {formatCurrency(budget.budget)} budget</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
            <div
              className={`h-4 rounded-full transition-all ${
                budget.percentageUsed > 0.95 ? 'bg-red-600' :
                budget.percentageUsed > 0.8 ? 'bg-yellow-600' :
                'bg-green-600'
              }`}
              style={{ width: `${Math.min(100, budget.percentageUsed * 100)}%` }}
            />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-sm opacity-80">Remaining</div>
              <div className="text-lg font-semibold">{formatCurrency(budget.remaining)}</div>
            </div>
            <div>
              <div className="text-sm opacity-80">Days Left</div>
              <div className="text-lg font-semibold">{budget.daysRemaining}</div>
            </div>
            <div>
              <div className="text-sm opacity-80">Daily Budget</div>
              <div className="text-lg font-semibold">{formatCurrency(budget.recommendedDailySpend)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Cost */}
        <div className="p-6 bg-white rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8 text-blue-600" />
            {report && report.totalCost > 100 ? (
              <TrendingUp className="w-5 h-5 text-red-600" />
            ) : (
              <TrendingDown className="w-5 h-5 text-green-600" />
            )}
          </div>
          <div className="text-sm text-gray-600 mb-1">Total Cost</div>
          <div className="text-3xl font-bold text-gray-900">
            {report ? formatCurrency(report.totalCost) : '-'}
          </div>
          {report && (
            <div className="text-sm text-gray-500 mt-2">
              {formatNumber(report.totalTokens.total)} tokens
            </div>
          )}
        </div>

        {/* Cache Savings */}
        <div className="p-6 bg-white rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <PieChart className="w-8 h-8 text-green-600" />
            {cache && cache.hitRate > 0.5 ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <Clock className="w-5 h-5 text-yellow-600" />
            )}
          </div>
          <div className="text-sm text-gray-600 mb-1">Cache Savings</div>
          <div className="text-3xl font-bold text-gray-900">
            {cache ? formatCurrency(cache.savings) : '-'}
          </div>
          {cache && (
            <div className="text-sm text-gray-500 mt-2">
              {(cache.hitRate * 100).toFixed(0)}% hit rate • {formatCurrency(cache.projectedMonthly)} / month
            </div>
          )}
        </div>

        {/* Cost by Model */}
        <div className="p-6 bg-white rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <BarChart3 className="w-8 h-8 text-purple-600" />
          </div>
          <div className="text-sm text-gray-600 mb-1">Top Model</div>
          <div className="text-lg font-bold text-gray-900 truncate">
            {report && report.byModel.length > 0 ? report.byModel[0].model : '-'}
          </div>
          {report && report.byModel.length > 0 && (
            <div className="text-sm text-gray-500 mt-2">
              {formatCurrency(report.byModel[0].cost)} ({report.byModel[0].percentage.toFixed(0)}%)
            </div>
          )}
        </div>
      </div>

      {/* Cost by Model Breakdown */}
      {report && report.byModel.length > 0 && (
        <div className="p-6 bg-white rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Cost by Model</h3>
          <div className="space-y-3">
            {report.byModel.map((model, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    index === 0 ? 'bg-blue-600' :
                    index === 1 ? 'bg-purple-600' :
                    index === 2 ? 'bg-green-600' :
                    'bg-gray-400'
                  }`} />
                  <span className="font-medium text-gray-700">{model.model}</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">{formatCurrency(model.cost)}</div>
                  <div className="text-sm text-gray-500">{model.percentage.toFixed(1)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily Trend Chart */}
      {report && report.dailyTrend.length > 0 && (
        <div className="p-6 bg-white rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Daily Cost Trend</h3>
          <div className="h-48 flex items-end space-x-1">
            {report.dailyTrend.map((day, index) => {
              const maxCost = Math.max(...report.dailyTrend.map(d => d.cost));
              const height = (day.cost / maxCost) * 100;
              return (
                <div
                  key={index}
                  className="flex-1 bg-blue-100 hover:bg-blue-200 rounded-t transition-colors relative group"
                  style={{ height: `${height}%` }}
                >
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {formatCurrency(day.cost)} • {formatNumber(day.tokens)} tokens
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>{report.dailyTrend[0]?.date}</span>
            <span>{report.dailyTrend[report.dailyTrend.length - 1]?.date}</span>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {budget && budget.status !== 'ok' && (
        <div className="p-6 bg-white rounded-lg shadow border-l-4 border-yellow-500">
          <h3 className="text-lg font-semibold mb-4">Recommendations</h3>
          <ul className="space-y-2">
            {budget.status === 'warning' && (
              <li className="flex items-start space-x-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <span>You've used {(budget.percentageUsed * 100).toFixed(0)}% of your budget. Consider switching to cheaper models.</span>
              </li>
            )}
            {budget.status === 'critical' && (
              <>
                <li className="flex items-start space-x-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                  <span>Critical: Only {formatCurrency(budget.remaining)} remaining. Auto-switch to gpt-3.5-turbo recommended.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <DollarSign className="w-5 h-5 text-green-600 mt-0.5" />
                  <span>Spend max {formatCurrency(budget.recommendedDailySpend)} / day to stay within budget.</span>
                </li>
              </>
            )}
            {budget.status === 'exceeded' && (
              <li className="flex items-start space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                <span>Budget exceeded by {formatCurrency(Math.abs(budget.remaining))}. Further operations may be blocked.</span>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CostDashboard;
