"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { PROMPTS, type PromptTemplate } from "@/data/prompts";
import { Skeleton, SkeletonCard, SkeletonText } from "@/web/components/Skeleton";
import { VariableForm } from "@/web/components/VariableForm";
import { PropertySelector } from "@/web/components/PropertySelector";
import {
  formatForBooking,
  formatForAirbnb,
  generateHashtags,
} from "@/lib/tourism/publish-helpers";

const tourismPrompts = PROMPTS.filter((p) => p.category === "tourism");

interface GeneratedPost {
  id?: string;
  title: string;
  excerpt: string;
  fullContent?: string;
}

type TabMode = "content" | "hotel-core";

type CoreResult = {
  success: boolean;
  booking?: Record<string, string>;
  email?: Record<string, string>;
  landing?: Record<string, string>;
  seo?: Record<string, { meta_title: string; meta_description: string; keywords: string[] }>;
};

export default function TourismGeneratePage() {
  const searchParams = useSearchParams();
  const templateId = searchParams.get("template");
  const promptId = searchParams.get("prompt");
  const [tabMode, setTabMode] = useState<TabMode>("content");
  const [selectedPrompt, setSelectedPrompt] = useState<PromptTemplate | null>(null);
  const [templateVars, setTemplateVars] = useState<Record<string, string> | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GeneratedPost | null>(null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [activePropertyId, setActivePropertyId] = useState<string | null>(null);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [coreHotelName, setCoreHotelName] = useState("");
  const [coreLocation, setCoreLocation] = useState("");
  const [corePropertyId, setCorePropertyId] = useState<string | null>(null);
  const [coreFeatures, setCoreFeatures] = useState("");
  const [coreOffer, setCoreOffer] = useState("");
  const [coreAudience, setCoreAudience] = useState("");
  const [coreGenerating, setCoreGenerating] = useState(false);
  const [coreSaving, setCoreSaving] = useState(false);
  const [coreResult, setCoreResult] = useState<CoreResult | null>(null);
  const [savedPageId, setSavedPageId] = useState<string | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && saveModalOpen) setSaveModalOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [saveModalOpen]);

  useEffect(() => {
    fetch("/api/user/active-property")
      .then((r) => r.json())
      .then((data) => setActivePropertyId(data.activePropertyId ?? null))
      .catch(() => setActivePropertyId(null));
  }, []);

  const retryLoadTemplate = () => {
    if (!templateId) return;
    setTemplateError(null);
    setTemplateLoading(true);
    fetch(`/api/user/templates/${templateId}`)
      .then((r) => r.json())
      .then((data) => {
        const t = data?.template;
        if (t?.basePrompt) {
          const prompt = tourismPrompts.find((p) => p.id === t.basePrompt);
          if (prompt) {
            setSelectedPrompt(prompt);
            setTemplateVars((t.customVars as Record<string, string>) ?? null);
          } else setTemplateError("Template ni mogoče naložiti");
        } else setTemplateError("Template ni mogoče naložiti");
      })
      .catch(() => setTemplateError("Template ni mogoče naložiti"))
      .finally(() => setTemplateLoading(false));
  };

  useEffect(() => {
    if (templateId) {
      setTemplateLoading(true);
      setTemplateError(null);
      fetch(`/api/user/templates/${templateId}`)
        .then((r) => r.json())
        .then((data) => {
          const t = data?.template;
          if (t?.basePrompt) {
            const prompt = tourismPrompts.find((p) => p.id === t.basePrompt);
            if (prompt) {
              setSelectedPrompt(prompt);
              setTemplateVars((t.customVars as Record<string, string>) ?? null);
            } else setTemplateError("Template ni mogoče naložiti");
          } else setTemplateError("Template ni mogoče naložiti");
        })
        .catch(() => setTemplateError("Template ni mogoče naložiti"))
        .finally(() => setTemplateLoading(false));
    } else if (promptId) {
      const p = tourismPrompts.find((x) => x.id === promptId);
      if (p) {
        setSelectedPrompt(p);
        setTemplateVars(null);
      } else {
        setSelectedPrompt(tourismPrompts[0] ?? null);
        setTemplateVars(null);
      }
    } else {
      setSelectedPrompt(tourismPrompts[0] ?? null);
      setTemplateVars(null);
    }
  }, [templateId, promptId]);

  const handleGenerate = (filledPrompt: string, customVars: Record<string, string>) => {
    setIsGenerating(true);
    setResult(null);
    setTemplateVars(customVars);

    fetch("/api/tourism/generate-content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic: filledPrompt }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!data.posts?.length) throw new Error(data.error ?? "Generation failed");
        const post = data.posts[0];
        setResult(post);
        setSaveModalOpen(true);
        setSaveName("");
        toast.success("Vsebina uspešno generirana");
      })
      .catch((err) => {
        toast.error(
          err instanceof Error
            ? err.message
            : "Vsebina ni bila generirana. Preveri internetno povezavo in poskusi znova."
        );
      })
      .finally(() => setIsGenerating(false));
  };

  const contentToCopy = result?.fullContent ?? result?.excerpt ?? "";

  const handleCopyForBooking = () => {
    if (!contentToCopy) return;
    const formatted = formatForBooking(contentToCopy);
    navigator.clipboard.writeText(formatted);
    toast.success("Kopirano v formatu za Booking.com");
  };

  const handleCopyForAirbnb = () => {
    if (!contentToCopy) return;
    const formatted = formatForAirbnb(contentToCopy);
    navigator.clipboard.writeText(formatted);
    toast.success("Kopirano v formatu za Airbnb");
  };

  const handleCopyHashtags = () => {
    const location = templateVars?.lokacija ?? templateVars?.destinacija ?? "";
    const type = templateVars?.tip ?? "apartma";
    const tags = generateHashtags(location, type);
    navigator.clipboard.writeText(tags.join(" "));
    toast.success("Hashtagi kopirani");
  };

  const handleSaveTemplate = () => {
    if (!selectedPrompt || !saveName.trim()) return;

    fetch("/api/user/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: saveName.trim(),
        category: "tourism",
        basePrompt: selectedPrompt.id,
        customVars: templateVars ?? undefined,
        propertyId: activePropertyId ?? null,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setSaveModalOpen(false);
        toast.success("Template shranjen");
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Save failed"));
  };

  const handleCoreGenerate = () => {
    const features = coreFeatures.split(/[,\n]/).map((f) => f.trim()).filter(Boolean);
    if (!coreHotelName.trim() || !coreLocation.trim() || features.length === 0) {
      toast.error("Vpiši ime hotela, lokacijo in vsaj eno značilnost.");
      return;
    }
    setCoreGenerating(true);
    setCoreResult(null);
    setSavedPageId(null);
    fetch("/api/tourism/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hotel_data: {
          hotel_name: coreHotelName.trim(),
          location: coreLocation.trim(),
          features,
          current_offer: coreOffer.trim() || undefined,
          target_audience: coreAudience.trim() || undefined,
        },
        agents: ["booking", "email", "landing", "seo"],
        languages: ["SL", "EN", "DE", "IT"],
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setCoreResult(data);
        toast.success("Vsebina generirana z Hotel Core");
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Napaka pri generiranju"))
      .finally(() => setCoreGenerating(false));
  };

  const handleCoreSave = () => {
    if (!coreResult?.landing || !coreResult?.seo) return;
    setCoreSaving(true);
    setSavedPageId(null);
    fetch("/api/tourism/generate/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        landing: coreResult.landing,
        seo: coreResult.seo,
        booking: coreResult.booking ?? undefined,
        email: coreResult.email ?? undefined,
        title: coreHotelName.trim() || "Hotel Landing",
        propertyId: corePropertyId ?? activePropertyId ?? null,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setSavedPageId(data.pageId ?? null);
        toast.success("Shranjeno v bazo");
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Shranjevanje ni uspelo"))
      .finally(() => setCoreSaving(false));
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-8 overflow-x-hidden">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold dark:text-white mb-2">
          Generate Tourism Content
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Select a template, fill in the variables, and generate. Multi-language support (SL, EN, DE, IT, HR).
        </p>
        <div className="flex gap-2 mb-8">
          <button
            type="button"
            onClick={() => setTabMode("content")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${tabMode === "content" ? "bg-blue-600 text-white" : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"}`}
          >
            Content
          </button>
          <button
            type="button"
            onClick={() => setTabMode("hotel-core")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${tabMode === "hotel-core" ? "bg-blue-600 text-white" : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"}`}
          >
            Hotel Core
          </button>
        </div>

        {tabMode === "hotel-core" ? (
          <div className="space-y-6 mb-8">
            <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold dark:text-white mb-4">Hotel podatki</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ime hotela</label>
                  <input
                    type="text"
                    value={coreHotelName}
                    onChange={(e) => setCoreHotelName(e.target.value)}
                    placeholder="Grand Hotel Alpina"
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lokacija</label>
                  <input
                    type="text"
                    value={coreLocation}
                    onChange={(e) => setCoreLocation(e.target.value)}
                    placeholder="Bled, Slovenija"
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Značilnosti (ena na vrstico ali ločene z vejico)</label>
                  <textarea
                    value={coreFeatures}
                    onChange={(e) => setCoreFeatures(e.target.value)}
                    placeholder="pogled na jezero, wellness & spa, vrhunska restavracija"
                    rows={4}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Aktualna ponudba (izbirno)</label>
                  <input
                    type="text"
                    value={coreOffer}
                    onChange={(e) => setCoreOffer(e.target.value)}
                    placeholder="20% popust za rezervacije v marcu"
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ciljna publika (izbirno)</label>
                  <input
                    type="text"
                    value={coreAudience}
                    onChange={(e) => setCoreAudience(e.target.value)}
                    placeholder="pari in družine"
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nastanitev (za shranjevanje)</label>
                  <PropertySelector value={corePropertyId} onChange={setCorePropertyId} />
                </div>
                <button
                  type="button"
                  onClick={handleCoreGenerate}
                  disabled={coreGenerating}
                  className="px-6 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  {coreGenerating ? "Generiram..." : "Generiraj (SL, EN, DE, IT)"}
                </button>
              </div>
            </div>
            {coreResult && (
              <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold dark:text-white">Rezultati</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      Platform-specifične predloge (Booking.com, Airbnb, landing, SEO)
                    </p>
                  </div>
                  {coreResult.landing && coreResult.seo && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCoreSave}
                        disabled={coreSaving}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                      >
                        {coreSaving ? "Shranjujem..." : "Shrani v bazo"}
                      </button>
                      {savedPageId && (
                        <Link
                          href="/dashboard/tourism/landing"
                          className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          Prikaži landing strani
                        </Link>
                      )}
                    </div>
                  )}
                </div>
                {coreResult.booking && (
                  <div>
                    <h3 className="font-medium dark:text-white mb-2">Predloge za Booking.com</h3>
                    <div className="space-y-2">
                      {Object.entries(coreResult.booking).map(([lang, text]) => (
                        <div key={lang} className="text-sm">
                          <span className="font-medium text-gray-600 dark:text-gray-400">{lang}:</span>
                          <p className="mt-1 p-2 bg-gray-100 dark:bg-gray-700 rounded-sm">{text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {coreResult.landing && (
                  <div>
                    <h3 className="font-medium dark:text-white mb-2">Landing strani (HTML)</h3>
                    <div className="flex flex-wrap gap-2">
                      {Object.keys(coreResult.landing).map((lang) => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => downloadCoreHtml(lang)}
                          className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          Prenesi {lang}.html
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {coreResult.seo && (
                  <div>
                    <h3 className="font-medium dark:text-white mb-2">SEO (meta, keywords)</h3>
                    <div className="space-y-2 text-sm">
                      {Object.entries(coreResult.seo).map(([lang, seo]) => (
                        <div key={lang} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-sm">
                          <span className="font-medium">{lang}:</span> {seo.meta_title} | {seo.keywords?.slice(0, 4).join(", ")}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select prompt
              </label>
              <div className="flex flex-wrap gap-2 min-w-0">
                {tourismPrompts.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedPrompt(p);
                      setTemplateVars(null);
                      setResult(null);
                    }}
                    className={`min-h-[44px] px-4 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 ${selectedPrompt?.id === p.id
                      ? "bg-blue-600 text-white"
                      : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {templateError && templateId ? (
              <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 sm:p-6 mb-8">
                <p className="text-red-700 dark:text-red-300 mb-4">{templateError}</p>
                <button
                  type="button"
                  onClick={retryLoadTemplate}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                >
                  Poskusi znova
                </button>
              </div>
            ) : templateLoading ? (
              <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-8">
                <Skeleton className="h-6 w-48 mb-4" />
                <SkeletonText lines={2} className="mb-6" />
                <SkeletonCard />
              </div>
            ) : selectedPrompt ? (
              <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-8">
                <h2 className="text-lg font-semibold dark:text-white mb-4">
                  {selectedPrompt.name}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {selectedPrompt.description}
                </p>
                <VariableForm
                  key={selectedPrompt.id + (templateVars ? "loaded" : "fresh")}
                  prompt={selectedPrompt}
                  initialValues={templateVars ?? undefined}
                  disabled={isGenerating}
                  submitLabel={isGenerating ? "Generiram..." : "Generate"}
                  onSubmit={(filled, vars) => {
                    setTemplateVars(vars);
                    handleGenerate(filled, vars);
                  }}
                />
              </div>
            ) : null}

            {isGenerating && !result ? (
              <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 mb-8">
                <Skeleton className="h-6 w-32 mb-4" />
                <SkeletonText lines={4} className="mb-4" />
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-10 w-28" />
                </div>
              </div>
            ) : result ? (
              <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold dark:text-white mb-2">Generated</h2>
                <h3 className="font-medium dark:text-white mb-2">{result.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                  {result.excerpt}
                </p>
                <div className="flex flex-wrap gap-2 min-w-0">
                  {result.id && (
                    <>
                      <Link
                        href={`/content/${result.id}`}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 min-h-[44px] inline-flex items-center"
                      >
                        View Full
                      </Link>
                      <Link
                        href={`/content/${result.id}?publish=1`}
                        className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 min-h-[44px] inline-flex items-center"
                      >
                        Publish
                      </Link>
                    </>
                  )}
                  {contentToCopy && (
                    <>
                      <button
                        type="button"
                        onClick={handleCopyForBooking}
                        className="px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-sm font-medium min-h-[44px] transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
                      >
                        Kopiraj za Booking.com
                      </button>
                      <button
                        type="button"
                        onClick={handleCopyForAirbnb}
                        className="px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-sm font-medium min-h-[44px]"
                      >
                        Kopiraj za Airbnb
                      </button>
                      <button
                        type="button"
                        onClick={handleCopyHashtags}
                        className="px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-sm font-medium min-h-[44px] transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
                      >
                        Kopiraj hashtags
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : null}
          </>
        )}

        {saveModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold dark:text-white mb-4">
                Save as Template
              </h3>
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="Template name (e.g. Moja VIP soba)"
                className="w-full px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-neutral-500 dark:placeholder:text-neutral-400 mb-4 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSaveModalOpen(false)}
                  aria-label="Prekliči in zapri"
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveTemplate}
                  disabled={!saveName.trim()}
                  className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <Link
            href="/dashboard/tourism/templates"
            className="text-blue-600 hover:underline dark:text-blue-400"
          >
            My Templates
          </Link>
          {" · "}
          <Link
            href="/dashboard/tourism"
            className="text-blue-600 hover:underline dark:text-blue-400"
          >
            Tourism Hub
          </Link>
        </p>

      </div>
    </div>
  );
}
