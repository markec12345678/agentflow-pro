"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Post {
  id: string;
  title: string | null;
  topic: string | null;
  type?: string;
  createdAt: string;
}

const TYPE_LABELS: Record<string, { icon: string; label: string }> = {
  "booking-description": { icon: "📋", label: "Booking opis" },
  "guest-welcome-email": { icon: "📧", label: "Email" },
  "destination-guide":   { icon: "📍", label: "Vodič" },
  "instagram-travel":    { icon: "📱", label: "Social" },
  "landing-page":        { icon: "🌐", label: "Landing" },
  "seasonal-campaign":   { icon: "🎄", label: "Kampanja" },
  "blog":                { icon: "📝", label: "Blog" },
};

function typeInfo(type?: string | null) {
  return TYPE_LABELS[type ?? ""] ?? { icon: "📄", label: type ?? "Vsebina" };
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "pravkar";
  if (m < 60) return `pred ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `pred ${h} ur`;
  const d = Math.floor(h / 24);
  if (d === 1) return "včeraj";
  if (d < 7) return `pred ${d} dni`;
  return new Date(dateStr).toLocaleDateString("sl-SI");
}

export default function ContentPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("vse");

  useEffect(() => {
    fetch("/api/content/history")
      .then(r => r.json())
      .then(data => {
        if (data.posts) setPosts(data.posts);
      })
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  const types = ["vse", ...Array.from(new Set(posts.map(p => p.type ?? "").filter(Boolean)))];

  const filtered = posts.filter(p => {
    const matchSearch = !search || (p.title ?? p.topic ?? "").toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "vse" || p.type === filterType;
    return matchSearch && matchType;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">📁</div>
          <p className="text-gray-500">Nalagam vsebino...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">📁 Moja vsebina</h1>
            <p className="text-gray-500 text-sm mt-1">
              {posts.length > 0 ? `${posts.length} kosov vsebine` : "Zaenkrat brez vsebine"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {posts.length > 0 && (
              <a
                href="/api/content/export?format=json"
                download
                className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                ⬇️ Izvozi
              </a>
            )}
            <Link
              href="/generate"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-all flex items-center gap-2"
            >
              <span>+</span>
              Nova vsebina
            </Link>
          </div>
        </div>

        {posts.length === 0 ? (
          /* Prazno stanje */
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-16 text-center">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Še nimate nobene vsebine
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto">
              Začnite z ustvarjanjem vsebine za vašo nastanitev. Hitro, enostavno, profesionalno.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {[
                { href: "/generate?template=booking-description", icon: "📋", label: "Booking opis" },
                { href: "/generate?template=guest-welcome-email", icon: "📧", label: "Email za goste" },
                { href: "/generate?template=instagram-travel",    icon: "📱", label: "Social post" },
              ].map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 px-5 py-3 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-xl font-semibold text-sm transition-all border border-blue-200 dark:border-blue-700"
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Iskanje + filter */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Išči vsebino..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {types.map(t => {
                  const info = t === "vse" ? { icon: "📋", label: "Vse" } : typeInfo(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFilterType(t)}
                      className={`px-3 py-2 text-xs rounded-xl font-semibold transition-all border ${
                        filterType === t
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:border-blue-400"
                      }`}
                    >
                      {info.icon} {info.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Rezultati iskanja */}
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-4xl mb-2">🔍</p>
                <p>Ni rezultatov za "{search}"</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map(post => {
                  const info = typeInfo(post.type);
                  return (
                    <div
                      key={post.id}
                      className="flex items-center gap-4 bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-gray-700 group"
                    >
                      {/* Ikona */}
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-2xl">
                        {info.icon}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {post.title ?? post.topic ?? "Brez naslova"}
                        </h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg">
                            {info.label}
                          </span>
                          <span className="text-xs text-gray-400">
                            {timeAgo(post.createdAt)}
                          </span>
                        </div>
                      </div>

                      {/* Akcije */}
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                          href={`/content/${post.id}`}
                          className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                          Odpri →
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Stats na dnu */}
            <div className="mt-8 flex justify-center">
              <Link
                href="/generate"
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all"
              >
                + Ustvari novo vsebino
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
