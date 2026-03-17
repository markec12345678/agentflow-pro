"use client";

import { useState, useEffect } from "react";
import { TourismErrorBoundary, LoadingState, EmptyState } from "@/web/components/TourismErrorBoundary";
import { toast } from "sonner";
import { PropertySelector } from "@/web/components/PropertySelector";
import "@/styles/progress-bars.css";

interface ChannelStats {
  bookings: number;
  revenue: number;
  avgStay: number;
}

interface PredictiveData {
  forecastNightsNext30d: number;
  forecastBookingsNext30d: number;
  forecastRevenueNext30d: number;
  trendDirection: "up" | "down" | "stable";
  trendPercent: number;
  confidence: number;
}

interface AnalyticsData {
  summary: {
    totalBookings: number;
    totalRevenue: number;
    avgBookingValue: number;
    avgStayLength: number;
    occupancyRate: number;
    period: { from: string; to: string };
  };
  channelPerformance: Record<string, ChannelStats>;
  monthlyTrend: Array<{ month: string; revenue: number }>;
  contentStats: {
    totalGenerated: number;
    byType: Record<string, number>;
  };
  topGuests: Array<{ name: string; bookings: number; totalSpent: number }>;
  predictive?: PredictiveData;
  successMetrics?: {
    avgResponseTimeMs: number;
    autoAnsweredCount: number;
    totalFaqResponses?: number;
    lowConfidenceCount?: number;
    revParPlaceholder: number | null;
    revParNote?: string;
  };
}

export default function AnalyticsPageWrapper() {
  return (
    <TourismErrorBoundary>
      <AnalyticsPage />
    </TourismErrorBoundary>
  );
}

