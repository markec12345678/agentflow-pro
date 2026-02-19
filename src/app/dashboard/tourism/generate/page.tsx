"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { PROMPTS, type PromptTemplate } from "@/data/prompts";
import { Skeleton, SkeletonCard, SkeletonText } from "@/web/components/Skeleton";
import { VariableForm } from "@/web/components/VariableForm";
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

export default function TourismGeneratePage() {
  const searchParams = useSearchParams();
  const templateId = searchParams.get("template");
  const promptId = searchParams.get("prompt");
  const [selectedPrompt, setSelectedPrompt] = useState<PromptTemplate | null>(null);
  const [templateVars, setTemplateVars] = useState<Record<string, string> | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GeneratedPost | null>(null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [activePropertyId, setActivePropertyId] = useState<string | null>(null);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [templateError, setTemplateError] = useState<string | null>(null);

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-8 overflow-x-hidden">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold dark:text-white mb-2">
          Generate Tourism Content
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Select a template, fill in the variables, and generate. Multi-language support (SL, EN, DE, IT, HR).
        </p>

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
