"use client";

import { useState } from "react";
import Link from "next/link";

export default function PersonalizePage() {
  const [template, setTemplate] = useState(
    "Hi {{name}}, we have a solution for {{industry}} companies like {{company}}."
  );
  const [dataInput, setDataInput] = useState(
    '[\n  { "name": "Jane", "company": "Acme", "industry": "SaaS" },\n  { "name": "John", "company": "Beta", "industry": "E-commerce" }\n]'
  );
  const [results, setResults] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePersonalize = async () => {
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      let data: Record<string, string>[];
      try {
        data = JSON.parse(dataInput) as Record<string, string>[];
      } catch {
        setError("Invalid JSON. Use format: [{ \"name\": \"...\", \"company\": \"...\" }, ...]");
        setLoading(false);
        return;
      }
      if (!Array.isArray(data)) {
        setError("Data must be an array of objects");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/personalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template, data }),
      });
      const out = (await res.json()) as { results?: string[]; error?: string };
      if (!res.ok) {
        const err = out.error;
        setError(typeof err === "object" && err && 'message' in err ? (err as { message: string }).message : (typeof err === "string" ? err : "Personalization failed"));
        setLoading(false);
        return;
      }
      setResults(out.results ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:underline">
            ← Home
          </Link>
        </div>
        <h1 className="text-3xl font-bold dark:text-white mb-2">
          Personalization
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Paste a template with placeholders like{" "}
          <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">
            {"{{name}}"}
          </code>{" "}
          and a JSON array of data. Get personalized content for each row.
        </p>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium dark:text-gray-300 mb-2">
              Template
            </label>
            <textarea
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
              placeholder="Hi {{name}}, welcome to {{company}}..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium dark:text-gray-300 mb-2">
              Data (JSON array)
            </label>
            <textarea
              value={dataInput}
              onChange={(e) => setDataInput(e.target.value)}
              rows={8}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
              placeholder='[{ "name": "Jane", "company": "Acme" }, ...]'
            />
          </div>

          <button
            type="button"
            onClick={handlePersonalize}
            disabled={loading}
            className="rounded-lg bg-green-600 px-6 py-3 font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Personalizing…" : "Personalize"}
          </button>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          {results.length > 0 && (
            <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-lg">
              <h2 className="text-lg font-semibold dark:text-white mb-4">
                Results ({results.length})
              </h2>
              <div className="space-y-3">
                {results.map((r, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm dark:text-gray-200"
                  >
                    {r}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
