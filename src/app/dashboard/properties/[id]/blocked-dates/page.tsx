"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, X, Calendar, Wrench, Home, AlertCircle, Trash2, Edit } from "lucide-react";
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from "date-fns";
import { sl } from "date-fns/locale";

interface BlockedDate {
  id: string;
  date: string;
  reason?: string;
  roomId?: string;
  createdAt: string;
}

interface Room {
  id: string;
  name: string;
  type: string;
}

const BLOCK_REASONS = [
  { value: "maintenance", label: "Maintenance", icon: <Wrench className="w-4 h-4" />, color: "orange" },
  { value: "owner-use", label: "Owner Use", icon: <Home className="w-4 h-4" />, color: "blue" },
  { value: "closed", label: "Property Closed", icon: <AlertCircle className="w-4 h-4" />, color: "red" },
  { value: "renovation", label: "Renovation", icon: <Wrench className="w-4 h-4" />, color: "purple" },
  { value: "other", label: "Other", icon: <AlertCircle className="w-4 h-4" />, color: "gray" }
];

export default function BlockedDatesPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;
  
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBlock, setNewBlock] = useState({
    startDate: "",
    endDate: "",
    reason: "maintenance",
    roomId: "",
    notes: ""
  });

  useEffect(() => {
    if (propertyId) {
      fetchData();
    }
  }, [propertyId]);

  const fetchData = async () => {
    try {
      const [blockedRes, roomsRes] = await Promise.all([
        fetch(`/api/tourism/properties/${propertyId}/blocked-dates`),
        fetch(`/api/tourism/properties/${propertyId}/rooms`)
      ]);

      if (blockedRes.ok && roomsRes.ok) {
        const blockedData = await blockedRes.json();
        const roomsData = await roomsRes.json();
        setBlockedDates(blockedData);
        setRooms(roomsData);
      }
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const addBlockedDates = async () => {
    try {
      const response = await fetch(`/api/tourism/calendar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          type: "blocked",
          checkIn: newBlock.startDate,
          checkOut: addDays(new Date(newBlock.endDate), 1).toISOString().split('T')[0],
          roomId: newBlock.roomId || null,
          notes: newBlock.notes || BLOCK_REASONS.find(r => r.value === newBlock.reason)?.label
        }),
      });

      if (response.ok) {
        toast.success("Dates blocked successfully");
        setShowAddForm(false);
        setNewBlock({ startDate: "", endDate: "", reason: "maintenance", roomId: "", notes: "" });
        fetchData();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to block dates");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const removeBlockedDate = async (blockedDateId: string) => {
    try {
      const response = await fetch(`/api/tourism/calendar?id=${blockedDateId}&type=blocked`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Date unblocked successfully");
        fetchData();
      } else {
        toast.error("Failed to unblock date");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const getBlockedDatesForDay = (day: Date) => {
    return blockedDates.filter(blocked => 
      isSameDay(new Date(blocked.date), day)
    );
  };

  const getDaysInMonth = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  };

  const getQuickBlockDates = (reason: string) => {
    const today = new Date();
    switch (reason) {
      case "maintenance":
        return {
          startDate: format(today, "yyyy-MM-dd"),
          endDate: format(addDays(today, 2), "yyyy-MM-dd"),
          notes: "Scheduled maintenance"
        };
      case "owner-use":
        return {
          startDate: format(addDays(today, 7), "yyyy-MM-dd"),
          endDate: format(addDays(today, 10), "yyyy-MM-dd"),
          notes: "Owner vacation"
        };
      default:
        return {
          startDate: format(today, "yyyy-MM-dd"),
          endDate: format(today, "yyyy-MM-dd"),
          notes: ""
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 35 }).map((_, i) => (
                    <div key={i} className="h-12 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-16 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/dashboard/properties/${propertyId}`} className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← Back to Property
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Blocked Dates</h1>
          <p className="text-gray-600 mt-2">Manage unavailable dates for maintenance, owner use, or other reasons</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {format(currentMonth, "MMMM yyyy", { locale: sl })}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  ←
                </button>
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  →
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {["Pon", "Tor", "Sre", "Čet", "Pet", "Sob", "Ned"].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
                  {day}
                </div>
              ))}
              
              {getDaysInMonth().map((day) => {
                const blockedForDay = getBlockedDatesForDay(day);
                const isBlocked = blockedForDay.length > 0;
                const isCurrentDay = isToday(day);

                return (
                  <div
                    key={day.toISOString()}
                    className={`aspect-square border rounded-lg p-2 relative ${
                      isCurrentDay ? "border-blue-500 bg-blue-50" : "border-gray-200"
                    } ${isBlocked ? "bg-red-50 border-red-200" : ""}`}
                  >
                    <div className="text-sm font-medium">{format(day, "d")}</div>
                    {isBlocked && (
                      <div className="absolute bottom-1 left-1 right-1">
                        <div className="text-xs text-red-600 truncate">
                          {blockedForDay[0].reason || "Blocked"}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                {BLOCK_REASONS.map((reason) => (
                  <button
                    key={reason.value}
                    onClick={() => {
                      const dates = getQuickBlockDates(reason.value);
                      setNewBlock({
                        ...dates,
                        reason: reason.value,
                        roomId: ""
                      });
                      setShowAddForm(true);
                    }}
                    className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className={`p-2 rounded-lg bg-${reason.color}-100 text-${reason.color}-600`}>
                      {reason.icon}
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-900">{reason.label}</div>
                      <div className="text-sm text-gray-600">Quick block</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Blocked Dates List */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Blocked Dates ({blockedDates.length})
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {blockedDates.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No blocked dates</p>
                ) : (
                  blockedDates.map((blocked) => {
                    const reasonInfo = BLOCK_REASONS.find(r => r.value === blocked.reason);
                    return (
                      <div key={blocked.id} className="flex items-start justify-between p-3 border border-gray-200 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`p-1 rounded bg-${reasonInfo?.color || 'gray'}-100 text-${reasonInfo?.color || 'gray'}-600`}>
                              {reasonInfo?.icon || <AlertCircle className="w-3 h-3" />}
                            </div>
                            <span className="font-medium text-gray-900">
                              {format(new Date(blocked.date), "dd.MM.yyyy")}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">
                            {blocked.notes || reasonInfo?.label || "Blocked"}
                          </div>
                        </div>
                        <button
                          onClick={() => removeBlockedDate(blocked.id)}
                          className="p-1 text-red-600 hover:text-red-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Add Blocked Dates Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Block Dates</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={newBlock.startDate}
                    onChange={(e) => setNewBlock({ ...newBlock, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={newBlock.endDate}
                    onChange={(e) => setNewBlock({ ...newBlock, endDate: e.target.value })}
                    min={newBlock.startDate}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                  <select
                    value={newBlock.reason}
                    onChange={(e) => setNewBlock({ ...newBlock, reason: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {BLOCK_REASONS.map((reason) => (
                      <option key={reason.value} value={reason.value}>{reason.label}</option>
                    ))}
                  </select>
                </div>

                {rooms.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Room (optional)</label>
                    <select
                      value={newBlock.roomId}
                      onChange={(e) => setNewBlock({ ...newBlock, roomId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">All Rooms</option>
                      {rooms.map((room) => (
                        <option key={room.id} value={room.id}>{room.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <input
                    type="text"
                    value={newBlock.notes}
                    onChange={(e) => setNewBlock({ ...newBlock, notes: e.target.value })}
                    placeholder="Additional notes..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={addBlockedDates}
                  disabled={!newBlock.startDate || !newBlock.endDate}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Block Dates
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewBlock({ startDate: "", endDate: "", reason: "maintenance", roomId: "", notes: "" });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
