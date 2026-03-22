"use client";

import Link from "next/link";

export default function SearchConsoleSetupPage() {
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <Link
          href="/dashboard/tourism/seo"
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          ← Nazaj na SEO
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Google Search Console – povezava
      </h1>

      <p className="text-gray-600 dark:text-gray-400">
        Za prikaz podatkov iz Google Search Console povežite svojo spletno stran z AgentFlow Pro.
      </p>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 dark:text-white">
          Možnost 1: Uvoz podatkov (CSV)
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Iz Google Search Console izvozite podatke v CSV in jih uvožite na strani{" "}
          <Link href="/dashboard/tourism/seo" className="text-blue-600 dark:text-blue-400 hover:underline">
            SEO
          </Link>{" "}
          (gumb »Uvozi CSV«).
        </p>

        <h2 className="font-semibold text-gray-900 dark:text-white">
          Možnost 2: OAuth povezava (prihodnje)
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Avtomatska sinhronizacija z Google Search Console bo na voljo v prihodnjih posodobitvah.
          Za zdaj uporabite CSV uvoz.
        </p>
      </div>

      <Link
        href="/dashboard/tourism/seo"
        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 font-medium transition-colors"
      >
        Preidi na SEO
      </Link>
    </div>
  );
}
