"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

// ─── PLATFORMA Dropdown - Organizirano po funkcijah (PMS best practices) ─────
const PLATFORM_MENU = [
  {
    category: "Operacije",
    items: [
      { href: "/dashboard", label: "Pregled", icon: "🏠", description: "Dashboard in overview" },
      { href: "/dashboard/tourism/calendar", label: "Koledar", icon: "📅", description: "Booking koledar" },
      { href: "/properties", label: "Nastanitve", icon: "🏨", description: "Upravljanje property-jev" },
      { href: "/housekeeping", label: "Housekeeping", icon: "🧹", description: "Čiščenje in vzdrževanje" },
    ],
  },
  {
    category: "Rezervacije",
    items: [
      { href: "/bookings", label: "Vse rezervacije", icon: "📋", description: "Pregled vseh bookingov" },
      { href: "/arrivals", label: "Arrivals", icon: "👋", description: "Današnji check-ini" },
      { href: "/departures", label: "Departures", icon: "🚪", description: "Današnji check-outi" },
    ],
  },
  {
    category: "Distribucija",
    items: [
      { href: "/channel-manager", label: "Channel Manager", icon: "🔄", description: "Sinhronizacija kanalov" },
      { href: "/booking-engine", label: "Booking Engine", icon: "🌐", description: "Direct bookingi" },
      { href: "/website", label: "Website Builder", icon: "✏️", description: "Ustvari spletno stran" },
    ],
  },
  {
    category: "Guest Experience",
    items: [
      { href: "/inbox", label: "Unified Inbox", icon: "📧", description: "Vsa sporočila na enem mestu" },
      { href: "/guests", label: "Gostje", icon: "👥", description: "Guest profili in CRM" },
      { href: "/reviews", label: "Reviews", icon: "⭐", description: "Upravljanje mnenj" },
      { href: "/guidebook", label: "Digital Guidebook", icon: "📖", description: "Vodič za goste" },
    ],
  },
  {
    category: "Revenue",
    items: [
      { href: "/dashboard/tourism/competitors", label: "Cene", icon: "💰", description: "Rate management" },
      { href: "/dashboard/tourism/dynamic-pricing", label: "Dinamične cene", icon: "📊", description: "AI pricing optimization" },
      { href: "/dashboard/tourism/revenue", label: "Revenue Analytics", icon: "📈", description: "RevPAR, ADR, occupancy" },
      { href: "/dashboard/insights", label: "Analytics", icon: "📉", description: "Reports in insights" },
      { href: "/dashboard/reports", label: "Poročila", icon: "📄", description: "Custom reports" },
    ],
  },
];

// ─── REŠITVE Dropdown - Po tipu nastanitve ────────────────────────────────────
const SOLUTIONS_MENU = [
  {
    category: "Po Tipu Nastanitve",
    items: [
      { href: "/solutions/hotels", label: "Hoteli", icon: "🏨", description: "Za hotele in hostle" },
      { href: "/solutions/apartments", label: "Apartmaji", icon: "🏢", description: "Za apartmaje in studio" },
      { href: "/solutions/vacation-rentals", label: "Vacation Rentals", icon: "🏖️", description: "Za počitniške najeme" },
      { href: "/solutions/farms", label: "Turistične Kmetije", icon: "🚜", description: "Za kmetije in vinotoče" },
      { href: "/solutions/guesthouses", label: "Guesthouse/B&B", icon: "🛏️", description: "Za penzione in B&B" },
      { href: "/solutions/camps", label: "Kampi/Glamping", icon: "⛺", description: "Za kampinge in glamping" },
    ],
  },
  {
    category: "Po Velikosti",
    items: [
      { href: "/solutions/solo", label: "Solo Hosti", icon: "👤", description: "1-3 property-jev" },
      { href: "/solutions/growing", label: "Rastoči Biznis", icon: "🌱", description: "4-50 property-jev" },
      { href: "/solutions/enterprise", label: "Enterprise", icon: "🏢", description: "50+ property-jev" },
    ],
  },
];

// ─── Quick Actions (vedno vidni) ──────────────────────────────────────────────
const QUICK_ACTIONS = [
  { href: "/bookings/new", label: "Nova rezervacija", icon: "➕", primary: true },
  { href: "/inbox", label: "Sporočila", icon: "💬", primary: false },
  { href: "/housekeeping", label: "Housekeeping", icon: "🧹", primary: false },
];

