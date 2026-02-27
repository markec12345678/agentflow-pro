"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { PropertySelector } from "@/web/components/PropertySelector";

interface Competitor {
  id: string;
  name: string;
  platform: string;
  url: string;
  currentPrice: number | null;
  lastUpdated: string | null;
  priceTrend: "up" | "down" | "stable";
}

interface MarketAnalysis {
  avgPrice: number;
  recommendations: string[];
}

export default function CompetitorsPage() {
  const [activePropertyId, setActivePropertyId] = useState<string | null>(null);
  const [location, setLocation] = useState("Bela Krajina");
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [marketAnalysis, setMarketAnalysis] = useState<MarketAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [addUrl, setAddUrl] = useState("");
  const [addPlatform, setAddPlatform] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [recCheckIn, setRecCheckIn] = useState("");
  const [recCheckOut, setRecCheckOut] = useState("");
  const [recLoading, setRecLoading] = useState(false);
  const [recResult, setRecResult] = useState<{
    recommendedPrice: number;
    suggestion: string;
    currentPrice: number;
    competitorAvg: number | null;
    nights: number;
  } | null>(null);

  const handleGetRecommendation = () => {
    if (!activePropertyId || !recCheckIn || !recCheckOut) {
      toast.error("Izberite nastanitev in datuma Od in Do");
      return;
    }
    setRecLoading(true);
    setRecResult(null);
    const params = new URLSearchParams({
      propertyId: activePropertyId,
      checkIn: recCheckIn,
      checkOut: recCheckOut,
    });
    fetch(`/api/tourism/price-recommendation?${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setRecResult(d);
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Napaka"))
      .finally(() => setRecLoading(false));
  };

  const fetchCompetitors = () => {
    if (!activePropertyId || !location.trim()) return;
    setLoading(true);
    fetch(
      `/api/tourism/competitor-prices?propertyId=${activePropertyId}&location=${encodeURIComponent(location.trim())}`
    )
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setCompetitors(d.competitors || []);
        setMarketAnalysis(d.marketAnalysis || null);
      })
      .catch((e) => {
        toast.error(e instanceof Error ? e.message : "Napaka pri nalaganju");
        setCompetitors([]);
        setMarketAnalysis(null);
      })
      .finally(() => setLoading(false));
  };

  // Nastavi location iz nastanitve, ko je izbrana, in naloži konkurente
  useEffect(() => {
    if (!activePropertyId) {
      setLocation("Bela Krajina");
      setCompetitors([]);
      setMarketAnalysis(null);
      return;
    }
    fetch("/api/tourism/properties")
      .then((r) => r.json())
      .then((d) => {
        const props = d?.properties ?? [];
        const prop = Array.isArray(props) ? props.find((p: { id: string }) => p.id === activePropertyId) : null;
        const loc = prop?.location?.trim() || "Bela Krajina";
        setLocation(loc);
        // Naloži konkurente s pravilno lokacijo
        setLoading(true);
        fetch(
          `/api/tourism/competitor-prices?propertyId=${activePropertyId}&location=${encodeURIComponent(loc)}`
        )
          .then((r) => r.json())
          .then((data) => {
            if (data.error) throw new Error(data.error);
            setCompetitors(data.competitors || []);
            setMarketAnalysis(data.marketAnalysis || null);
          })
          .catch((e) => {
            toast.error(e instanceof Error ? e.message : "Napaka pri nalaganju");
            setCompetitors([]);
            setMarketAnalysis(null);
          })
          .finally(() => setLoading(false));
      })
      .catch(() => {
        // Fallback: naloži z Bela Krajina
        if (activePropertyId) {
          setLoading(true);
          fetch(
            `/api/tourism/competitor-prices?propertyId=${activePropertyId}&location=${encodeURIComponent("Bela Krajina")}`
          )
            .then((r) => r.json())
            .then((data) => {
              if (data.error) throw new Error(data.error);
              setCompetitors(data.competitors || []);
              setMarketAnalysis(data.marketAnalysis || null);
            })
            .catch(() => {
              setCompetitors([]);
              setMarketAnalysis(null);
            })
            .finally(() => setLoading(false));
        }
      });
  }, [activePropertyId]);

  const handleAdd = () => {
    if (!activePropertyId || !addName.trim() || !addUrl.trim()) {
      toast.error("Vnesite ime in URL");
      return;
    }
    setAddLoading(true);
    fetch("/api/tourism/competitor-prices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "add-competitor",
        propertyId: activePropertyId,
        competitorData: { name: addName.trim(), platform: addPlatform.trim() || addName.trim(), url: addUrl.trim() },
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        toast.success("Konkurent dodan");
        setAddModalOpen(false);
        setAddName("");
        setAddUrl("");
        setAddPlatform("");
        fetchCompetitors();
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Napaka"))
      .finally(() => setAddLoading(false));
  };

  const handleRefresh = () => {
    if (!activePropertyId) return;
    setRefreshLoading(true);
    fetch("/api/tourism/competitor-prices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "refresh-all", propertyId: activePropertyId }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        toast.success(`Posodobljeno cen: ${d.refreshed ?? 0}`);
        fetchCompetitors();
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Napaka"))
      .finally(() => setRefreshLoading(false));
  };

  const handleDelete = (id: string) => {
    if (!confirm("Odstraniti tega konkurenta?")) return;
    fetch(`/api/tourism/competitor-prices?id=${id}`, { method: "DELETE" })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        toast.success("Konkurent odstranjen");
        fetchCompetitors();
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Napaka"));
  };

  const trendIcon = (t: string) => (t === "up" ? "↑" : t === "down" ? "↓" : "→");

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Konkurenčne cene
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Sledite cenam konkurence in primerjajte s povprečjem na trgu
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <PropertySelector value={activePropertyId} onChange={setActivePropertyId} />
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Lokacija"
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm min-w-[140px]"
          />
          <button
            onClick={fetchCompetitors}
            disabled={loading || !activePropertyId}
            className="rounded-lg bg-gray-200 dark:bg-gray-700 px-4 py-2 text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            {loading ? "Nalaganje..." : "Naloži"}
          </button>
          {activePropertyId && (
            <>
              <button
                onClick={() => setAddModalOpen(true)}
                className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700"
              >
                + Dodaj konkurenta
              </button>
              <button
                onClick={handleRefresh}
                disabled={refreshLoading || competitors.length === 0}
                className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
              >
                {refreshLoading ? "Posodabljam..." : "Posodobi cene"}
              </button>
            </>
          )}
        </div>
      </div>

      {activePropertyId && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
          <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3">Predlog cene (AI)</h2>
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Od</label>
              <input
                type="date"
                value={recCheckIn}
                onChange={(e) => setRecCheckIn(e.target.value)}
                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Do</label>
              <input
                type="date"
                value={recCheckOut}
                onChange={(e) => setRecCheckOut(e.target.value)}
                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
              />
            </div>
            <button
              onClick={handleGetRecommendation}
              disabled={recLoading || !recCheckIn || !recCheckOut}
              className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {recLoading ? "Predlagam..." : "Predlagaj ceno"}
            </button>
          </div>
          {recResult && (
            <div className="mt-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="flex flex-wrap gap-4 mb-2">
                <span className="font-semibold text-gray-900 dark:text-white">
                  Priporočena cena: €{recResult.recommendedPrice}/noč
                </span>
                <span className="text-sm text-gray-500">
                  Trenutna: €{recResult.currentPrice} ({recResult.nights} noči)
                </span>
                {recResult.competitorAvg != null && (
                  <span className="text-sm text-gray-500">
                    Konkurenca povpr.: €{recResult.competitorAvg}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">{recResult.suggestion}</p>
            </div>
          )}
        </div>
      )}

      {marketAnalysis && marketAnalysis.avgPrice > 0 && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
          <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">Tržna analiza</h2>
          <div className="flex flex-wrap gap-6">
            <div>
              <span className="text-sm text-gray-500">Povp. cena:</span>
              <span className="ml-2 font-bold text-lg">€{marketAnalysis.avgPrice.toLocaleString()}</span>
            </div>
            {marketAnalysis.recommendations?.[0] && (
              <p className="text-sm text-gray-600 dark:text-gray-400">{marketAnalysis.recommendations[0]}</p>
            )}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Nalaganje...</div>
        ) : !activePropertyId ? (
          <div className="p-8 text-center text-gray-500">
            Izberite nastanitev in vnesite lokacijo za prikaz konkurenčnih cen.
          </div>
        ) : competitors.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Ni sledenih konkurentov. Kliknite &quot;Dodaj konkurenta&quot; za začetek.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">Konkurent</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">Trenutna cena</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">Trend</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">Zadnja posodobitev</th>
                  <th className="w-20" />
                </tr>
              </thead>
              <tbody>
                {competitors.map((c) => (
                  <tr key={c.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3">
                      <a
                        href={c.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                      >
                        {c.name}
                      </a>
                    </td>
                    <td className="px-4 py-3">{c.currentPrice != null ? `€${c.currentPrice}` : "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 ${c.priceTrend === "up"
                          ? "text-red-600 dark:text-red-400"
                          : c.priceTrend === "down"
                            ? "text-green-600 dark:text-green-400"
                            : "text-gray-500"
                          }`}
                      >
                        {trendIcon(c.priceTrend)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {c.lastUpdated ? new Date(c.lastUpdated).toLocaleDateString("sl-SI") : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Odstrani
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {addModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Dodaj konkurenta</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ime</label>
                <input
                  type="text"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="npr. Apartma XYZ"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Platforma (opcijsko)</label>
                <input
                  type="text"
                  value={addPlatform}
                  onChange={(e) => setAddPlatform(e.target.value)}
                  placeholder="Booking.com, Airbnb..."
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL strani s cenami</label>
                <input
                  type="url"
                  value={addUrl}
                  onChange={(e) => setAddUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setAddModalOpen(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Prekliči
              </button>
              <button
                onClick={handleAdd}
                disabled={addLoading}
                className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {addLoading ? "Dodajanje..." : "Dodaj"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
