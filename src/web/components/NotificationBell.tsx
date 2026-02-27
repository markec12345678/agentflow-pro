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

interface NotificationBellProps {
  propertyId?: string | null;
}

export function NotificationBell({ propertyId }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch(
          `/api/tourism/notifications?${propertyId ? `propertyId=${propertyId}&` : ""}limit=10`
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
      await fetch(`/api/tourism/notifications?id=${id}`, {
        method: "DELETE",
      });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      const wasUnread = notifications.find((n) => n.id === id)?.read === false;
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

  const handleClick = () => {
    if (typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches) {
      window.dispatchEvent(new CustomEvent("toggle-notification-panel"));
      return;
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label={`Obvestila (${unreadCount} neprebranih)`}
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-20 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <h3 className="font-semibold">Obvestila</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Označi vse kot prebrano
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <span className="text-4xl mb-2 block">🔕</span>
                  <p>Ni novih obvestil</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${!notification.read ? "bg-blue-50/50 dark:bg-blue-900/20" : ""
                      }`}
                  >
                    <span className="text-xl mt-0.5">
                      {getIcon(notification.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-sm">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(notification.createdAt).toLocaleString(
                              "sl-SI"
                            )}
                          </p>
                        </div>
                        <div className="flex flex-col gap-1">
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              Preberi
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="text-xs text-gray-400 hover:text-red-500"
                          >
                            Izbriši
                          </button>
                        </div>
                      </div>
                      {notification.link && (
                        <Link
                          href={notification.link}
                          onClick={() => setIsOpen(false)}
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

            {/* Footer */}
            <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-center">
              <Link
                href="/dashboard/tourism/notifications"
                onClick={() => setIsOpen(false)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Vsa obvestila →
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
