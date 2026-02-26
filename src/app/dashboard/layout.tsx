"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import FloatingChat from "@/components/FloatingChat";

// ─── Glavna navigacija ────────────────────────────────────────────────────────
const MAIN_NAV = [
  { icon: "🏠", label: "Pregled", href: "/dashboard" },
  { icon: "✍️", label: "Ustvari", href: "/generate" },
  { icon: "📁", label: "Vsebina", href: "/content" },
  { icon: "🏨", label: "Nastanitve", href: "/settings" },
];

// ─── Turizem podmeni ──────────────────────────────────────────────────────────
const TOURISM_NAV = [
  { name: "Pregled", href: "/dashboard/tourism" },
  { name: "Generiraj", href: "/generate" },
  { name: "Predloge", href: "/dashboard/tourism/templates" },
  { name: "Nastanitve", href: "/dashboard/tourism/properties" },
  { name: "Landing strani", href: "/dashboard/tourism/landing" },
  { name: "Itinerarji", href: "/dashboard/tourism/itineraries" },
  { name: "Email", href: "/dashboard/tourism/email" },
  { name: "SEO", href: "/dashboard/tourism/seo" },
  { name: "Prevodi", href: "/dashboard/tourism/translate" },
];

// ─── Napredno (skrito) ────────────────────────────────────────────────────────
const ADVANCED_NAV = [
  { icon: "⚡", label: "Workflow Builder", href: "/workflows" },
  { icon: "💬", label: "Chat z agenti", href: "/chat" },
  { icon: "🔄", label: "Escalations", href: "/dashboard/escalations" },
  { icon: "⚙️", label: "Nastavitve", href: "/settings" },
  { icon: "📊", label: "Monitoring", href: "/monitoring" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [userIndustry, setUserIndustry] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    fetch("/api/profile", { signal: ctrl.signal })
      .then(r => r.json())
      .then((data: { onboarding?: { industry?: string } }) => {
        setUserIndustry(data?.onboarding?.industry ?? null);
      })
      .catch(() => setUserIndustry(null))
      .finally(() => clearTimeout(t));
  }, []);

  const showTourismHub =
    userIndustry === "tourism" || userIndustry === "travel-agency";

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === href
      : pathname.startsWith(href.split("?")[0]);

  const navLinkClass = (href: string) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive(href)
      ? "bg-blue-600 text-white shadow-sm"
      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
    }`;

  const sidebar = (
    <nav className="p-4 space-y-1" aria-label="Navigacija">
      {/* Logo */}
      <div className="px-3 py-3 mb-2">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
          <span className="text-xl">⚡</span>
          <span>AgentFlow<span className="text-blue-600"> Pro</span></span>
        </Link>
      </div>

      {/* Hiter gumb Ustvari */}
      <Link
        href="/generate"
        className="flex items-center justify-center gap-2 w-full py-2.5 mb-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-all shadow-sm"
      >
        <span>+</span>
        <span>Nova vsebina</span>
      </Link>

      {/* Glavna nav */}
      {MAIN_NAV.map(item => (
        <Link key={item.href} href={item.href} className={navLinkClass(item.href)}>
          <span className="text-lg">{item.icon}</span>
          <span>{item.label}</span>
        </Link>
      ))}

      {/* Tourism Hub */}
      {showTourismHub && (
        <div className="pt-3">
          <p className="px-3 py-1 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            Tourism Hub
          </p>
          {TOURISM_NAV.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-2 text-sm rounded-xl transition-all ${pathname.startsWith(item.href)
                  ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                }`}
            >
              {item.name}
            </Link>
          ))}
        </div>
      )}

      {/* Napredno */}
      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => setShowAdvanced(v => !v)}
          className="flex items-center gap-2 px-3 py-2 w-full text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <span>{showAdvanced ? "▲" : "▼"}</span>
          <span>Napredno</span>
        </button>
        {showAdvanced && (
          <div className="mt-1 space-y-0.5">
            {ADVANCED_NAV.map(item => (
              <Link key={item.href} href={item.href} className={navLinkClass(item.href)}>
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        {sidebar}
      </aside>

      {/* Mobile: hamburger header */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Mobile topbar */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
            <span>⚡</span>
            <span>AgentFlow<span className="text-blue-600"> Pro</span></span>
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(v => !v)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            aria-label="Meni"
          >
            {mobileOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile menu overlay */}
        {mobileOpen && (
          <div className="md:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            {sidebar}
          </div>
        )}

        {/* Vsebina */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-2 flex items-center justify-around">
          {[
            { icon: "🏠", label: "Domov", href: "/dashboard" },
            { icon: "✍️", label: "Ustvari", href: "/generate" },
            { icon: "📁", label: "Vsebina", href: "/content" },
            { icon: "⚙️", label: "Nastavitve", href: "/settings" },
          ].map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ${isActive(item.href)
                  ? "text-blue-600"
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Prostor za mobile bottom nav */}
        <div className="md:hidden h-16" />
      </div>

      {/* Floating AI Chat Assistant */}
      <FloatingChat />
    </div>
  );
}
