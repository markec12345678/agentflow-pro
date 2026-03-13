"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Percent, 
  Users, 
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  Plus,
  Download,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ─── Mock Data (zamenjaj z API kliki) ────────────────────────────────────────
const KPIS = {
  occupancy: { value: 78, change: 12, trend: "up" as const },
  revPAR: { value: 142, change: 8, trend: "up" as const },
  adr: { value: 182, change: -3, trend: "down" as const },
  direct: { value: 35, change: 15, trend: "up" as const },
  tasks: { value: 12, change: -5, trend: "up" as const },
};

const ARRIVALS = [
  { id: "1", guestName: "John Smith", room: "201", time: "14:00", source: "booking.com", price: 180, status: "confirmed" },
  { id: "2", guestName: "Maria Garcia", room: "Suite 5", time: "15:00", source: "airbnb", price: 250, status: "pending" },
  { id: "3", guestName: "Thomas Mueller", room: "105", time: "16:00", source: "direct", price: 150, status: "confirmed" },
  { id: "4", guestName: "Anna Novak", room: "302", time: "17:00", source: "expedia", price: 200, status: "confirmed" },
];

const DEPARTURES = [
  { id: "5", guestName: "Pierre Dubois", room: "201", time: "09:00", source: "booking.com", price: 180, status: "checked-out" },
  { id: "6", guestName: "Laura Johnson", room: "105", time: "10:00", source: "airbnb", price: 150, status: "pending" },
  { id: "7", guestName: "Marco Rossi", room: "302", time: "11:00", source: "direct", price: 200, status: "pending" },
];

const TASKS = [
  { id: "1", title: "Clean Room 201", type: "cleaning", priority: "high", due: "12:00", assignedTo: "Maria", status: "pending" },
  { id: "2", title: "Check-in: John Smith", type: "check-in", priority: "high", due: "14:00", assignedTo: null, status: "pending" },
  { id: "3", title: "Fix AC in Room 105", type: "maintenance", priority: "medium", due: "15:00", assignedTo: "Janez", status: "in-progress" },
  { id: "4", title: "Restock minibar - Suite 5", type: "cleaning", priority: "low", due: "16:00", assignedTo: null, status: "pending" },
  { id: "5", title: "Welcome VIP guest", type: "check-in", priority: "high", due: "17:00", assignedTo: "Ana", status: "pending" },
];

const RECENT_ACTIVITY = [
  { id: "1", type: "booking", description: "New booking from Booking.com - Room 201", time: "5 min ago", icon: "📋" },
  { id: "2", type: "message", description: "Message from Maria Garcia (Airbnb)", time: "15 min ago", icon: "💬" },
  { id: "3", type: "task", description: "Housekeeping completed - Room 302", time: "30 min ago", icon: "✅" },
  { id: "4", type: "payment", description: "Payment received - €180", time: "1 hour ago", icon: "💳" },
  { id: "5", type: "cancel", description: "Booking cancelled - Room 105", time: "2 hours ago", icon: "❌" },
];

// ─── Helper Components ───────────────────────────────────────────────────────

function KPICard({ title, value, change, trend, icon: Icon, suffix = "" }: any) {
  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-gray-400" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}{suffix}</div>
        <div className="flex items-center mt-2">
          {trend === "up" ? (
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
          )}
          <span className={`text-xs ${trend === "up" ? "text-green-500" : "text-red-500"}`}>
            {trend === "up" ? "+" : ""}{change}%
          </span>
          <span className="text-xs text-gray-500 ml-2">vs last month</span>
        </div>
      </CardContent>
    </Card>
  );
}

function SourceBadge({ source }: { source: string }) {
  const colors: Record<string, string> = {
    "booking.com": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    "airbnb": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    "direct": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    "expedia": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  };
  
  return (
    <Badge variant="outline" className={colors[source] || "bg-gray-100 text-gray-800"}>
      {source}
    </Badge>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    "high": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    "medium": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    "low": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  };
  
  return (
    <Badge variant="outline" className={colors[priority] || "bg-gray-100"}>
      {priority}
    </Badge>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    "confirmed": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    "pending": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    "checked-out": "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
    "cancelled": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };
  
  return (
    <Badge variant="outline" className={colors[status] || "bg-gray-100"}>
      {status}
    </Badge>
  );
}

// ─── Main Dashboard Component ────────────────────────────────────────────────

