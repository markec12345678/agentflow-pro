"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface ApiKeyItem {
  id: string;
  name: string;
  createdAt: string;
  preview: string;
}

export default function PublicApiPage() {
  const { data: _session, status } = useSession();
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [keyName, setKeyName] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      window.location.href = "/login";
      return;
    }
    if (status !== "authenticated") return;

    fetch("/api/api-keys")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) return;
        setKeys(data.keys ?? []);
      })
      .catch(() => setKeys([]))
      .finally(() => setLoading(false));
  }, [status]);

  const handleCreate = async () => {
    setCreating(true);
    setNewKey(null);
    try {
      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: keyName.trim() || "API Key" }),
      });
      const data = (await res.json()) as { key?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to create");
      setNewKey(data.key ?? null);
      setKeyName("");
      const refetch = await fetch("/api/api-keys");
      const refreshed = await refetch.json();
      if (!refreshed.error) setKeys(refreshed.keys ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this API key? It will stop working immediately.")) return;
    try {
      await fetch(`/api/api-keys?id=${id}`, { method: "DELETE" });
      setKeys((prev) => prev.filter((k) => k.id !== id));
    } catch {
      // ignore
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/settings"
          className="text-blue-600 hover:underline dark:text-blue-400 mb-6 inline-block"
        >
          ← Settings
        </Link>
        <h1 className="text-2xl font-bold dark:text-white mb-2">
          Public API Keys
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Create API keys for external systems to call the AgentFlow Pro API.
          Use <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded-sm">Authorization: Bearer &lt;key&gt;</code> in requests.
        </p>

        <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-lg mb-8">
          <h2 className="text-lg font-semibold dark:text-white mb-4">
            Create new API key
          </h2>
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              placeholder="Key name (optional)"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <button
              type="button"
              onClick={handleCreate}
              disabled={creating}
              className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create"}
            </button>
          </div>
          {newKey && (
            <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                Copy your key now. It won&apos;t be shown again.
              </p>
              <code className="block break-all text-sm text-amber-900 dark:text-amber-100 bg-amber-100 dark:bg-amber-900/40 p-2 rounded-sm">
                {newKey}
              </code>
            </div>
          )}
        </div>

        <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-lg">
          <h2 className="text-lg font-semibold dark:text-white mb-4">
            Your API keys
          </h2>
          {keys.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">
              No API keys yet. Create one above.
            </p>
          ) : (
            <ul className="space-y-3">
              {keys.map((k) => (
                <li
                  key={k.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-4"
                >
                  <div>
                    <p className="font-medium dark:text-white">{k.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {k.preview} · {new Date(k.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(k.id)}
                    className="text-red-600 hover:text-red-500 text-sm font-medium"
                  >
                    Revoke
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
          <Link href="/docs/api" className="text-blue-600 hover:underline dark:text-blue-400">
            View API documentation →
          </Link>
        </p>
      </div>
    </main>
  );
}
