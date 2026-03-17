"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format, addDays, startOfDay } from "date-fns";
import { sl } from "date-fns/locale";
import { toast } from "sonner";
import { PropertySelector } from "@/web/components/PropertySelector";

interface Room {
  id: string;
  name: string;
  type: string;
  capacity: number;
  beds: number;
  basePrice: number;
  status: "available" | "occupied" | "cleaning" | "maintenance" | "out-of-order";
  currentGuest?: {
    name: string;
    checkIn: string;
    checkOut: string;
    channel: string;
  };
  nextGuest?: {
    name: string;
    checkIn: string;
    checkOut: string;
    channel: string;
  };
  amenities: string[];
  photos: string[];
  lastCleaned?: string;
  notes?: string;
}

export default function RoomsPage() {
  const router = useRouter();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    if (selectedPropertyId) {
      fetchRooms();
    }
  }, [selectedPropertyId]);

  const fetchRooms = async () => {
    if (!selectedPropertyId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/tourism/rooms/status?propertyId=${selectedPropertyId}`);
      if (response.ok) {
        const data = await response.json();
        setRooms(data.rooms || []);
      } else {
        toast.error("Failed to fetch room status");
      }
    } catch (error) {
      toast.error("Error fetching room status");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (roomId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/v1/tourism/rooms/${roomId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success("Room status updated successfully!");
        fetchRooms(); // Refresh list
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
      case "available":
        return "bg-green-100 text-green-800";
      case "occupied":
        return "bg-blue-100 text-blue-800";
      case "cleaning":
        return "bg-yellow-100 text-yellow-800";
      case "maintenance":
        return "bg-red-100 text-red-800";
      case "out-of-order":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "available":
        return "Available";
      case "occupied":
        return "Occupied";
      case "cleaning":
        return "Cleaning";
      case "maintenance":
        return "Maintenance";
      case "out-of-order":
        return "Out of Order";
      default:
        return "Unknown";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "available":
        return (
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case "occupied":
        return (
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case "cleaning":
        return (
          <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case "maintenance":
        return (
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
    }
  };

  const filteredRooms = rooms.filter(room => {
    if (filter === "all") return true;
    return room.status === filter;
  });

  const roomStats = {
    total: rooms.length,
    available: rooms.filter(r => r.status === "available").length,
    occupied: rooms.filter(r => r.status === "occupied").length,
    cleaning: rooms.filter(r => r.status === "cleaning").length,
    maintenance: rooms.filter(r => r.status === "maintenance").length,
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
              <h1 className="text-3xl font-bold text-gray-900">Room Status</h1>
              <p className="text-gray-600 mt-2">Real-time room availability and status</p>
            </div>
          </div>
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
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="text-xl font-bold text-gray-900">{roomStats.total}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    {getStatusIcon("available")}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-600">Available</p>
                    <p className="text-xl font-bold text-green-600">{roomStats.available}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    {getStatusIcon("occupied")}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-600">Occupied</p>
                    <p className="text-xl font-bold text-blue-600">{roomStats.occupied}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    {getStatusIcon("cleaning")}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-600">Cleaning</p>
                    <p className="text-xl font-bold text-yellow-600">{roomStats.cleaning}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    {getStatusIcon("maintenance")}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-600">Maintenance</p>
                    <p className="text-xl font-bold text-red-600">{roomStats.maintenance}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter */}
            <div className="mb-6">
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700">Filter:</label>
                <div className="flex space-x-2">
                  {["all", "available", "occupied", "cleaning", "maintenance", "out-of-order"].map((status) => (
                    <button
                      key={status}
                      onClick={() => setFilter(status)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium ${
                        filter === status
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {status === "all" ? "All" : getStatusText(status)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Rooms Grid */}
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-500">Loading rooms...</p>
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <p className="mt-2 text-gray-500">No rooms found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredRooms.map((room) => (
                  <div key={room.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                    {/* Room Header */}
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">{room.name}</h3>
                          <p className="text-sm text-gray-500">{room.type}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(room.status)}
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(room.status)}`}>
                            {getStatusText(room.status)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Room Details */}
                    <div className="p-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Capacity:</span>
                          <span className="font-medium">{room.capacity} guests</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Beds:</span>
                          <span className="font-medium">{room.beds || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Price:</span>
                          <span className="font-medium">€{room.basePrice.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Current Guest */}
                      {room.currentGuest && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm font-medium text-blue-900">Current Guest</p>
                          <p className="text-sm text-blue-700">{room.currentGuest.name}</p>
                          <p className="text-xs text-blue-600">
                            {format(new Date(room.currentGuest.checkIn), "MMM d")} - {format(new Date(room.currentGuest.checkOut), "MMM d")}
                          </p>
                          <p className="text-xs text-blue-600">{room.currentGuest.channel}</p>
                        </div>
                      )}

                      {/* Next Guest */}
                      {room.nextGuest && (
                        <div className="mt-4 p-3 bg-green-50 rounded-lg">
                          <p className="text-sm font-medium text-green-900">Next Guest</p>
                          <p className="text-sm text-green-700">{room.nextGuest.name}</p>
                          <p className="text-xs text-green-600">
                            {format(new Date(room.nextGuest.checkIn), "MMM d")} - {format(new Date(room.nextGuest.checkOut), "MMM d")}
                          </p>
                          <p className="text-xs text-green-600">{room.nextGuest.channel}</p>
                        </div>
                      )}

                      {/* Last Cleaned */}
                      {room.lastCleaned && (
                        <div className="mt-2 text-xs text-gray-500">
                          Last cleaned: {format(new Date(room.lastCleaned), "MMM d, HH:mm")}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="mt-4 flex space-x-2">
                        <select
                          value={room.status}
                          onChange={(e) => handleStatusChange(room.id, e.target.value)}
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          title="Select room status"
                        >
                          <option value="available">Available</option>
                          <option value="occupied">Occupied</option>
                          <option value="cleaning">Cleaning</option>
                          <option value="maintenance">Maintenance</option>
                          <option value="out-of-order">Out of Order</option>
                        </select>
                        <Link
                          href={`/dashboard/properties/${selectedPropertyId}/rooms/${room.id}`}
                          className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                        >
                          Edit
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {!selectedPropertyId && (
          <div className="text-center py-12">
            <p className="text-gray-500">Please select a property to view room status</p>
          </div>
        )}
      </div>
    </div>
  );
}
