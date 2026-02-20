"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { PROMPTS } from "@/data/prompts";
import { FeatureTour, TOURISM_STEPS } from "@/web/components/FeatureTour";
import { PropertySelector } from "@/web/components/PropertySelector";
import { Skeleton } from "@/web/components/Skeleton";

const TOURISM_PROMPTS = PROMPTS.filter((p) => p.category === "tourism").map(
  (p) => ({ id: p.id, name: p.name, desc: p.description })
);

const PROMPT_EMOJI: Record<string, string> = {
  "booking-description": "📋",
  "airbnb-story": "🏠",
  "destination-guide": "🗺️",
  "seasonal-campaign": "🎄",
  "instagram-travel": "📱",
};

interface UserTemplate {
  id: string;
  name: string;
  basePrompt: string;
  customVars: Record<string, string> | null;
  language: string | null;
  updatedAt: string;
}

export default function TourismOverviewPage() {
  const [contentCount, setContentCount] = useState(0);
  const [templateCount, setTemplateCount] = useState(0);
  const [recentTemplates, setRecentTemplates] = useState<UserTemplate[]>([]);
  const [activePropertyId, setActivePropertyId] = useState<string | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/user/active-property")
      .then((r) => r.json())
      .then((data) => setActivePropertyId(data.activePropertyId ?? null))
      .catch(() => setActivePropertyId(null));
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const templateUrl = activePropertyId
      ? `/api/user/templates?category=tourism&propertyId=${encodeURIComponent(activePropertyId)}`
      : "/api/user/templates?category=tourism";
    Promise.all([
      fetch("/api/content/history", { signal: ctrl.signal }).then((r) => r.json()),
      fetch(templateUrl, { signal: ctrl.signal }).then((r) => r.json()),
    ])
      .then(([contentRes, templateRes]) => {
        setStatsError(null);
        const posts = contentRes?.posts ?? [];
        const templates = templateRes?.templates ?? [];
        const list = Array.isArray(templates) ? templates : [];
        setContentCount(Array.isArray(posts) ? posts.length : 0);
        setTemplateCount(list.length);
        setRecentTemplates(list.slice(0, 5));
      })
      .catch(() => {
        setStatsError("Prišlo je do napake pri nalaganju. Poskusi znova.");
        toast.error("Napaka pri nalaganju statistike ali template-ov.");
      })
      .finally(() => {
        clearTimeout(t);
        setStatsLoading(false);
      });
  }, [activePropertyId]);

  const getPromptName = (basePrompt: string) =>
    TOURISM_PROMPTS.find((p) => p.id === basePrompt)?.name ?? basePrompt;

  const stats = [
    { label: "Generiranih vsebin", value: String(contentCount), icon: "📄" },
    { label: "Shranjenih template-ov", value: String(templateCount), icon: "💾" },
    { label: "Jezikov", value: "5", icon: "🌍" },
    { label: "Prihranjenih ur", value: "18h", icon: "⏱️" },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 overflow-x-hidden">
      <FeatureTour
        steps={TOURISM_STEPS}
        storageKey="agentflow-tourism-tour-seen"
      />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Tourism Hub
          </h1>
          <p
            id="language-select"
            className="text-gray-600 dark:text-gray-400 mt-1"
          >
            Vsa orodja za turistične ponudnike na enem mestu. Multi-language
            (SL, EN, DE, IT, HR).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PropertySelector
            value={activePropertyId}
            onChange={async (id) => {
              const res = await fetch("/api/user/active-property", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ propertyId: id }),
              });
              if (res.ok) setActivePropertyId(id);
            }}
          />
          <Link href="/dashboard/tourism/generate" id="export-btn">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-medium hover:opacity-90 transition-opacity focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
              Novo Generiraj
            </span>
          </Link>
        </div>
      </div>

      {statsError && (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
          <p className="text-red-700 dark:text-red-300">{statsError}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4"
            >
              <Skeleton className="h-12 w-12 shrink-0 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-7 w-12" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          ))
        ) : (
          stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4"
            >
              <span className="text-3xl shrink-0" aria-hidden>
                {stat.icon}
              </span>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {stat.label}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div
        id="prompt-selector"
        className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Hitri Začetek
          </h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TOURISM_PROMPTS.map((prompt) => (
              <Link
                key={prompt.id}
                href={`/dashboard/tourism/generate?prompt=${prompt.id}`}
                className="group p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all"
              >
                <div className="font-semibold text-gray-900 dark:text-white mb-1">
                  {PROMPT_EMOJI[prompt.id] ? `${PROMPT_EMOJI[prompt.id]} ` : ""}
                  {prompt.name}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {prompt.desc}
                </div>
                <div className="mt-3 text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1">
                  Odpri →
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {(statsLoading || recentTemplates.length > 0) && (
        <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Nedavni Template-i
            </h2>
            <Link
              href="/dashboard/tourism/templates"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Vsi template-i →
            </Link>
          </div>
          <div className="p-4 space-y-2">
            {recentTemplates.map((template) => (
              <div
                key={template.id}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
              >
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {template.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {getPromptName(template.basePrompt)}
                  </div>
                </div>
                <Link
                  href={`/dashboard/tourism/generate?template=${template.id}`}
                  className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Uporabi
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 p-6 text-center">
        <div className="text-4xl mb-3" aria-hidden>
          🚧
        </div>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
          Kmalu: SEO ranking v realnem času
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Poveži Google Search Console in spremljaj pozicije ključnih besed v realnem času.
        </p>
        <button
          type="button"
          disabled
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed text-sm font-medium"
        >
          Obvesti me ko bo pripravljeno
        </button>
      </div>
    </div>
  );
}
