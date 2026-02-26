"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PropertySelector } from "@/web/components/PropertySelector";
import { TourismErrorBoundary } from "@/web/components/TourismErrorBoundary";

interface DeduplicationReport {
  type: string;
  duplicates: Array<{ ids: string[]; key: string; keepId: string; mergeIds: string[] }>;
  merged: number;
}

interface AnomalyReport {
  type: string;
  reservationIds: string[];
  count: number;
}

interface DataCleanupResult {
  deduplication: {
    guestByEmail: DeduplicationReport;
    guestByNameProperty: DeduplicationReport;
  };
  anomalies: AnomalyReport[];
  dryRun: boolean;
  timestamp: string;
}

function AnomalyBadge({ type }: { type: string }) {
  const labels: Record<string, string> = {
    checkout_before_checkin: "Check-out pred check-in",
    negative_price: "Negativna cena",
  };
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
      {labels[type] ?? type}
    </span>
  );
}

export default function DataCleanupPageWrapper() {
  return (
    <TourismErrorBoundary>
      <DataCleanupPage />
    </TourismErrorBoundary>
  );
}

function DataCleanupPage() {
  const [activePropertyId, setActivePropertyId] = useState<string | null>(null);
  const [result, setResult] = useState<DataCleanupResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);

  const runCleanup = async (dryRun: boolean, mergeDuplicates: boolean) => {
    if (mergeDuplicates && !dryRun) {
      if (!confirm("Resno želite združiti podvojene goste? To ne morete razveljaviti.")) return;
    }
    const setter = mergeDuplicates && !dryRun ? setApplying : setLoading;
    setter(true);
    setResult(null);
    try {
      const res = await fetch("/api/tourism/data-cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: activePropertyId || undefined,
          dryRun,
          mergeDuplicates: mergeDuplicates && !dryRun,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Napaka");
      setResult(data);
      if (mergeDuplicates && !dryRun)
        toast.success("Čiščenje izvedeno. Podvojene zapise smo združili.");
      else toast.success("Pregled končan.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Napaka pri čiščenju");
    } finally {
      setter(false);
    }
  };

  const dupEmail = result?.deduplication?.guestByEmail;
  const dupName = result?.deduplication?.guestByNameProperty;
  const anomalies = result?.anomalies ?? [];
  const hasDupes = (dupEmail?.merged ?? 0) + (dupName?.merged ?? 0) > 0;
  const hasAnomalies = anomalies.length > 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Čiščenje podatkov
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Deduplikacija gostov, preverjanje anomalij rezervacij
          </p>
        </div>
        <PropertySelector value={activePropertyId} onChange={setActivePropertyId} />
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-4">
        <h2 className="font-semibold text-gray-900 dark:text-white">
          Zaženi pregled
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Najprej preveri (dry run), nato po potrditvi uporabi združitev.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => runCleanup(true, false)}
            disabled={loading || applying}
            className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-medium hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            Preveri (dry run)
          </button>
          <button
            onClick={() => runCleanup(false, true)}
            disabled={loading || applying}
            className="px-4 py-2 rounded-lg bg-amber-600 text-white font-medium hover:bg-amber-700 disabled:opacity-50"
          >
            Združi podvojene goste
          </button>
        </div>
      </div>

      {result && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Čas: {new Date(result.timestamp).toLocaleString()} •{" "}
            {result.dryRun ? "Dry run (brez sprememb)" : "Spremembe izvedene"}
          </p>

          {hasDupes && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <h3 className="font-semibold">Podvojitve gostov</h3>
              </div>
              <div className="p-4 space-y-4">
                {dupEmail && dupEmail.duplicates.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Po emailu ({dupEmail.merged} za združitev)
                    </h4>
                    <ul className="text-sm space-y-1 list-disc list-inside">
                      {dupEmail.duplicates.slice(0, 5).map((d, i) => (
                        <li key={i}>
                          {d.key}: {d.ids.length} zapisov → obdrži {d.keepId.slice(0, 8)}…
                        </li>
                      ))}
                      {dupEmail.duplicates.length > 5 && (
                        <li className="text-gray-500">
                          … in še {dupEmail.duplicates.length - 5} skupin
                        </li>
                      )}
                    </ul>
                  </div>
                )}
                {dupName && dupName.duplicates.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Po imenu + nastanitev ({dupName.merged} za združitev)
                    </h4>
                    <ul className="text-sm space-y-1 list-disc list-inside">
                      {dupName.duplicates.slice(0, 5).map((d, i) => (
                        <li key={i}>
                          {d.key}: {d.ids.length} zapisov
                        </li>
                      ))}
                      {dupName.duplicates.length > 5 && (
                        <li className="text-gray-500">
                          … in še {dupName.duplicates.length - 5} skupin
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {hasAnomalies && (
            <div className="rounded-xl border border-red-200 dark:border-red-800 overflow-hidden">
              <div className="p-4 border-b border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                <h3 className="font-semibold text-red-900 dark:text-red-200">
                  Anomalije rezervacij
                </h3>
              </div>
              <div className="p-4 space-y-2">
                {anomalies.map((a, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 flex-wrap"
                  >
                    <AnomalyBadge type={a.type} />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {a.count} rezervacij
                    </span>
                    <span className="text-xs text-gray-500">
                      ID: {a.reservationIds.slice(0, 3).join(", ")}
                      {a.reservationIds.length > 3 && "…"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!hasDupes && !hasAnomalies && (
            <div className="rounded-xl border border-green-200 dark:border-green-800 p-4 bg-green-50 dark:bg-green-900/20">
              <p className="text-green-800 dark:text-green-200">
                ✓ Ni podvojenih gostov ali anomalij rezervacij.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
