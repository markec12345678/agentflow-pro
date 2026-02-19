"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { SkeletonList } from "@/web/components/Skeleton";

interface Property {
  id: string;
  name: string;
  location: string | null;
  type: string | null;
  capacity: number | null;
  createdAt: string;
}

const TYPES = ["apartma", "hisa", "hostel", "hotel", "kampa", "drugo"];

export default function TourismPropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", location: "", type: "", capacity: "" });
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);

  const fetchProperties = (showLoading = true) => {
    if (showLoading) setLoading(true);
    fetch("/api/tourism/properties")
      .then((r) => r.json())
      .then((data) => setProperties(data.properties ?? []))
      .catch(() => {
        setProperties([]);
        toast.error("Napaka pri nalaganju nastanitev.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/tourism/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          location: form.location.trim() || null,
          type: form.type.trim() || null,
          capacity: form.capacity ? parseInt(form.capacity, 10) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Napaka");
      setForm({ name: "", location: "", type: "", capacity: "" });
      fetchProperties(false);
      toast.success("Nastanitev dodana");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Napaka pri ustvarjanju");
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (id: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/tourism/properties/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          location: form.location.trim() || null,
          type: form.type.trim() || null,
          capacity: form.capacity ? parseInt(form.capacity, 10) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Napaka");
      setEditing(null);
      setForm({ name: "", location: "", type: "", capacity: "" });
      fetchProperties(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Napaka pri posodabljanju");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Izbrišem to nastanitev?")) return;
    try {
      const res = await fetch(`/api/tourism/properties/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Napaka");
      }
      fetchProperties(false);
      toast.success("Nastanitev izbrisana");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Napaka pri brisanju");
    }
  };

  const startEdit = (p: Property) => {
    setEditing(p.id);
    setForm({
      name: p.name,
      location: p.location ?? "",
      type: p.type ?? "",
      capacity: p.capacity != null ? String(p.capacity) : "",
    });
  };

  const cancelEdit = () => {
    setEditing(null);
    setForm({ name: "", location: "", type: "", capacity: "" });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8 overflow-x-hidden">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/tourism"
          className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
        >
          ← Tourism Hub
        </Link>
      </div>
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
        Nastanitve
      </h1>
      <p className="text-neutral-600 dark:text-neutral-400">
        Upravljaj nastanitve in preklopi med njimi v Tourism Hubu.
      </p>

      <form onSubmit={handleCreate} className="flex flex-wrap gap-3 w-full sm:w-auto">
        <input
          type="text"
          placeholder="Ime nastanitve"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 px-3 py-2 text-neutral-900 dark:text-neutral-100 min-w-[180px]"
        />
        <input
          type="text"
          placeholder="Lokacija"
          value={form.location}
          onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
          className="rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 px-3 py-2 text-neutral-900 dark:text-neutral-100 min-w-[120px]"
        />
        <select
          value={form.type}
          onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
          className="rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 px-3 py-2 text-neutral-900 dark:text-neutral-100"
        >
          <option value="">Tip</option>
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Kapaciteta"
          value={form.capacity}
          onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
          min={1}
          className="rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 px-3 py-2 text-neutral-900 dark:text-neutral-100 w-24"
        />
        <button
          type="submit"
          disabled={creating || !form.name.trim()}
          className="w-full sm:w-auto min-h-[44px] px-4 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          {creating ? "Dodajam..." : "Dodaj"}
        </button>
      </form>

      {loading ? (
        <SkeletonList count={3} />
      ) : properties.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 dark:border-neutral-600 p-8 text-center text-neutral-500">
          Še nimate nastanitev. Dodajte prvo z obrazcem zgoraj.
        </div>
      ) : (
        <ul className="space-y-3">
          {properties.map((p) => (
            <li
              key={p.id}
              className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4"
            >
              {editing === p.id ? (
                <div className="flex flex-wrap gap-2 items-end min-w-0">
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Ime"
                    className="min-w-[100px] flex-1 sm:flex-initial rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 px-3 py-2 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 dark:placeholder:text-neutral-400"
                  />
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                    placeholder="Lokacija"
                    className="min-w-[100px] flex-1 sm:flex-initial rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 px-3 py-2 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 dark:placeholder:text-neutral-400"
                  />
                  <select
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                    className="rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 px-3 py-2 text-neutral-900 dark:text-neutral-100"
                  >
                    <option value="">Tip</option>
                    {TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={form.capacity}
                    onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
                    placeholder="Kap."
                    className="w-16 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 px-3 py-2 text-neutral-900 dark:text-neutral-100"
                  />
                  <button
                    type="button"
                    onClick={() => handleUpdate(p.id)}
                    disabled={saving}
                    className="min-h-[44px] px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    Shrani
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="min-h-[44px] px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    Prekliči
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-neutral-900 dark:text-neutral-100">
                      {p.name}
                    </div>
                    <div className="text-sm text-neutral-500 dark:text-neutral-400">
                      {[p.location, p.type, p.capacity ? p.capacity + " oseb" : null].filter(Boolean).join(" · ") || "—"}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(p)}
                      className="text-sm px-2 py-1 rounded border hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    >
                      Uredi
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(p.id)}
                      aria-label={`Izbriši nastanitev ${p.name}`}
                      className="text-sm px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                    >
                      Izbriši
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
