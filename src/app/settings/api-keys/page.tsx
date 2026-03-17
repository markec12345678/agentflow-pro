"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function ApiKeysPage() {
  const { data: session, status } = useSession();
  const [keys, setKeys] = useState({
    firecrawl: "",
    context7: "",
    openai: "",
    gemini: "",
    github: "",
    serpapi: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [userIndustry, setUserIndustry] = useState<string | null>(null);
  const [showAdvancedKeys, setShowAdvancedKeys] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      window.location.href = "/login";
      return;
    }
    if (status !== "authenticated") return;

    Promise.all([
      fetch("/api/v1/user/keys").then((r) => r.json()),
      fetch("/api/onboarding").then((r) => r.json()),
    ])
      .then(([keysData, onboardingData]) => {
        if (!keysData.error) {
          setKeys({
            firecrawl: keysData.firecrawl ?? "",
            context7: keysData.context7 ?? "",
            openai: keysData.openai ?? "",
            gemini: keysData.gemini ?? "",
            github: keysData.github ?? "",
            serpapi: keysData.serpapi ?? "",
          });
        }
        if (!onboardingData.error && onboardingData.onboarding?.industry) {
          setUserIndustry(onboardingData.onboarding.industry);
        }
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
      if (keys.openai.trim() && !keys.openai.includes("*"))
        body.openai = keys.openai.trim();
      if (keys.gemini.trim() && !keys.gemini.includes("*"))
        body.gemini = keys.gemini.trim();
      if (keys.github.trim() && !keys.github.includes("*"))
        body.github = keys.github.trim();
      if (keys.serpapi.trim() && !keys.serpapi.includes("*"))
        body.serpapi = keys.serpapi.trim();

      const res = await fetch("/api/v1/user/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        const err = data.error;
        setMessage(typeof err === "object" && err?.message ? err.message : (typeof err === "string" ? err : "Failed to save"));
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
            {userIndustry === "tourism" || userIndustry === "travel-agency"
              ? "Odprite ključe za AI generiranje vsebin. OpenAI je obvezen za generiranje besedil."
              : "Add your own API keys for external services. You only pay for your own usage. We never store your keys unencrypted."}
          </p>
        </div>

        <div className="space-y-6">
          {(userIndustry === "tourism" || userIndustry === "travel-agency") ? (
            <>
              {/* Tourism: OpenAI first */}
              <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
                <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                  OpenAI API Key
                  <span className="ml-2 text-xs text-gray-500">(obvezen za AI generiranje)</span>
                </label>
                <input
                  type="password"
                  value={keys.openai}
                  onChange={(e) => setKeys((prev) => ({ ...prev, openai: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="sk-..."
                />
                <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400">
                  Ustvari ključ →
                </a>
              </div>
              {/* Firecrawl */}
              <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
                <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                  Firecrawl API Key
                  <span className="ml-2 text-xs text-gray-500">(500 strani/mesec brezplačno, opcijsko)</span>
                </label>
                <input
                  type="password"
                  value={keys.firecrawl}
                  onChange={(e) => setKeys((prev) => ({ ...prev, firecrawl: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="fc_..."
                />
                <a href="https://www.firecrawl.dev/app/api-keys" target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400">
                  Ustvari ključ →
                </a>
              </div>
              {/* Gemini */}
              <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
                <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                  Google Gemini API Key
                  <span className="ml-2 text-xs text-gray-500">(opcijsko, brezplačna kvota)</span>
                </label>
                <input
                  type="password"
                  value={keys.gemini}
                  onChange={(e) => setKeys((prev) => ({ ...prev, gemini: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="AIza..."
                />
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400">
                  Ustvari ključ (Google AI Studio) →
                </a>
              </div>
              {/* Collapsible: Za razvijalce */}
              <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800/50">
                <button
                  type="button"
                  onClick={() => setShowAdvancedKeys((v) => !v)}
                  className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  <span>{showAdvancedKeys ? "▲" : "▼"}</span>
                  <span>Napredne integracije (Za razvijalce)</span>
                </button>
                {showAdvancedKeys && (
                  <div className="mt-4 space-y-4">
                    <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
                      <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">Context7 API Key</label>
                      <input type="password" value={keys.context7} onChange={(e) => setKeys((prev) => ({ ...prev, context7: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-4 py-3 dark:border-gray-600 dark:bg-gray-700 dark:text-white" placeholder="c7_..." />
                      <a href="https://context7.com" target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400">Get your API key →</a>
                    </div>
                    <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
                      <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">GitHub Personal Access Token</label>
                      <input type="password" value={keys.github} onChange={(e) => setKeys((prev) => ({ ...prev, github: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-4 py-3 dark:border-gray-600 dark:bg-gray-700 dark:text-white" placeholder="ghp_..." />
                      <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400">Create token →</a>
                    </div>
                    <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
                      <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">SerpAPI Key</label>
                      <input type="password" value={keys.serpapi} onChange={(e) => setKeys((prev) => ({ ...prev, serpapi: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-4 py-3 dark:border-gray-600 dark:bg-gray-700 dark:text-white" placeholder="Get key at serpapi.com/manage-api-key" />
                      <a href="https://serpapi.com/manage-api-key" target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400">Get your API key →</a>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Non-tourism: original order */}
              <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
                <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">Firecrawl API Key <span className="ml-2 text-xs text-gray-500">(500 pages/month free)</span></label>
                <input type="password" value={keys.firecrawl} onChange={(e) => setKeys((prev) => ({ ...prev, firecrawl: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-4 py-3 dark:border-gray-600 dark:bg-gray-700 dark:text-white" placeholder="fc_..." />
                <a href="https://www.firecrawl.dev/app/api-keys" target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400">Get your free API key →</a>
              </div>
              <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
                <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">Context7 API Key</label>
                <input type="password" value={keys.context7} onChange={(e) => setKeys((prev) => ({ ...prev, context7: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-4 py-3 dark:border-gray-600 dark:bg-gray-700 dark:text-white" placeholder="c7_..." />
                <a href="https://context7.com" target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400">Get your API key →</a>
              </div>
              <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
                <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">OpenAI API Key <span className="ml-2 text-xs text-gray-500">(LLM, DALL-E)</span></label>
                <input type="password" value={keys.openai} onChange={(e) => setKeys((prev) => ({ ...prev, openai: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-4 py-3 dark:border-gray-600 dark:bg-gray-700 dark:text-white" placeholder="sk-..." />
                <p className="mt-1 text-xs text-gray-500">Ali dodaj OPENAI_API_KEY v .env – ostane trajno</p>
              </div>
              <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
                <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">Google Gemini API Key <span className="ml-2 text-xs text-gray-500">(LLM, brezplačna kvota)</span></label>
                <input type="password" value={keys.gemini} onChange={(e) => setKeys((prev) => ({ ...prev, gemini: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-4 py-3 dark:border-gray-600 dark:bg-gray-700 dark:text-white" placeholder="AIza..." />
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400">Ustvari ključ (Google AI Studio) →</a>
                <p className="mt-1 text-xs text-gray-500">Ali dodaj GEMINI_API_KEY v .env – ne izgubi se, trajno</p>
              </div>
              <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
                <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">GitHub Personal Access Token <span className="ml-2 text-xs text-gray-500">(100% free)</span></label>
                <input type="password" value={keys.github} onChange={(e) => setKeys((prev) => ({ ...prev, github: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-4 py-3 dark:border-gray-600 dark:bg-gray-700 dark:text-white" placeholder="ghp_..." />
                <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400">Create your free token →</a>
              </div>
              <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
                <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">SerpAPI Key <span className="ml-2 text-xs text-gray-500">(100 searches/month free)</span></label>
                <input type="password" value={keys.serpapi} onChange={(e) => setKeys((prev) => ({ ...prev, serpapi: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-4 py-3 dark:border-gray-600 dark:bg-gray-700 dark:text-white" placeholder="Get key at serpapi.com/manage-api-key" />
                <a href="https://serpapi.com/manage-api-key" target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400">Get your API key →</a>
              </div>
            </>
          )}

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
