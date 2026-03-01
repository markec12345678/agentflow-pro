"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Skeleton, SkeletonText } from "@/web/components/Skeleton";
import { generateFaqSchema } from "@/lib/tourism/faq-schema";
import { DEFAULT_FAQS } from "@/data/tourism-faqs";

const TEMPLATES = [
  { id: "tourism-basic", name: "Standard", desc: "Klasična nastanitev – hero, o nas, nastanitve, posebnosti, CTA" },
  { id: "luxury-retreat", name: "Luksuz", desc: "Luksuzna predloga z zgodbo in galerijo" },
  { id: "family-friendly", name: "Družinski", desc: "Družinska predloga z aktivnostmi in FAQ" },
] as const;

const LANGS = [
  { code: "sl", label: "Slovenščina" },
  { code: "en", label: "English" },
  { code: "de", label: "Deutsch" },
  { code: "it", label: "Italiano" },
  { code: "hr", label: "Hrvatski" },
] as const;

type LandingSection = { heading?: string; body?: string; items?: string[] };
type LandingContent = Record<string, LandingSection>;
type PageData = { sections: LandingContent; seoTitle: string; seoDescription: string };
type PagesData = Record<string, PageData>;

function sectionsToMarkdown(pages: PagesData): string {
  const lines: string[] = [];
  for (const [lang, data] of Object.entries(pages)) {
    const label = LANGS.find((l) => l.code === lang)?.label ?? lang;
    lines.push(`## ${label}\n`);
    lines.push(`### ${data.seoTitle}\n`);
    lines.push(`${data.seoDescription}\n`);
    for (const [, section] of Object.entries(data.sections)) {
      if (section.heading) lines.push(`### ${section.heading}\n`);
      if (section.body) lines.push(`${section.body}\n`);
      if (section.items?.length)
        section.items.forEach((i) => lines.push(`- ${i}\n`));
      lines.push("\n");
    }
    lines.push("---\n\n");
  }
  return lines.join("");
}

function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sectionsToHtml(pages: PagesData, title: string, baseUrl?: string): string {
  const firstLang = Object.keys(pages)[0] ?? "sl";
  const first = pages[firstLang];
  if (!first) return "";

  const sectionsHtml = Object.entries(first.sections)
    .map(([, s]) => {
      let h = "";
      if (s.heading) h += `<h2>${escHtml(s.heading)}</h2>`;
      if (s.body) h += `<p>${escHtml(s.body)}</p>`;
      if (s.items?.length)
        h += `<ul>${s.items.map((i) => `<li>${escHtml(i)}</li>`).join("")}</ul>`;
      return h;
    })
    .join("\n");

  const faqSchema = generateFaqSchema(DEFAULT_FAQS);
  const faqJson = JSON.stringify(faqSchema).replace(/<\/script>/gi, "<\\/script>");
  const faqSchemaScript = `<script type="application/ld+json">${faqJson}</script>`;

  const langCodes = Object.keys(pages);
  const base = baseUrl || process.env.NEXT_PUBLIC_APP_URL || "https://yoursite.com";
  const hreflangLinks =
    langCodes.length > 1
      ? langCodes
        .map(
          (lang) =>
            `<link rel="alternate" hreflang="${lang}" href="${base}/${lang === firstLang ? "" : lang + "/"}" />`
        )
        .join("\n  ") +
      `\n  <link rel="alternate" hreflang="x-default" href="${base}/" />`
      : "";

  return `<!DOCTYPE html>
<html lang="${escHtml(firstLang)}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escHtml(first.seoTitle ?? title)}</title>
  <meta name="description" content="${escHtml(first.seoDescription ?? "")}" />
  ${hreflangLinks ? hreflangLinks + "\n  " : ""}${faqSchemaScript}
</head>
<body>
  <header>
    <h1>${escHtml(title)}</h1>
  </header>
  <main>
${sectionsHtml}
  </main>
</body>
</html>`;
}

