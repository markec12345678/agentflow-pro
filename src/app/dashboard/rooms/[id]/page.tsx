"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
  description: string;
  basePrice: number;
  amenities: string[];
  photos: string[];
  seasonRates: any;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Reservation {
  id: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  channel: string;
  status: string;
  notes?: string;
}

interface MaintenanceTask {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in_progress" | "completed";
  assignedTo?: string;
  createdAt: string;
  dueDate?: string;
}

export default function RoomDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [room, setRoom] = useState<Room | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>([]);
  const [activeTab, setActiveTab] = useState<"details" | "reservations" | "maintenance">("details");

  // Resolve params Promise
  useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  useEffect(() => {
    if (selectedPropertyId && resolvedParams?.id) {
      fetchRoomDetails();
      fetchReservations();
      fetchMaintenanceTasks();
    }
  }, [selectedPropertyId, resolvedParams?.id]);

  const fetchRoomDetails = async () => {
    if (!selectedPropertyId || !resolvedParams?.id) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/tourism/properties/${selectedPropertyId}/rooms/${resolvedParams?.id}`);
      if (response.ok) {
        const data = await response.json();
        setRoom(data.room);
      } else {
        toast.error("Failed to fetch room details");
      }
    } catch (error) {
      toast.error("Error fetching room details");
    } finally {
      setLoading(false);
    }
  };

  const fetchReservations = async () => {
    if (!selectedPropertyId || !resolvedParams?.id) return;
    
    try {
      const response = await fetch(`/api/tourism/reservations?propertyId=${selectedPropertyId}&roomId=${resolvedParams?.id}`);
      if (response.ok) {
        const data = await response.json();
        setReservations(data.reservations || []);
      } else {
        toast.error("Failed to fetch reservations");
      }
    } catch (error) {
      toast.error("Error fetching reservations");
    }
  };

  const fetchMaintenanceTasks = async () => {
    if (!selectedPropertyId || !resolvedParams?.id) return;
    
    try {
      const response = await fetch(`/api/tourism/maintenance/tasks?propertyId=${selectedPropertyId}&roomId=${resolvedParams?.id}`);
      if (response.ok) {
        const data = await response.json();
        setMaintenanceTasks(data.tasks || []);
      } else {
        toast.error("Failed to fetch maintenance tasks");
      }
    } catch (error) {
      toast.error("Error fetching maintenance tasks");
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!resolvedParams?.id) return;
    
    try {
      const response = await fetch(`/api/rooms/${resolvedParams?.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success("Room status updated successfully!");
        fetchRoomDetails();
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-500">Loading room details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard/receptor/rooms" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← Back to Rooms
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Room Details</h1>
          <p className="text-gray-600 mt-2">Manage room information and status</p>
        </div>

        {/* Property Selector */}
        <div className="mb-6">
          <PropertySelector
            selectedPropertyId={selectedPropertyId}
            onPropertyChange={setSelectedPropertyId}
          />
        </div>

        {selectedPropertyId && room ? (
          <>
            {/* Room Header */}
            <div className="bg-white p-6 rounded-lg shadow mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{room.name}</h2>
                  <p className="text-gray-600">{room.type} • {room.capacity} guests • {room.beds || 0} beds</p>
                  <p className="text-gray-600">Base Price: €{room.basePrice.toFixed(2)}/night</p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(room.status)}`}>
                    {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
                  </span>
                  <select
                    value={room.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    title="Select room status"
                  >
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="out-of-order">Out of Order</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white shadow rounded-lg">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  <button
                    onClick={() => setActiveTab("details")}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "details"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    Details
                  </button>
                  <button
                    onClick={() => setActiveTab("reservations")}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "reservations"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    Reservations ({reservations.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("maintenance")}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "maintenance"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    Maintenance ({maintenanceTasks.length})
                  </button>
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === "details" && (
                  <div className="space-y-6">
                    {/* Basic Information */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Room Name</label>
                          <p className="text-gray-900">{room.name}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                          <p className="text-gray-900">{room.type}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Capacity</label>
                          <p className="text-gray-900">{room.capacity} guests</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Beds</label>
                          <p className="text-gray-900">{room.beds || 0}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Base Price</label>
                          <p className="text-gray-900">€{room.basePrice.toFixed(2)}/night</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                          <span className={`inline-flex px-2 py-1 text-sm font-semibold rounded-full ${getStatusColor(room.status)}`}>
                            {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    {room.description && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>
                        <p className="text-gray-700">{room.description}</p>
                      </div>
                    )}

                    {/* Amenities */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Amenities</h3>
                      <div className="flex flex-wrap gap-2">
                        {room.amenities.map((amenity, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full"
                          >
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Photos */}
                    {room.photos && room.photos.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Photos</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {room.photos.map((photo, index) => (
                            <div key={index} className="aspect-square bg-gray-200 rounded-lg overflow-hidden relative">
                              <Image
                                src={photo}
                                alt={`Room photo ${index + 1}`}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 50vw, 25vw"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "reservations" && (
                  <div className="space-y-4">
                    {reservations.length === 0 ? (
                      <div className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="mt-2 text-gray-500">No reservations found for this room</p>
                      </div>
                    ) : (
                      reservations.map((reservation) => (
                        <div key={reservation.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900">{reservation.guestName}</h4>
                              <p className="text-sm text-gray-500">{reservation.guestEmail}</p>
                              <p className="text-sm text-gray-500">{reservation.guestPhone}</p>
                              <p className="text-sm text-gray-500">
                                {format(new Date(reservation.checkIn), "MMM d, yyyy")} - {format(new Date(reservation.checkOut), "MMM d, yyyy")}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-gray-900">€{reservation.totalPrice.toFixed(2)}</p>
                              <p className="text-sm text-gray-500">{reservation.channel}</p>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                reservation.status === "confirmed" ? "bg-green-100 text-green-800" :
                                reservation.status === "cancelled" ? "bg-red-100 text-red-800" :
                                "bg-yellow-100 text-yellow-800"
                              }`}>
                                {reservation.status}
                              </span>
                            </div>
                          </div>
                          {reservation.notes && (
                            <div className="mt-2 p-2 bg-gray-50 rounded">
                              <p className="text-sm text-gray-600">{reservation.notes}</p>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === "maintenance" && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-gray-900">Maintenance Tasks</h3>
                      <Link
                        href={`/dashboard/rooms/${resolvedParams?.id}/maintenance/new`}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Add Task
                      </Link>
                    </div>
                    
                    {maintenanceTasks.length === 0 ? (
                      <div className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <p className="mt-2 text-gray-500">No maintenance tasks found</p>
                      </div>
                    ) : (
                      maintenanceTasks.map((task) => (
                        <div key={task.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900">{task.title}</h4>
                              <p className="text-sm text-gray-600">{task.description}</p>
                              <p className="text-sm text-gray-500">
                                Created: {format(new Date(task.createdAt), "MMM d, yyyy")}
                                {task.dueDate && ` • Due: ${format(new Date(task.dueDate), "MMM d, yyyy")}`}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(task.priority)}`}>
                                {task.priority.toUpperCase()}
                              </span>
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                task.status === "completed" ? "bg-green-100 text-green-800" :
                                task.status === "in_progress" ? "bg-blue-100 text-blue-800" :
                                "bg-gray-100 text-gray-800"
                              }`}>
                                {task.status.replace("_", " ").toUpperCase()}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : null}

        {!selectedPropertyId && (
          <div className="text-center py-12">
            <p className="text-gray-500">Please select a property to view room details</p>
          </div>
        )}
      </div>
    </div>
  );
}
