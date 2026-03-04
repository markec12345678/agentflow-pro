"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format, addDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subYears, subMonths } from "date-fns";
import { sl } from "date-fns/locale";
import { toast } from "sonner";
import { PropertySelector } from "@/web/components/PropertySelector";

interface GuestDemographics {
  totalGuests: number;
  newGuests: number;
  returningGuests: number;
  vipGuests: number;
  averageStay: number;
  totalNights: number;
  topCountries: Array<{
    country: string;
    count: number;
    percentage: number;
  }>;
  ageDistribution: Array<{
    ageGroup: string;
    count: number;
    percentage: number;
  }>;
  genderDistribution: Array<{
    gender: string;
    count: number;
    percentage: number;
  }>;
  channelDistribution: Array<{
    channel: string;
    count: number;
    percentage: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    guests: number;
    newGuests: number;
    returningGuests: number;
  }>;
}

interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
  countryCode: string;
  dateOfBirth?: string;
  gender?: string;
  riskScore: string;
  isVip: boolean;
  gdprConsent: boolean;
  preferences?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  reservations: {
    id: string;
    checkIn: string;
    checkOut: string;
    channel: string;
    totalPrice: number;
    status: string;
  }[];
}

interface Property {
  id: string;
  name: string;
  location: string;
}