function downloadBlob(blob: Blob, filename: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function TourismLandingPage() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [template, setTemplate] = useState<string>("tourism-basic");
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    type: "apartma",
    capacity: "4",
    features: "",
    priceFrom: "65",
    baseUrl: process.env.NEXT_PUBLIC_APP_URL || "https://yoursite.com",
  });
  const [languages, setLanguages] = useState<string[]>(["sl", "en"]);
  const [pages, setPages] = useState<PagesData | null>(null);
  const [loading, setLoading] = useState(false);
  const [savedPages, setSavedPages] = useState<{ id: string; title: string }[]>([]);
  const [autoSave, setAutoSave] = useState(false);
  const [coreLoading, setCoreLoading] = useState(false);
  const [coreResult, setCoreResult] = useState<{
    landing?: Record<string, string>;
    seo?: Record<string, { meta_title?: string; meta_description?: string; keywords?: string[] }>;
  } | null>(null);

  const loadSavedPages = () => {
    fetch("/api/tourism/landing-pages")
      .then((r) => r.json())
      .then((data) => setSavedPages((data.pages ?? []).map((p: { id: string; title: string }) => ({ id: p.id, title: p.title }))))
      .catch(() => setSavedPages([]));
  };

  const handleLoad = async (id: string) => {
    try {
      const res = await fetch(`/api/tourism/landing-pages/${id}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const page = data.page;
      if (page?.content && typeof page.content === "object") {
        setPages(page.content as PagesData);
        setFormData((prev) => ({ ...prev, name: page.title ?? prev.name }));
        setTemplate(page.template ?? "tourism-basic");
        setLanguages(Array.isArray(page.languages) ? page.languages : ["sl", "en"]);
        setStep(3);
        toast.success("Stran naložena");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nalaganje ni uspelo.");
    }
  };

  const toggleLang = (code: string) => {
    setLanguages((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  useEffect(() => {
    const loadId = searchParams.get("load");
    if (loadId) handleLoad(loadId);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- run once on mount when load param present

  const handleGenerateWithCore = async () => {
    if (!formData.name.trim()) {
      toast.error("Ime nastanitve je obvezno.");
      return;
    }
    const features = formData.features
      .split(/[,\n]/)
      .map((f) => f.trim())
      .filter(Boolean);
    if (features.length === 0) features.push(formData.type || "apartma");

    setCoreLoading(true);
    setCoreResult(null);
    try {
      const res = await fetch("/api/tourism/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotel_data: {
            hotel_name: formData.name.trim(),
            location: formData.location.trim() || "Slovenija",
            features,
            current_offer: formData.priceFrom ? `Od ${formData.priceFrom}€/noč` : undefined,
          },
          agents: ["landing", "seo"],
          languages: ["SL", "EN", "DE", "IT"],
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setCoreResult({ landing: data.landing, seo: data.seo });
      toast.success("Hotel Core: HTML generiran");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Napaka pri generiranju z Core");
    } finally {
      setCoreLoading(false);
    }
  };

  const handleCoreSave = async () => {
    if (!coreResult?.landing || !coreResult?.seo) return;
    try {
      const res = await fetch("/api/tourism/generate/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          landing: coreResult.landing,
          seo: coreResult.seo,
          title: formData.name.trim() || "Hotel Landing",
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success("Shranjeno v bazo");
      loadSavedPages();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Shranjevanje ni uspelo.");
    }
  };

  const downloadCoreHtml = (lang: string) => {
    const html = coreResult?.landing?.[lang];
    if (!html) return;
    const blob = new Blob([html], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `landing_${lang}.html`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleGenerate = async () => {
    if (!formData.name.trim()) {
      toast.error("Ime nastanitve je obvezno.");
      return;
    }
    if (languages.length === 0) {
      toast.error("Izberi vsaj en jezik.");
      return;
    }

    setLoading(true);
    setPages(null);
    try {
      const res = await fetch("/api/tourism/generate-landing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template,
          formData,
          languages,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const generatedPages = data.pages ?? {};
      setPages(generatedPages);
      setStep(3);
      toast.success("Landing stran generirana");
      if (autoSave) {
        await handleSave(generatedPages);
        loadSavedPages();
      }
    } catch (err) {
      console.error("Landing generation failed:", err);
      toast.error(err instanceof Error ? err.message : "Napaka pri generiranju.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportJson = () => {
    if (!pages) return;
    const blob = new Blob([JSON.stringify(pages, null, 2)], {
      type: "application/json",
    });
    downloadBlob(blob, `landing-${formData.name.replace(/\s+/g, "-")}.json`);
    toast.success("Export JSON – shranjeno");
  };

  const handleExportMarkdown = () => {
    if (!pages) return;
    const md = sectionsToMarkdown(pages);
    const blob = new Blob([md], { type: "text/markdown" });
    downloadBlob(blob, `landing-${formData.name.replace(/\s+/g, "-")}.md`);
    toast.success("Export Markdown – shranjeno");
  };

  const handleExportHtml = () => {
    if (!pages) return;
    const html = sectionsToHtml(pages, formData.name, formData.baseUrl?.trim() || undefined);
    const blob = new Blob([html], { type: "text/html" });
    downloadBlob(blob, `landing-${formData.name.replace(/\s+/g, "-")}.html`);
    toast.success("Export HTML – shranjeno");
  };

  const handleSave = async (pagesToSave?: typeof pages) => {
    if (!pagesToSave && !pages || !formData.name.trim()) return;
    const pagesData = pagesToSave ?? pages;
    const firstLang = Object.keys(pagesData!)[0];
    const first = pagesData![firstLang];
    if (!first) return;

    try {
      const res = await fetch("/api/tourism/landing-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.name,
          content: pagesData,
          template,
          languages,
          seoTitle: first.seoTitle,
          seoDescription: first.seoDescription,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success("Landing stran shranjena");
      loadSavedPages();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Shranjevanje ni uspelo.");
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 overflow-x-hidden">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Landing Page Generator
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Ustvari landing stran nastanitve v več jezikih (3 koraki)
        </p>
      </div>

      {savedPages.length === 0 && (
        <button
          type="button"
          onClick={loadSavedPages}
          className="mb-4 text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          Naloži shranjene strani
        </button>
      )}
      {savedPages.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Shranjene:</span>
          {savedPages.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleLoad(p.id)}
              className="min-h-[36px] px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
            >
              {p.title}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              if (s < step || (s === 2 && step >= 2) || (s === 3 && pages))
                setStep(s as 1 | 2 | 3);
            }}
            className={`min-h-[44px] px-4 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 ${step === s
              ? "bg-blue-600 text-white"
              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
          >
            Korak {s}
          </button>
        ))}
      </div>

      {step === 1 && (
        <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Izberi predlogo
            </h2>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {TEMPLATES.map((t) => (
                <label
                  key={t.id}
                  className={`flex flex-col gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all min-h-[120px] ${template === t.id
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                >
                  <input
                    type="radio"
                    name="template"
                    value={t.id}
                    checked={template === t.id}
                    onChange={() => setTemplate(t.id)}
                    className="sr-only"
                  />
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {t.name}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {t.desc}
                  </span>
                </label>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="mt-4 min-h-[44px] px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Naprej →
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Podatki nastanitve
            </h2>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              ← Nazaj
            </button>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Ime nastanitve *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  placeholder="npr. Apartmaji Bela Krajina"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Lokacija
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  placeholder="npr. Črnomelj"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Tip
                </label>
                <input
                  type="text"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  placeholder="apartma"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Kapaciteta
                </label>
                <input
                  type="text"
                  value={formData.capacity}
                  onChange={(e) =>
                    setFormData({ ...formData, capacity: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  placeholder="4"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Cena od (€/noč)
                </label>
                <input
                  type="text"
                  value={formData.priceFrom}
                  onChange={(e) =>
                    setFormData({ ...formData, priceFrom: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  placeholder="65"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Posebnosti
              </label>
              <textarea
                value={formData.features}
                onChange={(e) =>
                  setFormData({ ...formData, features: e.target.value })
                }
                rows={2}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                placeholder="WiFi, parkirišče, oprema za kuhanje"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Jeziki
              </label>
              <div className="flex flex-wrap gap-2">
                {LANGS.map((l) => (
                  <label
                    key={l.code}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <input
                      type="checkbox"
                      checked={languages.includes(l.code)}
                      onChange={() => toggleLang(l.code)}
                      className="rounded-sm"
                    />
                    <span className="text-sm">{l.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoSave}
                onChange={(e) => setAutoSave(e.target.checked)}
                className="rounded-sm"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Shrani avtomatsko po generiranju
              </span>
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading}
                className="min-h-[44px] px-4 py-3 rounded-lg bg-linear-to-r from-blue-600 to-cyan-500 text-white font-medium hover:opacity-90 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                {loading ? "Generiram..." : "Generiraj Zdaj"}
              </button>
              <button
                type="button"
                onClick={handleGenerateWithCore}
                disabled={coreLoading}
                className="min-h-[44px] px-4 py-3 rounded-lg border-2 border-amber-500 text-amber-600 dark:text-amber-400 font-medium hover:bg-amber-50 dark:hover:bg-amber-900/20 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                {coreLoading ? "Core..." : "Generiraj z Core"}
              </button>
            </div>
            {coreResult && (
              <div className="mt-4 p-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10 space-y-3">
                <h3 className="font-semibold text-gray-900 dark:text-white">Rezultat Hotel Core</h3>
                <div className="flex flex-wrap gap-2">
                  {coreResult.landing &&
                    Object.keys(coreResult.landing).map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => downloadCoreHtml(lang)}
                        className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Prenesi {lang}.html
                      </button>
                    ))}
                  <button
                    type="button"
                    onClick={handleCoreSave}
                    className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700"
                  >
                    Shrani v bazo
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {loading && (
        <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6">
          <Skeleton className="h-6 w-48 mb-4" />
          <SkeletonText lines={6} className="mb-4" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-28" />
          </div>
        </div>
      )}

      {step === 3 && pages && !loading && (
        <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Predogled
              </h2>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="min-h-[44px] px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  ← Uredi
                </button>
                <button
                  type="button"
                  onClick={handleExportJson}
                  aria-label="Export JSON"
                  className="min-h-[44px] px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  Export JSON
                </button>
                <button
                  type="button"
                  onClick={handleExportMarkdown}
                  aria-label="Export Markdown"
                  className="min-h-[44px] px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  Export Markdown
                </button>
                <button
                  type="button"
                  onClick={handleExportHtml}
                  aria-label="Export HTML"
                  className="min-h-[44px] px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  Export HTML
                </button>
                <button
                  type="button"
                  onClick={() => handleSave()}
                  aria-label="Shrani v bazo"
                  className="min-h-[44px] px-3 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  Shrani
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="baseUrl" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Base URL za hreflang (npr. https://moja-nastanitev.si)
              </label>
              <input
                id="baseUrl"
                type="url"
                value={formData.baseUrl}
                onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                placeholder="https://yoursite.com"
                className="w-full max-w-md px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
              />
            </div>
          </div>
          <div className="p-4 max-h-[60vh] overflow-y-auto space-y-6">
            {Object.entries(pages).map(([lang, data]) => {
              const label = LANGS.find((l) => l.code === lang)?.label ?? lang;
              return (
                <div
                  key={lang}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 p-4"
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {label}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {data.seoTitle}
                  </p>
                  <div className="space-y-4">
                    {Object.entries(data.sections).map(([key, section]) => (
                      <div key={key}>
                        {section.heading && (
                          <h4 className="font-medium text-gray-800 dark:text-gray-200 mt-2">
                            {section.heading}
                          </h4>
                        )}
                        {section.body && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {section.body}
                          </p>
                        )}
                        {section.items?.length ? (
                          <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400">
                            {section.items.map((i, idx) => (
                              <li key={idx}>{i}</li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
