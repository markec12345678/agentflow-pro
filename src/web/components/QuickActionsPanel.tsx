"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

function toWhatsAppUrl(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  const num = digits.startsWith("386") ? digits : digits.startsWith("0") ? "386" + digits.slice(1) : "386" + digits;
  return `https://wa.me/${num}`;
}

interface QuickActionsPanelProps {
  propertyId: string | null;
  isReceptionMode?: boolean;
}

export function QuickActionsPanel({ propertyId, isReceptionMode }: QuickActionsPanelProps) {
  const [tomorrowCount, setTomorrowCount] = useState<number | null>(null);
  const [sendingWelcome, setSendingWelcome] = useState(false);
  const [todayArrivals, setTodayArrivals] = useState<{ guestPhone?: string | null }[]>([]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (propertyId) params.set("propertyId", propertyId);
    fetch(`/api/tourism/send-welcome-tomorrow?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : { count: 0 }))
      .then((d) => setTomorrowCount(d.count))
      .catch(() => setTomorrowCount(0));
  }, [propertyId]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (propertyId) params.set("propertyId", propertyId);
    fetch(`/api/tourism/today-overview?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : {}))
      .then((d) => setTodayArrivals(d.arrivals ?? []))
      .catch(() => setTodayArrivals([]));
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

  const handleWhatsAppAll = () => {
    const urls = todayArrivals
      .map((a) => a.guestPhone && toWhatsAppUrl(a.guestPhone))
      .filter((u): u is string => Boolean(u));
    const unique = [...new Set(urls)];
    unique.forEach((url, i) => {
      setTimeout(() => window.open(url, "_blank"), i * 300);
    });
  };

  const calendarHref = propertyId
    ? `/dashboard/tourism/calendar?propertyId=${propertyId}&open=new`
    : "/dashboard/tourism/calendar?open=new";
  const preArrivalHref = propertyId
    ? `/dashboard/tourism/guest-communication?propertyId=${propertyId}&type=pre-arrival`
    : "/dashboard/tourism/guest-communication?type=pre-arrival";

  const actions = [
    {
      id: "welcome",
      label: "Pošlji dobrodošlico jutrišnjim",
      sublabel: tomorrowCount != null && tomorrowCount > 0 ? `${tomorrowCount} gostov` : null,
      icon: "✉️",
      onClick: handleSendWelcomeTomorrow,
      disabled: sendingWelcome || (tomorrowCount ?? 0) === 0,
      variant: "primary" as const,
    },
    {
      id: "new-res",
      label: "Nova rezervacija",
      icon: "➕",
      href: calendarHref,
      variant: "default" as const,
    },
    {
      id: "eturizem",
      label: "eTurizem prijava",
      icon: "📋",
      href: preArrivalHref,
      variant: "default" as const,
    },
    {
      id: "invoice",
      label: "Izpiši račun",
      icon: "🧾",
      href: propertyId
        ? `/dashboard/tourism/calendar?propertyId=${propertyId}`
        : "/dashboard/tourism/calendar",
      variant: "default" as const,
    },
    {
      id: "whatsapp",
      label: "WhatsApp danes prihodom",
      sublabel: todayArrivals.length > 0 ? `${todayArrivals.length} gostov` : null,
      icon: "💬",
      onClick: handleWhatsAppAll,
      disabled: todayArrivals.filter((a) => a.guestPhone && toWhatsAppUrl(a.guestPhone)).length === 0,
      variant: "default" as const,
    },
  ];

  return (
    <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Hitre akcije</h2>
      </div>
      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {actions.map((a) => {
          const content = (
            <>
              <span className="text-2xl mb-1 block" aria-hidden>{a.icon}</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white block truncate">{a.label}</span>
              {a.sublabel && (
                <span className="text-xs text-gray-500 dark:text-gray-400 block truncate">{a.sublabel}</span>
              )}
            </>
          );
          const baseClass =
            "flex flex-col items-center justify-center p-4 rounded-xl border transition-all min-h-[100px] " +
            (a.variant === "primary"
              ? "bg-teal-600 border-teal-600 text-white hover:bg-teal-700 hover:border-teal-700"
              : "bg-gray-50 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-900/20");

          if (a.href) {
            return (
              <Link
                key={a.id}
                href={a.href}
                className={`${baseClass} ${a.disabled ? "opacity-50 pointer-events-none" : ""}`}
              >
                {content}
              </Link>
            );
          }
          return (
            <button
              key={a.id}
              type="button"
              onClick={a.onClick}
              disabled={a.disabled}
              className={`${baseClass} ${a.disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
            >
              {content}
              {a.id === "welcome" && sendingWelcome && (
                <span className="text-xs mt-1 animate-pulse">Pošiljanje…</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