export default function GuestsReportPage() {
  const router = useRouter();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [demographics, setDemographics] = useState<GuestDemographics | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [dateRange, setDateRange] = useState({
    start: subMonths(new Date(), 11), // Last 12 months
    end: new Date(),
  });
  const [viewType, setViewType] = useState<"overview" | "countries" | "age" | "channels" | "trends">("overview");

  useEffect(() => {
    if (selectedPropertyId) {
      fetchGuestData();
    }
  }, [selectedPropertyId, dateRange]);

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

  const fetchGuestData = async () => {
    if (!selectedPropertyId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/reports/guests?propertyId=${selectedPropertyId}&start=${format(dateRange.start, "yyyy-MM-dd")}&end=${format(dateRange.end, "yyyy-MM-dd")}`);
      if (response.ok) {
        const data = await response.json();
        setDemographics(data.demographics);
        setGuests(data.guests || []);
      } else {
        toast.error("Failed to fetch guest data");
      }
    } catch (error) {
      toast.error("Error fetching guest data");
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (type: "3months" | "6months" | "12months" | "custom") => {
    const now = new Date();
    
    switch (type) {
      case "3months":
        setDateRange({
          start: subMonths(now, 3),
          end: now,
        });
        break;
      case "6months":
        setDateRange({
          start: subMonths(now, 6),
          end: now,
        });
        break;
      case "12months":
        setDateRange({
          start: subMonths(now, 12),
          end: now,
        });
        break;
      case "custom":
        // Keep current range
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
          type: "guests",
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
        a.download = `guests-report-${format(new Date(), "yyyy-MM-dd")}.${format}`;
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

  const getAgeGroup = (dateOfBirth?: string): string => {
    if (!dateOfBirth) return "Unknown";
    
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    const age = today.getFullYear() - birthDate.getFullYear();
    
    if (age < 18) return "Under 18";
    if (age < 25) return "18-24";
    if (age < 35) return "25-34";
    if (age < 45) return "35-44";
    if (age < 55) return "45-54";
    if (age < 65) return "55-64";
    return "65+";
  };

  const calculateAgeDistribution = (guestList: Guest[]) => {
    const ageGroups: { [key: string]: number } = {};
    
    guestList.forEach(guest => {
      const ageGroup = getAgeGroup(guest.dateOfBirth);
      ageGroups[ageGroup] = (ageGroups[ageGroup] || 0) + 1;
    });

    const total = Object.values(ageGroups).reduce((sum, count) => sum + count, 0);
    
    return Object.entries(ageGroups).map(([ageGroup, count]) => ({
      ageGroup,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    })).sort((a, b) => b.count - a.count);
  };

  const calculateGenderDistribution = (guestList: Guest[]) => {
    const genders: { [key: string]: number } = {};
    
    guestList.forEach(guest => {
      const gender = guest.gender || "Unknown";
      genders[gender] = (genders[gender] || 0) + 1;
    });

    const total = Object.values(genders).reduce((sum, count) => sum + count, 0);
    
    return Object.entries(genders).map(([gender, count]) => ({
      gender,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    })).sort((a, b) => b.count - a.count);
  };

  const calculateChannelDistribution = (guestList: Guest[]) => {
    const channels: { [key: string]: number } = {};
    
    guestList.forEach(guest => {
      guest.reservations.forEach(reservation => {
        const channel = reservation.channel || "Unknown";
        channels[channel] = (channels[channel] || 0) + 1;
      });
    });

    const total = Object.values(channels).reduce((sum, count) => sum + count, 0);
    
    return Object.entries(channels).map(([channel, count]) => ({
      channel,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    })).sort((a, b) => b.count - a.count);
  };

  const calculateMonthlyTrends = (guestList: Guest[]) => {
    const monthlyData: { [key: string]: { guests: number; newGuests: number; returningGuests: number } } } = {};
    
    // Initialize months for the last 12 months
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const month = subMonths(now, i);
      const monthKey = format(month, "yyyy-MM");
      monthlyData[monthKey] = { guests: 0, newGuests: 0, returningGuests: 0 };
    }
    
    guestList.forEach(guest => {
      guest.reservations.forEach(reservation => {
        const month = format(new Date(reservation.checkIn), "yyyy-MM");
        if (monthlyData[month]) {
          monthlyData[month].guests += 1;
          
          // Check if this is a new or returning guest
          const guestReservations = guest.reservations.filter(r => 
            new Date(r.checkIn) < new Date(reservation.checkIn)
          );
          
          if (guestReservations.length === 0) {
            monthlyData[month].newGuests += 1;
          } else {
            monthlyData[month].returningGuests += 1;
          }
        }
      });
    });

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      guests: data.guests,
      newGuests: data.newGuests,
      returningGuests: data.returningGuests,
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-500">Loading guest data...</p>
        </div>
      </div>
    );
  }

  const enhancedDemographics = demographics ? {
    ...demographics,
    ageDistribution: calculateAgeDistribution(guests),
    genderDistribution: calculateGenderDistribution(guests),
    channelDistribution: calculateChannelDistribution(guests),
    monthlyTrends: calculateMonthlyTrends(guests),
  } : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Guest Demographics</h1>
          <p className="text-gray-600 mt-2">Comprehensive guest analysis and demographics</p>
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
                  onClick={() => handleDateRangeChange("3months")}
                  className={`px-3 py-2 text-sm rounded-lg ${
                    dateRange.start >= subMonths(new Date(), 3) && dateRange.end <= new Date()
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  3 Months
                </button>
                <button
                  onClick={() => handleDateRangeChange("6months")}
                  className={`px-3 py-2 text-sm rounded-lg ${
                    dateRange.start >= subMonths(new Date(), 6) && dateRange.end <= new Date()
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  6 Months
                </button>
                <button
                  onClick={() => handleDateRangeChange("12months")}
                  className={`px-3 py-2 text-sm rounded-lg ${
                    dateRange.start >= subMonths(new Date(), 12) && dateRange.end <= new Date()
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  12 Months
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">View</label>
              <select
                value={viewType}
                onChange={(e) => setViewType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="overview">Overview</option>
                <option value="countries">Countries</option>
                <option value="age">Age Distribution</option>
                <option value="channels">Channels</option>
                <option value="trends">Monthly Trends</option>
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

        {selectedPropertyId && enhancedDemographics && (
          <>
            {/* Overview Stats */}
            {viewType === "overview" && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
                  <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2m0 4v2m0 4v2m0 4v2M9 19h6a2 2 0 002-2v-2a2 2 0 00-2-2H9a2 2 0 00-2 2v2a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm text-gray-600">Total Guests</p>
                        <p className="text-2xl font-bold text-gray-900">{enhancedDemographics.totalGuests}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                      <div className="p-3 bg-green-100 rounded-lg">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0 3h.01M12 9v3m0 0v3m0 3h.01M6 9h.01M6 12h.01M6 15h.01M6 18h.01" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm text-gray-600">New Guests</p>
                        <p className="text-2xl font-bold text-gray-900">{enhancedDemographics.newGuests}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                      <div className="p-3 bg-purple-100 rounded-lg">
                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 6m-1.356 2A8.001 8.001 0 0014.582 6m-1.356 2L4 4m5.582 2A8.001 8.001 0 0014.582 6m-1.356 2L4 4" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm text-gray-600">Returning Guests</p>
                        <p className="text-2xl font-bold text-gray-900">{enhancedDemographics.returningGuests}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                      <div className="p-3 bg-yellow-100 rounded-lg">
                        <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V8m0 13l-3-3m3 3l3-3m-3 3h6m-6-9h6m2 2H9m1 1h1m-1 1h-1m1-1v-1m-1 1v1m0 0h6m-6 0h6" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm text-gray-600">VIP Guests</p>
                        <p className="text-2xl font-bold text-gray-900">{enhancedDemographics.vipGuests}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                      <div className="p-3 bg-orange-100 rounded-lg">
                        <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 0V3m-8 4h8M8 0l-8 8m8 0l-8-8m0 0v8m0-4h.01M12 12h.01M16 12h.01M20 12h.01" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm text-gray-600">Avg Stay</p>
                        <p className="text-2xl font-bold text-gray-900">{enhancedDemographics.averageStay.toFixed(1)} nights</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top Countries */}
                <div className="bg-white p-6 rounded-lg shadow mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Countries</h3>
                  <div className="space-y-3">
                    {enhancedDemographics.topCountries.map((country, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-900">{country.country}</span>
                            <span className="text-sm font-bold text-gray-900">{country.count} guests</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="h-2 rounded-full bg-blue-500"
                              style={{ width: `${country.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="ml-4 text-right">
                          <p className="text-sm font-medium text-gray-900">{country.percentage.toFixed(1)}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Countries View */}
            {viewType === "countries" && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Guest Countries</h3>
                <div className="space-y-3">
                  {enhancedDemographics.topCountries.map((country, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">{country.country}</span>
                          <span className="text-sm font-bold text-gray-900">{country.count} guests</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-blue-500"
                            style={{ width: `${country.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <p className="text-sm font-medium text-gray-900">{country.percentage.toFixed(1)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Age Distribution */}
            {viewType === "age" && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Age Distribution</h3>
                <div className="space-y-3">
                  {enhancedDemographics.ageDistribution.map((age, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">{age.ageGroup}</span>
                          <span className="text-sm font-bold text-gray-900">{age.count} guests</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-purple-500"
                            style={{ width: `${age.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <p className="text-sm font-medium text-gray-900">{age.percentage.toFixed(1)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Gender Distribution */}
            {viewType === "channels" && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Channels</h3>
                <div className="space-y-3">
                  {enhancedDemographics.channelDistribution.map((channel, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">{channel.channel}</span>
                          <span className="text-sm font-bold text-gray-900">{channel.count} bookings</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-green-500"
                            style={{ width: `${channel.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <p className="text-sm font-medium text-gray-900">{channel.percentage.toFixed(1)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Monthly Trends */}
            {viewType === "trends" && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Guest Trends</h3>
                <div className="space-y-4">
                  {enhancedDemographics.monthlyTrends.map((trend, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">
                            {format(new Date(trend.month + "-01"), "MMMM yyyy")}
                          </span>
                          <span className="text-sm font-bold text-gray-900">{trend.guests} guests</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="flex h-2">
                            <div
                              className="h-2 rounded-full bg-blue-500"
                              style={{ width: `${(trend.newGuests / trend.guests) * 100}%` }}
                            ></div>
                            <div
                              className="h-2 rounded-full bg-green-500"
                              style={{ width: `${(trend.returningGuests / trend.guests) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span className="flex items-center">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
                            New: {trend.newGuests}
                          </span>
                          <span className="flex items-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                            Returning: {trend.returningGuests}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {!selectedPropertyId && (
          <div className="text-center py-12">
            <p className="text-gray-500">Please select a property to view guest demographics</p>
          </div>
        )}
      </div>
    </div>
  );
}
