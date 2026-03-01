"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Skeleton } from "@/web/components/Skeleton";

interface TodayOverview {
  date: string;
  arrivals: { id: string; guestName: string; propertyName: string; checkIn: string }[];
  departures: { id: string; guestName: string; propertyName: string; checkOut: string }[];
  inHouse: { id: string; guestName: string; propertyName: string }[];
  counts: { arrivals: number; departures: number; inHouse: number };
  pendingPreArrivalCount: number;
}

interface DailyRevenue {
  date: string;
  revenue: number;
  departureCount: number;
}

interface Checkpoint {
  id: string;
  nodeLabel: string | null;
  createdAt: string;
  workflow: { id: string; name: string };
}

interface ActionRequired {
  type: string;
  title: string;
  count?: number;
  href: string;
}

interface DirectorSummary {
  todayOverview: TodayOverview;
  dailyRevenue: DailyRevenue;
  checkpoints: Checkpoint[];
  alerts: Array<{
    id: string;
    type: "event" | "log";
    eventType: string;
    entityId: string;
    metadata?: unknown;
    channel?: string;
    at: string;
  }>;
  pendingGuestCommsCount: number;
  actionsRequired?: ActionRequired[];
}

function formatDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("sl-SI", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function DirectorPage() {
  const [data, setData] = useState<DirectorSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch("/api/director/summary")
      .then((r) => {
        if (!r.ok) throw new Error("Napaka pri nalaganju");
        return r.json();
      })
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Director</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
        <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const { todayOverview, dailyRevenue, checkpoints, alerts, pendingGuestCommsCount } = data;
  const actionsRequired = data.actionsRequired ?? [];
  const hasAny = todayOverview.counts.arrivals > 0 || todayOverview.counts.departures > 0 || todayOverview.counts.inHouse > 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Director: {formatDate(todayOverview.date)}
      </h1>

      {/* Hero: autonomous vs actions required */}
      <div
        className={`rounded-xl border p-6 ${actionsRequired.length === 0
          ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"
          : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
          }`}
      >
        {actionsRequired.length === 0 ? (
          <div className="flex items-center gap-3">
            <span className="text-3xl" aria-hidden>✓</span>
            <p className="text-lg font-semibold text-emerald-800 dark:text-emerald-200">
              Sistem je popolnoma avtonomen danes – ničesar ni treba storiti
            </p>
          </div>
        ) : (
          <div>
            <h2 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-3">
              Zahteva pozornost
            </h2>
            <ul className="space-y-2">
              {actionsRequired.map((a, i) => (
                <li key={`${a.type}-${i}`}>
                  <Link
                    href={a.href}
                    className="flex items-center justify-between gap-4 rounded-lg px-3 py-2 text-sm font-medium text-amber-900 dark:text-amber-100 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                  >
                    <span>{a.title}</span>
                    <span className="text-amber-600 dark:text-amber-400">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Today overview cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white">
          <div className="text-4xl font-bold">{todayOverview.counts.arrivals}</div>
          <div className="text-sm font-medium text-white/90 mt-1">Prihodov</div>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 p-6 text-white">
          <div className="text-4xl font-bold">{todayOverview.counts.departures}</div>
          <div className="text-sm font-medium text-white/90 mt-1">Odhodov</div>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-6 text-white">
          <div className="text-4xl font-bold">{todayOverview.counts.inHouse}</div>
          <div className="text-sm font-medium text-white/90 mt-1">V nastanitvi</div>
        </div>
      </div>

      {/* Revenue */}
      <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Dnevni prihodek
        </h2>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">
          €{dailyRevenue.revenue.toFixed(2)}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {dailyRevenue.departureCount} odhodov
        </p>
      </div>

      {/* Pending approvals */}
      {(checkpoints.length > 0 || pendingGuestCommsCount > 0) && (
        <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Čaka na odobritev
          </h2>
          <div className="space-y-2">
            {checkpoints.map((cp) => (
              <div
                key={cp.id}
                className="flex items-center justify-between gap-4 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
              >
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {cp.workflow.name} – {cp.nodeLabel ?? "Odobritev"}
                </span>
                <Link
                  href="/dashboard"
                  className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Odobri →
                </Link>
              </div>
            ))}
            {pendingGuestCommsCount > 0 && (
              <div className="flex items-center justify-between gap-4 py-2">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {pendingGuestCommsCount} pre-arrival emailov
                </span>
                <Link
                  href="/dashboard/tourism/guest-communication?type=pre-arrival"
                  className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Upravljaj →
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Zadnja opozorila (24h)
          </h2>
          <ul className="space-y-2">
            {alerts.slice(0, 10).map((a) => (
              <li
                key={a.id}
                className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2"
              >
                <span
                  className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${a.eventType === "eturizem_pending"
                    ? "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200"
                    : a.eventType === "property_pricing_suggested"
                      ? "bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-200"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    }`}
                >
                  {a.eventType === "eturizem_pending"
                    ? "eTurizem"
                    : a.eventType === "property_pricing_suggested"
                      ? "Cene"
                      : a.eventType}
                </span>
                {a.eventType === "eturizem_pending" && a.metadata && typeof a.metadata === "object" && "count" in a.metadata && (
                  <span>{(a.metadata as { count?: number }).count} prihodov brez eTurizem</span>
                )}
                {a.eventType === "property_pricing_suggested" && a.metadata && typeof a.metadata === "object" && "suggestedBasePrice" in a.metadata && (
                  <span>
                    Predlog cene: €{(a.metadata as { suggestedBasePrice?: number }).suggestedBasePrice}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Quick links */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/dashboard/tourism"
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
        >
          Tourism Hub
        </Link>
        <Link
          href="/dashboard/tourism/calendar"
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          Koledar
        </Link>
        {!hasAny && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Ni prihodov, odhodov ali gostov v nastanitvi danes.
          </p>
        )}
      </div>
    </div>
  );
}
