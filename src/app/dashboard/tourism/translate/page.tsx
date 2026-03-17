"use client";

import { useState } from "react";
import { logger } from '@/infrastructure/observability/logger';
import { toast } from "sonner";
import { Skeleton } from "@/web/components/Skeleton";

const LANGS = [
  { code: "sl", label: "Slovenščina" },
  { code: "en", label: "English" },
  { code: "de", label: "Deutsch" },
  { code: "it", label: "Italiano" },
  { code: "hr", label: "Hrvatski" },
] as const;

export default function TourismTranslatePage() {
  const [content, setContent] = useState("");
  const [sourceLang, setSourceLang] = useState("sl");
  const [targetLangs, setTargetLangs] = useState<string[]>(["en"]);
  const [results, setResults] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const toggleTarget = (code: string) => {
    setTargetLangs((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleTranslate = async () => {
    if (!content.trim()) {
      toast.error("Vnesi vsebino za prevod.");
      return;
    }
    if (targetLangs.length === 0) {
      toast.error("Izberi vsaj en ciljni jezik.");
      return;
    }

    setLoading(true);
    setResults(null);
    try {
      const res = await fetch("/api/v1/tourism/batch-translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          sourceLang,
          targetLangs,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResults(data.translations ?? {});
    } catch (err) {
      logger.error("Translate failed:", err);
      toast.error(err instanceof Error ? err.message : "Napaka pri prevodu.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, lang: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(lang);
      toast.success("Kopirano");
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error("Kopiranje ni uspelo.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
        Multi-Language Batch Translator
      </h1>
      <p className="text-neutral-600 dark:text-neutral-400">
        Prevedi opis nastanitve ali vsebino v več jezikov hkrati (SL, EN, DE, IT, HR).
      </p>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Izvorna vsebina
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Vstavi besedilo za prevod (npr. opis apartmaja)..."
          className="w-full min-h-[160px] rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 dark:placeholder:text-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          disabled={loading}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Izvorni jezik
          </label>
          <select
            value={sourceLang}
            onChange={(e) => setSourceLang(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 px-3 py-2 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            disabled={loading}
            title="Izberite izvorni jezik"
          >
            {LANGS.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Ciljni jeziki
          </label>
          <div className="flex flex-wrap gap-2">
            {LANGS.filter((l) => l.code !== sourceLang).map((l) => (
              <label
                key={l.code}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800"
              >
                <input
                  type="checkbox"
                  checked={targetLangs.includes(l.code)}
                  onChange={() => toggleTarget(l.code)}
                  disabled={loading}
                  className="rounded-sm"
                />
                <span className="text-sm">{l.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={handleTranslate}
        disabled={loading || !content.trim() || targetLangs.length === 0}
        className="w-full sm:w-auto min-h-[44px] px-4 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
      >
        {loading ? "Prevedam..." : "Prevedi v izbrane jezike"}
      </button>

      {loading && targetLangs.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
          <Skeleton className="h-6 w-24" />
          {targetLangs.slice(0, 3).map((lang) => (
            <div
              key={lang}
              className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 space-y-2"
            >
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-20 w-full" />
            </div>
          ))}
        </div>
      )}
      {!loading && results && Object.keys(results).length > 0 && (
        <div className="space-y-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
          <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
            Prevodi
          </h2>
          {Object.entries(results).map(([lang, text]) => {
            const label = LANGS.find((l) => l.code === lang)?.label ?? lang;
            return (
              <div
                key={lang}
                className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    {label}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(text, lang)}
                    aria-label={copied === lang ? "Kopirano" : `Kopiraj prevod ${label}`}
                    className="text-sm px-2 py-1 rounded-sm bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-300 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  >
                    {copied === lang ? "Kopirano!" : "Kopiraj"}
                  </button>
                </div>
                <p className="text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap text-sm">
                  {text}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
