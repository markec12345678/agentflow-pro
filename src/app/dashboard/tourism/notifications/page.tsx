"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { PropertySelector } from "@/web/components/PropertySelector";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = () => {
    setLoading(true);
    const url = `/api/tourism/notifications?limit=50${propertyId ? `&propertyId=${propertyId}` : ""}`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      })
      .catch(() => {
        toast.error("Napaka pri nalaganju obvestil");
        setNotifications([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchNotifications();
  }, [propertyId]);

  const markAsRead = async (id: string) => {
    try {
      await fetch("/api/tourism/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      toast.error("Napaka");
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch("/api/tourism/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: "all" }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      toast.success("Vsa obvestila označena kot prebrana");
    } catch {
      toast.error("Napaka");
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await fetch(`/api/tourism/notifications?id=${id}`, { method: "DELETE" });
      const wasUnread = notifications.find((n) => n.id === id)?.read === false;
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (wasUnread) setUnreadCount((prev) => Math.max(0, prev - 1));
      toast.success("Obvestilo odstranjeno");
    } catch {
      toast.error("Napaka");
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "warning":
        return "⚠️";
      case "error":
        return "❌";
      case "success":
        return "✅";
      default:
        return "ℹ️";
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Obvestila
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Vsa obvestila za vaše nastanitve na enem mestu
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <PropertySelector value={propertyId} onChange={setPropertyId} />
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Označi vsa kot prebrana
            </button>
          )}
          <Link
            href="/dashboard/tourism"
            className="rounded-lg bg-gray-200 dark:bg-gray-700 px-4 py-2 text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Nazaj na pregled
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Nalaganje...</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="text-4xl mb-2">🔔</div>
            <p>Ni obvestil.</p>
            <p className="text-sm mt-1">Tu bodo prikazana obvestila o rezervacijah, gostih in drugih dogodkih.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {notifications.map((n) => (
              <li
                key={n.id}
                className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                  !n.read ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
                }`}
              >
                <span className="text-xl mt-0.5">{getTypeIcon(n.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={`font-medium ${!n.read ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400"}`}>
                        {n.title}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{n.message}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-gray-400">
                        {new Date(n.createdAt).toLocaleDateString("sl-SI")}
                      </span>
                      {!n.read && (
                        <button
                          onClick={() => markAsRead(n.id)}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Prebrano
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(n.id)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Izbriši
                      </button>
                    </div>
                  </div>
                  {n.link && (
                    <Link
                      href={n.link}
                      className="inline-block mt-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Odpri →
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