export function AppNav() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [platformOpen, setPlatformOpen] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const platformRef = useRef<HTMLDivElement>(null);
  const solutionsRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const firstName = session?.user?.name?.split(" ")[0] ?? session?.user?.email?.split("@")[0] ?? "";

  // Zapri ob kliku zunaj
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (platformRef.current && !platformRef.current.contains(e.target as Node)) setPlatformOpen(false);
      if (solutionsRef.current && !solutionsRef.current.contains(e.target as Node)) setSolutionsOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Zapri ob navigaciji
  useEffect(() => {
    setPlatformOpen(false);
    setSolutionsOpen(false);
    setUserOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href.split("?")[0]);

  return (
    <nav className="sticky top-0 z-40 border-b border-gray-800 bg-gray-900/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">

          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 text-white font-bold text-lg shrink-0">
            <span className="text-xl">🤖</span>
            <span className="hidden sm:inline">AgentFlow</span>
            <span className="text-blue-400">Pro</span>
          </Link>

          {/* Desktop Nav - Platforma & Rešitve */}
          <div className="hidden md:flex items-center gap-1">
            
            {/* Platforma Dropdown */}
            <div className="relative" ref={platformRef}>
              <button
                type="button"
                onClick={() => setPlatformOpen(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  platformOpen
                    ? "bg-blue-600/20 text-blue-400"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
              >
                <span>🎯</span>
                <span>Platforma</span>
                <span className="text-xs opacity-60">{platformOpen ? "▲" : "▼"}</span>
              </button>

              {platformOpen && (
                <div className="absolute top-full left-0 mt-2 w-[700px] bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl p-6 z-50 grid grid-cols-2 gap-6">
                  {PLATFORM_MENU.map((section) => (
                    <div key={section.category}>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">{section.category}</h3>
                      <div className="space-y-1">
                        {section.items.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
                              isActive(item.href)
                                ? "bg-blue-600/20 text-blue-400"
                                : "text-gray-300 hover:bg-gray-700 hover:text-white"
                            }`}
                          >
                            <span className="text-lg">{item.icon}</span>
                            <div className="text-left">
                              <div className="text-sm font-medium">{item.label}</div>
                              <div className="text-xs text-gray-500">{item.description}</div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Rešitve Dropdown */}
            <div className="relative" ref={solutionsRef}>
              <button
                type="button"
                onClick={() => setSolutionsOpen(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  solutionsOpen
                    ? "bg-blue-600/20 text-blue-400"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
              >
                <span>🏷️</span>
                <span>Rešitve</span>
                <span className="text-xs opacity-60">{solutionsOpen ? "▲" : "▼"}</span>
              </button>

              {solutionsOpen && (
                <div className="absolute top-full left-0 mt-2 w-[600px] bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl p-6 z-50 grid grid-cols-2 gap-6">
                  {SOLUTIONS_MENU.map((section) => (
                    <div key={section.category}>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">{section.category}</h3>
                      <div className="space-y-1">
                        {section.items.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
                              isActive(item.href)
                                ? "bg-blue-600/20 text-blue-400"
                                : "text-gray-300 hover:bg-gray-700 hover:text-white"
                            }`}
                          >
                            <span className="text-lg">{item.icon}</span>
                            <div className="text-left">
                              <div className="text-sm font-medium">{item.label}</div>
                              <div className="text-xs text-gray-500">{item.description}</div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Desni del: Quick Actions + User menu */}
          <div className="hidden md:flex items-center gap-2">

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              {QUICK_ACTIONS.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    action.primary
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-gray-800 hover:bg-gray-700 text-gray-300"
                  }`}
                >
                  <span>{action.icon}</span>
                  <span>{action.label}</span>
                </Link>
              ))}
            </div>

            {/* User dropdown */}
            {status !== "loading" && (
              <div className="relative" ref={userRef}>
                <button
                  type="button"
                  onClick={() => setUserOpen(v => !v)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-cyan-500 text-sm font-bold text-white">
                    {session?.user?.email?.[0]?.toUpperCase() ?? "?"}
                  </span>
                  <span className="text-sm hidden lg:inline">{firstName || "Račun"}</span>
                  <span className="text-xs opacity-60">▼</span>
                </button>

                {userOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl p-2 z-50">
                    {session ? (
                      <>
                        <div className="px-3 py-2 border-b border-gray-700 mb-2">
                          <p className="text-xs text-gray-400">Prijavljeni kot</p>
                          <p className="text-sm text-white font-medium truncate">{session.user?.email}</p>
                        </div>
                        {[
                          { href: "/dashboard", icon: "🏠", label: "Dashboard" },
                          { href: "/profile", icon: "👤", label: "Profil" },
                          { href: "/settings", icon: "⚙️", label: "Nastavitve" },
                          { href: "/monitoring", icon: "📊", label: "Monitoring" },
                          { href: "/admin", icon: "👑", label: "Admin" },
                        ].map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-sm ${
                              pathname === item.href
                                ? "bg-blue-600/20 text-blue-400"
                                : "text-gray-300 hover:bg-gray-700 hover:text-white"
                            }`}
                          >
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                          </Link>
                        ))}
                        <div className="border-t border-gray-700 mt-2 pt-2">
                          <button
                            type="button"
                            onClick={() => signOut({ callbackUrl: "/login" })}
                            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-gray-400 hover:bg-gray-700 hover:text-white transition-colors text-sm"
                          >
                            <span>🚪</span>
                            <span>Odjava</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <Link href="/login" className="block px-3 py-2.5 rounded-xl text-gray-300 hover:bg-gray-700 text-sm">
                          Prijava
                        </Link>
                        <Link href="/onboarding" className="block mt-1 px-3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold text-center">
                          Začni brezplačno
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden p-2 text-gray-300 hover:text-white"
            aria-label={mobileOpen ? "Zapri meni" : "Odpri meni"}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile meni */}
        {mobileOpen && (
          <div className="md:hidden py-4 space-y-4 border-t border-gray-800 max-h-[70vh] overflow-y-auto">
            
            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-2 px-2">
              {QUICK_ACTIONS.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl text-sm font-medium transition-all ${
                    action.primary
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-gray-800 hover:bg-gray-700 text-gray-300"
                  }`}
                >
                  <span className="text-xl">{action.icon}</span>
                  <span className="text-xs">{action.label}</span>
                </Link>
              ))}
            </div>

            {/* Platforma Section */}
            <div>
              <button
                type="button"
                onClick={() => setPlatformOpen((v) => !v)}
                className="flex items-center justify-between w-full px-4 py-2 text-gray-300 hover:bg-gray-800 rounded-xl"
              >
                <span className="font-semibold">🎯 Platforma</span>
                <span>{platformOpen ? "▲" : "▼"}</span>
              </button>
              {platformOpen && (
                <div className="mt-2 space-y-1">
                  {PLATFORM_MENU.map((section) => (
                    <div key={section.category}>
                      <p className="px-4 text-xs font-semibold text-gray-500 uppercase mb-2">{section.category}</p>
                      {section.items.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors ${
                            isActive(item.href)
                              ? "bg-blue-600/20 text-blue-400"
                              : "text-gray-300 hover:bg-gray-800"
                          }`}
                        >
                          <span>{item.icon}</span>
                          <span className="font-medium">{item.label}</span>
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Rešitve Section */}
            <div>
              <button
                type="button"
                onClick={() => setSolutionsOpen((v) => !v)}
                className="flex items-center justify-between w-full px-4 py-2 text-gray-300 hover:bg-gray-800 rounded-xl"
              >
                <span className="font-semibold">🏷️ Rešitve</span>
                <span>{solutionsOpen ? "▲" : "▼"}</span>
              </button>
              {solutionsOpen && (
                <div className="mt-2 space-y-1">
                  {SOLUTIONS_MENU.map((section) => (
                    <div key={section.category}>
                      <p className="px-4 text-xs font-semibold text-gray-500 uppercase mb-2">{section.category}</p>
                      {section.items.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="flex items-center gap-3 px-4 py-2.5 text-gray-300 hover:bg-gray-800 rounded-xl"
                        >
                          <span>{item.icon}</span>
                          <span className="font-medium">{item.label}</span>
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Account */}
            <div className="border-t border-gray-800 pt-4">
              {session ? (
                <>
                  <p className="px-4 text-xs text-gray-500 mb-3">{session.user?.email}</p>
                  {[
                    { href: "/profile", label: "Profil" },
                    { href: "/settings", label: "Nastavitve" },
                    { href: "/monitoring", label: "Monitoring" },
                  ].map((item) => (
                    <Link key={item.href} href={item.href} className="block px-4 py-2 text-gray-400 hover:text-white">
                      {item.label}
                    </Link>
                  ))}
                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="block w-full text-left px-4 py-2 text-gray-400 hover:text-white"
                  >
                    Odjava
                  </button>
                </>
              ) : (
                <Link href="/login" className="block px-4 py-2 text-gray-400 hover:text-white">
                  Prijava
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
