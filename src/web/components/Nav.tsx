"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export function Nav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: session, status } = useSession();

  const navLinks = (
    <>
      <Link
        href="/workflows"
        className="text-gray-300 transition-colors hover:text-white"
      >
        Workflows
      </Link>
      <Link
        href="/pricing"
        className="text-gray-300 transition-colors hover:text-white"
      >
        Pricing
      </Link>
      <Link
        href="/dashboard"
        className="text-gray-300 transition-colors hover:text-white"
      >
        Dashboard
      </Link>
      <Link
        href="/memory"
        className="text-gray-300 transition-colors hover:text-white"
      >
        Memory
      </Link>
      <Link
        href="/monitoring"
        className="text-gray-300 transition-colors hover:text-white"
      >
        Monitoring
      </Link>
      <Link
        href="/contact"
        className="text-gray-300 transition-colors hover:text-white"
      >
        Contact
      </Link>
    </>
  );

  const authButtons = (
    <>
      {status === "loading" ? (
        <span className="text-gray-400">Loading...</span>
      ) : session ? (
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-gray-300 transition-colors hover:text-white"
        >
          Logout
        </button>
      ) : (
        <>
          <Link
            href="/login"
            className="text-gray-300 transition-colors hover:text-white"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
          >
            Get Started
          </Link>
        </>
      )}
    </>
  );

  return (
    <nav className="border-b border-gray-800 bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="text-xl font-bold text-white">
            AgentFlow Pro
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-6 md:flex">{navLinks}</div>

          {/* Auth Buttons */}
          <div className="hidden items-center gap-4 md:flex">{authButtons}</div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-gray-300 hover:text-white md:hidden"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-gray-800 py-4 md:hidden">
            <div className="flex flex-col gap-4">
              <Link
                href="/workflows"
                className="text-gray-300 transition-colors hover:text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                Workflows
              </Link>
              <Link
                href="/pricing"
                className="text-gray-300 transition-colors hover:text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link
                href="/dashboard"
                className="text-gray-300 transition-colors hover:text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                href="/memory"
                className="text-gray-300 transition-colors hover:text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                Memory
              </Link>
              <Link
                href="/monitoring"
                className="text-gray-300 transition-colors hover:text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                Monitoring
              </Link>
              <Link
                href="/contact"
                className="text-gray-300 transition-colors hover:text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact
              </Link>
              <div className="flex flex-col gap-2 border-t border-gray-800 pt-4">
                {status === "loading" ? (
                  <span className="text-gray-400">Loading...</span>
                ) : session ? (
                  <button
                    onClick={() => {
                      signOut({ callbackUrl: "/login" });
                      setMobileMenuOpen(false);
                    }}
                    className="text-left text-gray-300 transition-colors hover:text-white"
                  >
                    Logout
                  </button>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="text-gray-300 transition-colors hover:text-white"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 text-center"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
