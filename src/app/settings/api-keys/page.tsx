"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function ApiKeysPage() {
  const { data: session, status } = useSession();
  const [keys, setKeys] = useState({
    firecrawl: "",
    context7: "",
    github: "",
    serpapi: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      window.location.href = "/login";
      return;
    }
    if (status !== "authenticated") return;

    fetch("/api/user/keys")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) return;
        setKeys({
          firecrawl: data.firecrawl ?? "",
          context7: data.context7 ?? "",
          github: data.github ?? "",
          serpapi: data.serpapi ?? "",
        });
      })
      .catch(() => { });
  }, [status]);

  const handleSave = async () => {
    setMessage(null);
    setSaving(true);
    try {
      const body: Record<string, string> = {};
      if (keys.firecrawl.trim() && !keys.firecrawl.includes("*"))
        body.firecrawl = keys.firecrawl.trim();
      if (keys.context7.trim() && !keys.context7.includes("*"))
        body.context7 = keys.context7.trim();
      if (keys.github.trim() && !keys.github.includes("*"))
        body.github = keys.github.trim();
      if (keys.serpapi.trim() && !keys.serpapi.includes("*"))
        body.serpapi = keys.serpapi.trim();

      const res = await fetch("/api/user/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Failed to save");
        return;
      }
      setMessage("API keys saved!");
    } catch {
      setMessage("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || !session) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex min-h-[50vh] items-center justify-center p-8">
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/settings"
          className="mb-6 inline-block text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          ← Back to Settings
        </Link>
        <h1 className="mb-8 text-3xl font-bold text-gray-900 dark:text-white">
          API Keys
        </h1>

        <div className="mb-8 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/30">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Bring Your Own Key (BYOK)</strong>
            <br />
            Add your own API keys for external services. You only pay for your
            own usage. We never store your keys unencrypted.
          </p>
        </div>

        <div className="space-y-6">
          {/* Firecrawl */}
          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
              Firecrawl API Key
              <span className="ml-2 text-xs text-gray-500">
                (500 pages/month free)
              </span>
            </label>
            <input
              type="password"
              value={keys.firecrawl}
              onChange={(e) =>
                setKeys((prev) => ({ ...prev, firecrawl: e.target.value }))
              }
              className="w-full rounded-lg border border-gray-300 px-4 py-3 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="fc_..."
            />
            <a
              href="https://www.firecrawl.dev/app/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
            >
              Get your free API key →
            </a>
          </div>

          {/* Context7 */}
          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
              Context7 API Key
            </label>
            <input
              type="password"
              value={keys.context7}
              onChange={(e) =>
                setKeys((prev) => ({ ...prev, context7: e.target.value }))
              }
              className="w-full rounded-lg border border-gray-300 px-4 py-3 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="c7_..."
            />
            <a
              href="https://context7.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
            >
              Get your API key →
            </a>
          </div>

          {/* GitHub */}
          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
              GitHub Personal Access Token
              <span className="ml-2 text-xs text-gray-500">(100% free)</span>
            </label>
            <input
              type="password"
              value={keys.github}
              onChange={(e) =>
                setKeys((prev) => ({ ...prev, github: e.target.value }))
              }
              className="w-full rounded-lg border border-gray-300 px-4 py-3 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="ghp_..."
            />
            <a
              href="https://github.com/settings/tokens"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
            >
              Create your free token →
            </a>
          </div>

          {/* SerpAPI */}
          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
              SerpAPI Key
              <span className="ml-2 text-xs text-gray-500">
                (100 searches/month free)
              </span>
            </label>
            <input
              type="password"
              value={keys.serpapi}
              onChange={(e) =>
                setKeys((prev) => ({ ...prev, serpapi: e.target.value }))
              }
              className="w-full rounded-lg border border-gray-300 px-4 py-3 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="Get key at serpapi.com/manage-api-key"
            />
            <a
              href="https://serpapi.com/manage-api-key"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
            >
              Get your API key →
            </a>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-lg bg-blue-600 py-4 text-lg font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save API Keys"}
          </button>

          {message && (
            <p
              className={
                message === "API keys saved!"
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }
            >
              {message}
            </p>
          )}

          {/* Security Note */}
          <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/30">
            <p className="text-sm text-green-800 dark:text-green-200">
              <strong>Security:</strong> Your API keys are encrypted and never
              shared. You only pay for your own usage.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
