// src/components/Header.tsx
"use client";

import { useUser } from '@/context/UserContext';
import { useTime } from '@/context/TimeContext';
import { BellIcon, UserCircleIcon, Cog6ToothIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { signOut } from 'next-auth/react';

export const Header = () => {
  const { user } = useUser();
  const { isNight } = useTime();

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between bg-white px-6 shadow-sm">
      {/* Left: Logo */}
      <div className="flex items-center space-x-3">
        <div className="h-8 w-8 rounded-lg bg-indigo-600" />
        <span className="text-xl font-bold text-gray-900">AgentFlow Pro</span>
      </div>

      {/* Center: Search */}
      <div className="relative flex-1 max-w-2xl">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search guests, rooms, tasks..."
          className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />
      </div>

      {/* Right: User + Notifications + Quick Actions */}
      <div className="flex items-center space-x-4">
        <button className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
          <BellIcon className="h-6 w-6" />
        </button>
        <button className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
          <Cog6ToothIcon className="h-6 w-6" />
        </button>
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
            <span className="text-indigo-800 font-medium text-sm">
              {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </span>
          </div>
          <span className="text-sm font-medium text-gray-900 hidden sm:inline">
            {user?.name || user?.email || 'User'}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="text-sm text-gray-600 hover:text-gray-900 ml-2"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
};