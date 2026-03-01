"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { PROMPTS } from "@/data/prompts";

const TOURISM_PROMPTS = PROMPTS.filter((p) => p.category === "tourism");
const LANGUAGES = [
  { id: "sl", label: "SL" },
  { id: "en", label: "EN" },
  { id: "de", label: "DE" },
  { id: "it", label: "IT" },
  { id: "hr", label: "HR" },
];

interface Property {
  id: string;
  name: string;
  location?: string | null;
  type?: string | null;
}

export default function BulkGeneratePage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<Set<string>>(new Set());
  const [promptId, setPromptId] = useState(TOURISM_PROMPTS[0]?.id ?? "");
  const [languages, setLanguages] = useState<string[]>(["sl"]);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number; results?: unknown[]; errors?: unknown[] } | null>(null);

  useEffect(() => {
    fetch("/api/tourism/properties")
      .then((r) => r.json())
      .then((data) => setProperties(data.properties ?? []))
      .catch(() => setProperties([]))
      .finally(() => setLoading(false));
  }, []);

  const toggleProperty = (id: string) => {
    setSelectedPropertyIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllProperties = () => {
    if (selectedPropertyIds.size === properties.length) {
      setSelectedPropertyIds(new Set());
    } else {
      setSelectedPropertyIds(new Set(properties.map((p) => p.id)));
    }
  };

  const toggleLanguage = (id: string) => {
    setLanguages((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]
    );
  };

  const handleGenerate = async () => {
    const ids = Array.from(selectedPropertyIds);
    if (ids.length === 0) {
      toast.error("Izberite vsaj eno nastanitev");
      return;
    }
    if (!promptId) {
      toast.error("Izberite šablo");
      return;
    }
    setGenerating(true);
    setResult(null);
    try {
      const res = await fetch("/api/tourism/bulk-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyIds: ids,
          promptId,
          languages: languages.length ? languages : ["sl"],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Napaka");
      setResult(data);
      toast.success(`Uspešno: ${data.success}, spodletelo: ${data.failed}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bulk generiranje ni uspelo");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">📦</div>
          <p className="text-gray-500">Nalagam nastanitve...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link
            href="/dashboard/tourism"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block"
          >
            ← Nazaj na Tourism
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Bulk generiranje vsebine
          </h1>
          <p className="text-gray-500 mt-1">
            Generirajte vsebino za več nastanitev naenkrat
          </p>
        </div>

        <div className="space-y-6">
          {/* Nastanitve */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
              Izberite nastanitve
            </h2>
            {properties.length === 0 ? (
              <p className="text-gray-500 text-sm">
                Nimate nastanitev.{" "}
                <Link href="/dashboard/tourism/properties" className="text-blue-600 hover:underline">
                  Dodajte nastanitev
                </Link>
              </p>
            ) : (
              <>
                <label className="flex items-center gap-2 mb-3 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={selectedPropertyIds.size === properties.length}
                    onChange={toggleAllProperties}
                    className="rounded-sm"
                  />
                  Izberi vse
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {properties.map((p) => (
                    <label
                      key={p.id}
                      className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPropertyIds.has(p.id)}
                        onChange={() => toggleProperty(p.id)}
                        className="rounded-sm"
                      />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{p.name}</p>
                        {p.location && (
                          <p className="text-xs text-gray-500">{p.location}</p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Šablona */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
            <label htmlFor="bulk-prompt" className="font-semibold text-gray-900 dark:text-white mb-4 block">
              Šablona vsebine
            </label>
            <select
              id="bulk-prompt"
              value={promptId}
              onChange={(e) => setPromptId(e.target.value)}
              aria-label="Šablona vsebine"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {TOURISM_PROMPTS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Jeziki */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
              Jeziki
            </h2>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => toggleLanguage(l.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border-2 ${languages.includes(l.id)
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                    : "border-gray-200 dark:border-gray-600 text-gray-600 hover:border-blue-300"
                    }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Generiraj */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating || properties.length === 0 || selectedPropertyIds.size === 0}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-lg transition-all"
          >
            {generating
              ? "Generiranje…"
              : `Generiraj (${selectedPropertyIds.size} nastanitev × ${languages.length} jezik)`}
          </button>

          {/* Rezultat */}
          {result && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
                Rezultat
              </h2>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Uspešno: {result.success}, Spodletelo: {result.failed}
              </p>
              {result.results && result.results.length > 0 && (
                <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
                  {(result.results as { propertyName?: string; language?: string; contentId?: string }[]).slice(0, 10).map((r, i) => (
                    <div key={i} className="text-xs text-gray-500">
                      {r.propertyName} – {r.language} → {r.contentId ? "✓" : "–"}
                    </div>
                  ))}
                  {(result.results?.length ?? 0) > 10 && (
                    <p className="text-xs text-gray-400">+ {(result.results?.length ?? 0) - 10} več</p>
                  )}
                </div>
              )}
              <Link
                href="/content"
                className="mt-4 inline-block text-sm text-blue-600 hover:underline"
              >
                Odpri Moja vsebina →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
