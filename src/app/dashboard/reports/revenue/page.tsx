"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format, addDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval } from "date-fns";
import { sl } from "date-fns/locale";
import { toast } from "sonner";
import { PropertySelector } from "@/web/components/PropertySelector";

interface RevenueData {
  date: string;
  revenue: number;
  occupancyRevenue: number;
  extraRevenue: number;
  damageRevenue: number;
  totalRevenue: number;
  reservations: number;
  averageRevenuePerReservation: number;
  averageRevenuePerRoom: number;
}

interface ChannelRevenue {
  channel: string;
  revenue: number;
  reservations: number;
  percentage: number;
}

interface RoomTypeRevenue {
  roomType: string;
  revenue: number;
  reservations: number;
  averageRevenue: number;
}

interface Property {
  id: string;
  name: string;
  location: string;
}

export default function RevenueReportPage() {
  const router = useRouter();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [channelRevenue, setChannelRevenue] = useState<ChannelRevenue[]>([]);
  const [roomTypeRevenue, setRoomTypeRevenue] = useState<RoomTypeRevenue[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [dateRange, setDateRange] = useState({
    start: startOfWeek(new Date(), { weekStartsOn: 1 }),
    end: endOfWeek(new Date(), { weekStartsOn: 1 }),
  });
  const [viewType, setViewType] = useState<"day" | "week" | "month">("week");
  const [revenueType, setRevenueType] = useState<"total" | "occupancy" | "extra" | "damage">("total");

  useEffect(() => {
    if (selectedPropertyId) {
      fetchRevenueData();
    }
  }, [selectedPropertyId, dateRange, viewType]);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const response = await fetch("/api/tourism/properties");
      if (response.ok) {
        const data = await response.json();
        setProperties(data.properties || []);
      }
    } catch (error) {
      toast.error("Error fetching properties");
    }
  };

  const fetchRevenueData = async () => {
    if (!selectedPropertyId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/reports/revenue?propertyId=${selectedPropertyId}&start=${format(dateRange.start, "yyyy-MM-dd")}&end=${format(dateRange.end, "yyyy-MM-dd")}`);
      if (response.ok) {
        const data = await response.json();
        setRevenueData(data.revenueData || []);
        setChannelRevenue(data.channelRevenue || []);
        setRoomTypeRevenue(data.roomTypeRevenue || []);
      } else {
        toast.error("Failed to fetch revenue data");
      }
    } catch (error) {
      toast.error("Error fetching revenue data");
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (type: "day" | "week" | "month") => {
    setViewType(type);
    const now = new Date();
    
    switch (type) {
      case "day":
        setDateRange({
          start: startOfDay(now),
          end: endOfDay(now),
        });
        break;
      case "week":
        setDateRange({
          start: startOfWeek(now, { weekStartsOn: 1 }),
          end: endOfWeek(now, { weekStartsOn: 1 }),
        });
        break;
      case "month":
        setDateRange({
          start: startOfMonth(now),
          end: endOfMonth(now),
        });
        break;
    }
  };

  const handleExport = async (format: "csv" | "pdf") => {
    if (!selectedPropertyId) return;
    
    try {
      const response = await fetch("/api/reports/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "revenue",
          propertyId: selectedPropertyId,
          dateRange: {
            start: format(dateRange.start, "yyyy-MM-dd"),
            end: format(dateRange.end, "yyyy-MM-dd"),
          },
          format,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `revenue-report-${format(new Date(), "yyyy-MM-dd")}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success("Report exported successfully!");
      } else {
        toast.error("Failed to export report");
      }
    } catch (error) {
      toast.error("Error exporting report");
    }
  };

  const getRevenueValue = (data: RevenueData) => {
    switch (revenueType) {
      case "total":
        return data.totalRevenue;
      case "occupancy":
        return data.occupancyRevenue;
      case "extra":
        return data.extraRevenue;
      case "damage":
        return data.damageRevenue;
      default:
        return data.totalRevenue;
    }
  };

  const getRevenueLabel = () => {
    switch (revenueType) {
      case "total":
        return "Total Revenue (€)";
      case "occupancy":
        return "Occupancy Revenue (€)";
      case "extra":
        return "Extra Revenue (€)";
      case "damage":
        return "Damage Revenue (€)";
      default:
        return "Total Revenue (€)";
    }
  };

  const calculateStats = () => {
    if (revenueData.length === 0) return {
      totalRevenue: 0,
      averageDailyRevenue: 0,
      totalReservations: 0,
      averageRevenuePerReservation: 0,
      peakRevenue: 0,
      peakRevenueDate: null,
      channelBreakdown: [],
      roomTypeBreakdown: [],
    };

    const totalRevenue = revenueData.reduce((sum, d) => sum + d.totalRevenue, 0);
    const averageDailyRevenue = totalRevenue / revenueData.length;
    const totalReservations = revenueData.reduce((sum, d) => sum + d.reservations, 0);
    const averageRevenuePerReservation = totalReservations > 0 ? totalRevenue / totalReservations : 0;
    
    const peakData = revenueData.reduce((max, d) => d.totalRevenue > max.totalRevenue ? d : max);
    
    return {
      totalRevenue,
      averageDailyRevenue,
      totalReservations,
      averageRevenuePerReservation,
      peakRevenue: peakData.totalRevenue,
      peakRevenueDate: peakData.date,
      channelBreakdown: channelRevenue,
      roomTypeBreakdown: roomTypeRevenue,
    };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-500">Loading revenue data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Revenue Report</h1>
          <p className="text-gray-600 mt-2">Comprehensive revenue analysis and breakdown</p>
        </div>

        {/* Controls */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Property</label>
              <PropertySelector
                selectedPropertyId={selectedPropertyId}
                onPropertyChange={setSelectedPropertyId}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleDateRangeChange("day")}
                  className={`px-3 py-2 text-sm rounded-lg ${
                    viewType === "day"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Day
                </button>
                <button
                  onClick={() => handleDateRangeChange("week")}
                  className={`px-3 py-2 text-sm rounded-lg ${
                    viewType === "week"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Week
                </button>
                <button
                  onClick={() => handleDateRangeChange("month")}
                  className={`px-3 py-2 text-sm rounded-lg ${
                    viewType === "month"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Month
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Revenue Type</label>
              <select
                value={revenueType}
                onChange={(e) => setRevenueType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="total">Total Revenue</option>
                <option value="occupancy">Occupancy Revenue</option>
                <option value="extra">Extra Revenue</option>
                <option value="damage">Damage Revenue</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Export</label>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleExport("csv")}
                  className="px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  CSV
                </button>
                <button
                  onClick={() => handleExport("pdf")}
                  className="px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  PDF
                </button>
              </div>
            </div>
          </div>
        </div>

        {selectedPropertyId && (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m0 0H4m8 0h8" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">€{stats.totalRevenue.toFixed(0)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 12h18M3 12l6.364-6.364M21 12l-6.364 6.364M12 12l6.364 6.364M12 12l-6.364-6.364" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Daily Average</p>
                    <p className="text-2xl font-bold text-gray-900">€{stats.averageDailyRevenue.toFixed(0)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Total Reservations</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalReservations}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m0 0H4m8 0h8" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Avg per Reservation</p>
                    <p className="text-2xl font-bold text-gray-900">€{stats.averageRevenuePerReservation.toFixed(0)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-3 bg-red-100 rounded-lg">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Peak Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">€{stats.peakRevenue.toFixed(0)}</p>
                    {stats.peakRevenueDate && (
                      <p className="text-xs text-gray-500">
                        {format(new Date(stats.peakRevenueDate), "MMM d")}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Revenue Chart */}
            <div className="bg-white p-6 rounded-lg shadow mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {getRevenueLabel()} - {format(dateRange.start, "MMM d")} to {format(dateRange.end, "MMM d")}
              </h3>
              
              {revenueData.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m0 0H4m8 0h8" />
                  </svg>
                  <p className="mt-2 text-gray-500">No revenue data available for selected period</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {revenueData.map((data, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">
                            {format(new Date(data.date), "EEE, MMM d")}
                          </span>
                          <span className="text-lg font-bold text-green-600">
                            €{getRevenueValue(data).toFixed(0)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-green-500"
                            style={{
                              width: `${Math.min((getRevenueValue(data) / Math.max(...revenueData.map(d => getRevenueValue(d)))) * 100}%`
                            }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>Reservations: {data.reservations}</span>
                          <span>Avg: €{data.averageRevenuePerReservation.toFixed(0)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Channel Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Channel</h3>
                
                {channelRevenue.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <p className="mt-2 text-gray-500">No channel data available</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {channelRevenue.map((channel, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-900">{channel.channel}</span>
                            <span className="text-sm font-bold text-gray-900">€{channel.revenue.toFixed(0)}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="h-2 rounded-full bg-blue-500"
                              style={{ width: `${channel.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="ml-4 text-right">
                          <p className="text-sm text-gray-500">{channel.reservations} bookings</p>
                          <p className="text-sm font-medium text-gray-900">{channel.percentage.toFixed(1)}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Room Type Breakdown */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Room Type</h3>
                
                {roomTypeRevenue.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <p className="mt-2 text-gray-500">No room type data available</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {roomTypeRevenue.map((roomType, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-900">{roomType.roomType}</span>
                            <span className="text-sm font-bold text-gray-900">€{roomType.revenue.toFixed(0)}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="h-2 rounded-full bg-purple-500"
                              style={{
                                width: `${Math.min((roomType.revenue / Math.max(...roomTypeRevenue.map(rt => rt.revenue))) * 100}%`
                              }}
                            ></div>
                          </div>
                        </div>
                        <div className="ml-4 text-right">
                          <p className="text-sm text-gray-500">{roomType.reservations} bookings</p>
                          <p className="text-sm font-medium text-gray-900">€{roomType.averageRevenue.toFixed(0)} avg</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {!selectedPropertyId && (
          <div className="text-center py-12">
            <p className="text-gray-500">Please select a property to view revenue report</p>
          </div>
        )}
      </div>
    </div>
  );
}
