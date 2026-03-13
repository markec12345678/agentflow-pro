"use client";

import { useState } from "react";
import { Plus, Search, Filter, User, Clock, AlertCircle, CheckCircle2, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ─── Mock Data ───────────────────────────────────────────────────────────────
const ROOMS = {
  dirty: [
    { id: "201", number: "201", type: "Standard", guest: "Maria Garcia", checkout: "10:00", priority: "high" },
    { id: "205", number: "205", type: "Suite", guest: "John Smith", checkout: "11:00", priority: "high" },
    { id: "302", number: "302", type: "Deluxe", guest: "Stay-over", checkout: null, priority: "medium" },
    { id: "105", number: "105", type: "Standard", guest: "Check-out", checkout: "09:00", priority: "high" },
    { id: "410", number: "410", type: "Apartment", guest: "VIP Guest", checkout: "12:00", priority: "high" },
  ],
  cleaning: [
    { id: "305", number: "305", type: "Deluxe", guest: "Check-out", assignedTo: "Maria", eta: "30 min", progress: 60 },
    { id: "412", number: "412", type: "Suite", guest: "VIP", assignedTo: "Ana", eta: "45 min", progress: 40 },
  ],
  clean: [
    { id: "101", number: "101", type: "Standard", guest: "Arrival 14:00", inspected: true },
    { id: "102", number: "102", type: "Standard", guest: "Arrival 15:00", inspected: true },
    { id: "203", number: "203", type: "Deluxe", guest: "Arrival 16:00", inspected: false },
    { id: "308", number: "308", type: "Suite", guest: "VIP Arrival", inspected: true },
    { id: "210", number: "210", type: "Standard", guest: "Available", inspected: true },
  ],
  maintenance: [
    { id: "105", number: "105", type: "Standard", issue: "AC not working", assignedTo: "Janez", priority: "medium" },
    { id: "315", number: "315", type: "Deluxe", issue: "Broken chair", assignedTo: null, priority: "low" },
  ],
};

export default function HousekeepingDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedView, setSelectedView] = useState("all");

  return (
    <div className="space-y-6">
      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            🧹 Housekeeping
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Room status and cleaning tasks
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Assign Task
          </Button>
        </div>
      </div>

      {/* ─── Search & Stats ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search rooms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            🔴 {ROOMS.dirty.length} Dirty
          </Badge>
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            🟡 {ROOMS.cleaning.length} Cleaning
          </Badge>
          <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            🟢 {ROOMS.clean.length} Clean
          </Badge>
          <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            🔵 {ROOMS.maintenance.length} Maintenance
          </Badge>
        </div>
      </div>

      {/* ─── Kanban Board ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* ─── DIRTY Column ─────────────────────────────────────────────── */}
        <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                DIRTY
              </span>
              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                {ROOMS.dirty.length}
              </span>
            </CardTitle>
            <CardDescription>Ready for cleaning</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {ROOMS.dirty.map((room) => (
              <Card key={room.id} className="bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-lg">Room {room.number}</p>
                      <p className="text-xs text-gray-500">{room.type}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        👤 {room.guest}
                      </p>
                      {room.checkout && (
                        <p className="text-xs text-gray-500">
                          <Clock className="inline h-3 w-3 mr-1" />
                          Checkout: {room.checkout}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className={
                      room.priority === "high" 
                        ? "bg-red-100 text-red-800" 
                        : "bg-yellow-100 text-yellow-800"
                    }>
                      {room.priority}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <Button size="sm" className="flex-1 h-8">
                      <User className="h-3 w-3 mr-1" />
                      Assign
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>

        {/* ─── CLEANING Column ─────────────────────────────────────────── */}
        <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                CLEANING
              </span>
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                {ROOMS.cleaning.length}
              </span>
            </CardTitle>
            <CardDescription>In progress</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {ROOMS.cleaning.map((room) => (
              <Card key={room.id} className="bg-white dark:bg-gray-800 border border-yellow-200 dark:border-yellow-800">
                <CardContent className="p-3">
                  <div>
                    <p className="font-bold text-lg">Room {room.number}</p>
                    <p className="text-xs text-gray-500">{room.type}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      👤 {room.guest}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs">
                        {room.assignedTo?.charAt(0)}
                      </div>
                      <span className="text-xs text-gray-600">{room.assignedTo}</span>
                    </div>
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-500">Progress</span>
                        <span className="text-gray-700 font-medium">{room.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-yellow-500 h-1.5 rounded-full transition-all" 
                          style={{ width: `${room.progress}%` }}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      <Clock className="inline h-3 w-3 mr-1" />
                      ETA: {room.eta}
                    </p>
                  </div>
                  <Button size="sm" className="w-full mt-3 h-8">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Mark Complete
                  </Button>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>

        {/* ─── CLEAN Column ────────────────────────────────────────────── */}
        <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                CLEAN
              </span>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                {ROOMS.clean.length}
              </span>
            </CardTitle>
            <CardDescription>Ready for guests</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {ROOMS.clean.map((room) => (
              <Card key={room.id} className="bg-white dark:bg-gray-800 border border-green-200 dark:border-green-800">
                <CardContent className="p-3">
                  <div>
                    <p className="font-bold text-lg">Room {room.number}</p>
                    <p className="text-xs text-gray-500">{room.type}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {room.guest.startsWith("Arrival") ? (
                        <>
                          🤝 {room.guest}
                        </>
                      ) : (
                        <>✅ {room.guest}</>
                      )}
                    </p>
                    {room.inspected && (
                      <Badge variant="outline" className="mt-2 text-xs bg-green-100 text-green-800">
                        ✓ Inspected
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <Button size="sm" variant="outline" className="flex-1 h-8">
                      View
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>

        {/* ─── MAINTENANCE Column ──────────────────────────────────────── */}
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                MAINTENANCE
              </span>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {ROOMS.maintenance.length}
              </span>
            </CardTitle>
            <CardDescription>Repairs needed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {ROOMS.maintenance.map((room) => (
              <Card key={room.id} className="bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800">
                <CardContent className="p-3">
                  <div>
                    <p className="font-bold text-lg">Room {room.number}</p>
                    <p className="text-xs text-gray-500">{room.type}</p>
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">
                      ⚠️ {room.issue}
                    </p>
                    {room.assignedTo ? (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs">
                          {room.assignedTo?.charAt(0)}
                        </div>
                        <span className="text-xs text-gray-600">{room.assignedTo}</span>
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" className="w-full mt-2 h-8">
                        <Plus className="h-3 w-3 mr-1" />
                        Assign
                      </Button>
                    )}
                    <Badge variant="outline" className={
                      room.priority === "high" 
                        ? "bg-red-100 text-red-800 mt-2" 
                        : "bg-blue-100 text-blue-800 mt-2"
                    }>
                      {room.priority}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
