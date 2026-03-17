"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { SkeletonList } from "@/web/components/Skeleton";

interface SeasonRange {
  from: string;
  to: string;
  rate: number;
}

interface Property {
  id: string;
  name: string;
  location: string | null;
  type: string | null;
  capacity: number | null;
  basePrice?: number | null;
  currency?: string | null;
  seasonRates?: { high?: SeasonRange[]; mid?: SeasonRange[]; low?: SeasonRange[] } | null;
  reservationAutoApprovalRules?: { enabled?: boolean; channels?: string[]; maxAmount?: number } | null;
  createdAt: string;
}

const AUTO_APPROVAL_CHANNELS = ["mews", "booking.com", "direct", "airbnb"];

const TYPES = ["apartma", "hisa", "hostel", "hotel", "kampa", "drugo"];

const AMENITY_PRESETS = ["WiFi", "Parkirišče", "Bazen", "Kuhinja", "TV", "Klima", "Hišni ljubljenčki"];
const POLICY_PRESETS: { type: string; label: string }[] = [
  { type: "check-in", label: "Check-in čas" },
  { type: "check-out", label: "Check-out čas" },
  { type: "cancellation", label: "Odpovedi" },
  { type: "pets", label: "Hišni ljubljenčki" },
];

interface Amenity {
  id: string;
  name: string;
  category: string | null;
}

interface PropertyPolicy {
  id: string;
  policyType: string;
  content: string;
}

