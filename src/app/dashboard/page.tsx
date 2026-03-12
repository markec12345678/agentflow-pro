"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface KPI {
  label: string;
  value: string | number;
  change: number;
  trend: "up" | "down" | "neutral";
  icon: string;
}

interface Booking {
  id: string;
  guestName: string;
  property: string;
  checkIn: string;
  checkOut: string;
  status: "confirmed" | "pending" | "checked-in" | "checked-out";
  channel: "booking.com" | "airbnb" | "direct" | "expedia";
  revenue: number;
}

interface Task {
  id: string;
  title: string;
  type: "cleaning" | "maintenance" | "check-in" | "check-out";
  priority: "high" | "medium" | "low";
  due: string;
  assignedTo?: string;
}

interface Activity {
  id: string;
  type: "booking" | "message" | "task" | "payment";
  description: string;
  time: string;
  icon: string;
}

// ─── Mock Data (replace with real API calls) ──────────────────────────────────
const KPIS: KPI[] = [
  { label: "Occupancy Rate", value: "78%", change: 12, trend: "up", icon: "📊" },
  { label: "RevPAR", value: "€142", change: 8, trend: "up", icon: "💰" },
  { label: "ADR", value: "€182", change: -3, trend: "down", icon: "🏷️" },
  { label: "Direct Bookings", value: "35%", change: 15, trend: "up", icon: "🌐" },
  { label: "Tasks Pending", value: "12", change: -5, trend: "up", icon: "✅" },
];

const ARRIVALS: Booking[] = [
  { id: "1", guestName: "John Smith", property: "Room 201", checkIn: "14:00", checkOut: "11:00", status: "confirmed", channel: "booking.com", revenue: 180 },
  { id: "2", guestName: "Maria Garcia", property: "Suite 5", checkIn: "15:00", checkOut: "10:00", status: "pending", channel: "airbnb", revenue: 250 },
  { id: "3", guestName: "Thomas Mueller", property: "Room 105", checkIn: "16:00", checkOut: "09:00", status: "confirmed", channel: "direct", revenue: 150 },
];

const DEPARTURES: Booking[] = [
  { id: "4", guestName: "Anna Novak", property: "Room 302", checkIn: "11:00", checkOut: "10:00", status: "checked-out", channel: "expedia", revenue: 200 },
  { id: "5", guestName: "Pierre Dubois", property: "Room 201", checkIn: "10:00", checkOut: "09:00", status: "checked-out", channel: "booking.com", revenue: 180 },
];

const TASKS: Task[] = [
  { id: "1", title: "Clean Room 201", type: "cleaning", priority: "high", due: "12:00", assignedTo: "Maria" },
  { id: "2", title: "Check-in: John Smith", type: "check-in", priority: "high", due: "14:00" },
  { id: "3", title: "Fix AC in Room 105", type: "maintenance", priority: "medium", due: "15:00", assignedTo: "Janez" },
  { id: "4", title: "Restock minibar - Suite 5", type: "cleaning", priority: "low", due: "16:00" },
];

const ACTIVITIES: Activity[] = [
  { id: "1", type: "booking", description: "New booking from Booking.com - Room 201", time: "5 min ago", icon: "📋" },
  { id: "2", type: "message", description: "Message from Maria Garcia (Airbnb)", time: "15 min ago", icon: "💬" },
  { id: "3", type: "task", description: "Housekeeping completed - Room 302", time: "30 min ago", icon: "✅" },
  { id: "4", type: "payment", description: "Payment received - €180", time: "1 hour ago", icon: "💳" },
  { id: "5", type: "booking", description: "Booking cancelled - Room 105", time: "2 hours ago", icon: "❌" },
];

// ─── Helper Components ────────────────────────────────────────────────────────

function KPICard({ kpi }: { kpi: KPI }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <span className="text-2xl">{kpi.icon}</span>
        <span className={`text-sm font-semibold px-2 py-1 rounded-full ${
          kpi.trend === "up" 
            ? "bg-green-100 text-green-700" 
            : kpi.trend === "down"
            ? "bg-red-100 text-red-700"
            : "bg-gray-100 text-gray-700"
        }`}>
          {kpi.trend === "up" ? "↑" : kpi.trend === "down" ? "↓" : "→"} {Math.abs(kpi.change)}%
        </span>
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-1">{kpi.value}</div>
      <div className="text-sm text-gray-500">{kpi.label}</div>
    </div>
  );
}

