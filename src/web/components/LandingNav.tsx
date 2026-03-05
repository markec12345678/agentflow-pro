"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { trackCTAClick } from "@/lib/analytics";

const NAV_CONFIG = {
  solutions: {
    label: "Solutions",
    items: [
      {
        name: "Tourism & Hospitality",
        href: "/solutions/industry/tourism",
        desc: "Booking descriptions, destination guides, seasonal campaigns",
        badge: "Popular",
      },
      {
        name: "Marketing Agencies",
        href: "/solutions",
        desc: "Bulk generation, brand guardrails, client reporting",
      },
      {
        name: "E-commerce",
        href: "/solutions/industry/ecommerce",
        desc: "Product descriptions, SEO, multi-language content",
      },
      {
        name: "Tech & SaaS",
        href: "/solutions/industry/tech",
        desc: "Technical docs, release notes, developer content",
      },
    ],
  },
  resources: {
    label: "Resources",
    items: [
      {
        name: "Documentation",
        href: "/docs",
        desc: "API reference, guides, tutorials",
      },
      {
        name: "Video Tutorials",
        href: "/docs",
        desc: "Short guides for every feature",
      },
      {
        name: "Case Studies",
        href: "/stories",
        desc: "How customers achieve results",
      },
      {
        name: "Support",
        href: "/contact",
        desc: "FAQ, chat, email support",
      },
    ],
  },
};

const NAV_PRIMARY = [
  { name: "Pricing", href: "/pricing", highlight: false },
  { name: "Demo", href: "/#demo-video", highlight: false },
];