export default function TourismPropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    location: "",
    type: "",
    capacity: "",
    basePrice: "",
    currency: "EUR",
    seasonRates: { high: [] as SeasonRange[], mid: [] as SeasonRange[], low: [] as SeasonRange[] },
    autoApprovalEnabled: false,
    autoApprovalChannels: [] as string[],
    autoApprovalMaxAmount: "" as string | number,
  });
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [policies, setPolicies] = useState<PropertyPolicy[]>([]);
  const [newAmenity, setNewAmenity] = useState("");
  const [newPolicy, setNewPolicy] = useState({ type: "", content: "" });

  const fetchProperties = (showLoading = true) => {
    if (showLoading) setLoading(true);
    fetch("/api/v1/tourism/properties")
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

  useEffect(() => {
    if (!editing) {
      setAmenities([]);
      setPolicies([]);
      return;
    }
    const load = async () => {
      try {
        const [aRes, pRes] = await Promise.all([
          fetch(`/api/v1/tourism/properties/${editing}/amenities`),
          fetch(`/api/v1/tourism/properties/${editing}/policies`),
        ]);
        const aData = await aRes.json();
        const pData = await pRes.json();
        setAmenities(aData.amenities ?? []);
        setPolicies(pData.policies ?? []);
      } catch {
        setAmenities([]);
        setPolicies([]);
      }
    };
    load();
  }, [editing]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/v1/tourism/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          location: form.location.trim() || null,
          type: form.type.trim() || null,
          capacity: form.capacity ? parseInt(form.capacity, 10) : null,
          basePrice: form.basePrice ? parseFloat(form.basePrice) : null,
          currency: form.currency.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Napaka");
      setForm({ name: "", location: "", type: "", capacity: "", basePrice: "", currency: "EUR", seasonRates: { high: [], mid: [], low: [] }, autoApprovalEnabled: false, autoApprovalChannels: [], autoApprovalMaxAmount: "" });
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
      const res = await fetch(`/api/v1/tourism/properties/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          location: form.location.trim() || null,
          type: form.type.trim() || null,
          capacity: form.capacity ? parseInt(form.capacity, 10) : null,
          basePrice: form.basePrice ? parseFloat(form.basePrice) : null,
          currency: form.currency?.trim() || null,
          seasonRates: {
            high: (form.seasonRates.high || []).filter((r) => r.from && r.to && r.rate > 0),
            mid: (form.seasonRates.mid || []).filter((r) => r.from && r.to && r.rate > 0),
            low: (form.seasonRates.low || []).filter((r) => r.from && r.to && r.rate > 0),
          },
          reservationAutoApprovalRules: {
            enabled: form.autoApprovalEnabled,
            channels: form.autoApprovalChannels.length > 0 ? form.autoApprovalChannels : undefined,
            maxAmount: form.autoApprovalMaxAmount !== "" && !Number.isNaN(Number(form.autoApprovalMaxAmount))
              ? Number(form.autoApprovalMaxAmount) : undefined,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Napaka");
      setEditing(null);
      setForm({ name: "", location: "", type: "", capacity: "", basePrice: "", currency: "EUR", seasonRates: { high: [], mid: [], low: [] }, autoApprovalEnabled: false, autoApprovalChannels: [], autoApprovalMaxAmount: "" });
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
      const res = await fetch(`/api/v1/tourism/properties/${id}`, {
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
    const sr = p.seasonRates as { high?: SeasonRange[]; mid?: SeasonRange[]; low?: SeasonRange[] } | null | undefined;
    const rules = p.reservationAutoApprovalRules as { enabled?: boolean; channels?: string[]; maxAmount?: number } | null | undefined;
    setForm({
      name: p.name,
      location: p.location ?? "",
      type: p.type ?? "",
      capacity: p.capacity != null ? String(p.capacity) : "",
      basePrice: p.basePrice != null ? String(p.basePrice) : "",
      currency: p.currency ?? "EUR",
      seasonRates: {
        high: Array.isArray(sr?.high) ? sr.high : [],
        mid: Array.isArray(sr?.mid) ? sr.mid : [],
        low: Array.isArray(sr?.low) ? sr.low : [],
      },
      autoApprovalEnabled: rules?.enabled ?? false,
      autoApprovalChannels: Array.isArray(rules?.channels) ? rules.channels : [],
      autoApprovalMaxAmount: rules?.maxAmount != null ? rules.maxAmount : "",
    });
  };

  const cancelEdit = () => {
    setEditing(null);
    setForm({ name: "", location: "", type: "", capacity: "", basePrice: "", currency: "EUR", seasonRates: { high: [], mid: [], low: [] }, autoApprovalEnabled: false, autoApprovalChannels: [], autoApprovalMaxAmount: "" });
    setAmenities([]);
    setPolicies([]);
  };

  const addAmenity = async () => {
    const name = newAmenity.trim() || undefined;
    if (!editing || !name) return;
    try {
      const res = await fetch(`/api/v1/tourism/properties/${editing}/amenities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Napaka");
      setAmenities((prev) => [...prev, data]);
      setNewAmenity("");
      toast.success("Oprema dodana");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Napaka");
    }
  };

  const removeAmenity = async (amenityId: string) => {
    if (!editing) return;
    try {
      const res = await fetch(
        `/api/v1/tourism/properties/${editing}/amenities?amenityId=${amenityId}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Napaka");
      }
      setAmenities((prev) => prev.filter((a) => a.id !== amenityId));
      toast.success("Oprema odstranjena");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Napaka");
    }
  };

  const addPolicy = async () => {
    const { type, content } = newPolicy;
    if (!editing || !type.trim() || !content.trim()) return;
    try {
      const res = await fetch(`/api/v1/tourism/properties/${editing}/policies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ policyType: type, content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Napaka");
      setPolicies((prev) => [...prev, data]);
      setNewPolicy({ type: "", content: "" });
      toast.success("Pravilo dodano");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Napaka");
    }
  };

  const removePolicy = async (policyId: string) => {
    if (!editing) return;
    try {
      const res = await fetch(
        `/api/v1/tourism/properties/${editing}/policies?policyId=${policyId}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Napaka");
      }
      setPolicies((prev) => prev.filter((p) => p.id !== policyId));
      toast.success("Pravilo odstranjeno");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Napaka");
    }
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
          aria-label="Tip nastanitve"
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
        <input
          type="number"
          placeholder="Osnovna cena (€)"
          value={form.basePrice}
          onChange={(e) => setForm((f) => ({ ...f, basePrice: e.target.value }))}
          min={0}
          step={1}
          className="rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 px-3 py-2 text-neutral-900 dark:text-neutral-100 w-28"
        />
        <input
          type="text"
          placeholder="Valuta"
          value={form.currency}
          onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
          className="rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 px-3 py-2 text-neutral-900 dark:text-neutral-100 w-16"
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
                <div className="space-y-4">
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
                      aria-label="Tip nastanitve"
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
                    <input
                      type="number"
                      value={form.basePrice}
                      onChange={(e) => setForm((f) => ({ ...f, basePrice: e.target.value }))}
                      placeholder="Cena"
                      min={0}
                      step={1}
                      className="w-20 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 px-3 py-2 text-neutral-900 dark:text-neutral-100"
                    />
                    <input
                      type="text"
                      value={form.currency}
                      onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                      placeholder="EUR"
                      className="w-14 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 px-3 py-2 text-neutral-900 dark:text-neutral-100"
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                    <div>
                      <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Oprema</h4>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <input
                          type="text"
                          value={newAmenity}
                          onChange={(e) => setNewAmenity(e.target.value)}
                          placeholder="Dodaj (npr. WiFi)"
                          className="flex-1 min-w-[120px] rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 px-2 py-1.5 text-sm"
                        />
                        <button
                          type="button"
                          onClick={addAmenity}
                          className="px-2 py-1.5 rounded-lg bg-neutral-200 dark:bg-neutral-700 text-sm hover:bg-neutral-300 dark:hover:bg-neutral-600"
                        >
                          Dodaj
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {AMENITY_PRESETS.map((a) => (
                          <button
                            key={a}
                            type="button"
                            onClick={async () => {
                              if (!editing) return;
                              try {
                                const res = await fetch(`/api/v1/tourism/properties/${editing}/amenities`, {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ name: a }),
                                });
                                const data = await res.json();
                                if (!res.ok) throw new Error(data.error ?? "Napaka");
                                setAmenities((prev) => [...prev, data]);
                                toast.success("Oprema dodana");
                              } catch (err) {
                                toast.error(err instanceof Error ? err.message : "Napaka");
                              }
                            }}
                            className="text-xs px-2 py-1 rounded-sm bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                          >
                            +{a}
                          </button>
                        ))}
                      </div>
                      <ul className="mt-2 space-y-1">
                        {amenities.map((a) => (
                          <li key={a.id} className="flex items-center gap-2 text-sm">
                            <span>{a.name}</span>
                            <button
                              type="button"
                              onClick={() => removeAmenity(a.id)}
                              className="text-red-600 hover:underline text-xs"
                            >
                              Izbriši
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Pravila</h4>
                      <div className="space-y-2 mb-2">
                        <select
                          value={newPolicy.type}
                          onChange={(e) => setNewPolicy((p) => ({ ...p, type: e.target.value }))}
                          className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 px-2 py-1.5 text-sm"
                          aria-label="Tip pravila"
                        >
                          <option value="">Tip pravila</option>
                          {POLICY_PRESETS.map((pr) => (
                            <option key={pr.type} value={pr.type}>{pr.label}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={newPolicy.content}
                          onChange={(e) => setNewPolicy((p) => ({ ...p, content: e.target.value }))}
                          placeholder="Vsebina (npr. 15:00–18:00)"
                          className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 px-2 py-1.5 text-sm"
                        />
                        <button
                          type="button"
                          onClick={addPolicy}
                          disabled={!newPolicy.type.trim() || !newPolicy.content.trim()}
                          className="px-2 py-1.5 rounded-lg bg-neutral-200 dark:bg-neutral-700 text-sm hover:bg-neutral-300 dark:hover:bg-neutral-600 disabled:opacity-50"
                        >
                          Dodaj pravilo
                        </button>
                      </div>
                      <ul className="mt-2 space-y-1">
                        {policies.map((pol) => (
                          <li key={pol.id} className="text-sm">
                            <span className="font-medium">{pol.policyType}:</span> {pol.content.slice(0, 40)}{pol.content.length > 40 ? "…" : ""}
                            <button
                              type="button"
                              onClick={() => removePolicy(pol.id)}
                              className="ml-2 text-red-600 hover:underline text-xs"
                            >
                              Izbriši
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
                    <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Sezonske cene</h4>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">Cena za noč (€) za obdobje. Če datum prihoda spada v sezono, uporabi se ta cena namesto osnovne.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {(["high", "mid", "low"] as const).map((season) => (
                        <div key={season} className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
                          <div className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                            {season === "high" ? "Visoka sezona" : season === "mid" ? "Srednja sezona" : "Nizka sezona"}
                          </div>
                          {(form.seasonRates[season]?.length ? form.seasonRates[season] : [{ from: "", to: "", rate: 0 }]).map((r, i) => (
                            <div key={i} className="space-y-1 mb-2">
                              <div className="flex gap-1">
                                <input
                                  type="date"
                                  value={r.from}
                                  onChange={(e) => {
                                    const arr = [...(form.seasonRates[season] || [])];
                                    if (!arr[i]) arr[i] = { from: "", to: "", rate: 0 };
                                    arr[i] = { ...arr[i], from: e.target.value };
                                    setForm((f) => ({ ...f, seasonRates: { ...f.seasonRates, [season]: arr } }));
                                  }}
                                  className="flex-1 rounded-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 px-2 py-1 text-xs"
                                  placeholder="Od"
                                />
                                <input
                                  type="date"
                                  value={r.to}
                                  onChange={(e) => {
                                    const arr = [...(form.seasonRates[season] || [])];
                                    if (!arr[i]) arr[i] = { from: "", to: "", rate: 0 };
                                    arr[i] = { ...arr[i], to: e.target.value };
                                    setForm((f) => ({ ...f, seasonRates: { ...f.seasonRates, [season]: arr } }));
                                  }}
                                  className="flex-1 rounded-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 px-2 py-1 text-xs"
                                  placeholder="Do"
                                />
                              </div>
                              <div className="flex gap-1 items-center">
                                <input
                                  type="number"
                                  value={r.rate || ""}
                                  onChange={(e) => {
                                    const arr = [...(form.seasonRates[season] || [])];
                                    if (!arr[i]) arr[i] = { from: "", to: "", rate: 0 };
                                    arr[i] = { ...arr[i], rate: parseFloat(e.target.value) || 0 };
                                    setForm((f) => ({ ...f, seasonRates: { ...f.seasonRates, [season]: arr } }));
                                  }}
                                  placeholder="Cena €"
                                  min={0}
                                  step={1}
                                  className="w-20 rounded-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 px-2 py-1 text-xs"
                                />
                                {form.seasonRates[season]?.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => setForm((f) => ({
                                      ...f,
                                      seasonRates: {
                                        ...f.seasonRates,
                                        [season]: f.seasonRates[season].filter((_, j) => j !== i),
                                      },
                                    }))}
                                    className="text-red-600 text-xs"
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                          {(!form.seasonRates[season]?.length || form.seasonRates[season].every((x) => x.from || x.to || x.rate)) && (
                            <button
                              type="button"
                              onClick={() => setForm((f) => ({
                                ...f,
                                seasonRates: {
                                  ...f.seasonRates,
                                  [season]: [...(f.seasonRates[season] || []), { from: "", to: "", rate: 0 }],
                                },
                              }))}
                              className="text-xs text-blue-600 hover:underline"
                            >
                              + Dodaj obdobje
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
                    <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Samodejna odobritev rezervacij</h4>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">Ko PMS sync vnese rezervacijo s statusom »pending«, jo ob vklopljenih pravilih samodejno potrdi.</p>
                    <div className="space-y-3">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={form.autoApprovalEnabled}
                          onChange={(e) => setForm((f) => ({ ...f, autoApprovalEnabled: e.target.checked }))}
                          className="rounded border-neutral-300 dark:border-neutral-600"
                        />
                        <span className="text-sm">Vklopi samodejno odobritev</span>
                      </label>
                      {form.autoApprovalEnabled && (
                        <>
                          <div className="text-xs text-neutral-600 dark:text-neutral-400">Kanali (pustite prazno za vse):</div>
                          <div className="flex flex-wrap gap-2">
                            {AUTO_APPROVAL_CHANNELS.map((ch) => (
                              <label key={ch} className="flex items-center gap-1 text-sm">
                                <input
                                  type="checkbox"
                                  checked={form.autoApprovalChannels.includes(ch)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setForm((f) => ({ ...f, autoApprovalChannels: [...f.autoApprovalChannels, ch] }));
                                    } else {
                                      setForm((f) => ({ ...f, autoApprovalChannels: f.autoApprovalChannels.filter((c) => c !== ch) }));
                                    }
                                  }}
                                  className="rounded border-neutral-300 dark:border-neutral-600"
                                />
                                {ch}
                              </label>
                            ))}
                          </div>
                          <div>
                            <label className="text-xs text-neutral-600 dark:text-neutral-400">Max znesek (€, opcijsko – rezervacije nad znesek ostanejo pending):</label>
                            <input
                              type="number"
                              value={form.autoApprovalMaxAmount}
                              onChange={(e) => setForm((f) => ({ ...f, autoApprovalMaxAmount: e.target.value }))}
                              placeholder="npr. 500"
                              min={0}
                              step={1}
                              className="mt-1 w-24 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 px-2 py-1 text-sm"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-neutral-900 dark:text-neutral-100">
                      {p.name}
                    </div>
                    <div className="text-sm text-neutral-500 dark:text-neutral-400">
                      {[p.location, p.type, p.capacity ? p.capacity + " oseb" : null, p.basePrice != null ? (p.basePrice + " " + (p.currency || "EUR") + "/noč") : null, (p.reservationAutoApprovalRules as { enabled?: boolean })?.enabled ? "Auto-odobritev ✓" : null].filter(Boolean).join(" · ") || "—"}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(p)}
                      className="text-sm px-2 py-1 rounded-sm border hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    >
                      Uredi
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(p.id)}
                      aria-label={`Izbriši nastanitev ${p.name}`}
                      className="text-sm px-2 py-1 rounded-sm border border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
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
