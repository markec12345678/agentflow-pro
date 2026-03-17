"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Skeleton } from "@/web/components/Skeleton";
import { SeoKeywordChart } from "@/web/components/tourism/SeoKeywordChart";
import { PropertySelector } from "@/web/components/PropertySelector";

type KeywordRow = {
  id?: string;
  keyword: string;
  position: number | null;
  volume: number | null;
  difficulty: number | null;
};

type OptimizeResult = {
  keywords: string[];
  metaTitle: string;
  metaDescription: string;
  headlineSuggestions: string[];
  internalLinkSuggestions: string[];
  geoHints?: { faqSuggestions: string[]; featuredSnippetHints: string[]; conversionPatterns: string[] };
  aeoHints?: { faqSuggestions: string[]; featuredSnippetHints: string[]; conversionPatterns: string[] };
};

type SortKey = "position-asc" | "position-desc" | "volume-desc" | "difficulty-asc";
type PriorityFilter = "all" | "high" | "medium" | "low";

function getPriority(pos: number | null): "high" | "medium" | "low" {
  if (pos == null || pos <= 0) return "low";
  if (pos <= 10) return "high";
  if (pos <= 20) return "medium";
  return "low";
}

export default function TourismSeoPage() {
  const [keywords, setKeywords] = useState<KeywordRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortKey>("position-asc");
  const [filterPriority, setFilterPriority] = useState<PriorityFilter>("all");
  const [optimizeModalOpen, setOptimizeModalOpen] = useState(false);
  const [optimizeKeyword, setOptimizeKeyword] = useState<string | null>(null);
  const [optimizeLoading, setOptimizeLoading] = useState(false);
  const [optimizeResult, setOptimizeResult] = useState<OptimizeResult | null>(null);
  const [optimizeError, setOptimizeError] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importCsv, setImportCsv] = useState("");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [activePropertyId, setActivePropertyId] = useState<string | null>(null);
  const [gscData, setGscData] = useState<{
    connected?: boolean;
    siteUrl?: string;
    lastSync?: string | null;
    summary?: { totalClicks: number; totalImpressions: number; avgCTR: number; avgPosition: number };
    setupRequired?: boolean;
  } | null>(null);
  const [gscLoading, setGscLoading] = useState(false);

  const refetchKeywords = () => {
    fetch("/api/v1/tourism/seo-metrics")
      .then((r) => r.json())
      .then((data: { metrics?: KeywordRow[] }) => {
        const list = data.metrics ?? [];
        setKeywords(
          list.map((m) => ({
            id: m.id,
            keyword: m.keyword,
            position: m.position ?? null,
            volume: m.volume ?? null,
            difficulty: m.difficulty ?? null,
          }))
        );
      })
      .catch(() => toast.error("Napaka pri osvežitvi"));
  };

  useEffect(() => {
    if (!activePropertyId) {
      setGscData(null);
      return;
    }
    setGscLoading(true);
    fetch(`/api/v1/tourism/search-console?propertyId=${activePropertyId}&days=30`)
      .then((r) => r.json())
      .then((data) => {
        if (data.setupRequired) {
          setGscData({ setupRequired: true });
        } else {
          setGscData(data);
        }
      })
      .catch(() => {
        setGscData(null);
        toast.error("Napaka pri nalaganju Search Console podatkov");
      })
      .finally(() => setGscLoading(false));
  }, [activePropertyId]);

  const handleImport = async () => {
    setImportLoading(true);
    try {
      let res: Response;
      if (importFile) {
        const fd = new FormData();
        fd.append("file", importFile);
        res = await fetch("/api/v1/tourism/seo-metrics/import", {
          method: "POST",
          body: fd,
        });
      } else if (importCsv.trim()) {
        res = await fetch("/api/v1/tourism/seo-metrics/import", {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: importCsv.trim(),
        });
      } else {
        toast.error("Naloži CSV datoteko ali prilepi vsebino.");
        setImportLoading(false);
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Import failed");
      refetchKeywords();
      toast.success(`Uvoženo: ${data.imported ?? 0} (${data.created ?? 0} novih, ${data.updated ?? 0} posodobljenih)`);
      setImportOpen(false);
      setImportCsv("");
      setImportFile(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Napaka pri uvozu");
    } finally {
      setImportLoading(false);
    }
  };

  useEffect(() => {
    const ctrl = new AbortController();
    fetch("/api/v1/tourism/seo-metrics", { signal: ctrl.signal })
      .then((r) => r.json())
      .then((data: { metrics?: KeywordRow[] }) => {
        const list = data.metrics ?? [];
        setKeywords(
          list.map((m) => ({
            id: m.id,
            keyword: m.keyword,
            position: m.position ?? null,
            volume: m.volume ?? null,
            difficulty: m.difficulty ?? null,
          }))
        );
      })
      .catch((e) => {
        if ((e as Error).name !== "AbortError") {
          setKeywords([]);
          toast.error("Napaka pri nalaganju SEO metrik.");
        }
      })
      .finally(() => setLoading(false));

    return () => ctrl.abort();
  }, []);

  const filteredAndSorted = useMemo(() => {
    let list = [...keywords];

    if (filterPriority !== "all") {
      list = list.filter((k) => getPriority(k.position) === filterPriority);
    }

    list.sort((a, b) => {
      switch (sortBy) {
        case "position-asc":
          return (a.position ?? 999) - (b.position ?? 999);
        case "position-desc":
          return (b.position ?? 0) - (a.position ?? 0);
        case "volume-desc":
          return (b.volume ?? 0) - (a.volume ?? 0);
        case "difficulty-asc":
          return (a.difficulty ?? 999) - (b.difficulty ?? 999);
        default:
          return 0;
      }
    });

    return list;
  }, [keywords, sortBy, filterPriority]);

  const chartData = useMemo(
    () =>
      filteredAndSorted.slice(0, 8).map((k) => ({
        name: k.keyword.length > 18 ? `${k.keyword.slice(0, 16)}…` : k.keyword,
        position: k.position ?? 0,
        volume: k.volume ?? 0,
      })),
    [filteredAndSorted]
  );

  const handleOptimize = (keyword: string) => {
    setOptimizeKeyword(keyword);
    setOptimizeModalOpen(true);
    setOptimizeLoading(true);
    setOptimizeError(null);
    setOptimizeResult(null);

    fetch("/api/optimize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic: keyword }),
    })
      .then((r) => r.json())
      .then((data: OptimizeResult & { error?: string }) => {
        if (data.error) throw new Error(data.error);
        setOptimizeResult({
          keywords: data.keywords ?? [],
          metaTitle: data.metaTitle ?? "",
          metaDescription: data.metaDescription ?? "",
          headlineSuggestions: data.headlineSuggestions ?? [],
          internalLinkSuggestions: data.internalLinkSuggestions ?? [],
          geoHints: data.geoHints,
          aeoHints: data.aeoHints,
        });
      })
      .catch((e) => setOptimizeError(e instanceof Error ? e.message : "Optimization failed"))
      .finally(() => setOptimizeLoading(false));
  };

  const closeOptimizeModal = () => {
    setOptimizeModalOpen(false);
    setOptimizeKeyword(null);
    setOptimizeResult(null);
    setOptimizeError(null);
  };

  const copyMetaToClipboard = () => {
    if (!optimizeResult) return;
    const text = `Title: ${optimizeResult.metaTitle}\nDescription: ${optimizeResult.metaDescription}`;
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Meta copied to clipboard");
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
            SEO Dashboard
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Tourism SEO keywords and optimization suggestions. Track rankings and optimize with AI.
          </p>
        </div>
        <PropertySelector value={activePropertyId} onChange={setActivePropertyId} />
      </div>

      {/* Google Search Console */}
      {activePropertyId && (
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4">
          <h2 className="text-lg font-medium text-neutral-800 dark:text-neutral-200 mb-3">
            Google Search Console
          </h2>
          {gscLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : gscData?.setupRequired ? (
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              GSC ni povezan.               Povežite v{" "}
              <a href="/settings" className="text-blue-600 dark:text-blue-400 hover:underline">
                nastavitvah
              </a>
              .
            </p>
          ) : gscData?.connected && gscData.summary ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-neutral-500 uppercase">Klikov</p>
                <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{gscData.summary.totalClicks}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 uppercase">Prikazov</p>
                <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{gscData.summary.totalImpressions}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 uppercase">CTR</p>
                <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{gscData.summary.avgCTR.toFixed(2)}%</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 uppercase">Pov. pozicija</p>
                <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{gscData.summary.avgPosition.toFixed(1)}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Ni podatkov.</p>
          )}
        </div>
      )}

      {/* Chart */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4">
        <h2 className="text-lg font-medium text-neutral-800 dark:text-neutral-200 mb-4">
          Volume by Keyword
        </h2>
        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : chartData.length > 0 ? (
          <SeoKeywordChart data={chartData} />
        ) : (
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">No data to display.</p>
        )}
      </div>

      {/* Import Keywords */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4">
        <button
          type="button"
          onClick={() => setImportOpen(!importOpen)}
          className="flex items-center justify-between w-full text-left"
        >
          <h2 className="text-lg font-medium text-neutral-800 dark:text-neutral-200">
            Uvozi ključne besede
          </h2>
          <span className="text-neutral-500">{importOpen ? "▲" : "▼"}</span>
        </button>
        {importOpen && (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              CSV format: keyword, position, volume, difficulty (header optional)
            </p>
            <div className="flex flex-wrap gap-3">
              <label className="cursor-pointer px-4 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-sm font-medium">
                <input
                  type="file"
                  accept=".csv,.txt"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    setImportFile(f ?? null);
                    if (f) setImportCsv("");
                  }}
                />
                {importFile ? importFile.name : "Izberi datoteko"}
              </label>
              <span className="text-neutral-500 text-sm self-center">ali</span>
              <textarea
                placeholder="Prilepi CSV (keyword, position, volume, difficulty)"
                value={importCsv}
                onChange={(e) => {
                  setImportCsv(e.target.value);
                  setImportFile(null);
                }}
                rows={2}
                className="flex-1 min-w-[200px] px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm resize-y"
              />
            </div>
            <button
              type="button"
              onClick={handleImport}
              disabled={importLoading || (!importFile && !importCsv.trim())}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {importLoading ? "Uvažam…" : "Uvozi"}
            </button>
          </div>
        )}
      </div>

      {/* Filter / Sort */}
      <div className="flex flex-wrap gap-3 items-center">
        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Filter:</span>
        {(["all", "high", "medium", "low"] as PriorityFilter[]).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setFilterPriority(p)}
            className={`px-4 py-2 rounded-lg font-medium text-sm min-h-[44px] transition-colors ${filterPriority === p
              ? "bg-blue-600 text-white"
              : "bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-600"
              }`}
          >
            {p === "all" ? "All" : p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 ml-2">Sort:</span>
        <button
          type="button"
          onClick={() => setSortBy("position-asc")}
          className={`px-3 py-2 rounded-lg text-sm min-h-[44px] ${sortBy === "position-asc"
            ? "bg-blue-600 text-white"
            : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
            }`}
        >
          Position ↑
        </button>
        <button
          type="button"
          onClick={() => setSortBy("position-desc")}
          className={`px-3 py-2 rounded-lg text-sm min-h-[44px] ${sortBy === "position-desc"
            ? "bg-blue-600 text-white"
            : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
            }`}
        >
          Position ↓
        </button>
        <button
          type="button"
          onClick={() => setSortBy("volume-desc")}
          className={`px-3 py-2 rounded-lg text-sm min-h-[44px] ${sortBy === "volume-desc"
            ? "bg-blue-600 text-white"
            : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
            }`}
        >
          Volume
        </button>
        <button
          type="button"
          onClick={() => setSortBy("difficulty-asc")}
          className={`px-3 py-2 rounded-lg text-sm min-h-[44px] ${sortBy === "difficulty-asc"
            ? "bg-blue-600 text-white"
            : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
            }`}
        >
          Difficulty
        </button>
      </div>

      {/* Keyword Table */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 overflow-hidden">
        <h2 className="text-lg font-medium text-neutral-800 dark:text-neutral-200 p-4 pb-2">
          Keyword Tracking
        </h2>
        {loading ? (
          <div className="p-4 space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : keywords.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-neutral-600 dark:text-neutral-400 mb-2">
              Ni SEO podatkov – uvozite ali povežite GSC
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                type="button"
                onClick={() => setImportOpen(true)}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
              >
                Uvozi ključne besede
              </button>
              <a
                href="/dashboard/tourism/seo/search-console-setup"
                className="px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                Poveži Google Search Console
              </a>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-700">
                  <th className="text-left py-3 px-4 font-medium text-neutral-700 dark:text-neutral-300">
                    Keyword
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-neutral-700 dark:text-neutral-300">
                    Position
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-neutral-700 dark:text-neutral-300">
                    Volume
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-neutral-700 dark:text-neutral-300">
                    Difficulty
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-neutral-700 dark:text-neutral-300">
                    Priority
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-neutral-700 dark:text-neutral-300">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSorted.map((row, i) => {
                  const prio = getPriority(row.position);
                  return (
                    <tr
                      key={row.id ?? i}
                      className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                    >
                      <td className="py-3 px-4 text-neutral-900 dark:text-neutral-100">
                        {row.keyword}
                      </td>
                      <td className="py-3 px-4 text-neutral-700 dark:text-neutral-300">
                        {row.position ?? "—"}
                      </td>
                      <td className="py-3 px-4 text-neutral-700 dark:text-neutral-300">
                        {row.volume ?? "—"}
                      </td>
                      <td className="py-3 px-4 text-neutral-700 dark:text-neutral-300">
                        {row.difficulty ?? "—"}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${prio === "high"
                            ? "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200"
                            : prio === "medium"
                              ? "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200"
                              : "bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400"
                            }`}
                        >
                          {prio}
                        </span>
                      </td>
                      <td className="py-3 px-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleOptimize(row.keyword)}
                          className="text-blue-600 dark:text-blue-400 hover:underline font-medium min-h-[44px] min-w-[44px]"
                        >
                          Optimiziraj
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {!loading && filteredAndSorted.length === 0 && (
          <p className="p-4 text-neutral-500 dark:text-neutral-400 text-sm">
            No keywords match the filter.
          </p>
        )}
      </div>

      {/* Optimize Modal */}
      {optimizeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-w-lg w-full max-h-[90vh] overflow-y-auto rounded-xl bg-white dark:bg-gray-800 p-6 shadow-xl">
            <h3 className="text-lg font-bold dark:text-white mb-4">
              SEO, GEO & AEO Optimization — {optimizeKeyword}
            </h3>
            {optimizeLoading && (
              <p className="text-gray-500 dark:text-gray-400">Analyzing...</p>
            )}
            {optimizeError && (
              <p className="mb-4 text-sm text-red-600 dark:text-red-400">{optimizeError}</p>
            )}
            {optimizeResult && !optimizeLoading && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="seo-meta-title" className="block text-sm font-medium dark:text-gray-300 mb-1">
                    Meta Title
                  </label>
                  <input
                    id="seo-meta-title"
                    type="text"
                    value={optimizeResult.metaTitle}
                    aria-label="Meta Title"
                    onChange={(e) =>
                      setOptimizeResult((r) =>
                        r ? { ...r, metaTitle: e.target.value } : r
                      )
                    }
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label htmlFor="seo-meta-desc" className="block text-sm font-medium dark:text-gray-300 mb-1">
                    Meta Description
                  </label>
                  <textarea
                    id="seo-meta-desc"
                    value={optimizeResult.metaDescription}
                    aria-label="Meta Description"
                    onChange={(e) =>
                      setOptimizeResult((r) =>
                        r ? { ...r, metaDescription: e.target.value } : r
                      )
                    }
                    rows={2}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                {optimizeResult.keywords.length > 0 && (
                  <div>
                    <p className="text-sm font-medium dark:text-gray-300 mb-1">Keywords</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {optimizeResult.keywords.join(", ")}
                    </p>
                  </div>
                )}
                {optimizeResult.headlineSuggestions.length > 0 && (
                  <div>
                    <p className="text-sm font-medium dark:text-gray-300 mb-1">
                      Headline Suggestions
                    </p>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc list-inside space-y-1">
                      {optimizeResult.headlineSuggestions.map((h, i) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {optimizeResult.internalLinkSuggestions.length > 0 && (
                  <div>
                    <p className="text-sm font-medium dark:text-gray-300 mb-1">
                      Internal Link Ideas
                    </p>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc list-inside space-y-1 break-all">
                      {optimizeResult.internalLinkSuggestions.map((u, i) => (
                        <li key={i}>
                          <a
                            href={u}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {u}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {optimizeResult.geoHints && (
                  <div className="rounded-lg border border-purple-200 dark:border-purple-800 p-3">
                    <p className="text-sm font-medium dark:text-gray-300 mb-2">
                      GEO (Generative Engine Optimization)
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      FAQ ideas for AI search:
                    </p>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc list-inside space-y-0.5">
                      {optimizeResult.geoHints.faqSuggestions.slice(0, 3).map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {optimizeResult.aeoHints && (
                  <div className="rounded-lg border border-indigo-200 dark:border-indigo-800 p-3">
                    <p className="text-sm font-medium dark:text-gray-300 mb-2">
                      AEO (Answer Engine Optimization)
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Featured snippet tips:
                    </p>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc list-inside space-y-0.5">
                      {optimizeResult.aeoHints.featuredSnippetHints.slice(0, 2).map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeOptimizeModal}
                    className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 py-2 font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={copyMetaToClipboard}
                    className="flex-1 rounded-lg bg-blue-600 py-2 font-medium text-white hover:bg-blue-700"
                  >
                    Copy Meta
                  </button>
                </div>
              </div>
            )}
            {!optimizeResult && !optimizeLoading && (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeOptimizeModal}
                  className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 py-2 font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => optimizeKeyword && handleOptimize(optimizeKeyword)}
                  disabled={optimizeLoading}
                  className="flex-1 rounded-lg bg-blue-600 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
