'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface NavigationItem {
  name: string;
  href: string;
  icon: string;
}

export default function CemboljskiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navigation: NavigationItem[] = [
    {
      name: 'Dashboard',
      href: '/cemboljski/dashboard',
      icon: '📊'
    },
    {
      name: 'Rezervacije',
      href: '/cemboljski/rezervacije',
      icon: '📋'
    },
    {
      name: 'Gostje',
      href: '/cemboljski/gostje',
      icon: '👥'
    },
    {
      name: 'Nastavitve',
      href: '/cemboljski/nastavitve',
      icon: '⚙️'
    },
    {
      name: 'Analytics',
      href: '/cemboljski/analytics',
      icon: '📈'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 px-6 border-b">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">🏨</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AgentFlow</h1>
                <p className="text-sm text-gray-600">Cemboljski</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  pathname === item.href
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <span className="mr-3">{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </nav>

          {/* User */}
          <div className="border-t p-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-gray-600 font-bold text-sm">👤</span>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">Admin User</div>
                <div className="text-xs text-gray-500">admin@cemboljski.si</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pl-64">
        {children}
      </div>
    </div>
  );
}
