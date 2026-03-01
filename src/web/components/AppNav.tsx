"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

// ─── Navigacijske točke (max 5) ───────────────────────────────────────────────
const MAIN_NAV = [
  { href: "/dashboard", label: "Domov",    icon: "🏠" },
  { href: "/generate",  label: "Ustvari",  icon: "✍️" },
  { href: "/content",   label: "Vsebina",  icon: "📁" },
  { href: "/pricing",   label: "Cenik",    icon: "💳" },
];

// ─── Meni "Ustvari" za turizem ────────────────────────────────────────────────
const CREATE_ITEMS = [
  { href: "/generate",                             icon: "✨", label: "Splošno ustvarjanje" },
  { href: "/generate?template=booking-description",icon: "📋", label: "Booking.com opis" },
  { href: "/generate?template=airbnb-story",       icon: "🏠", label: "Airbnb story" },
  { href: "/generate?template=guest-welcome-email",icon: "📧", label: "Email za goste" },
  { href: "/generate?template=destination-guide",  icon: "📍", label: "Vodič destinacije" },
  { href: "/generate?template=instagram-travel",   icon: "📱", label: "Instagram caption" },
  { href: "/generate?template=seasonal-campaign",  icon: "🎄", label: "Sezonska kampanja" },
];

export function AppNav() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [createOpen, setCreateOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const createRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const firstName = session?.user?.name?.split(" ")[0] ?? session?.user?.email?.split("@")[0] ?? "";

  // Zapri ob kliku zunaj
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (createRef.current && !createRef.current.contains(e.target as Node)) setCreateOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Zapri ob navigaciji
  useEffect(() => {
    setCreateOpen(false);
    setUserOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href.split("?")[0]);

  const navLinkClass = (href: string) =>
    `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive(href)
        ? "bg-blue-600/20 text-blue-400"
        : "text-gray-300 hover:bg-gray-800 hover:text-white"
    }`;

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

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">

            {/* Domov */}
            <Link href="/dashboard" className={navLinkClass("/dashboard")}>
              <span>🏠</span>
              <span>Domov</span>
            </Link>

            {/* Ustvari – z dropdown-om */}
            <div className="relative" ref={createRef}>
              <button
                type="button"
                onClick={() => setCreateOpen(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  createOpen || isActive("/generate")
                    ? "bg-blue-600/20 text-blue-400"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
              >
                <span>✍️</span>
                <span>Ustvari</span>
                <span className="text-xs opacity-60">{createOpen ? "▲" : "▼"}</span>
              </button>

              {createOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl p-2 z-50">
                  {CREATE_ITEMS.map(item => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                    >
                      <span>{item.icon}</span>
                      <span className="text-sm font-medium">{item.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Vsebina */}
            <Link href="/content" className={navLinkClass("/content")}>
              <span>📁</span>
              <span>Vsebina</span>
            </Link>

            {/* Cenik */}
            <Link href="/pricing" className={navLinkClass("/pricing")}>
              <span>💳</span>
              <span>Cenik</span>
            </Link>

          </div>

          {/* Desni del: User menu */}
          <div className="hidden md:flex items-center gap-2">

            {/* Hitri gumb Ustvari */}
            <Link
              href="/generate"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            >
              <span>+</span>
              <span>Nova vsebina</span>
            </Link>

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
                  <div className="absolute right-0 top-full mt-2 w-52 bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl p-2 z-50">
                    {session ? (
                      <>
                        <div className="px-3 py-2 border-b border-gray-700 mb-2">
                          <p className="text-xs text-gray-400">Prijavljeni kot</p>
                          <p className="text-sm text-white font-medium truncate">{session.user?.email}</p>
                        </div>
                        {[
                          { href: "/dashboard",  icon: "🏠", label: "Dashboard" },
                          { href: "/profile",    icon: "👤", label: "Profil" },
                          { href: "/settings",   icon: "⚙️", label: "Nastavitve" },
                          { href: "/monitoring", icon: "📊", label: "Monitoring" },
                          { href: "/admin",      icon: "👑", label: "Admin" },
                        ].map(item => (
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
            onClick={() => setMobileOpen(v => !v)}
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
          <div className="md:hidden py-4 space-y-1 border-t border-gray-800">

            {/* Hitri gumb */}
            <Link
              href="/generate"
              className="flex items-center justify-center gap-2 mx-2 mb-3 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold"
            >
              <span>✍️</span> Nova vsebina
            </Link>

            {MAIN_NAV.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive(item.href)
                    ? "bg-blue-600/20 text-blue-400"
                    : "text-gray-300 hover:bg-gray-800"
                }`}
              >
                <span>{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}

            <div className="border-t border-gray-800 pt-3 mt-3">
              <p className="px-4 text-xs font-semibold text-gray-500 uppercase mb-2">Ustvari</p>
              {CREATE_ITEMS.slice(1).map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-2.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-colors"
                >
                  <span>{item.icon}</span>
                  <span className="text-sm">{item.label}</span>
                </Link>
              ))}
            </div>

            {/* Account */}
            <div className="border-t border-gray-800 pt-3 mt-3">
              {session ? (
                <>
                  <p className="px-4 text-xs text-gray-500 mb-2">{session.user?.email}</p>
                  {[
                    { href: "/profile",    label: "Profil" },
                    { href: "/settings",   label: "Nastavitve" },
                    { href: "/monitoring", label: "Monitoring" },
                  ].map(item => (
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
