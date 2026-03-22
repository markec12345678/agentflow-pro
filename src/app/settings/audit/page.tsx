"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface AuditRun {
  id: string;
  agentType: string;
  status: string;
  input: Record<string, unknown> | null;
  output: Record<string, unknown> | null;
  createdAt: string;
}

export default function AuditPage() {
  const { data: _session, status } = useSession();
  const [runs, setRuns] = useState<AuditRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [agentFilter, setAgentFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      window.location.href = "/login";
      return;
    }
    if (status !== "authenticated") return;

    const params = new URLSearchParams();
    if (agentFilter) params.set("agentType", agentFilter);
    if (fromDate) params.set("from", fromDate);
    if (toDate) params.set("to", toDate);

    fetch(`/api/audit?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) return;
        setRuns(data.runs ?? []);
      })
      .catch(() => setRuns([]))
      .finally(() => setLoading(false));
  }, [status, agentFilter, fromDate, toDate]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/settings"
            className="text-blue-600 hover:underline dark:text-blue-400"
          >
            ← Settings
          </Link>
          <h1 className="text-2xl font-bold dark:text-white">AI Audit Logs</h1>
        </div>

        <p className="text-gray-600 dark:text-gray-400 mb-6">
          History of AI agent runs for compliance and debugging.
        </p>

        <div className="flex flex-wrap gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium dark:text-gray-300 mb-1">
              Agent type
            </label>
            <select
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              title="Filtriraj po tipu agenta"
            >
              <option value="">All</option>
              <option value="content">Content</option>
              <option value="image">Image</option>
              <option value="personalize">Personalize</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium dark:text-gray-300 mb-1">
              From
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              title="Začetni datum za audit"
              placeholder="Izberite začetni datum"
            />
          </div>
          <div>
            <label className="block text-sm font-medium dark:text-gray-300 mb-1">
              To
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              title="Končni datum za audit"
              placeholder="Izberite končni datum"
            />
          </div>
        </div>

        <div className="rounded-xl bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
          {runs.length === 0 ? (
            <p className="p-8 text-center text-gray-500 dark:text-gray-400">
              No audit records found.
            </p>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {runs.map((r) => (
                <div
                  key={r.id}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium dark:text-white">
                      {r.agentType}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(r.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {r.input && Object.keys(r.input).length > 0 && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                      Input: {JSON.stringify(r.input)}
                    </p>
                  )}
                  {r.output && Object.keys(r.output).length > 0 && (
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Output: {JSON.stringify(r.output)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
