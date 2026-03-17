// src/app/dashboard/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { UserProvider, useUser } from '@/context/UserContext';
import { TimeProvider } from '@/context/TimeContext';
import { RoleProvider } from '@/context/RoleContext';
import { Header } from '@/components/Header';
import { Toolbar } from '@/components/Toolbar';
import { MetricsCard } from '@/components/MetricsCard';
import { UnifiedDeskView } from '@/components/UnifiedDeskView';
import { AIAssistPanel } from '@/components/AIAssistPanel';
import { TourismTimeline } from '@/components/TourismTimeline';
import { Guest, Room, Task } from '@/types';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface DashboardStats {
  checkInsToday: number;
  checkOutsToday: number;
  occupiedRooms: number;
  cleaningInProgress: number;
  urgentTasks: number;
  totalRooms: number;
  occupancyRate: number;
}

const DashboardContent = () => {
  const { user } = useUser();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        setError(null);

        const [statsRes, guestsRes, roomsRes, tasksRes] = await Promise.all([
          fetch('/api/v1/dashboard/stats'),
          fetch('/api/v1/dashboard/guests'),
          fetch('/api/v1/dashboard/rooms'),
          fetch('/api/v1/dashboard/tasks'),
        ]);

        if (!statsRes.ok) throw new Error('Failed to fetch stats');
        if (!guestsRes.ok) throw new Error('Failed to fetch guests');
        if (!roomsRes.ok) throw new Error('Failed to fetch rooms');
        if (!tasksRes.ok) throw new Error('Failed to fetch tasks');

        const statsData = await statsRes.json();
        const guestsData = await guestsRes.json();
        const roomsData = await roomsRes.json();
        const tasksData = await tasksRes.json();

        setStats(statsData);
        setGuests(guestsData);
        setRooms(roomsData);
        setTasks(tasksData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
    
    // Refresh every 60 seconds
    const interval = setInterval(fetchDashboardData, 60_000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationCircleIcon className="h-12 w-12 text-red-500 mx-auto" />
          <p className="mt-4 text-gray-600">Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Toolbar />
      <main className="px-6 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Main Content: cols 1-8 */}
          <div className="lg:col-span-8 space-y-6">
            {/* Top Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricsCard
                title="Today's Check-ins"
                value={stats?.checkInsToday || 0}
                trend={`+${stats?.checkInsToday || 0} vs yesterday`}
                icon={<div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center"><span className="text-emerald-700 text-xs">✓</span></div>}
                status={stats && stats.checkInsToday > 15 ? 'high' : undefined}
              />
              <MetricsCard
                title="Occupied Rooms"
                value={`${stats?.occupiedRooms || 0}/${stats?.totalRooms || 0}`}
                trend={`${stats?.occupancyRate || 0}% occupancy`}
                icon={<div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center"><span className="text-gray-700 text-xs">🏠</span></div>}
              />
              <MetricsCard
                title="Cleaning Delay"
                value={stats?.cleaningInProgress || 0}
                trend={stats && stats.cleaningInProgress > 0 ? '>30 min' : 'All on time'}
                icon={<div className="h-6 w-6 rounded-full bg-amber-100 flex items-center justify-center"><span className="text-amber-700 text-xs">⚠️</span></div>}
                status={stats && stats.cleaningInProgress > 0 ? 'critical' : undefined}
              />
              <MetricsCard
                title="Urgent Tasks"
                value={stats?.urgentTasks || 0}
                trend="Priority"
                icon={<div className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center"><span className="text-red-700 text-xs">❗</span></div>}
                status={stats && stats.urgentTasks > 3 ? 'high' : undefined}
              />
            </div>

            {/* Unified Desk + Timeline */}
            <div className="space-y-6">
              <UnifiedDeskView guests={guests} rooms={rooms} tasks={tasks} />
              <TourismTimeline items={[]} />
            </div>
          </div>

          {/* Sidebar: cols 9-12 */}
          <div className="lg:col-span-4 space-y-6">
            <AIAssistPanel />
          </div>
        </div>
      </main>
    </div>
  );
};

const DashboardPage = () => {
  return (
    <UserProvider>
      <TimeProvider>
        <RoleProvider>
          <DashboardContent />
        </RoleProvider>
      </TimeProvider>
    </UserProvider>
  );
};

export default DashboardPage;