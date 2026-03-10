"use client";

import { useEffect, useState } from "react";

export function DashboardPreview() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Mock data for animation
  const [activeBookings, setActiveBookings] = useState(12);
  const [revenue, setRevenue] = useState(2847);

  useEffect(() => {
    if (!mounted) return;
    
    // Animate bookings
    const bookingInterval = setInterval(() => {
      setActiveBookings(prev => {
        const change = Math.random() > 0.7 ? (Math.random() > 0.5 ? 1 : -1) : 0;
        return Math.max(8, Math.min(20, prev + change));
      });
    }, 3000);

    // Animate revenue
    const revenueInterval = setInterval(() => {
      setRevenue(prev => {
        const change = Math.floor(Math.random() * 50);
        return prev + change;
      });
    }, 2000);

    return () => {
      clearInterval(bookingInterval);
      clearInterval(revenueInterval);
    };
  }, [mounted]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
      {/* Top Bar */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-400"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
          <div className="w-3 h-3 rounded-full bg-green-400"></div>
        </div>
        <div className="text-white text-xs font-medium opacity-80">AgentFlow Pro Dashboard</div>
        <div className="w-16"></div>
      </div>

      {/* Sidebar + Content Layout */}
      <div className="flex">
        {/* Sidebar */}
        <div className="w-16 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 p-3 space-y-3 hidden sm:block">
          {[
            { icon: "🏠", active: true },
            { icon: "📅", active: false },
            { icon: "👥", active: false },
            { icon: "📊", active: false },
            { icon: "⚙️", active: false },
          ].map((item, i) => (
            <div
              key={i}
              className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-all ${
                item.active
                  ? "bg-blue-100 dark:bg-blue-900/30"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              {item.icon}
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 bg-gray-50 dark:bg-gray-900/50">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Card 1 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Today's Revenue</div>
              <div className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-1">
                €{revenue.toLocaleString()}
                <span className="text-xs text-green-500">↑ 12%</span>
              </div>
              <div className="mt-2 h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-1000"
                  style={{ width: `${mounted ? 68 : 0}%` }}
                />
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Active Bookings</div>
              <div className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-1">
                {activeBookings}
                <span className="text-xs text-blue-500">● Live</span>
              </div>
              <div className="flex gap-1 mt-2">
                {[...Array(7)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                      i < activeBookings / 3
                        ? "bg-blue-500"
                        : "bg-gray-200 dark:bg-gray-700"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Chart Area */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700 mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">Weekly Overview</div>
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
              </div>
            </div>
            <div className="flex items-end gap-1 h-16">
              {[40, 65, 45, 80, 55, 70, 60].map((height, i) => (
                <div
                  key={i}
                  className="flex-1 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t transition-all duration-700"
                  style={{ 
                    height: mounted ? `${height}%` : "0%",
                    transitionDelay: `${i * 100}ms`
                  }}
                />
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Recent Activity</div>
            {[
              { icon: "✅", text: "Booking confirmed", time: "2m ago", color: "bg-green-100 dark:bg-green-900/30" },
              { icon: "📧", text: "Email sent to guest", time: "5m ago", color: "bg-blue-100 dark:bg-blue-900/30" },
              { icon: "🏨", text: "New reservation", time: "12m ago", color: "bg-purple-100 dark:bg-purple-900/30" },
            ].map((item, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 ${item.color} rounded-lg p-2 transition-all duration-500 ${
                  mounted ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                }`}
                style={{ transitionDelay: `${500 + i * 200}ms` }}
              >
                <span className="text-sm">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-700 dark:text-gray-300 truncate">{item.text}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{item.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-xs text-gray-600 dark:text-gray-400">All systems operational</span>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">Last sync: just now</div>
      </div>
    </div>
  );
}
