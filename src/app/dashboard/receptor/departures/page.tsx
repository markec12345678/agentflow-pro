"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format, addDays, startOfDay } from "date-fns";
import { sl } from "date-fns/locale";
import { toast } from "sonner";
import { PropertySelector } from "@/web/components/PropertySelector";

interface Departure {
  id: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  roomNumber: string;
  roomType: string;
  checkOutTime: string;
  totalPrice: number;
  channel: string;
  status: "confirmed" | "checked-out" | "late-checkout";
  notes?: string;
  roomStatus: "clean" | "dirty" | "cleaning";
}

export default function DeparturesPage() {
  const router = useRouter();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    if (selectedPropertyId) {
      fetchDepartures();
    }
  }, [selectedPropertyId, selectedDate]);

  const fetchDepartures = async () => {
    if (!selectedPropertyId) return;
    
    setLoading(true);
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const response = await fetch(`/api/tourism/today-overview?propertyId=${selectedPropertyId}&date=${dateStr}`);
      if (response.ok) {
        const data = await response.json();
        setDepartures(data.departures || []);
      } else {
        toast.error("Failed to fetch departures");
      }
    } catch (error) {
      toast.error("Error fetching departures");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async (departureId: string) => {
    try {
      const response = await fetch(`/api/tourism/reservations/${departureId}/check-out`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        toast.success("Guest checked out successfully!");
        fetchDepartures(); // Refresh list
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to check out guest");
      }
    } catch (error) {
      toast.error("Error checking out guest");
    }
  };

  const handleMarkClean = async (departureId: string) => {
    try {
      const response = await fetch(`/api/tourism/rooms/clean`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationId: departureId }),
      });

      if (response.ok) {
        toast.success("Room marked as clean!");
        fetchDepartures(); // Refresh list
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update room status");
      }
    } catch (error) {
      toast.error("Error updating room status");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "checked-out":
        return "bg-green-100 text-green-800";
      case "late-checkout":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "checked-out":
        return "Checked Out";
      case "late-checkout":
        return "Late Checkout";
      default:
        return "Pending";
    }
  };

  const getRoomStatusColor = (status: string) => {
    switch (status) {
      case "clean":
        return "bg-green-100 text-green-800";
      case "dirty":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const getRoomStatusText = (status: string) => {
    switch (status) {
      case "clean":
        return "Clean";
      case "dirty":
        return "Dirty";
      default:
        return "Cleaning";
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
              <h1 className="text-3xl font-bold text-gray-900">Today's Departures</h1>
              <p className="text-gray-600 mt-2">Manage guest check-outs for {format(selectedDate, "EEEE, MMMM d, yyyy", { locale: sl })}</p>
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
              title="Select departure date"
              placeholder="Select departure date"
            />
          </div>
        </div>

        {selectedPropertyId && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Total Departures</p>
                    <p className="text-2xl font-bold text-gray-900">{departures.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Checked Out</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {departures.filter(d => d.status === "checked-out").length}
                    </p>
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
                    <p className="text-sm text-gray-600">Rooms Clean</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {departures.filter(d => d.roomStatus === "clean").length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Departures List */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Departure List</h2>
              </div>
              
              {loading ? (
                <div className="p-6 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-500">Loading departures...</p>
                </div>
              ) : departures.length === 0 ? (
                <div className="p-6 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293H8m0 0l-2.586-2.586a1 1 0 00-.707-.293H6" />
                  </svg>
                  <p className="mt-2 text-gray-500">No departures scheduled for this date</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {departures.map((departure) => (
                    <div key={departure.id} className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4">
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">{departure.guestName}</h3>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="text-sm text-gray-500">{departure.guestEmail}</span>
                                <span className="text-sm text-gray-500">•</span>
                                <span className="text-sm text-gray-500">{departure.guestPhone}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-gray-900">{departure.roomNumber}</p>
                              <p className="text-sm text-gray-500">{departure.roomType}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-gray-900">{departure.checkOutTime}</p>
                              <p className="text-sm text-gray-500">{departure.channel}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-gray-900">€{departure.totalPrice.toFixed(2)}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(departure.status)}`}>
                                  {getStatusText(departure.status)}
                                </span>
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoomStatusColor(departure.roomStatus)}`}>
                                  {getRoomStatusText(departure.roomStatus)}
                                </span>
                              </div>
                            </div>
                          </div>
                          {departure.notes && (
                            <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                              <p className="text-sm text-gray-600">{departure.notes}</p>
                            </div>
                          )}
                        </div>
                        <div className="ml-4 flex items-center space-x-2">
                          {departure.status === "confirmed" && (
                            <button
                              onClick={() => handleCheckOut(departure.id)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              Check Out
                            </button>
                          )}
                          {departure.status === "checked-out" && departure.roomStatus !== "clean" && (
                            <button
                              onClick={() => handleMarkClean(departure.id)}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                              Mark Clean
                            </button>
                          )}
                          <Link
                            href={`/dashboard/guests/${departure.id}`}
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
            <p className="text-gray-500">Please select a property to view departures</p>
          </div>
        )}
      </div>
    </div>
  );
}