function AnalyticsPage() {
  const [activePropertyId, setActivePropertyId] = useState<string | null>(null);
  const [period, setPeriod] = useState("30d");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [competitorLocation, setCompetitorLocation] = useState("");
  const [competitorData, setCompetitorData] = useState<{
    competitors?: Array<{ name: string; prices?: number[] }>;
    marketData?: { avgPrice: number; recommendations?: string[] };
  } | null>(null);
  const [competitorLoading, setCompetitorLoading] = useState(false);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/v1/tourism/analytics?propertyId=${activePropertyId}&period=${period}`
        );
        const analyticsData = await res.json();
        setData(analyticsData);
      } catch {
        toast.error("Napaka pri nalaganju analitike");
      } finally {
        setLoading(false);
      }
    };

    if (activePropertyId) {
      fetchAnalytics();
    }
  }, [activePropertyId, period]);

  const fetchCompetitorPrices = () => {
    if (!activePropertyId || !competitorLocation.trim()) {
      toast.error("Izberite nastanitev in vnesite lokacijo (npr. Bela Krajina)");
      return;
    }
    setCompetitorLoading(true);
    fetch(`/api/v1/tourism/competitor-prices?propertyId=${activePropertyId}&location=${encodeURIComponent(competitorLocation.trim())}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setCompetitorData({ competitors: d.competitors, marketData: d.marketAnalysis });
      })
      .catch((e) => {
        toast.error(e instanceof Error ? e.message : "Napaka pri nalaganju konkurenčnih cen");
        setCompetitorData(null);
      })
      .finally(() => setCompetitorLoading(false));
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Analitika & Poročila
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Kanalna uspešnost, prihodki, zasedenost, AI vsebina
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label htmlFor="period-select" className="sr-only">Izberi obdobje</label>
          <select
            id="period-select"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
            aria-label="Izberi časovno obdobje za analitiko"
          >
            <option value="7d">Zadnjih 7 dni</option>
            <option value="30d">Zadnjih 30 dni</option>
            <option value="90d">Zadnjih 90 dni</option>
            <option value="1y">Zadnje leto</option>
          </select>
          <PropertySelector value={activePropertyId} onChange={setActivePropertyId} />
        </div>
      </div>

      {/* Competitor prices */}
      {activePropertyId && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold">Konkurenčne cene</h2>
            <p className="text-sm text-gray-500 mt-1">Primerjajte cene s konkurenco v izbrani lokaciji</p>
          </div>
          <div className="p-4 flex flex-wrap gap-2 items-end">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Lokacija (npr. Bela Krajina)</label>
              <input
                type="text"
                value={competitorLocation}
                onChange={(e) => setCompetitorLocation(e.target.value)}
                placeholder="Bela Krajina"
                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm min-w-[180px]"
              />
            </div>
            <button
              onClick={fetchCompetitorPrices}
              disabled={competitorLoading}
              className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {competitorLoading ? "Nalaganje..." : "Naloži konkurenčne cene"}
            </button>
          </div>
          {competitorData && (
            <div className="p-4 pt-0 space-y-4">
              {competitorData.marketData && competitorData.marketData.avgPrice > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Povp. tržna cena</div>
                    <div className="text-xl font-bold">€{competitorData.marketData.avgPrice.toLocaleString()}</div>
                  </div>
                  {competitorData.marketData.recommendations?.[0] && (
                    <div className="col-span-2 md:col-span-3">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Priporočilo</div>
                      <div className="text-sm text-gray-800 dark:text-gray-200">{competitorData.marketData.recommendations[0]}</div>
                    </div>
                  )}
                </div>
              )}
              {competitorData.competitors && competitorData.competitors.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sledeni konkurenti</div>
                  <div className="flex flex-wrap gap-2">
                    {competitorData.competitors.map((c: { name: string; prices?: number[] }) => (
                      <span
                        key={c.name}
                        className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1 text-sm"
                      >
                        {c.name}: {c.prices && c.prices.length > 0 ? `€${c.prices[c.prices.length - 1]}` : "—"}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {(!competitorData.competitors || competitorData.competitors.length === 0) && !competitorLoading && competitorData.marketData?.avgPrice === 0 && (
                <p className="text-sm text-gray-500">Za to nastanitev še ni podatkov o konkurenci. Dodajte konkurente v nastanitvah.</p>
              )}
            </div>
          )}
        </div>
      )}

      {loading ? (
        <LoadingState message="Nalaganje analitike..." />
      ) : !data ? (
        <EmptyState
          icon="📊"
          title="Ni podatkov za prikaz"
          description="Izberite nastanitev za prikaz analitike in poročil."
          actionLabel="Izberi nastanitev"
          actionHref="/dashboard/tourism/properties"
        />
      ) : (
        <>
          {/* Success metrics (Roadmap optional) */}
          {data.successMetrics && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-linear-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="font-semibold">Uspešnost FAQ</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Čas odziva in avtomatsko odgovorjena sporočila
                </p>
              </div>
              <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Povp. čas odziva</div>
                  <div className="text-xl font-bold">
                    {data.successMetrics.avgResponseTimeMs > 0
                      ? `${data.successMetrics.avgResponseTimeMs} ms`
                      : "—"}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Avtomatsko odgovorjeno</div>
                  <div className="text-xl font-bold">{data.successMetrics.autoAnsweredCount}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Za ročni pregled</div>
                  <div className="text-xl font-bold">
                    {typeof data.successMetrics.lowConfidenceCount === "number"
                      ? data.successMetrics.lowConfidenceCount
                      : "—"}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">nizko zaupanje (&lt;90%)</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">RevPAR</div>
                  <div className="text-xl font-bold">
                    {data.successMetrics.revParPlaceholder != null
                      ? `€${data.successMetrics.revParPlaceholder}`
                      : "—"}
                  </div>
                  {data.successMetrics.revParNote && (
                    <div className="text-xs text-gray-500 mt-0.5">{data.successMetrics.revParNote}</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Predictive (Blok C #8) */}
          {data.predictive && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-linear-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="font-semibold">📈 Napoved (naslednjih 30 dni)</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Na podlagi trenutnega trenda • zaupanje {Math.round(data.predictive.confidence * 100)}%
                </p>
              </div>
              <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Prenočišča</div>
                  <div className="text-xl font-bold">{data.predictive.forecastNightsNext30d}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Rezervacije</div>
                  <div className="text-xl font-bold">{data.predictive.forecastBookingsNext30d}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Prihodki</div>
                  <div className="text-xl font-bold">€{data.predictive.forecastRevenueNext30d.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Trend</div>
                  <div className="text-xl font-bold">
                    {data.predictive.trendDirection === "up" && "↑"}
                    {data.predictive.trendDirection === "down" && "↓"}
                    {data.predictive.trendDirection === "stable" && "→"}
                    {data.predictive.trendPercent !== 0 && ` ${data.predictive.trendPercent}%`}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SummaryCard
              label="Skupaj rezervacij"
              value={data.summary.totalBookings}
              icon="📅"
              trend="+12%"
              positive
            />
            <SummaryCard
              label="Skupni prihodki"
              value={`€${data.summary.totalRevenue.toLocaleString()}`}
              icon="💰"
              trend="+8%"
              positive
            />
            <SummaryCard
              label="Povpr. vrednost"
              value={`€${Math.round(data.summary.avgBookingValue)}`}
              icon="📊"
            />
            <SummaryCard
              label="Zasedenost"
              value={`${Math.round(data.summary.occupancyRate)}%`}
              icon="🏨"
              trend={data.summary.occupancyRate > 70 ? "Odlično" : "Izboljšaj"}
              positive={data.summary.occupancyRate > 70}
            />
          </div>

          {/* Channel Performance */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <h2 className="font-semibold">📊 Uspešnost po Kanalih</h2>
              </div>
              <div className="p-4">
                <div className="space-y-4">
                  {Object.entries(data.channelPerformance).map(([channel, stats]) => (
                    <div key={channel} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">
                          {channel === "direct" && "🌐"}
                          {channel === "bookingcom" && "📱"}
                          {channel === "airbnb" && "🏠"}
                          {channel === "expedia" && "✈️"}
                          {channel === "other" && "📋"}
                        </div>
                        <div>
                          <div className="font-medium capitalize">{channel}</div>
                          <div className="text-sm text-gray-500">
                            {stats.bookings} rezervacij • povp. {stats.avgStay} noči
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">€{stats.revenue.toLocaleString()}</div>
                        <div className="text-sm text-gray-500">
                          {data.summary.totalRevenue > 0
                            ? Math.round((stats.revenue / data.summary.totalRevenue) * 100)
                            : 0}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Revenue Trend */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <h2 className="font-semibold">📈 Trend Prihodkov</h2>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  {data.monthlyTrend.map((month) => (
                    <div key={month.month} className="flex items-center gap-4">
                      <div className="w-20 text-sm text-gray-600 dark:text-gray-400">
                        {month.month}
                      </div>
                      <div className="flex-1">
                        <div className="h-8 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden relative">
                          <div
                            className={`h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all absolute left-0 top-0 progress-width-${Math.round((data.summary.totalRevenue > 0 ? (month.revenue / data.summary.totalRevenue) * 100 / 5 : 0) * 5)}`}
                          />
                        </div>
                      </div>
                      <div className="w-20 text-right font-medium">
                        €{month.revenue.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* AI Content Stats */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-linear-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
              <h2 className="font-semibold">🤖 AI Vsebina Statistika</h2>
            </div>
            <div className="p-4">
              <div className="grid md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {data.contentStats.totalGenerated}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Skupaj generiranih
                  </div>
                </div>
                {Object.entries(data.contentStats.byType).map(([type, count]) => (
                  <div key={type} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                    <div className="text-2xl font-bold">{count}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                      {type.replace(/-/g, " ")}
                    </div>
                  </div>
                ))}
              </div>

              {/* Time Saved Estimate */}
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-4">
                  <div className="text-3xl">⏱️</div>
                  <div>
                    <div className="font-semibold text-emerald-800 dark:text-emerald-200">
                      Prihranjeno časa z AI
                    </div>
                    <div className="text-sm text-emerald-600 dark:text-emerald-400">
                      Ocenjeno {Math.round(data.contentStats.totalGenerated * 0.5)} ur prihranjeno
                      (povp. 30 min na vsebino ročno)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Top Guests */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <h2 className="font-semibold">⭐ Najboljši Gosti</h2>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                {data.topGuests.map((guest, index) => (
                  <div
                    key={guest.name}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-linear-to-r from-blue-500 to-cyan-500 text-white flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{guest.name}</div>
                        <div className="text-sm text-gray-500">
                          {guest.bookings} rezervacij
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">€{guest.totalSpent}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Generate Report Button */}
          <div className="flex justify-end">
            <button
              onClick={() => {
                toast.success("Poročilo generirano! Prenos se je začel.");
              }}
              className="px-6 py-3 rounded-lg bg-linear-to-r from-blue-600 to-cyan-500 text-white font-medium hover:opacity-90 transition-opacity"
            >
              📥 Prenesi Poročilo (PDF)
            </button>
          </div>
        </>
      )}

      {/* Competitor Prices Teaser */}
      <div className="rounded-xl border-2 border-dashed border-purple-300 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-900/10 p-6">
        <div className="flex items-start gap-4">
          <div className="text-3xl">🎯</div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-2">Spremljanje Cen Tekmecev</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Primerjajte svoje cene z konkurenco in optimizirajte prihodke.
            </p>
            <a
              href="/dashboard/tourism/competitors"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors"
            >
              Odpri Competitor Analytics →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  trend,
  positive,
}: {
  label: string;
  value: string | number;
  icon: string;
  trend?: string;
  positive?: boolean;
}) {
  return (
    <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xs">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        {trend && (
          <span
            className={`text-xs px-2 py-1 rounded-full ${positive
              ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
              : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
              }`}
          >
            {trend}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-gray-600 dark:text-gray-400">{label}</div>
    </div>
  );
}
