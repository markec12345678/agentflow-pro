"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

type GscSite = { siteUrl: string; permissionLevel: string };
type GscRow = { keyword: string; clicks: number; impressions: number; ctr: number; position: number };

const MOCK_SUGGESTIONS = [
  { priority: "high" as const, text: 'Dodaj "Bela krajina" v naslov Booking opisa' },
  { priority: "medium" as const, text: 'Vključi long-tail ključne besede: "apartma z bazenom Bela krajina"' },
  { priority: "low" as const, text: "Optimiziraj meta description za večji CTR" },
];

export default function TourismSeoDashboard() {
  const [gscConnected, setGscConnected] = useState(false);
  const [sites, setSites] = useState<GscSite[]>([]);
  const [selectedSite, setSelectedSite] = useState("");
  const [keywords, setKeywords] = useState<GscRow[]>([]);
  const [loadingKeywords, setLoadingKeywords] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/search-console/sites");
        const data = await res.json();
        if (!mounted) return;
        setGscConnected(!!data.connected);
        setSites(data.sites ?? []);
        if (data.sites?.length && !selectedSite) {
          setSelectedSite(data.sites[0].siteUrl);
        }
      } catch {
        if (mounted) setGscConnected(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const err = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "").get("error");
    if (err) toast.error(`Google Search Console: ${err}`);
  }, []);

  useEffect(() => {
    const ok = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "").get("gsc");
    if (ok === "ok") toast.success("Google Search Console povezan");
  }, []);

  useEffect(() => {
    if (!selectedSite || !gscConnected) return;
    let mounted = true;
    setLoadingKeywords(true);
    fetch(`/api/search-console/analytics?siteUrl=${encodeURIComponent(selectedSite)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!mounted || data.error) return;
        setKeywords(data.rows ?? []);
      })
      .catch(() => {})
      .finally(() => { if (mounted) setLoadingKeywords(false); });
    return () => { mounted = false; };
  }, [selectedSite, gscConnected]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 overflow-x-hidden">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          SEO Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Spremljaj ranking in optimiziraj vsebine za več direktnih rezervacij
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Ključne Besede
            </h2>
            {gscConnected && sites.length > 0 && (
              <select
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
                className="text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-1.5"
              >
                {sites.map((s) => (
                  <option key={s.siteUrl} value={s.siteUrl}>
                    {s.siteUrl}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="p-4">
            {!gscConnected ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Poveži Google Search Console za prikaz resničnih podatkov o rankingu.
                </p>
                <a
                  href="/api/auth/google-sc/connect"
                  className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
                >
                  Poveži Google Search Console
                </a>
              </div>
            ) : loadingKeywords ? (
              <p className="text-sm text-gray-500">Nalagam...</p>
            ) : keywords.length === 0 ? (
              <p className="text-sm text-gray-500">
                Ni podatkov za zadnjih 28 dni. Dodaj spletno mesto v Search Console in počakaj nekaj dni.
              </p>
            ) : (
              <div className="space-y-4">
                {keywords.map((item) => (
                  <div
                    key={item.keyword}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                  >
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {item.keyword}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Impresije: {item.impressions} • Klikov: {item.clicks} • CTR: {(item.ctr * 100).toFixed(2)}%
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`font-bold ${
                          item.position <= 3
                            ? "text-emerald-500"
                            : item.position <= 10
                            ? "text-amber-500"
                            : "text-red-500"
                        }`}
                      >
                        #{item.position.toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        na Google
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {gscConnected && (
              <form
                method="post"
                action="/api/auth/connections"
                className="mt-4"
              >
                <input type="hidden" name="_method" value="DELETE" />
                <input type="hidden" name="provider" value="google_search_console" />
                <button
                  type="button"
                  onClick={async () => {
                    const res = await fetch("/api/auth/connections?provider=google_search_console", {
                      method: "DELETE",
                    });
                    if (res.ok) {
                      setGscConnected(false);
                      setSites([]);
                      setKeywords([]);
                      toast.success("Odpojeno");
                    }
                  }}
                  className="mt-4 text-sm text-amber-600 dark:text-amber-400 hover:underline"
                >
                  Odstrani povezavo
                </button>
            )}
          </div>
        </div>

        <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Predlogi za Izboljšave
            </h2>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {MOCK_SUGGESTIONS.map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <span
                    className={`mt-2 shrink-0 w-2 h-2 rounded-full ${
                      item.priority === "high"
                        ? "bg-red-500"
                        : item.priority === "medium"
                        ? "bg-amber-500"
                        : "bg-green-500"
                    }`}
                    aria-hidden
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900 dark:text-white">
                      {item.text}
                    </div>
                    <button
                      type="button"
                      disabled
                      className="mt-1 text-sm text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Optimiziraj z AI →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
