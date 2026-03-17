"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { PropertySelector } from "@/web/components/PropertySelector";

interface PmsConnection {
  id: string;
  propertyId: string;
  provider: string;
  hasCredentials: boolean;
}

export default function PmsConnectionsPage() {
  const [activePropertyId, setActivePropertyId] = useState<string | null>(null);
  const [connections, setConnections] = useState<PmsConnection[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [form, setForm] = useState({ accessToken: "", clientToken: "" });

  useEffect(() => {
    fetch("/api/v1/user/active-property")
      .then((r) => r.json())
      .then((data) => setActivePropertyId(data.activePropertyId ?? null))
      .catch(() => setActivePropertyId(null));
  }, []);

  useEffect(() => {
    if (!activePropertyId) {
      setConnections([]);
      return;
    }
    setLoading(true);
    fetch(`/api/v1/tourism/pms-connections?propertyId=${activePropertyId}`)
      .then((r) => r.json())
      .then((data) => setConnections(data.connections ?? []))
      .catch(() => setConnections([]))
      .finally(() => setLoading(false));
  }, [activePropertyId]);

  const handleSave = async () => {
    if (!activePropertyId || !form.accessToken.trim() || !form.clientToken.trim()) {
      toast.error("Izberite nastanitev in vnesite oba tokena");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/v1/tourism/pms-connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: activePropertyId,
          provider: "mews",
          accessToken: form.accessToken.trim(),
          clientToken: form.clientToken.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Napaka");
      setForm({ accessToken: "", clientToken: "" });
      setConnections((prev) => {
        const rest = prev.filter((c) => c.provider !== "mews");
        return [...rest, { id: data.id, propertyId: data.propertyId, provider: "mews", hasCredentials: true }];
      });
      toast.success("Poverilnice shranjene");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Napaka pri shranjevanju");
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async () => {
    if (!activePropertyId) return;
    const hasTokensInForm = form.accessToken.trim() && form.clientToken.trim();
    if (!hasMews && !hasTokensInForm) {
      toast.error("Vnesite Access Token in Client Token za sinhronizacijo");
      return;
    }
    setSyncing(true);
    try {
      const body: { propertyId: string; provider: string; accessToken?: string; clientToken?: string } = {
        propertyId: activePropertyId,
        provider: "mews",
      };
      if (hasTokensInForm) {
        body.accessToken = form.accessToken.trim();
        body.clientToken = form.clientToken.trim();
      }
      const res = await fetch("/api/v1/tourism/pms-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? data.message ?? "Napaka");
      toast.success(data.message ?? `Sinhronizirano: ${data.fetched ?? data.synced ?? 0} rezervacij`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Napaka pri sinhronizaciji");
    } finally {
      setSyncing(false);
    }
  };

  const handleRemove = async () => {
    if (!activePropertyId || !confirm("Odstranim shranjene poverilnice Mews?")) return;
    try {
      const res = await fetch(
        `/api/v1/tourism/pms-connections?propertyId=${activePropertyId}&provider=mews`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Napaka");
      setConnections((prev) => prev.filter((c) => c.provider !== "mews"));
      toast.success("Poverilnice odstranjene");
    } catch {
      toast.error("Napaka pri odstranjevanju");
    }
  };

  const hasMews = connections.some((c) => c.provider === "mews");

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl space-y-6">
      <div>
        <Link href="/dashboard/tourism" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
          ← Tourism Hub
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        PMS Povezave
      </h1>
      <p className="text-gray-600 dark:text-gray-400">
        Povežite Mews ali druge PMS za sinhronizacijo rezervacij.
      </p>

      <PropertySelector
        value={activePropertyId}
        onChange={async (id) => {
          const res = await fetch("/api/v1/user/active-property", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ propertyId: id }),
          });
          if (res.ok) setActivePropertyId(id);
        }}
      />

      {!activePropertyId ? (
        <p className="text-gray-500">Izberite nastanitev za nadaljevanje.</p>
      ) : (
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">Mews</h2>
            <p className="text-sm text-gray-500">
              Access Token in Client Token iz Mews Developer Dashboard.
            </p>

            <div className="space-y-2">
              <input
                type="password"
                value={form.accessToken}
                onChange={(e) => setForm((f) => ({ ...f, accessToken: e.target.value }))}
                placeholder="Access Token"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
              />
              <input
                type="password"
                value={form.clientToken}
                onChange={(e) => setForm((f) => ({ ...f, clientToken: e.target.value }))}
                placeholder="Client Token"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleSave}
                disabled={saving || !form.accessToken.trim() || !form.clientToken.trim()}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Shranjujem..." : "Shrani poverilnice"}
              </button>
              <button
                onClick={handleSync}
                disabled={syncing || !form.accessToken.trim() || !form.clientToken.trim()}
                className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {syncing ? "Sinhroniziram..." : "Sinhroniziraj zdaj"}
              </button>
              {hasMews && (
                <button
                  onClick={handleRemove}
                  className="px-4 py-2 rounded-lg border border-red-300 text-red-600 text-sm hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Odstrani
                </button>
              )}
            </div>

            {hasMews && (
              <p className="text-xs text-green-600 dark:text-green-400">
                Poverilnice shranjene. Kliknite Sinhroniziraj zdaj brez vnosa – uporablja shranjene tokene.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
