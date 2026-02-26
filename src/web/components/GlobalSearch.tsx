"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface SearchResult {
  id: string;
  type: "reservation" | "guest" | "property" | "content" | "template";
  title: string;
  subtitle: string;
  url: string;
  icon: string;
}

interface GlobalSearchProps {
  propertyId?: string | null;
}

export function GlobalSearch({ propertyId }: GlobalSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  // Keyboard shortcut: Cmd/Ctrl + K to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `/api/tourism/search?q=${encodeURIComponent(searchQuery)}${propertyId ? `&propertyId=${propertyId}` : ""}`
      );
      const data = await res.json();
      setResults(data.results || []);
      setSelectedIndex(0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    const timeout = setTimeout(() => search(query), 200);
    return () => clearTimeout(timeout);
  }, [query, search]);

  const handleSelect = (result: SearchResult) => {
    setIsOpen(false);
    setQuery("");
    router.push(result.url);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        aria-label="Išči (Cmd+K)"
      >
        <span>🔍</span>
        <span className="hidden sm:inline">Išči...</span>
        <span className="hidden md:inline text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">
          ⌘K
        </span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50">
      <div className="w-full max-w-2xl mx-4 bg-white dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
          <span className="text-xl">🔍</span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Išči rezervacije, goste, nastanitve, vsebino..."
            className="flex-1 bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-500"
            autoFocus
          />
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            ESC
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
              Iskanje...
            </div>
          ) : results.length === 0 ? (
            query ? (
              <div className="p-8 text-center text-gray-500">
                Ni rezultatov za &quot;{query}&quot;
              </div>
            ) : (
              <div className="p-4">
                <p className="text-sm text-gray-500 mb-3">Hitri dostop:</p>
                <div className="grid grid-cols-2 gap-2">
                  <QuickLink href="/dashboard/tourism/calendar" icon="📅" label="Koledar" />
                  <QuickLink href="/dashboard/tourism/guest-communication" icon="💬" label="Komunikacija" />
                  <QuickLink href="/dashboard/tourism/analytics" icon="📊" label="Analitika" />
                  <QuickLink href="/dashboard/tourism/data-cleanup" icon="🧹" label="Čiščenje podatkov" />
                  <QuickLink href="/dashboard/tourism/generate" icon="✍️" label="Generiraj vsebino" />
                </div>
              </div>
            )
          ) : (
            <div className="py-2">
              {results.map((result, index) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleSelect(result)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${index === selectedIndex ? "bg-blue-50 dark:bg-blue-900/30" : ""
                    }`}
                >
                  <span className="text-2xl">{result.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 dark:text-white truncate">
                      {result.title}
                    </div>
                    <div className="text-sm text-gray-500 truncate">
                      {result.subtitle}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 uppercase">
                    {result.type}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 text-xs text-gray-500">
          <div className="flex gap-3">
            <span>↓↑ navigacija</span>
            <span>↵ izberi</span>
          </div>
          <span>{results.length} rezultatov</span>
        </div>
      </div>
    </div>
  );
}

function QuickLink({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
    >
      <span>{icon}</span>
      <span className="text-sm">{label}</span>
    </Link>
  );
}
