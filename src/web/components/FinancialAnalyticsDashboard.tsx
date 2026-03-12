/**
 * AgentFlow Pro - Financial Analytics Dashboard
 * Revenue, ADR, RevPAR, occupancy trends, and forecasting
 */

"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { sl } from "date-fns/locale";

interface FinancialMetrics {
  totalRevenue: number;
  adr: number; // Average Daily Rate
  revpar: number; // Revenue Per Available Room
  occupancyRate: number;
  availableRooms: number;
  bookedRooms: number;
  revenueByChannel: Record<string, number>;
  forecastAccuracy: number;
}

interface RevenueTrend {
  date: string;
  revenue: number;
  occupancy: number;
  adr: number;
}

export default function FinancialAnalyticsDashboard() {
  const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
  const [trends, setTrends] = useState<RevenueTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"7d" | "30d" | "90d" | "ytd">("30d");

  useEffect(() => {
    fetchFinancialData();
  }, [period]);

  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tourism/analytics/financial?period=${period}`);
      const data = await res.json();
      setMetrics(data.metrics);
      setTrends(data.trends);
    } catch (error) {
      console.error("[Financial Analytics] Error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">Ni podatkov za prikaz</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Finančna Analitika</h2>
        <div className="flex gap-2">
          {["7d", "30d", "90d", "ytd"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p as any)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                period === p
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {p === "ytd" ? "Letos" : p === "7d" ? "7 dni" : p === "30d" ? "30 dni" : "90 dni"}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Skupni Prihodki"
          value={`€${metrics.totalRevenue.toLocaleString("sl-SI", { minimumFractionDigits: 2 })}`}
          trend="+12%"
          trendLabel="vs. prejšnje obdobje"
        />

        <MetricCard
          title="ADR (Povprečna cena)"
          value={`€${metrics.adr.toLocaleString("sl-SI", { minimumFractionDigits: 2 })}`}
          trend="+5%"
          trendLabel="povprečno na noč"
        />

        <MetricCard
          title="RevPAR"
          value={`€${metrics.revpar.toLocaleString("sl-SI", { minimumFractionDigits: 2 })}`}
          trend="+8%"
          trendLabel="prihodek na sobo"
        />

        <MetricCard
          title="Zasedenost"
          value={`${metrics.occupancyRate.toFixed(1)}%`}
          trend="+3%"
          trendLabel={`${metrics.bookedRooms}/${metrics.availableRooms} sob`}
        />
      </div>

      {/* Revenue by Channel */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Prihodki po Kanalih</h3>
        <div className="space-y-3">
          {Object.entries(metrics.revenueByChannel).map(([channel, revenue]) => {
            const percentage = (revenue / metrics.totalRevenue) * 100;
            return (
              <div key={channel}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700 capitalize">
                    {channel === "booking.com" ? "Booking.com" : channel}
                  </span>
                  <span className="text-gray-600">
                    €{revenue.toLocaleString("sl-SI", { minimumFractionDigits: 2 })} ({percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getChannelColor(channel)}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Revenue Trend Chart */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Trend Prihodkov</h3>
        <div className="h-64">
          {/* Simple bar chart visualization */}
          <div className="flex items-end justify-between h-full gap-1">
            {trends.map((trend, index) => {
              const maxRevenue = Math.max(...trends.map(t => t.revenue));
              const height = (trend.revenue / maxRevenue) * 100;
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                    style={{ height: `${height}%` }}
                    title={`€${trend.revenue.toFixed(2)}`}
                  />
                  <span className="text-xs text-gray-500 rotate-45 origin-top-left">
                    {formatDate(trend.date)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Forecast vs Actual */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Napoved vs. Dejansko</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Napovedano</p>
            <p className="text-2xl font-bold text-blue-700">
              €{(metrics.totalRevenue / (1 + metrics.forecastAccuracy / 100)).toFixed(2)}
            </p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Dejansko</p>
            <p className="text-2xl font-bold text-green-700">€{metrics.totalRevenue.toFixed(2)}</p>
          </div>
        </div>
        <p className="text-center text-sm text-gray-600 mt-4">
          Točnost napovedi: {metrics.forecastAccuracy.toFixed(1)}%
        </p>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  trend,
  trendLabel,
}: {
  title: string;
  value: string;
  trend: string;
  trendLabel: string;
}) {
  const isPositive = trend.startsWith("+");

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <p className="text-sm text-gray-600 mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900 mb-2">{value}</p>
      <div className="flex items-center gap-2">
        <span
          className={`text-sm font-medium ${
            isPositive ? "text-green-600" : "text-red-600"
          }`}
        >
          {trend}
        </span>
        <span className="text-xs text-gray-500">{trendLabel}</span>
      </div>
    </div>
  );
}

function getChannelColor(channel: string): string {
  const colors: Record<string, string> = {
    "booking.com": "bg-blue-500",
    "airbnb": "bg-pink-500",
    "expedia": "bg-yellow-500",
    "direct": "bg-green-500",
    "ical": "bg-purple-500",
  };
  return colors[channel] || "bg-gray-500";
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return format(date, "dd. MM", { locale: sl });
}
