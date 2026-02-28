"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

interface NotificationSidePanelProps {
  propertyId?: string | null;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const STORAGE_KEY = "agentflow-notifications-panel-open";

export function NotificationSidePanel({ propertyId, isOpen: controlledOpen, onOpenChange }: NotificationSidePanelProps) {
  const [internalOpen, setInternalOpen] = useState(true);
  const isOpen = onOpenChange ? (controlledOpen ?? internalOpen) : internalOpen;

  const setIsOpen = (v: boolean | ((prev: boolean) => boolean)) => {
    const next = typeof v === "function" ? v(isOpen) : v;
    if (onOpenChange) {
      onOpenChange(next);
    } else {
      setInternalOpen(next);
    }
  };
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (onOpenChange) return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      setInternalOpen(stored !== "0");
    } catch {
      // ignore
    }
  }, [onOpenChange]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch(
          `/api/tourism/notifications?${propertyId ? `propertyId=${propertyId}&` : ""}limit=50`
        );
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      } catch {
        // Silent fail
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [propertyId]);

  const toggle = () => {
    const next = !isOpen;
    try {
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      // ignore
    }
    setIsOpen(next);
  };

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
      // Silent fail
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
    } catch {
      // Silent fail
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await fetch(`/api/tourism/notifications?id=${id}`, { method: "DELETE" });
      const wasUnread = notifications.find((n) => n.id === id)?.read === false;
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (wasUnread) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch {
      // Silent fail
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "reservation":
        return "📅";
      case "guest":
        return "👤";
      case "review":
        return "⭐";
      case "alert":
        return "🚨";
      case "message":
        return "💬";
      default:
        return "🔔";
    }
  };

  return (
    <>
      {/* Desktop: fixed side panel - hidden on mobile md:hidden for small screens */}
      <div className="hidden md:block fixed right-0 top-0 h-full z-40">
        {isOpen ? (
          <div className="w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 h-full flex flex-col shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 shrink-0">
              <h3 className="font-semibold text-gray-900 dark:text-white">Obvestila</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Vse prebrano
                  </button>
                )}
                <button
                  onClick={toggle}
                  className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Strni panel"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <span className="text-4xl mb-2 block">🔕</span>
                  <p className="text-sm">Ni novih obvestil</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${!n.read ? "bg-blue-50/50 dark:bg-blue-900/20" : ""
                      }`}
                  >
                    <span className="text-xl mt-0.5 shrink-0">{getIcon(n.type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-sm text-gray-900 dark:text-white">{n.title}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{n.message}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(n.createdAt).toLocaleString("sl-SI")}
                          </p>
                        </div>
                        <div className="flex flex-col gap-1 shrink-0">
                          {!n.read && (
                            <button
                              onClick={() => markAsRead(n.id)}
                              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              Preberi
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(n.id)}
                            className="text-xs text-gray-400 hover:text-red-500"
                          >
                            Izbriši
                          </button>
                        </div>
                      </div>
                      {n.link && (
                        <Link
                          href={n.link}
                          onClick={toggle}
                          className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-1 inline-block"
                        >
                          Odpri →
                        </Link>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 shrink-0 text-center">
              <Link
                href="/dashboard/tourism/notifications"
                onClick={toggle}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Vsa obvestila →
              </Link>
            </div>
          </div>
        ) : (
          <button
            onClick={toggle}
            className="w-12 h-full flex flex-col items-center justify-start pt-6 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            aria-label="Odpri obvestila"
          >
            <span className="text-2xl">🔔</span>
            {unreadCount > 0 && (
              <span className="mt-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        )}
      </div>
    </>
  );
}