function BookingCard({ booking, type }: { booking: Booking; type: "arrival" | "departure" }) {
  const channelColors = {
    "booking.com": "bg-blue-100 text-blue-700",
    "airbnb": "bg-rose-100 text-rose-700",
    "direct": "bg-green-100 text-green-700",
    "expedia": "bg-yellow-100 text-yellow-700",
  };

  const statusColors = {
    "confirmed": "bg-green-500",
    "pending": "bg-yellow-500",
    "checked-in": "bg-blue-500",
    "checked-out": "bg-gray-400",
  };

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-12 rounded-full ${statusColors[booking.status]}`} />
        <div>
          <div className="font-semibold text-gray-900">{booking.guestName}</div>
          <div className="text-sm text-gray-500">{booking.property} • {type === "arrival" ? booking.checkIn : booking.checkOut}</div>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs px-2 py-0.5 rounded-full ${channelColors[booking.channel]}`}>
              {booking.channel}
            </span>
            <span className="text-xs text-gray-600">€{booking.revenue}</span>
          </div>
        </div>
      </div>
      <Link 
        href={`/bookings/${booking.id}`}
        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
      >
        View →
      </Link>
    </div>
  );
}

function TaskCard({ task }: { task: Task }) {
  const priorityColors = {
    "high": "bg-red-100 text-red-700",
    "medium": "bg-yellow-100 text-yellow-700",
    "low": "bg-blue-100 text-blue-700",
  };

  const typeIcons = {
    "cleaning": "🧹",
    "maintenance": "🔧",
    "check-in": "👋",
    "check-out": "🚪",
  };

  return (
    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
      <div className="flex items-center gap-3">
        <span className="text-xl">{typeIcons[task.type]}</span>
        <div>
          <div className="font-medium text-gray-900">{task.title}</div>
          <div className="text-sm text-gray-500">Due: {task.due} {task.assignedTo && `• ${task.assignedTo}`}</div>
        </div>
      </div>
      <span className={`text-xs px-2 py-1 rounded-full font-medium ${priorityColors[task.priority]}`}>
        {task.priority}
      </span>
    </div>
  );
}

function ActivityItem({ activity }: { activity: Activity }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <span className="text-lg">{activity.icon}</span>
      <div className="flex-1">
        <div className="text-sm text-gray-900">{activity.description}</div>
        <div className="text-xs text-gray-500 mt-0.5">{activity.time}</div>
      </div>
    </div>
  );
}

// ─── Main Dashboard Component ─────────────────────────────────────────────────

export default function DashboardPage() {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <div className="text-gray-600">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Dobrodošel nazaj, {session?.user?.name?.split(" ")[0] || session?.user?.email?.split("@")[0] || "User"}! 👋
            </h1>
            <p className="text-gray-500 mt-1">
              Here's what's happening with your properties today
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/bookings/new"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <span>➕</span>
              <span>Nova rezervacija</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8 space-y-8">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {KPIS.map((kpi) => (
            <KPICard key={kpi.label} kpi={kpi} />
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Arrivals & Departures */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Smart Calendar Placeholder */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">📅 Smart Calendar</h2>
                <div className="flex items-center gap-2">
                  <button className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1 rounded-lg hover:bg-gray-100">
                    ← Previous
                  </button>
                  <button className="text-sm font-medium text-gray-900 px-3 py-1">
                    March 2026
                  </button>
                  <button className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1 rounded-lg hover:bg-gray-100">
                    Next →
                  </button>
                </div>
              </div>
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                <div className="text-gray-400 mb-2">📆</div>
                <div className="text-gray-600 font-medium">Interactive calendar coming soon</div>
                <div className="text-sm text-gray-500 mt-1">Drag & drop bookings, inline editing</div>
              </div>
            </div>

            {/* Arrivals Today */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">👋 Arrivals Today</h2>
                <Link href="/arrivals" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  View all →
                </Link>
              </div>
              <div className="space-y-3">
                {ARRIVALS.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} type="arrival" />
                ))}
              </div>
            </div>

            {/* Departures Today */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">🚪 Departures Today</h2>
                <Link href="/departures" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  View all →
                </Link>
              </div>
              <div className="space-y-3">
                {DEPARTURES.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} type="departure" />
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Tasks & Activity */}
          <div className="space-y-6">
            
            {/* Tasks Requiring Action */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">✅ Tasks</h2>
                <Link href="/tasks" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  View all →
                </Link>
              </div>
              <div className="space-y-3">
                {TASKS.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
              <button className="w-full mt-4 text-center text-sm text-gray-600 hover:text-gray-900 py-2 rounded-lg hover:bg-gray-50">
                + Add new task
              </button>
            </div>

            {/* Recent Activity Feed */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">📰 Recent Activity</h2>
                <Link href="/activity" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  View all →
                </Link>
              </div>
              <div className="space-y-1">
                {ACTIVITIES.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </div>
            </div>

            {/* Performance Trends */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">📈 Performance</h2>
                <Link href="/analytics" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  View all →
                </Link>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Occupancy (7 days)</span>
                    <span className="font-medium text-gray-900">78%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: "78%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Revenue vs. forecast</span>
                    <span className="font-medium text-green-600">+12%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: "112%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Direct bookings</span>
                    <span className="font-medium text-gray-900">35%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: "35%" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
