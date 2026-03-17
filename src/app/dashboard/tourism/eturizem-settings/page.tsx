"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { PropertySelector } from "@/web/components/PropertySelector";

interface AjpesConnection {
  configured: boolean;
  id?: string;
  username?: string;
  rnoId?: number | null;
}

interface EturizemStats {
  totalSubmissions: number;
  successfulSubmissions: number;
  failedSubmissions: number;
  lastSubmissionAt: string | null;
  lastSubmissionStatus: "success" | "failed" | null;
  successRate: number;
}

export default function EturizemSettingsPage() {
  const [activePropertyId, setActivePropertyId] = useState<string | null>(null);
  const [connection, setConnection] = useState<AjpesConnection | null>(null);
  const [stats, setStats] = useState<EturizemStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    username: "",
    password: "",
    rnoId: "",
  });

  useEffect(() => {
    fetch("/api/v1/user/active-property")
      .then((r) => r.json())
      .then((data) => setActivePropertyId(data.activePropertyId ?? null))
      .catch(() => setActivePropertyId(null));
  }, []);

  useEffect(() => {
    if (!activePropertyId) {
      setConnection(null);
      setStats(null);
      setForm({ username: "", password: "", rnoId: "" });
      return;
    }
    setLoading(true);
    Promise.all([
      fetch(`/api/v1/tourism/eturizem/connection?propertyId=${activePropertyId}`).then((r) => r.json()),
      fetch(`/api/v1/tourism/eturizem/stats?propertyId=${activePropertyId}`).then((r) => r.json()).catch(() => null),
    ])
      .then(([connData, statsData]) => {
        setConnection(connData);
        setStats(statsData);
        if (connData.username) setForm((f) => ({ ...f, username: connData.username }));
        if (connData.rnoId != null) setForm((f) => ({ ...f, rnoId: String(connData.rnoId) }));
      })
      .catch(() => {
        setConnection(null);
        setStats(null);
      })
      .finally(() => setLoading(false));
  }, [activePropertyId]);

  const handleSave = async () => {
    if (!activePropertyId) {
      toast.error("Izberite nastanitev");
      return;
    }
    if (!connection?.configured && (!form.username.trim() || !form.password)) {
      toast.error("Uporabniško ime in geslo sta obvezna za novo povezavo");
      return;
    }
    setSaving(true);
    try {
      const body: { propertyId: string; username?: string; password?: string; rnoId?: number } = {
        propertyId: activePropertyId,
      };
      if (form.username.trim()) body.username = form.username.trim();
      if (form.password) body.password = form.password;
      const rno = parseInt(form.rnoId, 10);
      if (!isNaN(rno)) body.rnoId = rno;

      const res = await fetch("/api/v1/tourism/eturizem/connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Napaka");
      setConnection({ configured: true, id: data.id, username: data.username, rnoId: data.rnoId });
      setForm((f) => ({ ...f, password: "" }));
      toast.success("AJPES povezava shranjena");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Napaka pri shranjevanju");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!activePropertyId || !confirm("Odstranim AJPES povezavo za to nastanitev?")) return;
    try {
      const res = await fetch(
        `/api/v1/tourism/eturizem/connection?propertyId=${activePropertyId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Napaka");
      setConnection({ configured: false });
      setForm({ username: "", password: "", rnoId: "" });
      toast.success("Povezava odstranjena");
    } catch {
      toast.error("Napaka pri odstranjevanju");
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl space-y-6">
      <div>
        <Link href="/dashboard/tourism" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
          ← Tourism Hub
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        eTurizem (AJPES)
      </h1>
      <p className="text-gray-600 dark:text-gray-400">
        Povežite AJPES račun za prijavo gostov v knjigo gostov. Uporabniško ime in geslo iz AJPES portala ter RNO ID nastanitvenega obrata.
      </p>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Skupaj prijav</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalSubmissions}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Uspešne</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.successfulSubmissions}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Neuspešne</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.failedSubmissions}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Uspešnost</p>
            <p className={`text-2xl font-bold ${stats.successRate >= 90 ? "text-green-600" : stats.successRate >= 70 ? "text-amber-600" : "text-red-600"}`}>
              {stats.successRate}%
            </p>
          </div>
        </div>
      )}

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
      ) : loading ? (
        <p className="text-gray-500">Nalagam...</p>
      ) : (
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">AJPES poverilnice</h2>
            <p className="text-sm text-gray-500">
              Uporabniško ime in geslo iz portala AJPES (ajpes.si). RNO ID dobite ob vpisu v Register nastanitvenih obratov.
            </p>

            <div className="space-y-2">
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                placeholder="Uporabniško ime AJPES"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
              />
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder={connection?.configured ? "Geslo (pustite prazno za obdržati)" : "Geslo"}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
              />
              <input
                type="number"
                value={form.rnoId}
                onChange={(e) => setForm((f) => ({ ...f, rnoId: e.target.value }))}
                placeholder="RNO ID nastanitvenega obrata"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleSave}
                disabled={saving || (!connection?.configured && (!form.username.trim() || !form.password))}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Shranjujem..." : "Shrani"}
              </button>
              {connection?.configured && (
                <button
                  onClick={handleRemove}
                  className="px-4 py-2 rounded-lg border border-red-300 text-red-600 text-sm hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Odstrani povezavo
                </button>
              )}
            </div>

            {connection?.configured && (
              <p className="text-xs text-green-600 dark:text-green-400">
                Povezava nastavljena. Gostov lahko prijavljate z gumba »Prijavi v eTurizem« na Pregledu.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
