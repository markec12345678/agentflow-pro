"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Skeleton } from "@/web/components/Skeleton";
import { EturizemCheckInModal } from "@/web/components/EturizemCheckInModal";

interface TodayItem {
  id: string;
  guestId?: string | null;
  guestName: string;
  guestPhone?: string | null;
  guestEmail?: string | null;
  guest?: {
    id: string;
    name: string;
    dateOfBirth: string | null;
    countryCode: string | null;
    documentType: string | null;
    documentId: string | null;
    gender: string | null;
  } | null;
  propertyName: string;
  propertyId?: string;
  checkIn?: string;
  checkOut?: string;
  eturizemSubmittedAt?: string | null;
}

function toWhatsAppUrl(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  const num = digits.startsWith("386") ? digits : digits.startsWith("0") ? "386" + digits.slice(1) : "386" + digits;
  return `https://wa.me/${num}`;
}

interface TodayOverviewData {
  date: string;
  arrivals: TodayItem[];
  departures: TodayItem[];
  inHouse: TodayItem[];
  counts: { arrivals: number; departures: number; inHouse: number };
  pendingPreArrivalCount?: number;
}

interface TodayOverviewProps {
  propertyId: string | null;
}

export function TodayOverview({ propertyId }: TodayOverviewProps) {
  const [data, setData] = useState<TodayOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<"arrivals" | "departures" | "inHouse" | null>(null);
  const [eturizemModalArrival, setEturizemModalArrival] = useState<TodayItem | null>(null);
  const [tomorrowCount, setTomorrowCount] = useState<number | null>(null);
  const [sendingWelcome, setSendingWelcome] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (propertyId) params.set("propertyId", propertyId);
    fetch(`/api/tourism/today-overview?${params.toString()}`)
      .then((r) => {
        if (!r.ok) throw new Error("Napaka pri nalaganju");
        return r.json();
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [propertyId]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (propertyId) params.set("propertyId", propertyId);
    fetch(`/api/tourism/send-welcome-tomorrow?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : { count: 0 }))
      .then((d) => setTomorrowCount(d.count))
      .catch(() => setTomorrowCount(0));
  }, [propertyId]);

  const handleSendWelcomeTomorrow = async () => {
    setSendingWelcome(true);
    try {
      const res = await fetch("/api/tourism/send-welcome-tomorrow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: propertyId ? JSON.stringify({ propertyId }) : "{}",
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && (json.queued > 0 || json.sent > 0)) {
        setTomorrowCount((c) => Math.max(0, (c ?? 0) - (json.sent ?? json.queued ?? 0)));
      }
    } finally {
      setSendingWelcome(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4">
        <Skeleton className="h-6 w-32 mb-3" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
        <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const formattedDate = new Date(data.date + "T12:00:00").toLocaleDateString("sl-SI", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const hasAny = data.counts.arrivals > 0 || data.counts.departures > 0 || data.counts.inHouse > 0;

  return (
    <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Danes: {formattedDate}
        </h2>
      </div>
      <div className="p-4 space-y-4">
        {(data.pendingPreArrivalCount ?? 0) > 0 && (
          <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 flex items-center justify-between gap-3">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              {data.pendingPreArrivalCount} pre-arrival čakata na odobritev
            </p>
            <Link
              href={
                propertyId
                  ? `/dashboard/tourism/guest-communication?propertyId=${propertyId}&type=pre-arrival`
                  : data.arrivals[0]?.propertyId
                    ? `/dashboard/tourism/guest-communication?propertyId=${data.arrivals[0].propertyId}&type=pre-arrival`
                    : "/dashboard/tourism/guest-communication?type=pre-arrival"
              }
              className="shrink-0 px-3 py-1.5 text-sm font-medium rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors"
            >
              Pošlji emaili →
            </Link>
          </div>
        )}
        {tomorrowCount != null && tomorrowCount > 0 && (
          <div className="rounded-lg bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 p-3 flex items-center justify-between gap-3">
            <p className="text-sm text-teal-800 dark:text-teal-200">
              Jutri prihaja {tomorrowCount} {tomorrowCount === 1 ? "gost" : "gostov"} – Pošlji dobrodošlico
            </p>
            <button
              type="button"
              onClick={handleSendWelcomeTomorrow}
              disabled={sendingWelcome}
              className="shrink-0 px-3 py-1.5 text-sm font-medium rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-60 transition-colors"
            >
              {sendingWelcome ? "Pošiljanje…" : "Pošlji dobrodošlico"}
            </button>
          </div>
        )}
        {!hasAny ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Ni prihodov, odhodov ali gostov v nastanitvi danes.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={() => setExpanded(expanded === "arrivals" ? null : "arrivals")}
                className="min-h-[120px] p-6 rounded-xl bg-linear-to-br from-emerald-500 to-teal-600 text-white text-left hover:shadow-lg motion-safe:hover:scale-[1.02] transition-all duration-200"
                aria-label={`Prihodov: ${data.counts.arrivals}`}
              >
                <svg className="w-8 h-8 mb-2 opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                <div className="text-4xl font-bold">{data.counts.arrivals}</div>
                <div className="text-sm font-medium text-white/90 mt-1">Prihodov</div>
              </button>
              <button
                onClick={() => setExpanded(expanded === "departures" ? null : "departures")}
                className="min-h-[120px] p-6 rounded-xl bg-linear-to-br from-orange-500 to-amber-600 text-white text-left hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
                aria-label={`Odhodov: ${data.counts.departures}`}
              >
                <svg className="w-8 h-8 mb-2 opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v7" />
                </svg>
                <div className="text-4xl font-bold">{data.counts.departures}</div>
                <div className="text-sm font-medium text-white/90 mt-1">Odhodov</div>
              </button>
              <button
                onClick={() => setExpanded(expanded === "inHouse" ? null : "inHouse")}
                className="min-h-[120px] p-6 rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 text-white text-left hover:shadow-lg motion-safe:hover:scale-[1.02] transition-all duration-200"
                aria-label={`V nastanitvi: ${data.counts.inHouse}`}
              >
                <svg className="w-8 h-8 mb-2 opacity-90" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <circle cx="12" cy="12" r="8" />
                </svg>
                <div className="text-4xl font-bold">{data.counts.inHouse}</div>
                <div className="text-sm font-medium text-white/90 mt-1">V nastanitvi</div>
              </button>
            </div>

            {expanded === "arrivals" && data.arrivals.length > 0 && (
              <div className="rounded-lg bg-gray-50 dark:bg-gray-800/80 p-3 space-y-2">
                {data.arrivals.map((a) => (
                  <div
                    key={a.id}
                    className="flex justify-between items-center gap-2 text-sm flex-wrap"
                  >
                    <span className="text-gray-900 dark:text-white font-medium">{a.guestName}</span>
                    <span className="flex items-center gap-2 flex-wrap">
                      {a.guestPhone && (
                        <a href={`tel:${a.guestPhone.trim()}`} className="text-blue-600 dark:text-blue-400 hover:underline" aria-label={`Pokliči ${a.guestName}`}>{a.guestPhone}</a>
                      )}
                      {a.guestEmail && (
                        <a href={`mailto:${a.guestEmail.trim()}`} className="text-blue-600 dark:text-blue-400 hover:underline" aria-label={`Email ${a.guestName}`}>{a.guestEmail}</a>
                      )}
                      {a.guestPhone && toWhatsAppUrl(a.guestPhone) && (
                        <a href={toWhatsAppUrl(a.guestPhone)} target="_blank" rel="noopener noreferrer" className="text-green-600 dark:text-green-400 hover:underline" aria-label={`WhatsApp ${a.guestName}`}>WhatsApp</a>
                      )}
                      <span className="text-gray-500 dark:text-gray-400">
                        {a.propertyName} · {a.checkIn}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            )}
            {expanded === "departures" && data.departures.length > 0 && (
              <div className="rounded-lg bg-gray-50 dark:bg-gray-800/80 p-3 space-y-2">
                {data.departures.map((d) => (
                  <div
                    key={d.id}
                    className="flex justify-between items-center gap-2 text-sm flex-wrap"
                  >
                    <span className="text-gray-900 dark:text-white font-medium">{d.guestName}</span>
                    <span className="flex items-center gap-2 flex-wrap">
                      {d.guestPhone && (
                        <a href={`tel:${d.guestPhone.trim()}`} className="text-blue-600 dark:text-blue-400 hover:underline" aria-label={`Pokliči ${d.guestName}`}>{d.guestPhone}</a>
                      )}
                      {d.guestEmail && (
                        <a href={`mailto:${d.guestEmail.trim()}`} className="text-blue-600 dark:text-blue-400 hover:underline" aria-label={`Email ${d.guestName}`}>{d.guestEmail}</a>
                      )}
                      {d.guestPhone && toWhatsAppUrl(d.guestPhone) && (
                        <a href={toWhatsAppUrl(d.guestPhone)} target="_blank" rel="noopener noreferrer" className="text-green-600 dark:text-green-400 hover:underline" aria-label={`WhatsApp ${d.guestName}`}>WhatsApp</a>
                      )}
                      <span className="text-gray-500 dark:text-gray-400">
                        {d.propertyName} · {d.checkOut}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            )}
            {expanded === "inHouse" && data.inHouse.length > 0 && (
              <div className="rounded-lg bg-gray-50 dark:bg-gray-800/80 p-3 space-y-2">
                {data.inHouse.map((h) => (
                  <div
                    key={h.id}
                    className="flex justify-between items-center gap-2 text-sm flex-wrap"
                  >
                    <span className="text-gray-900 dark:text-white font-medium">{h.guestName}</span>
                    <span className="flex items-center gap-2 flex-wrap">
                      {h.guestPhone && (
                        <a href={`tel:${h.guestPhone.trim()}`} className="text-blue-600 dark:text-blue-400 hover:underline" aria-label={`Pokliči ${h.guestName}`}>{h.guestPhone}</a>
                      )}
                      {h.guestEmail && (
                        <a href={`mailto:${h.guestEmail.trim()}`} className="text-blue-600 dark:text-blue-400 hover:underline" aria-label={`Email ${h.guestName}`}>{h.guestEmail}</a>
                      )}
                      {h.guestPhone && toWhatsAppUrl(h.guestPhone) && (
                        <a href={toWhatsAppUrl(h.guestPhone)} target="_blank" rel="noopener noreferrer" className="text-green-600 dark:text-green-400 hover:underline" aria-label={`WhatsApp ${h.guestName}`}>WhatsApp</a>
                      )}
                      <span className="text-gray-500 dark:text-gray-400">{h.propertyName}</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        <Link
          href="/dashboard/tourism/calendar"
          className="block text-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
        >
          Koledar →
        </Link>
      </div>

      {eturizemModalArrival && (
        <EturizemCheckInModal
          arrival={eturizemModalArrival}
          onClose={() => setEturizemModalArrival(null)}
          onSuccess={() => {
            setEturizemModalArrival(null);
            const params = new URLSearchParams();
            if (propertyId) params.set("propertyId", propertyId);
            fetch(`/api/tourism/today-overview?${params.toString()}`)
              .then((r) => (r.ok ? r.json() : data))
              .then(setData)
              .catch(() => { });
          }}
        />
      )}
    </div>
  );
}
