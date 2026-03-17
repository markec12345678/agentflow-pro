"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Escalation {
  id: string;
  userId: string;
  threadId: string | null;
  lastMessagePreview: string;
  confidence: number;
  status: string;
  createdAt: string;
  user?: { email: string; name: string | null };
}

export default function EscalationsPage() {
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [showAll, setShowAll] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchEscalations = useCallback(() => {
    const params = new URLSearchParams();
    if (statusFilter !== "pending") params.set("status", statusFilter);
    if (showAll) params.set("all", "true");
    fetch(`/api/v1/chat/escalations?${params}`)
      .then((r) => r.json())
      .then((data: { escalations?: Escalation[] }) => {
        setEscalations(Array.isArray(data.escalations) ? data.escalations : []);
      })
      .catch(() => setEscalations([]))
      .finally(() => setLoading(false));
  }, [statusFilter, showAll]);

  useEffect(() => {
    setLoading(true);
    fetchEscalations();
  }, [fetchEscalations]);

  const updateStatus = (id: string, status: string) => {
    setUpdating(id);
    fetch(`/api/v1/chat/escalations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
      .then((r) => {
        if (!r.ok) throw new Error("Update failed");
        return r.json();
      })
      .then(() => fetchEscalations())
      .catch(() => { })
      .finally(() => setUpdating(null));
  };

  const statusLabels: Record<string, string> = {
    pending: "Čaka",
    acknowledged: "V obdelavi",
    resolved: "Rešeno",
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        HITL Escalations
      </h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        Pogovori, ki zahtevajo ročno prevzem (nizko zaupanje AI odgovora).
      </p>

      <div className="flex flex-wrap gap-4 mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filtriraj po statusu"
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
        >
          <option value="pending">Čaka</option>
          <option value="acknowledged">V obdelavi</option>
          <option value="resolved">Rešeno</option>
          <option value="all">Vsi</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <input
            type="checkbox"
            checked={showAll}
            onChange={(e) => setShowAll(e.target.checked)}
          />
          Prikaži vse uporabnike (admin)
        </label>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : escalations.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
          <p className="text-4xl mb-2">✓</p>
          <p className="text-gray-500 dark:text-gray-400">
            Ni escalationov s tem statusom.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {escalations.map((e) => (
            <div
              key={e.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {showAll && e.user && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      {e.user.email}
                    </p>
                  )}
                  <p className="text-sm text-gray-900 dark:text-white line-clamp-2">
                    {e.lastMessagePreview}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${e.status === "pending"
                          ? "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200"
                          : e.status === "acknowledged"
                            ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
                            : "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                        }`}
                    >
                      {statusLabels[e.status] ?? e.status}
                    </span>
                    <span className="text-xs text-gray-400">
                      Zaupanje: {Math.round(e.confidence * 100)}%
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(e.createdAt).toLocaleString("sl-SI")}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {e.threadId && (
                    <Link
                      href={`/chat?threadId=${e.threadId}`}
                      className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                    >
                      Odpri chat
                    </Link>
                  )}
                  {e.status === "pending" && (
                    <button
                      onClick={() => updateStatus(e.id, "acknowledged")}
                      disabled={updating === e.id}
                      className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {updating === e.id ? "..." : "Prevzemi"}
                    </button>
                  )}
                  {e.status !== "resolved" && (
                    <button
                      onClick={() => updateStatus(e.id, "resolved")}
                      disabled={updating === e.id}
                      className="px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                    >
                      {updating === e.id ? "..." : "Rešeno"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