export function LandingNav() {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setOpenDropdown(null);
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenDropdown(null);
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  return (
    <>
      <nav
        aria-label="Main navigation"
        className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "border-b border-gray-200/50 bg-white/95 shadow-lg backdrop-blur-md dark:border-gray-800/50 dark:bg-gray-900/95"
            : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between lg:h-20">
            <Link href="/" className="group flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-blue-600 via-cyan-500 to-emerald-400 shadow-lg transition-shadow group-hover:shadow-xl">
                <span className="text-lg font-bold text-white">🤖</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold leading-tight text-gray-900 dark:text-white">
                  AgentFlow Pro
                </span>
                <span className="-mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  Content + Calendar
                </span>
              </div>
            </Link>

            <div className="hidden items-center gap-1 lg:flex">
              <div
                className="relative"
                onMouseEnter={() => setOpenDropdown("solutions")}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                {openDropdown === "solutions" ? (
                  <button
                    id="solutions-trigger"
                    aria-expanded="true"
                    aria-haspopup="true"
                    aria-controls="solutions-menu"
                    className="outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 flex items-center gap-1.5 rounded-xl px-4 py-2.5 font-medium text-gray-700 transition-all hover:bg-gray-100/50 hover:text-blue-600 dark:text-gray-300 dark:hover:bg-gray-800/50 dark:hover:text-blue-400"
                  >
                    {NAV_CONFIG.solutions.label}
                    <svg
                      className="h-4 w-4 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                ) : (
                  <button
                    id="solutions-trigger"
                    aria-expanded="false"
                    aria-haspopup="true"
                    aria-controls="solutions-menu"
                    className="outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 flex items-center gap-1.5 rounded-xl px-4 py-2.5 font-medium text-gray-700 transition-all hover:bg-gray-100/50 hover:text-blue-600 dark:text-gray-300 dark:hover:bg-gray-800/50 dark:hover:text-blue-400"
                  >
                    {NAV_CONFIG.solutions.label}
                    <svg
                      className="h-4 w-4 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                )}
                {openDropdown === "solutions" && (
                  <div
                    id="solutions-menu"
                    role="group"
                    aria-label="Solutions"
                    className="absolute left-0 top-full z-50 mt-3 w-80 rounded-2xl border border-gray-200/50 bg-white p-2 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 dark:border-gray-700/50 dark:bg-gray-800"
                  >
                    {NAV_CONFIG.solutions.items.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 group flex min-w-0 items-start gap-3 rounded-xl p-3.5 transition-all hover:bg-linear-to-r hover:from-blue-50/50 hover:to-cyan-50/50 dark:hover:from-blue-900/20 dark:hover:to-cyan-900/20"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {item.name}
                            </span>
                            {item.badge && (
                              <span className="rounded-full bg-linear-to-r from-emerald-500 to-cyan-500 px-2 py-0.5 text-xs font-medium text-white">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                            {item.desc}
                          </p>
                        </div>
                        <svg
                          className="h-5 w-5 shrink-0 text-gray-400 transition-colors group-hover:text-blue-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div
                className="relative"
                onMouseEnter={() => setOpenDropdown("resources")}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                {openDropdown === "resources" ? (
                  <button
                    aria-expanded="true"
                    aria-haspopup="true"
                    aria-controls="resources-menu"
                    className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 font-medium text-gray-700 transition-all hover:bg-gray-100/50 hover:text-blue-600 dark:text-gray-300 dark:hover:bg-gray-800/50 dark:hover:text-blue-400"
                  >
                    {NAV_CONFIG.resources.label}
                    <svg
                      className="h-4 w-4 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                ) : (
                  <button
                    aria-expanded="false"
                    aria-haspopup="true"
                    aria-controls="resources-menu"
                    className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 font-medium text-gray-700 transition-all hover:bg-gray-100/50 hover:text-blue-600 dark:text-gray-300 dark:hover:bg-gray-800/50 dark:hover:text-blue-400"
                  >
                    {NAV_CONFIG.resources.label}
                    <svg
                      className="h-4 w-4 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                )}
                {openDropdown === "resources" && (
                  <div
                    id="resources-menu"
                    role="group"
                    aria-label="Resources"
                    className="absolute left-0 top-full z-50 mt-3 w-72 rounded-2xl border border-gray-200/50 bg-white p-2 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 dark:border-gray-700/50 dark:bg-gray-800"
                  >
                    {NAV_CONFIG.resources.items.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 group flex min-w-0 items-start gap-3 rounded-xl p-3.5 transition-all hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {item.name}
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {item.desc}
                          </p>
                        </div>
                        <svg
                          className="h-5 w-5 shrink-0 text-gray-400 transition-colors group-hover:text-blue-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {NAV_PRIMARY.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`rounded-xl px-4 py-2.5 font-medium transition-all ${
                    pathname === item.href
                      ? "bg-blue-50/50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                      : "text-gray-700 hover:bg-gray-100/50 hover:text-blue-600 dark:text-gray-300 dark:hover:bg-gray-800/50 dark:hover:text-blue-400"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-3 lg:flex">
                <Link
                  href="/login"
                  className="outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 inline-block cursor-pointer px-4 py-2.5 font-medium text-gray-600 transition-colors hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                >
                  Sign In
                </Link>
                <div className="relative isolate">
                  <span className="absolute -top-2 -right-2 z-10 rounded-full bg-red-500 px-2 py-1 text-xs font-bold text-white shadow-sm animate-pulse">
                    NEW
                  </span>
                  <Link
                    href="/onboarding"
                    className={`group block overflow-hidden rounded-xl bg-linear-to-r from-blue-600 via-cyan-500 to-emerald-400 px-6 py-3 text-base font-bold text-white shadow-xl transition-all hover:shadow-2xl hover:brightness-110 ${scrolled ? "ring-2 ring-emerald-400/50" : ""}`}
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      🔥 Start Free Trial
                      <span className="inline-block transition-transform duration-200 group-hover:translate-x-0.5">
                        →
                      </span>
                    </span>
                  </Link>
                </div>
              </div>

              {mobileMenuOpen ? (
                <button
                  type="button"
                  aria-expanded="true"
                  aria-label="Close menu"
                  className="outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 lg:hidden"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              ) : (
                <button
                  type="button"
                  aria-expanded="false"
                  aria-label="Open menu"
                  className="outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 lg:hidden"
                  onClick={() => setMobileMenuOpen(true)}
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
          <div className="border-b border-gray-200 bg-gray-50/50 py-2 dark:border-gray-800 dark:bg-gray-900/50">
            <div className="container mx-auto flex flex-col items-center gap-1 px-4 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-6">
              <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-500 dark:text-gray-400 sm:gap-6">
                <span className="flex items-center gap-1.5">
                  <span className="text-emerald-500">✓</span> No credit card
                  required
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-emerald-500">✓</span> 7-day free trial
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-emerald-500">✓</span> Cancel anytime
                </span>
              </div>
              <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                🎉 247 tourism providers joined this week
              </p>
            </div>
          </div>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 flex flex-col bg-white dark:bg-gray-900 lg:hidden">
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-24 pb-4">
            <div className="space-y-8">
              <div>
                <h3 className="mb-3 text-base font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  {NAV_CONFIG.solutions.label}
                </h3>
                <div className="space-y-1">
                  {NAV_CONFIG.solutions.items.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 flex min-h-[44px] items-center justify-between rounded-xl p-3.5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {item.name}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {item.desc}
                        </p>
                      </div>
                      <svg
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-base font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  {NAV_CONFIG.resources.label}
                </h3>
                <div className="space-y-1">
                  {NAV_CONFIG.resources.items.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="flex min-h-[44px] items-center justify-between rounded-xl p-3.5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span className="font-medium text-gray-900 dark:text-white">
                        {item.name}
                      </span>
                      <svg
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="space-y-1 border-t border-gray-200 pt-6 dark:border-gray-800">
                {NAV_PRIMARY.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 flex min-h-[44px] items-center rounded-xl p-3.5 font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-auto shrink-0 border-t border-gray-200 px-4 pb-[env(safe-area-inset-bottom)] pt-4 dark:border-gray-800">
              <Link
                href="/login"
                className="mb-3 flex min-h-[44px] w-full items-center justify-center font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Link>
              <div className="relative">
                <span className="absolute -top-2 right-4 rounded-full bg-red-500 px-2 py-1 text-xs font-bold text-white animate-pulse">
                  NEW
                </span>
                <Link
                  href="/onboarding"
                  className="outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 group flex min-h-[44px] w-full items-center justify-center rounded-xl bg-linear-to-r from-blue-600 via-cyan-500 to-emerald-400 py-3.5 font-semibold text-white shadow-lg"
                  onClick={() => {
                    trackCTAClick("/onboarding");
                    setMobileMenuOpen(false);
                  }}
                >
                  <span className="flex items-center justify-center gap-2">
                    🔥 Start Free Trial
                    <span className="inline-block transition-transform duration-200 group-hover:translate-x-0.5">
                      →
                    </span>
                  </span>
                </Link>
              </div>
              <p className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">
                🎉 247 tourism providers joined this week
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="h-24 lg:h-28" />
    </>
  );
}
