"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { PROMPTS } from "@/data/prompts";
import { FeatureTour, TOURISM_STEPS } from "@/web/components/FeatureTour";
import { PropertySelector } from "@/web/components/PropertySelector";
import { Skeleton } from "@/web/components/Skeleton";
import { GlobalSearch } from "@/web/components/GlobalSearch";
import { NotificationBell } from "@/web/components/NotificationBell";
import { OnboardingWizard } from "@/web/components/OnboardingWizard";
import { TodayOverview } from "@/web/components/TodayOverview";
import { QuickActionsPanel } from "@/web/components/QuickActionsPanel";

const FIRST_SESSION_STEPS = [
  { id: "property", label: "Dodaj nastanitev", href: "/dashboard/tourism/properties", done: false },
  { id: "content", label: "Generiraj prvo vsebino", href: "/generate", done: false },
  { id: "template", label: "Shrani template", href: "/dashboard/tourism/templates", done: false },
];

function FirstSessionChecklist({
  hasProperty,
  hasContent,
  hasTemplate,
  loading,
}: {
  hasProperty: boolean;
  hasContent: boolean;
  hasTemplate: boolean;
  loading: boolean;
}) {
  const [dismissed, setDismissed] = useState(false);
  const allDone = hasProperty && hasContent && hasTemplate;
  const doneCount = [hasProperty, hasContent, hasTemplate].filter(Boolean).length;

  useEffect(() => {
    try {
      const dis = localStorage.getItem("agentflow-first-session-dismissed");
      if (dis) setDismissed(true);
    } catch { }
  }, []);

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem("agentflow-first-session-dismissed", "1");
    } catch { }
  };

  if (loading || dismissed || allDone) return null;

  const steps = [
    { ...FIRST_SESSION_STEPS[0], done: hasProperty },
    { ...FIRST_SESSION_STEPS[1], done: hasContent },
    { ...FIRST_SESSION_STEPS[2], done: hasTemplate },
  ];

  return (
    <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Začni v 3 korakih
        </h3>
        <button
          onClick={dismiss}
          className="text-gray-400 hover:text-gray-600 text-lg leading-none"
          aria-label="Zapri"
        >
          ×
        </button>
      </div>
      <div className="flex flex-wrap gap-3">
        {steps.map((s) => (
          <Link
            key={s.id}
            href={s.href}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${s.done
              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
              : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-400"
              }`}
          >
            <span className={s.done ? "" : "opacity-50"}>{s.done ? "✓" : "○"}</span>
            {s.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const isReceptionMode = searchParams.get("mode") === "reception";

  useEffect(() => {
    try {
      if (localStorage.getItem("agentflow-reception-mode") === "1" && !isReceptionMode) {
        router.replace("/dashboard/tourism?mode=reception", { scroll: false });
      }
    } catch {
      // SSR or localStorage unavailable
    }
  }, [isReceptionMode, router]);
  const [contentCount, setContentCount] = useState(0);
  const [templateCount, setTemplateCount] = useState(0);
  const [propertyCount, setPropertyCount] = useState(0);
  const [recentTemplates, setRecentTemplates] = useState<UserTemplate[]>([]);
  const [activePropertyId, setActivePropertyId] = useState<string | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [dailyRevenue, setDailyRevenue] = useState<{ revenue: number; departureCount: number } | null>(null);
  const [occupancyData, setOccupancyData] = useState<{
    today: { occupancyPercent: number; revenue: number };
    todayPlus1: { occupancyPercent: number; revenue: number };
    todayPlus2: { occupancyPercent: number; revenue: number };
    mtd: { occupancyPercent: number; revenue: number };
    ytd: { occupancyPercent: number; revenue: number };
  } | null>(null);
  const [revenueRangeData, setRevenueRangeData] = useState<{ date: string; revenue: number }[] | null>(null);
  const [chartsLoading, setChartsLoading] = useState(false);
  const [newInquiryCount, setNewInquiryCount] = useState(0);

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
      fetch("/api/tourism/properties", { signal: ctrl.signal }).then((r) => r.json()).catch(() => ({ properties: [] })),
    ])
      .then(([contentRes, templateRes, propsRes]) => {
        setStatsError(null);
        const posts = contentRes?.posts ?? [];
        const templates = templateRes?.templates ?? [];
        const list = Array.isArray(templates) ? templates : [];
        const properties = propsRes?.properties ?? [];
        setContentCount(Array.isArray(posts) ? posts.length : 0);
        setTemplateCount(list.length);
        setPropertyCount(Array.isArray(properties) ? properties.length : 0);
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

  // Dnevni promet (Reception)
  useEffect(() => {
    const params = new URLSearchParams();
    if (activePropertyId) params.set("propertyId", activePropertyId);
    fetch(`/api/tourism/daily-revenue?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setDailyRevenue({ revenue: d.revenue ?? 0, departureCount: d.departureCount ?? 0 }))
      .catch(() => setDailyRevenue(null));
  }, [activePropertyId]);

  // Occupancy in revenue charts
  useEffect(() => {
    if (!activePropertyId) {
      setOccupancyData(null);
      setRevenueRangeData(null);
      return;
    }
    setChartsLoading(true);
    Promise.all([
      fetch(`/api/tourism/occupancy?propertyId=${encodeURIComponent(activePropertyId)}`).then((r) => r.json()),
      fetch(`/api/tourism/daily-revenue/range?propertyId=${encodeURIComponent(activePropertyId)}`).then((r) => r.json()),
    ])
      .then(([occRes, revRes]) => {
        if (occRes.error) throw new Error(occRes.error);
        if (revRes.error) throw new Error(revRes.error);
        setOccupancyData({
          today: occRes.today,
          todayPlus1: occRes.todayPlus1,
          todayPlus2: occRes.todayPlus2,
          mtd: occRes.mtd,
          ytd: occRes.ytd,
        });
        setRevenueRangeData(revRes.days ?? []);
      })
      .catch(() => {
        setOccupancyData(null);
        setRevenueRangeData(null);
      })
      .finally(() => setChartsLoading(false));
  }, [activePropertyId]);

  const getPromptName = (basePrompt: string) =>
    TOURISM_PROMPTS.find((p) => p.id === basePrompt)?.name ?? basePrompt;

  const savedHours = Math.round(contentCount * 0.5 + templateCount * 0.3);
  const stats = [
    { label: "Generiranih vsebin", value: String(contentCount), icon: "📄" },
    { label: "Shranjenih template-ov", value: String(templateCount), icon: "💾" },
    { label: "Jezikov", value: "5", icon: "🌍" },
    { label: "Prihranjenih ur", value: `${savedHours}h`, icon: "⏱️" },
  ];

  return (
    <div className={`p-4 sm:p-6 lg:p-8 space-y-8 overflow-x-hidden ${isReceptionMode ? "max-w-4xl mx-auto" : ""}`}>
      {!isReceptionMode && (
        <>
          <OnboardingWizard />
          <FeatureTour
            steps={TOURISM_STEPS}
            storageKey="agentflow-tourism-tour-seen"
          />
        </>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Tourism Hub
          </h1>
          <p
            id="language-select"
            className="text-gray-600 dark:text-gray-400 mt-1"
          >
            {isReceptionMode
              ? "Recepcijski način – danes in hitre akcije"
              : "Vsa orodja za turistične ponudnike na enem mestu. Multi-language (SL, EN, DE, IT, HR)."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={isReceptionMode ? "/dashboard/tourism" : "/dashboard/tourism?mode=reception"}
            onClick={() => {
              try {
                if (isReceptionMode) {
                  localStorage.removeItem("agentflow-reception-mode");
                } else {
                  localStorage.setItem("agentflow-reception-mode", "1");
                }
              } catch { /* ignore */ }
            }}
            className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
          >
            {isReceptionMode ? "↩ Običajni način" : "🖥 Reception način"}
          </Link>
          <GlobalSearch propertyId={activePropertyId} />
          <NotificationBell propertyId={activePropertyId} />
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
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-linear-to-r from-blue-600 to-cyan-500 text-white font-medium hover:opacity-90 transition-opacity focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
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

      {!isReceptionMode && (
        <FirstSessionChecklist
          hasProperty={propertyCount > 0}
          hasContent={contentCount > 0}
          hasTemplate={templateCount > 0}
          loading={statsLoading}
        />
      )}

      {(isReceptionMode || dailyRevenue !== null) && (
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-4">
          <div className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
            Danes: €{(dailyRevenue?.revenue ?? 0).toFixed(2)} prihodkov
            ({dailyRevenue?.departureCount ?? 0} odhodov)
          </div>
        </div>
      )}

      {newInquiryCount > 0 && (
        <Link
          href={`/dashboard/tourism/inbox?status=new${activePropertyId ? `&propertyId=${activePropertyId}` : ""}`}
          className="block rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
        >
          <div className="text-sm font-medium text-amber-800 dark:text-amber-200 flex items-center gap-2">
            <span>📥</span> Nova povpraševanja: {newInquiryCount}
          </div>
        </Link>
      )}

      {isReceptionMode && (
        <QuickActionsPanel propertyId={activePropertyId} isReceptionMode />
      )}

      <div className={isReceptionMode ? "text-lg [&_h2]:text-xl [&_.text-sm]:text-base" : ""}>
        <TodayOverview propertyId={activePropertyId} />
      </div>

      {!isReceptionMode && (
        <QuickActionsPanel propertyId={activePropertyId} />
      )}

      {activePropertyId && (occupancyData || revenueRangeData?.length || chartsLoading) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {chartsLoading ? (
            <>
              <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 h-64">
                <Skeleton className="h-full w-full" />
              </div>
              <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 h-64">
                <Skeleton className="h-full w-full" />
              </div>
            </>
          ) : occupancyData ? (
            <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Zasedenost</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: "Danes", value: occupancyData.today.occupancyPercent },
                      { name: "Jutri", value: occupancyData.todayPlus1.occupancyPercent },
                      { name: "Pojutrišnjem", value: occupancyData.todayPlus2.occupancyPercent },
                      { name: "MTD", value: occupancyData.mtd.occupancyPercent },
                      { name: "YTD", value: occupancyData.ytd.occupancyPercent },
                    ]}
                    margin={{ top: 8, right: 8, left: 0, bottom: 24 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-neutral-200 dark:stroke-neutral-700" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number | undefined) => [`${v != null ? v : 0}%`, "Zasedenost"]} />
                    <Bar dataKey="value" fill="#10b981" name="Zasedenost %" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : null}
          {revenueRangeData && revenueRangeData.length > 0 && !chartsLoading ? (
            <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Prihodki (zadnjih 7 dni)</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={revenueRangeData.map((d) => ({
                      name: d.date.slice(5),
                      revenue: d.revenue,
                    }))}
                    margin={{ top: 8, right: 8, left: 0, bottom: 24 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-neutral-200 dark:stroke-neutral-700" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number | undefined) => [`€${(v ?? 0).toFixed(2)}`, "Prihodki"]} />
                    <Bar dataKey="revenue" fill="#3b82f6" name="Prihodki €" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {isReceptionMode && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Link
            href="/dashboard/tourism/guest-communication"
            className="p-6 rounded-xl bg-linear-to-r from-violet-600 to-blue-600 text-white hover:opacity-90 transition-opacity text-center"
          >
            <div className="text-4xl mb-3">💬</div>
            <div className="font-semibold text-xl">Komunikacija z Gosti</div>
          </Link>
          <Link
            href="/dashboard/tourism/calendar"
            className="p-6 rounded-xl bg-linear-to-r from-emerald-500 to-teal-600 text-white hover:opacity-90 transition-opacity text-center"
          >
            <div className="text-4xl mb-3">📅</div>
            <div className="font-semibold text-xl">Koledar & Zasedenost</div>
          </Link>
        </div>
      )}

      {!isReceptionMode && (
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
      )}

      {!isReceptionMode && (
        <>
          <div
            id="prompt-selector"
            className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Hitri Začetek
              </h2>
              <Link
                href="/dashboard/tourism/bulk-generate"
                className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                📦 Bulk generiranje
              </Link>
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
        </>
      )}

      {/* New Feature Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/dashboard/tourism/guest-communication"
          className="p-4 rounded-xl bg-linear-to-r from-violet-600 to-blue-600 text-white hover:opacity-90 transition-opacity"
        >
          <div className="text-2xl mb-2">💬</div>
          <div className="font-semibold">Komunikacija z Gosti</div>
          <div className="text-sm text-white/80">Pre-arrival, Post-stay, FAQ</div>
        </Link>

        <Link
          href="/dashboard/tourism/calendar"
          className="p-4 rounded-xl bg-linear-to-r from-emerald-500 to-teal-600 text-white hover:opacity-90 transition-opacity"
        >
          <div className="text-2xl mb-2">📅</div>
          <div className="font-semibold">Koledar & Zasedenost</div>
          <div className="text-sm text-white/80">Rezervacije, iCal sync</div>
        </Link>

        <Link
          href="/dashboard/tourism/analytics"
          className="p-4 rounded-xl bg-linear-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 transition-opacity"
        >
          <div className="text-2xl mb-2">📊</div>
          <div className="font-semibold">Analitika & Poročila</div>
          <div className="text-sm text-white/80">Kanali, prihodki, trendi</div>
        </Link>

        <Link
          href="/dashboard/tourism/data-cleanup"
          className="p-4 rounded-xl bg-linear-to-r from-slate-500 to-gray-600 text-white hover:opacity-90 transition-opacity"
        >
          <div className="text-2xl mb-2">🧹</div>
          <div className="font-semibold">Čiščenje podatkov</div>
          <div className="text-sm text-white/80">Deduplikacija, anomalije</div>
        </Link>

        <Link
          href="/dashboard/tourism/competitors"
          className="p-4 rounded-xl bg-linear-to-r from-orange-500 to-red-500 text-white hover:opacity-90 transition-opacity"
        >
          <div className="text-2xl mb-2">🎯</div>
          <div className="font-semibold">Spremljanje Tekmecev</div>
          <div className="text-sm text-white/80">Primerjava cen, trg</div>
        </Link>

        <Link
          href="/dashboard/tourism/booking-com"
          className="p-4 rounded-xl bg-linear-to-r from-amber-500 to-yellow-600 text-white hover:opacity-90 transition-opacity"
        >
          <div className="text-2xl mb-2">🏨</div>
          <div className="font-semibold">Booking.com Partner</div>
          <div className="text-sm text-white/80">Connectivity / Affiliate prijava</div>
        </Link>
      </div>

      <div className="rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 p-6 text-center">
        <div className="text-4xl mb-3" aria-hidden>
          📅
        </div>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
          iCal Sinhronizacija
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Sinhronizirajte koledar z Airbnb, Booking.com in drugimi platformami.
        </p>
        <Link
          href="/dashboard/tourism/calendar"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium transition-colors"
        >
          Nastavi iCal Sync →
        </Link>
      </div>
    </div>
  );
}
