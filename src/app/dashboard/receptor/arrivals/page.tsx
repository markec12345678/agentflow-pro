"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format, addDays, startOfDay } from "date-fns";
import { sl } from "date-fns/locale";
import { toast } from "sonner";
import { PropertySelector } from "@/web/components/PropertySelector";

interface Arrival {
  id: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  roomNumber: string;
  roomType: string;
  checkInTime: string;
  totalPrice: number;
  channel: string;
  status: "confirmed" | "checked-in" | "late";
  notes?: string;
}

export default function ArrivalsPage() {
  const router = useRouter();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [arrivals, setArrivals] = useState<Arrival[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    if (selectedPropertyId) {
      fetchArrivals();
    }
  }, [selectedPropertyId, selectedDate]);

  const fetchArrivals = async () => {
    if (!selectedPropertyId) return;
    
    setLoading(true);
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const response = await fetch(`/api/tourism/today-overview?propertyId=${selectedPropertyId}&date=${dateStr}`);
      if (response.ok) {
        const data = await response.json();
        setArrivals(data.arrivals || []);
      } else {
        toast.error("Failed to fetch arrivals");
      }
    } catch (error) {
      toast.error("Error fetching arrivals");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (arrivalId: string) => {
    try {
      const response = await fetch(`/api/tourism/reservations/${arrivalId}/check-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        toast.success("Guest checked in successfully!");
        fetchArrivals(); // Refresh list
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to check in guest");
      }
    } catch (error) {
      toast.error("Error checking in guest");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "checked-in":
        return "bg-green-100 text-green-800";
      case "late":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "checked-in":
        return "Checked In";
      case "late":
        return "Late";
      default:
        return "Pending";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/dashboard/receptor" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
                ← Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Today's Arrivals</h1>
              <p className="text-gray-600 mt-2">Manage guest check-ins for {format(selectedDate, "EEEE, MMMM d, yyyy", { locale: sl })}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <PropertySelector
              selectedPropertyId={selectedPropertyId}
              onPropertyChange={setSelectedPropertyId}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              value={format(selectedDate, "yyyy-MM-dd")}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              title="Select arrival date"
              placeholder="Select arrival date"
            />
          </div>
        </div>

        {selectedPropertyId && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Total Arrivals</p>
                    <p className="text-2xl font-bold text-gray-900">{arrivals.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Checked In</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {arrivals.filter(a => a.status === "checked-in").length}
                    </p>
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
                    <p className="text-2xl font-bold text-gray-900">
                      {arrivals.filter(a => a.status === "confirmed").length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Arrivals List */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Arrival List</h2>
              </div>
              
              {loading ? (
                <div className="p-6 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-500">Loading arrivals...</p>
                </div>
              ) : arrivals.length === 0 ? (
                <div className="p-6 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293H8m0 0l-2.586-2.586a1 1 0 00-.707-.293H6" />
                  </svg>
                  <p className="mt-2 text-gray-500">No arrivals scheduled for this date</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {arrivals.map((arrival) => (
                    <div key={arrival.id} className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4">
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">{arrival.guestName}</h3>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="text-sm text-gray-500">{arrival.guestEmail}</span>
                                <span className="text-sm text-gray-500">•</span>
                                <span className="text-sm text-gray-500">{arrival.guestPhone}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-gray-900">{arrival.roomNumber}</p>
                              <p className="text-sm text-gray-500">{arrival.roomType}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-gray-900">{arrival.checkInTime}</p>
                              <p className="text-sm text-gray-500">{arrival.channel}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-gray-900">€{arrival.totalPrice.toFixed(2)}</p>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(arrival.status)}`}>
                                {getStatusText(arrival.status)}
                              </span>
                            </div>
                          </div>
                          {arrival.notes && (
                            <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                              <p className="text-sm text-gray-600">{arrival.notes}</p>
                            </div>
                          )}
                        </div>
                        <div className="ml-4 flex items-center space-x-2">
                          {arrival.status === "confirmed" && (
                            <button
                              onClick={() => handleCheckIn(arrival.id)}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                              Check In
                            </button>
                          )}
                          <Link
                            href={`/dashboard/guests/${arrival.id}`}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            View Details
                          </Link>
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
            <p className="text-gray-500">Please select a property to view arrivals</p>
          </div>
        )}
      </div>
    </div>
  );
}
