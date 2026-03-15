"use client";

import { useState, useEffect } from "react";
import { logger } from '@/infrastructure/observability/logger';
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Skeleton, SkeletonText } from "@/web/components/Skeleton";
import { PropertySelector } from "@/web/components/PropertySelector";
import { generateFaqSchema } from "@/lib/tourism/faq-schema";
import { DEFAULT_FAQS } from "@/data/tourism-faqs";

const TEMPLATES = [
  { id: "tourism-basic", name: "Standard", desc: "Classic accommodation – hero, about, accommodations, features, CTA" },
  { id: "luxury-retreat", name: "Luxury", desc: "Luxury template with story and gallery" },
  { id: "family-friendly", name: "Family", desc: "Family template with activities and FAQ" },
] as const;

const LANGS = [
  { code: "sl", label: "Slovenian" },
  { code: "en", label: "English" },
  { code: "de", label: "German" },
  { code: "it", label: "Italian" },
  { code: "hr", label: "Croatian" },
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

function sectionsToHtml(
  pages: PagesData,
  title: string,
  baseUrl?: string,
  propertyId?: string | null,
  apiBaseUrl?: string
): string {
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
  const apiBase = apiBaseUrl || process.env.NEXT_PUBLIC_APP_URL || "https://app.agentflow.pro";

  const contactFormHtml =
    propertyId && apiBase
      ? `
  <section id="contact">
    <h2>Contact</h2>
    <form id="inquiry-form">
      <input type="hidden" name="propertyId" value="${escHtml(propertyId)}" />
      <p><input type="text" name="name" placeholder="Name" required minlength="2" style="width:100%;max-width:300px;padding:8px;margin:4px 0;" /></p>
      <p><input type="email" name="email" placeholder="Email" required style="width:100%;max-width:300px;padding:8px;margin:4px 0;" /></p>
      <p><textarea name="message" placeholder="Message" required minlength="10" rows="4" style="width:100%;max-width:400px;padding:8px;margin:4px 0;"></textarea></p>
      <button type="submit" style="padding:8px 16px;background:#2563eb;color:white;border:none;border-radius:8px;cursor:pointer;">Send</button>
    </form>
    <div id="inquiry-result" style="margin-top:12px;"></div>
    <script>
(function(){
  var form=document.getElementById('inquiry-form');
  var result=document.getElementById('inquiry-result');
  if(!form||!result)return;
  form.addEventListener('submit',async function(e){
    e.preventDefault();
    var fd=new FormData(form);
    var body={propertyId:fd.get('propertyId'),name:fd.get('name'),email:fd.get('email'),message:fd.get('message')};
    result.textContent='Sending...';
    try{
      var res=await fetch('${apiBase.replace(/\/$/, "")}/api/tourism/inquiries',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      var data=await res.json();
      if(res.ok){result.textContent='Thank you! Message sent.';result.style.color='#059669';form.reset();}
      else{result.textContent=data.error||'Error. Please try again.';result.style.color='#dc2626';}
    }catch(err){result.textContent='Connection error. Please try again.';result.style.color='#dc2626';}
  });
})();
    <\\/script>
  </section>`
      : "";

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
${contactFormHtml}
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
    propertyId: null as string | null,
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
        setFormData((prev) => ({
          ...prev,
          name: page.title ?? prev.name,
          propertyId: page.propertyId ?? null,
        }));
        setTemplate(page.template ?? "tourism-basic");
        setLanguages(Array.isArray(page.languages) ? page.languages : ["sl", "en"]);
        setStep(3);
        toast.success("Page loaded");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load.");
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
      toast.error("Accommodation name is required.");
      return;
    }
    const features = formData.features
      .split(/[,\n]/)
      .map((f) => f.trim())
      .filter(Boolean);
    if (features.length === 0) features.push(formData.type || "apartment");

    setCoreLoading(true);
    setCoreResult(null);
    try {
      const res = await fetch("/api/tourism/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotel_data: {
            hotel_name: formData.name.trim(),
            location: formData.location.trim() || "Slovenia",
            features,
            current_offer: formData.priceFrom ? `From ${formData.priceFrom}€/night` : undefined,
          },
          agents: ["landing", "seo"],
          languages: ["SL", "EN", "DE", "IT"],
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setCoreResult({ landing: data.landing, seo: data.seo });
      toast.success("Hotel Core: HTML generated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error generating with Core");
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
      toast.success("Saved to database");
      loadSavedPages();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save.");
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
      toast.error("Accommodation name is required.");
      return;
    }
    if (languages.length === 0) {
      toast.error("Select at least one language.");
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
      toast.success("Landing page generated");
      if (autoSave) {
        await handleSave(generatedPages);
        loadSavedPages();
      }
    } catch (err) {
      logger.error("Landing generation failed:", err);
      toast.error(err instanceof Error ? err.message : "Error generating.");
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
    toast.success("Export JSON – saved");
  };

  const handleExportMarkdown = () => {
    if (!pages) return;
    const md = sectionsToMarkdown(pages);
    const blob = new Blob([md], { type: "text/markdown" });
    downloadBlob(blob, `landing-${formData.name.replace(/\s+/g, "-")}.md`);
    toast.success("Export Markdown – saved");
  };

  const handleExportHtml = () => {
    if (!pages) return;
    const apiBase =
      (typeof window !== "undefined" ? window.location.origin : null) ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://app.agentflow.pro";
    const html = sectionsToHtml(
      pages,
      formData.name,
      formData.baseUrl?.trim() || undefined,
      formData.propertyId,
      apiBase
    );
    const blob = new Blob([html], { type: "text/html" });
    downloadBlob(blob, `landing-${formData.name.replace(/\s+/g, "-")}.html`);
    toast.success("Export HTML – saved");
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
      toast.success("Landing page saved");
      loadSavedPages();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save.");
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 overflow-x-hidden">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Landing Page Generator
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Create accommodation landing page in multiple languages (3 steps)
        </p>
      </div>

      {savedPages.length === 0 && (
        <button
          type="button"
          onClick={loadSavedPages}
          className="mb-4 text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          Load saved pages
        </button>
      )}
      {savedPages.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Saved:</span>
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
            Step {s}
          </button>
        ))}
      </div>

      {step === 1 && (
        <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Choose template
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
              Next →
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Accommodation details
            </h2>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              ← Back
            </button>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Accommodation name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  placeholder="e.g. Apartments Bela Krajina"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  placeholder="e.g. Ljubljana"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Type
                </label>
                <input
                  type="text"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  placeholder="apartment"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Capacity
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
                  Price from (€/night)
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
                Features
              </label>
              <textarea
                value={formData.features}
                onChange={(e) =>
                  setFormData({ ...formData, features: e.target.value })
                }
                rows={2}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                placeholder="WiFi, parking, kitchen equipment"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Languages
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
                Auto-save after generation
              </span>
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading}
                className="min-h-[44px] px-4 py-3 rounded-lg bg-linear-to-r from-blue-600 to-cyan-500 text-white font-medium hover:opacity-90 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                {loading ? "Generating..." : "Generate Now"}
              </button>
              <button
                type="button"
                onClick={handleGenerateWithCore}
                disabled={coreLoading}
                className="min-h-[44px] px-4 py-3 rounded-lg border-2 border-amber-500 text-amber-600 dark:text-amber-400 font-medium hover:bg-amber-50 dark:hover:bg-amber-900/20 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                {coreLoading ? "Core..." : "Generate with Core"}
              </button>
            </div>
            {coreResult && (
              <div className="mt-4 p-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10 space-y-3">
                <h3 className="font-semibold text-gray-900 dark:text-white">Hotel Core Result</h3>
                <div className="flex flex-wrap gap-2">
                  {coreResult.landing &&
                    Object.keys(coreResult.landing).map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => downloadCoreHtml(lang)}
                        className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Download {lang}.html
                      </button>
                    ))}
                  <button
                    type="button"
                    onClick={handleCoreSave}
                    className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700"
                  >
                    Save to database
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
                Preview
              </h2>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="min-h-[44px] px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  ← Edit
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
                  aria-label="Save to database"
                  className="min-h-[44px] px-3 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  Save
                </button>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label htmlFor="baseUrl" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Base URL for hreflang (e.g. https://my-accommodation.com)
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
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Property for contact form (when selected, included in Export HTML)
                </label>
                <PropertySelector
                  value={formData.propertyId}
                  onChange={(id) => setFormData({ ...formData, propertyId: id })}
                />
              </div>
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
