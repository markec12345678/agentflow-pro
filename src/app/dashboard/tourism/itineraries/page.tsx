"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Skeleton } from "@/web/components/Skeleton";

type Activity = {
  time?: string;
  title: string;
  description?: string;
  location?: string;
};

type DayEntry = {
  day: number;
  date?: string;
  activities: Activity[];
};

type ItineraryItem = {
  id: string;
  title: string;
  days: unknown;
  updatedAt: string;
};

const DEFAULT_DAYS: DayEntry[] = Array.from({ length: 3 }, (_, i) => ({
  day: i + 1,
  activities: [{ title: "", description: "", location: "" }],
}));

export default function TourismItinerariesPage() {
  const [list, setList] = useState<ItineraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formDays, setFormDays] = useState<DayEntry[]>(DEFAULT_DAYS);
  const [formSaving, setFormSaving] = useState(false);
  const [dayCount, setDayCount] = useState(3);

  useEffect(() => {
    fetch("/api/tourism/itineraries")
      .then((r) => r.json())
      .then((data: { itineraries?: ItineraryItem[] }) => {
        setList(data.itineraries ?? []);
      })
      .catch(() => toast.error("Napaka pri nalaganju itinerarijev"))
      .finally(() => setLoading(false));
  }, []);

  const loadForEdit = (id: string) => {
    setEditingId(id);
    setCreating(false);
    fetch(`/api/tourism/itineraries/${id}`)
      .then((r) => r.json())
      .then((data: { itinerary?: ItineraryItem }) => {
        const it = data.itinerary;
        if (it) {
          setFormTitle(it.title);
          const days = Array.isArray(it.days) ? (it.days as DayEntry[]) : DEFAULT_DAYS;
          setFormDays(days);
          setDayCount(days.length);
        }
      })
      .catch(() => toast.error("Napaka pri nalaganju"));
  };

  const startCreate = () => {
    setCreating(true);
    setEditingId(null);
    setFormTitle("");
    setFormDays(DEFAULT_DAYS);
    setDayCount(3);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setCreating(false);
  };

  const addDay = () => {
    const n = Math.min(dayCount + 1, 14);
    setDayCount(n);
    setFormDays((prev) => {
      const next = [...prev];
      while (next.length < n) {
        next.push({ day: next.length + 1, activities: [{ title: "", description: "", location: "" }] });
      }
      return next.slice(0, n);
    });
  };

  const removeDay = () => {
    const n = Math.max(dayCount - 1, 1);
    setDayCount(n);
    setFormDays((prev) => prev.slice(0, n));
  };

  const updateActivity = (dayIdx: number, actIdx: number, field: keyof Activity, value: string) => {
    setFormDays((prev) => {
      const next = prev.map((d, i) => {
        if (i !== dayIdx) return d;
        const acts = [...d.activities];
        acts[actIdx] = { ...acts[actIdx], [field]: value };
        return { ...d, activities: acts };
      });
      return next;
    });
  };

  const addActivity = (dayIdx: number) => {
    setFormDays((prev) =>
      prev.map((d, i) =>
        i === dayIdx ? { ...d, activities: [...d.activities, { title: "", description: "", location: "" }] } : d
      )
    );
  };

  const removeActivity = (dayIdx: number, actIdx: number) => {
    setFormDays((prev) =>
      prev.map((d, i) =>
        i === dayIdx
          ? {
              ...d,
              activities: d.activities.filter((_, idx) => idx !== actIdx).length
                ? d.activities.filter((_, idx) => idx !== actIdx)
                : [{ title: "", description: "", location: "" }],
            }
          : d
      )
    );
  };

  const save = async () => {
    if (!formTitle.trim()) {
      toast.error("Vnesi naslov itinerarija");
      return;
    }
    setFormSaving(true);
    try {
      const daysData = formDays.slice(0, dayCount).map((d, i) => ({
        day: i + 1,
        date: d.date ?? undefined,
        activities: d.activities.filter((a) => a.title.trim()).length ? d.activities : [{ title: "—", description: "", location: "" }],
      }));

      if (editingId) {
        const res = await fetch(`/api/tourism/itineraries/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: formTitle.trim(), days: daysData }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setList((prev) => prev.map((it) => (it.id === editingId ? { ...it, ...data.itinerary } : it)));
        toast.success("Itinerarij posodobljen");
      } else if (creating) {
        const res = await fetch("/api/tourism/itineraries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: formTitle.trim(), days: daysData }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setList((prev) => [data.itinerary, ...prev]);
        toast.success("Itinerarij ustvarjen");
      }
      cancelEdit();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Napaka pri shranjevanju");
    } finally {
      setFormSaving(false);
    }
  };

  const deleteItinerary = async (id: string) => {
    if (!confirm("Izbrišem ta itinerarij?")) return;
    try {
      const res = await fetch(`/api/tourism/itineraries/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
      setList((prev) => prev.filter((it) => it.id !== id));
      if (editingId === id) cancelEdit();
      toast.success("Itinerarij izbrisan");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Napaka pri brisanju");
    }
  };

  const exportMarkdown = (it: ItineraryItem) => {
    const days = Array.isArray(it.days) ? (it.days as DayEntry[]) : [];
    let md = `# ${it.title}\n\n`;
    for (const d of days) {
      md += `## Dan ${d.day}${d.date ? ` (${d.date})` : ""}\n\n`;
      for (const a of d.activities) {
        if (a.time) md += `- **${a.time}** – ${a.title}`;
        else md += `- ${a.title}`;
        if (a.location) md += ` @ ${a.location}`;
        md += "\n";
        if (a.description) md += `  ${a.description}\n`;
      }
      md += "\n";
    }
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${it.title.replace(/\s+/g, "-")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Itinerarji</h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Ustvarite in urejajte itinerarije za goste. Dan 1–14, aktivnosti z urami in lokacijami.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <div className="space-y-4">
          {!creating && !editingId && (
            <button
              type="button"
              onClick={startCreate}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
            >
              + Nov itinerarij
            </button>
          )}

          {(creating || editingId) && (
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 space-y-4">
              <h2 className="text-lg font-medium">{editingId ? "Uredi itinerarij" : "Nov itinerarij"}</h2>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Naslov itinerarija"
                className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800"
              />
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Št. dni (1–14):</span>
                <button
                  type="button"
                  onClick={removeDay}
                  disabled={dayCount <= 1}
                  className="px-2 py-1 rounded bg-neutral-200 dark:bg-neutral-700 disabled:opacity-50"
                >
                  −
                </button>
                <span className="font-mono">{dayCount}</span>
                <button
                  type="button"
                  onClick={addDay}
                  disabled={dayCount >= 14}
                  className="px-2 py-1 rounded bg-neutral-200 dark:bg-neutral-700 disabled:opacity-50"
                >
                  +
                </button>
              </div>
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {formDays.slice(0, dayCount).map((day, dayIdx) => (
                  <div
                    key={dayIdx}
                    className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-3 space-y-2"
                  >
                    <h3 className="font-medium">Dan {dayIdx + 1}</h3>
                    {day.activities.map((act, actIdx) => (
                      <div key={actIdx} className="grid gap-2 grid-cols-1 sm:grid-cols-4">
                        <input
                          type="text"
                          placeholder="Čas (npr. 09:00)"
                          value={act.time ?? ""}
                          onChange={(e) => updateActivity(dayIdx, actIdx, "time", e.target.value)}
                          className="px-3 py-2 rounded border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Naziv aktivnosti"
                          value={act.title}
                          onChange={(e) => updateActivity(dayIdx, actIdx, "title", e.target.value)}
                          className="sm:col-span-2 px-3 py-2 rounded border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm"
                        />
                        <div className="flex gap-1">
                          <input
                            type="text"
                            placeholder="Lokacija"
                            value={act.location ?? ""}
                            onChange={(e) => updateActivity(dayIdx, actIdx, "location", e.target.value)}
                            className="flex-1 px-3 py-2 rounded border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => removeActivity(dayIdx, actIdx)}
                            className="px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                          >
                            ×
                          </button>
                        </div>
                        <textarea
                          placeholder="Opis"
                          value={act.description ?? ""}
                          onChange={(e) => updateActivity(dayIdx, actIdx, "description", e.target.value)}
                          rows={1}
                          className="sm:col-span-4 px-3 py-2 rounded border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm"
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addActivity(dayIdx)}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      + Aktivnost
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={save}
                  disabled={formSaving}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {formSaving ? "Shranjujem…" : "Shrani"}
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 text-sm"
                >
                  Prekliči
                </button>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
                  <th className="text-left py-3 px-4 font-medium">Naslov</th>
                  <th className="text-left py-3 px-4 font-medium">Posodobljeno</th>
                  <th className="text-right py-3 px-4 font-medium">Akcije</th>
                </tr>
              </thead>
              <tbody>
                {list.map((it) => (
                  <tr
                    key={it.id}
                    className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                  >
                    <td className="py-3 px-4 text-neutral-900 dark:text-neutral-100">{it.title}</td>
                    <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400">
                      {new Date(it.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => exportMarkdown(it)}
                        className="text-blue-600 dark:text-blue-400 hover:underline mr-3"
                      >
                        Export MD
                      </button>
                      <button
                        type="button"
                        onClick={() => loadForEdit(it.id)}
                        className="text-blue-600 dark:text-blue-400 hover:underline mr-3"
                      >
                        Uredi
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteItinerary(it.id)}
                        className="text-red-600 dark:text-red-400 hover:underline"
                      >
                        Izbriši
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {list.length === 0 && (
              <p className="p-4 text-neutral-500 dark:text-neutral-400 text-sm">
                Še nimate itinerarijev. Kliknite „Nov itinerarij“ za začetek.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
