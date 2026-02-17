"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export function Nav() {
  const { data: session, status } = useSession();

  return (
    <nav className="flex items-center gap-4 border-b border-gray-200 bg-white px-8 py-4">
      <Link href="/" className="font-bold text-indigo-600 hover:text-indigo-700">
        AgentFlow Pro
      </Link>
      <Link href="/workflows" className="text-gray-600 hover:text-gray-900">
        Workflows
      </Link>
      <Link href="/pricing" className="text-gray-600 hover:text-gray-900">
        Pricing
      </Link>
      <Link href="/memory" className="text-gray-600 hover:text-gray-900">
        Memory
      </Link>
      <div className="ml-auto flex items-center gap-2">
        {status === "loading" ? (
          <span className="text-sm text-gray-500">Loading...</span>
        ) : session ? (
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="rounded px-3 py-1 text-sm text-gray-600 hover:bg-gray-100"
          >
            Logout
          </button>
        ) : (
          <>
            <Link href="/login" className="rounded px-3 py-1 text-sm text-gray-600 hover:bg-gray-100">
              Login
            </Link>
            <Link
              href="/register"
              className="rounded bg-indigo-600 px-3 py-1 text-sm text-white hover:bg-indigo-700"
            >
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
