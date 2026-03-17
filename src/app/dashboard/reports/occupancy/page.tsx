"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format, addDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval } from "date-fns";
import { sl } from "date-fns/locale";
import { toast } from "sonner";
import { PropertySelector } from "@/web/components/PropertySelector";

interface OccupancyData {
  date: string;
  occupancyRate: number;
  occupiedRooms: number;
  totalRooms: number;
  availableRooms: number;
  revenue: number;
  arrivals: number;
  departures: number;
  inHouse: number;
}

interface Room {
  id: string;
  name: string;
  type: string;
  capacity: number;
  basePrice: number;
  status: string;
}

interface Property {
  id: string;
  name: string;
  location: string;
}

export default function OccupancyReportPage() {
  const router = useRouter();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [occupancyData, setOccupancyData] = useState<OccupancyData[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [dateRange, setDateRange] = useState({
    start: startOfWeek(new Date(), { weekStartsOn: 1 }),
    end: endOfWeek(new Date(), { weekStartsOn: 1 }),
  });
  const [viewType, setViewType] = useState<"day" | "week" | "month">("week");
  const [selectedMetric, setSelectedMetric] = useState<"occupancy" | "revenue" | "arrivals" | "departures">("occupancy");

  useEffect(() => {
    if (selectedPropertyId) {
      fetchOccupancyData();
      fetchRooms();
    }
  }, [selectedPropertyId, dateRange, viewType]);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const response = await fetch("/api/v1/tourism/properties");
      if (response.ok) {
        const data = await response.json();
        setProperties(data.properties || []);
      }
    } catch (error) {
      toast.error("Error fetching properties");
    }
  };

  const fetchOccupancyData = async () => {
    if (!selectedPropertyId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/reports/occupancy?propertyId=${selectedPropertyId}&start=${format(dateRange.start, "yyyy-MM-dd")}&end=${format(dateRange.end, "yyyy-MM-dd")}`);
      if (response.ok) {
        const data = await response.json();
        setOccupancyData(data.occupancyData || []);
      } else {
        toast.error("Failed to fetch occupancy data");
      }
    } catch (error) {
      toast.error("Error fetching occupancy data");
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    if (!selectedPropertyId) return;
    
    try {
      const response = await fetch(`/api/v1/tourism/rooms/status?propertyId=${selectedPropertyId}`);
      if (response.ok) {
        const data = await response.json();
        setRooms(data.rooms || []);
      }
    } catch (error) {
      toast.error("Error fetching rooms");
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
          type: "occupancy",
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
        a.download = `occupancy-report-${format(new Date(), "yyyy-MM-dd")}.${format}`;
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

  const getMetricValue = (data: OccupancyData) => {
    switch (selectedMetric) {
      case "occupancy":
        return data.occupancyRate;
      case "revenue":
        return data.revenue;
      case "arrivals":
        return data.arrivals;
      case "departures":
        return data.departures;
      default:
        return data.occupancyRate;
    }
  };

  const getMetricLabel = () => {
    switch (selectedMetric) {
      case "occupancy":
        return "Occupancy Rate (%)";
      case "revenue":
        return "Revenue (€)";
      case "arrivals":
        return "Arrivals";
      case "departures":
        return "Departures";
      default:
        return "Occupancy Rate (%)";
    }
  };

  const getMetricColor = (value: number) => {
    switch (selectedMetric) {
      case "occupancy":
        return value >= 80 ? "text-green-600" : value >= 60 ? "text-yellow-600" : "text-red-600";
      case "revenue":
        return "text-green-600";
      case "arrivals":
        return "text-blue-600";
      case "departures":
        return "text-orange-600";
      default:
        return "text-gray-600";
    }
  };

  const calculateStats = () => {
    if (occupancyData.length === 0) return {
      avgOccupancy: 0,
      totalRevenue: 0,
      totalArrivals: 0,
      totalDepartures: 0,
      peakOccupancy: 0,
      peakOccupancyDate: null,
    };

    const avgOccupancy = occupancyData.reduce((sum, d) => sum + d.occupancyRate, 0) / occupancyData.length;
    const totalRevenue = occupancyData.reduce((sum, d) => sum + d.revenue, 0);
    const totalArrivals = occupancyData.reduce((sum, d) => sum + d.arrivals, 0);
    const totalDepartures = occupancyData.reduce((sum, d) => sum + d.departures, 0);
    
    const peakData = occupancyData.reduce((max, d) => d.occupancyRate > max.occupancyRate ? d : max);
    
    return {
      avgOccupancy: Math.round(avgOccupancy * 10) / 10,
      totalRevenue,
      totalArrivals,
      totalDepartures,
      peakOccupancy: peakData.occupancyRate,
      peakOccupancyDate: peakData.date,
    };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-500">Loading occupancy data...</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Occupancy Report</h1>
          <p className="text-gray-600 mt-2">Detailed occupancy analysis and trends</p>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Metric</label>
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                title="Select metric type"
              >
                <option value="occupancy">Occupancy Rate</option>
                <option value="revenue">Revenue</option>
                <option value="arrivals">Arrivals</option>
                <option value="departures">Departures</option>
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
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Avg Occupancy</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.avgOccupancy}%</p>
                  </div>
                </div>
              </div>

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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Total Arrivals</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalArrivals}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4V7m0 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Total Departures</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalDepartures}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Peak Occupancy</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.peakOccupancy}%</p>
                    {stats.peakOccupancyDate && (
                      <p className="text-xs text-gray-500">
                        {format(new Date(stats.peakOccupancyDate), "MMM d")}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="bg-white p-6 rounded-lg shadow mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {getMetricLabel()} - {format(dateRange.start, "MMM d")} to {format(dateRange.end, "MMM d")}
              </h3>
              
              {occupancyData.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p className="mt-2 text-gray-500">No data available for selected period</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {occupancyData.map((data, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">
                            {format(new Date(data.date), "EEE, MMM d")}
                          </span>
                          <span className={`text-lg font-bold ${getMetricColor(getMetricValue(data))}`}>
                            {selectedMetric === "revenue" ? `€${getMetricValue(data).toFixed(0)}` : getMetricValue(data)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              selectedMetric === "occupancy" 
                                ? getMetricValue(data) >= 80 ? "bg-green-500" : 
                                  getMetricValue(data) >= 60 ? "bg-yellow-500" : "bg-red-500"
                                : "bg-blue-500"
                            }`}
                            style={{
                              width: `${selectedMetric === "occupancy" ? getMetricValue(data) : Math.min((getMetricValue(data) / Math.max(...occupancyData.map(d => getMetricValue(d)))) * 100)}%`
                            }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>Rooms: {data.occupiedRooms}/{data.totalRooms}</span>
                          <span>Revenue: €{data.revenue.toFixed(0)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Room Breakdown */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Room Breakdown</h3>
              
              {rooms.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <p className="mt-2 text-gray-500">No rooms found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rooms.map((room) => (
                    <div key={room.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{room.name}</h4>
                          <p className="text-sm text-gray-500">{room.type}</p>
                          <p className="text-sm text-gray-500">{room.capacity} guests</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">€{room.basePrice.toFixed(0)}</p>
                          <p className="text-sm text-gray-500">per night</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {!selectedPropertyId && (
          <div className="text-center py-12">
            <p className="text-gray-500">Please select a property to view occupancy report</p>
          </div>
        )}
      </div>
    </div>
  );
}
