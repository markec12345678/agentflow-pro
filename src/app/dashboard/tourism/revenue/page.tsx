"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { PropertySelector } from "@/web/components/PropertySelector";
import { format, subDays } from "date-fns";

interface RevenueAnalytics {
  revenue: {
    totalRevenue: number;
    totalNights: number;
    occupiedRoomNights: number;
    roomNightsAvailable: number;
  };
  kpis: {
    occupancyRate: number;
    adr: number;
    revpar: number;
    averageStayLength: number;
  };
  revenueByChannel: Record<string, { revenue: number; bookings: number }>;
  dailyTrend: Array<{
    date: string;
    revenue: number;
    occupancy: number;
    occupiedRooms: number;
    availableRooms: number;
  }>;
  roomPerformance: Array<{
    roomId: string;
    roomName: string;
    roomType: string;
    revenue: number;
    nights: number;
    adr: number;
    bookings: number;
  }>;
}

export default function RevenueAnalyticsPage() {
  const [activePropertyId, setActivePropertyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState<"7d" | "30d" | "90d" | "custom">("30d");
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [analytics, setAnalytics] = useState<RevenueAnalytics | null>(null);

  useEffect(() => {
    if (activePropertyId) {
      fetchAnalytics();
    } else {
      setAnalytics(null);
    }
  }, [activePropertyId, period, startDate, endDate]);

  const handleExport = async (format: "pdf" | "excel") => {
    if (!activePropertyId || !analytics) return;
    try {
      const res = await fetch("/api/tourism/revenue/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: activePropertyId,
          startDate: analytics.period.start,
          endDate: analytics.period.end,
          format,
        }),
      });
      if (!res.ok) throw new Error("Export failed");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `revenue-report-${format(new Date(), "yyyy-MM-dd")}.${format === "excel" ? "csv" : "html"}`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error("Export failed");
      console.error(error);
    }
  };

  const fetchAnalytics = async () => {
    if (!activePropertyId) return;
    setLoading(true);
    try {
      let url = `/api/tourism/revenue/analytics?propertyId=${activePropertyId}`;
      if (period === "custom") {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      } else {
        const days = parseInt(period);
        const start = format(subDays(new Date(), days), "yyyy-MM-dd");
        const end = format(new Date(), "yyyy-MM-dd");
        url += `&startDate=${start}&endDate=${end}`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch analytics");
      const data = await res.json();
      setAnalytics(data);
    } catch (error) {
      toast.error("Napaka pri nalaganju podatkov");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!activePropertyId) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Revenue Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Sledite prihodkom, zasedenosti in ključnim metrikam
          </p>
        </div>
        <PropertySelector value={activePropertyId} onChange={setActivePropertyId} />
        <div className="p-8 text-center text-gray-500">Izberite nastanitev za prikaz metrik</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Revenue Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Sledite prihodkom, zasedenosti in ključnim metrikam
            </p>
          </div>
          <PropertySelector value={activePropertyId} onChange={setActivePropertyId} />
        </div>
        <div className="p-8 text-center text-gray-500">Nalaganje...</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Revenue Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Sledite prihodkom, zasedenosti in ključnim metrikam
            </p>
          </div>
          <PropertySelector value={activePropertyId} onChange={setActivePropertyId} />
        </div>
        <div className="p-8 text-center text-gray-500">Ni podatkov</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Revenue Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Sledite prihodkom, zasedenosti in ključnim metrikam
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <PropertySelector value={activePropertyId} onChange={setActivePropertyId} />
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
          >
            <option value="7d">Zadnjih 7 dni</option>
            <option value="30d">Zadnjih 30 dni</option>
            <option value="90d">Zadnjih 90 dni</option>
            <option value="custom">Po meri</option>
          </select>
          <button
            onClick={() => handleExport("excel")}
            disabled={!analytics}
            className="px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            📊 Excel
          </button>
          <button
            onClick={() => handleExport("pdf")}
            disabled={!analytics}
            className="px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            📄 PDF
          </button>
        </div>
      </div>

      {/* Custom Date Range */}
      {period === "custom" && (
        <div className="flex items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Od</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Do</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
            />
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
          <div className="text-sm text-gray-500 mb-1">Skupni prihodek</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            €{analytics.revenue.totalRevenue.toLocaleString("sl-SI")}
          </div>
          <div className="text-xs text-gray-500 mt-2">
            {analytics.revenue.occupiedRoomNights} noči prodanih
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
          <div className="text-sm text-gray-500 mb-1">Zasedenost</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {analytics.kpis.occupancyRate.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500 mt-2">
            {analytics.revenue.roomNightsAvailable} razpoložljivih noči
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
          <div className="text-sm text-gray-500 mb-1">ADR</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            €{analytics.kpis.adr.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500 mt-2">Povprečna cena na noč</div>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
          <div className="text-sm text-gray-500 mb-1">RevPAR</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            €{analytics.kpis.revpar.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500 mt-2">Prihodek na razpoložljivo sobo</div>
        </div>
      </div>

      {/* Revenue by Channel */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
        <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">
          Prihodki po kanalih
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(analytics.revenueByChannel).map(([channel, data]) => (
            <div key={channel} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize mb-2">
                {channel}
              </div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                €{data.revenue.toLocaleString("sl-SI")}
              </div>
              <div className="text-xs text-gray-500 mt-1">{data.bookings} rezervacij</div>
            </div>
          ))}
        </div>
      </div>

      {/* Room Performance */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
        <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">
          Uspešnost sob
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Soba
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tip
                </th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Prihodek
                </th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Noči
                </th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                  ADR
                </th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Rezervacij
                </th>
              </tr>
            </thead>
            <tbody>
              {analytics.roomPerformance
                .sort((a, b) => b.revenue - a.revenue)
                .map((room) => (
                  <tr
                    key={room.roomId}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-4 py-3 text-gray-900 dark:text-white">{room.roomName}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{room.roomType}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                      €{room.revenue.toLocaleString("sl-SI")}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">
                      {room.nights}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">
                      €{room.adr.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">
                      {room.bookings}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