export default function TourismDashboard() {
  const [timeRange, setTimeRange] = useState("today");

  return (
    <div className="space-y-6">
      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dobrodošel nazaj! 👋
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Here's what's happening with your properties today
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nova rezervacija
          </Button>
        </div>
      </div>

      {/* ─── Time Range Filter ─────────────────────────────────────────────── */}
      <Tabs value={timeRange} onValueChange={setTimeRange} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-4">
          <TabsTrigger value="today">Danes</TabsTrigger>
          <TabsTrigger value="week">Teden</TabsTrigger>
          <TabsTrigger value="month">Mesec</TabsTrigger>
          <TabsTrigger value="year">Leto</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* ─── KPI Cards ─────────────────────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <KPICard
          title="Occupancy Rate"
          value={KPIS.occupancy.value}
          change={KPIS.occupancy.change}
          trend={KPIS.occupancy.trend}
          icon={Percent}
          suffix="%"
        />
        <KPICard
          title="RevPAR"
          value={KPIS.revPAR.value}
          change={KPIS.revPAR.change}
          trend={KPIS.revPAR.trend}
          icon={DollarSign}
          suffix="€"
        />
        <KPICard
          title="ADR"
          value={KPIS.adr.value}
          change={KPIS.adr.change}
          trend={KPIS.adr.trend}
          icon={DollarSign}
          suffix="€"
        />
        <KPICard
          title="Direct Bookings"
          value={KPIS.direct.value}
          change={KPIS.direct.change}
          trend={KPIS.direct.trend}
          icon={Users}
          suffix="%"
        />
        <KPICard
          title="Tasks Pending"
          value={KPIS.tasks.value}
          change={KPIS.tasks.change}
          trend={KPIS.tasks.trend}
          icon={CheckCircle2}
        />
      </div>

      {/* ─── Main Content Grid ─────────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* ─── Arrivals ────────────────────────────────────────────────────── */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  🤝 Arrivals Today
                </CardTitle>
                <CardDescription>{ARRIVALS.length} guests checking in</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/tourism/calendar">
                  View all
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ARRIVALS.map((arrival) => (
                <div
                  key={arrival.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-12 rounded-full bg-gradient-to-b from-green-400 to-green-600" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {arrival.guestName}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Room {arrival.room} • {arrival.time}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <SourceBadge source={arrival.source} />
                        <span className="text-xs text-gray-500">€{arrival.price}</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/reservations/${arrival.id}`}>
                      View
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ─── Departures ──────────────────────────────────────────────────── */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  📤 Departures Today
                </CardTitle>
                <CardDescription>{DEPARTURES.length} guests checking out</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/tourism/calendar">
                  View all
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {DEPARTURES.map((departure) => (
                <div
                  key={departure.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-12 rounded-full bg-gradient-to-b from-gray-400 to-gray-600" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {departure.guestName}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Room {departure.room} • {departure.time}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <SourceBadge source={departure.source} />
                        <span className="text-xs text-gray-500">€{departure.price}</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/reservations/${departure.id}`}>
                      View
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ─── Tasks ───────────────────────────────────────────────────────── */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  ✅ Tasks
                </CardTitle>
                <CardDescription>{TASKS.filter(t => t.status === "pending").length} pending tasks</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/housekeeping">
                  View all
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {TASKS.slice(0, 4).map((task) => (
                <div
                  key={task.id}
                  className="flex items-start justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {task.type === "cleaning" ? (
                      <div className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                        🧹
                      </div>
                    ) : task.type === "check-in" ? (
                      <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                        🤝
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                        🔧
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <PriorityBadge priority={task.priority} />
                        <span className="text-xs text-gray-500">Due: {task.due}</span>
                      </div>
                      {task.assignedTo && (
                        <p className="text-xs text-gray-500 mt-1">
                          👤 {task.assignedTo}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full mt-2" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add new task
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Recent Activity & Performance ─────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📰 Recent Activity
            </CardTitle>
            <CardDescription>Latest updates from your properties</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {RECENT_ACTIVITY.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="text-xl">{activity.icon}</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📊 Performance (7 days)
            </CardTitle>
            <CardDescription>Key metrics overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Occupancy (7 days)</span>
                  <span className="font-medium">78%</span>
                </div>
                <Progress value={78} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Revenue vs. forecast</span>
                  <span className="font-medium text-green-600">+12%</span>
                </div>
                <Progress value={112} className="h-2" indicatorClassName="bg-green-600" />
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Direct bookings</span>
                  <span className="font-medium">35%</span>
                </div>
                <Progress value={35} className="h-2" indicatorClassName="bg-purple-600" />
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Guest satisfaction</span>
                  <span className="font-medium">4.8/5</span>
                </div>
                <Progress value={96} className="h-2" indicatorClassName="bg-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
