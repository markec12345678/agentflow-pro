"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format, addDays, startOfDay } from "date-fns";
import { sl } from "date-fns/locale";
import { toast } from "sonner";
import { PropertySelector } from "@/web/components/PropertySelector";

interface DailyStats {
  arrivals: number;
  departures: number;
  inHouse: number;
  available: number;
  occupancyRate: number;
  revenue: number;
  pendingReservations: number;
}

interface QuickReservation {
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  roomId: string;
  guests: number;
  totalPrice: number;
}

export default function ReceptorDashboard() {
  const router = useRouter();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DailyStats | null>(null);
  const [today] = useState(new Date());

  useEffect(() => {
    if (selectedPropertyId) {
      fetchDailyStats();
    }
  }, [selectedPropertyId]);

  const fetchDailyStats = async () => {
    if (!selectedPropertyId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/tourism/today-overview?propertyId=${selectedPropertyId}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        toast.error("Failed to fetch daily stats");
      }
    } catch (error) {
      toast.error("Error fetching stats");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickReservation = async (reservation: QuickReservation) => {
    try {
      const response = await fetch("/api/tourism/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...reservation,
          propertyId: selectedPropertyId,
          status: "confirmed",
          channel: "direct"
        }),
      });

      if (response.ok) {
        toast.success("Reservation created successfully!");
        fetchDailyStats(); // Refresh stats
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to create reservation");
      }
    } catch (error) {
      toast.error("Error creating reservation");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Receptor Dashboard</h1>
          <p className="text-gray-600 mt-2">Daily operations and guest management</p>
        </div>

        {/* Property Selector */}
        <div className="mb-6">
          <PropertySelector
            selectedPropertyId={selectedPropertyId}
            onPropertyChange={setSelectedPropertyId}
          />
        </div>

        {selectedPropertyId && (
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Arrivals Today</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.arrivals || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Departures Today</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.departures || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">In House</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.inHouse || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.pendingReservations || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Today's Schedule */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Today's Schedule</h2>
                <div className="space-y-4">
                  <Link href="/dashboard/receptor/arrivals" className="block p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Arrivals</h3>
                        <p className="text-sm text-gray-600">Check-ins scheduled for today</p>
                      </div>
                      <div className="text-2xl font-bold text-green-600">{stats?.arrivals || 0}</div>
                    </div>
                  </Link>
                  
                  <Link href="/dashboard/receptor/departures" className="block p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Departures</h3>
                        <p className="text-sm text-gray-600">Check-outs scheduled for today</p>
                      </div>
                      <div className="text-2xl font-bold text-blue-600">{stats?.departures || 0}</div>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
                <div className="space-y-4">
                  <Link href="/dashboard/receptor/quick-reservation" className="block p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-lg mr-4">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium">Quick Reservation</h3>
                        <p className="text-sm text-gray-600">Create a new reservation</p>
                      </div>
                    </div>
                  </Link>
                  
                  <Link href="/dashboard/receptor/rooms" className="block p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center">
                      <div className="p-2 bg-purple-100 rounded-lg mr-4">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium">Room Status</h3>
                        <p className="text-sm text-gray-600">Real-time room availability</p>
                      </div>
                    </div>
                  </Link>
                  
                  <Link href="/dashboard/receptor/guests/search" className="block p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center">
                      <div className="p-2 bg-green-100 rounded-lg mr-4">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium">Guest Search</h3>
                        <p className="text-sm text-gray-600">Find guest information</p>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="mt-8 bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">New reservation received</p>
                    <p className="text-sm text-gray-600">John Doe - Room 101</p>
                  </div>
                  <span className="text-sm text-gray-500">2 minutes ago</span>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Guest checked out</p>
                    <p className="text-sm text-gray-600">Jane Smith - Room 205</p>
                  </div>
                  <span className="text-sm text-gray-500">15 minutes ago</span>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Room cleaned</p>
                    <p className="text-sm text-gray-600">Room 101 - Ready for check-in</p>
                  </div>
                  <span className="text-sm text-gray-500">30 minutes ago</span>
                </div>
              </div>
            </div>
          </>
        )}

        {!selectedPropertyId && (
          <div className="text-center py-12">
            <p className="text-gray-500">Please select a property to view the dashboard</p>
          </div>
        )}
      </div>
    </div>
  );
}
