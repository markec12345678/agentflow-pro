"use client";

import Link from "next/link";
import { LayoutDashboard, Calendar, Users, ClipboardList, BarChart3, Settings, Menu, X, Moon, Sun } from "lucide-react";
import { useState } from "react";

const MAIN_NAV = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Calendar, label: "Koledar", href: "/dashboard/tourism/calendar" },
  { icon: Users, label: "Gosti", href: "/dashboard/guests" },
  { icon: ClipboardList, label: "Housekeeping", href: "/dashboard/housekeeping" },
  { icon: BarChart3, label: "Poročila", href: "/dashboard/reports" },
  { icon: Settings, label: "Nastavitve", href: "/settings" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className={`flex min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="p-4">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl">
            ⚡ AgentFlow Pro
          </Link>
        </div>
        <nav className="p-4 space-y-1">
          {MAIN_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Mobile */}
      <div className="flex-1 min-w-0">
        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b bg-white dark:bg-gray-800">
          <Link href="/dashboard" className="font-bold">⚡ AgentFlow</Link>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2">
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden bg-white dark:bg-gray-800 border-b p-4">
            {MAIN_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        )}

        {/* Content */}
        <main className="p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
