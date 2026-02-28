"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface InsightsData {
  period: { from: string; to: string };
  totalExecutions: number;
  successCount: number;
  failureCount: number;
  failureRate: number;
  byAgentType: Record<
    string,
    { runs: number; success: number; failed: number }
  >;
  estimatedTimeSavedHours: number;
}

export default function InsightsPage() {
  const [period, setPeriod] = useState("30d");
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/insights?period=${period}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Error"))
      .finally(() => setLoading(false));
  }, [period]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6 text-center">
          <p className="text-red-700 dark:text-red-300">
            {error ?? "Ni mogoče naložiti podatkov."}
          </p>
          <Link
            href="/dashboard"
            className="mt-4 inline-block text-blue-600 dark:text-blue-400 hover:underline"
          >
            Nazaj na pregled
          </Link>
        </div>
      </div>
    );
  }

  const agentTypeLabels: Record<string, string> = {
    workflow: "Workflow",
    content: "Vsebina",
    chat: "Chat",
    image: "Slika",
    personalize: "Personalizacija",
    optimize: "Optimizacija",
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Insights
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Izvedbe agentov, stopnja napak, prihranjen čas
          </p>
        </div>
        <label htmlFor="period-select" className="sr-only">
          Izberi obdobje
        </label>
        <select
          id="period-select"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          aria-label="Izberi časovno obdobje"
        >
          <option value="7d">Zadnjih 7 dni</option>
          <option value="30d">Zadnjih 30 dni</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Skupaj izvedb
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {data.totalExecutions}
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Uspešnih
          </div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
            {data.successCount}
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Stopnja napak
          </div>
          <div
            className={`text-2xl font-bold mt-1 ${data.failureRate > 10
                ? "text-red-600 dark:text-red-400"
                : "text-gray-900 dark:text-white"
              }`}
          >
            {data.failureRate}%
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Ocenjen prihranjen čas
          </div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            ~{data.estimatedTimeSavedHours} h
          </div>
        </div>
      </div>

      {Object.keys(data.byAgentType).length > 0 && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Po vrstah agentov
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Izvedbe po agentType (uspešno / neuspešno)
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left px-4 py-3 text-gray-600 dark:text-gray-400 font-medium">
                    Agent
                  </th>
                  <th className="text-right px-4 py-3 text-gray-600 dark:text-gray-400 font-medium">
                    Skupaj
                  </th>
                  <th className="text-right px-4 py-3 text-gray-600 dark:text-gray-400 font-medium">
                    Uspešno
                  </th>
                  <th className="text-right px-4 py-3 text-gray-600 dark:text-gray-400 font-medium">
                    Neuspešno
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(data.byAgentType)
                  .sort(([, a], [, b]) => b.runs - a.runs)
                  .map(([agentType, stats]) => (
                    <tr
                      key={agentType}
                      className="border-b border-gray-100 dark:border-gray-700/50"
                    >
                      <td className="px-4 py-3 text-gray-900 dark:text-white">
                        {agentTypeLabels[agentType] ?? agentType}
                      </td>
                      <td className="text-right px-4 py-3 text-gray-700 dark:text-gray-300">
                        {stats.runs}
                      </td>
                      <td className="text-right px-4 py-3 text-green-600 dark:text-green-400">
                        {stats.success}
                      </td>
                      <td className="text-right px-4 py-3 text-red-600 dark:text-red-400">
                        {stats.failed}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {data.totalExecutions === 0 && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Še nimate izvedb v tem obdobju.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Ustvarite vsebino, poženite workflow ali uporabite chat za prve metrike.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link
              href="/generate"
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
            >
              Ustvari vsebino
            </Link>
            <Link
              href="/workflows"
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Workflow Builder
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
