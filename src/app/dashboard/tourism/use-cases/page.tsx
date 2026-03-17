"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

interface UseCaseItem {
  useCase: string;
  target: string;
  value: string;
  agents: string[];
  workflow: string;
  estimatedTime: string;
  output: string;
}

interface UseCasesData {
  title?: string;
  subtitle?: string;
  lastUpdated?: string;
  priorityMatrix?: {
    high?: UseCaseItem[];
    medium?: UseCaseItem[];
  };
  implementationDetails?: Record<string, { description: string; input?: string; process?: string[]; output?: string; useCase?: string }>;
  apiUsage?: Record<string, unknown>;
  businessValue?: Record<string, string>;
  roadmap?: Record<string, unknown>;
}

export default function TourismUseCasesPage() {
  const [data, setData] = useState<UseCasesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v1/tourism/use-cases")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Napaka"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="mx-auto max-w-4xl">
          <p className="text-gray-400">Nalaganje vodiča...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="mx-auto max-w-4xl">
          <p className="text-amber-400">{error}</p>
          <Link href="/dashboard/tourism" className="mt-4 inline-block text-blue-400 hover:underline">
            ← Nazaj na Tourism Hub
          </Link>
        </div>
      </div>
    );
  }

  const matrix = data?.priorityMatrix;
  const details = data?.implementationDetails;
  const business = data?.businessValue;
  const roadmap = data?.roadmap;

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="mx-auto max-w-4xl space-y-8">
        <Link
          href="/dashboard/tourism"
          className="inline-block text-gray-400 transition-colors hover:text-white"
        >
          ← Tourism Hub
        </Link>

        <header>
          <h1 className="text-3xl font-bold text-white">{data?.title ?? "Use Cases"}</h1>
          <p className="mt-2 text-gray-400">{data?.subtitle}</p>
          {data?.lastUpdated && (
            <p className="mt-1 text-sm text-gray-500">Zadnja posodobitev: {data.lastUpdated}</p>
          )}
        </header>

        {matrix && (
          <section className="rounded-lg border border-gray-700 bg-gray-800 p-6">
            <h2 className="mb-4 text-xl font-semibold text-white">Matrika prioritet</h2>
            {matrix.high && matrix.high.length > 0 && (
              <div className="mb-6">
                <h3 className="mb-2 text-sm font-medium uppercase text-green-400">Visoka prioriteta</h3>
                <ul className="space-y-3">
                  {matrix.high.map((item, i) => (
                    <li
                      key={i}
                      className="rounded border border-gray-600 bg-gray-700/50 p-4"
                    >
                      <div className="font-medium text-white">{item.useCase}</div>
                      <div className="mt-1 text-sm text-gray-400">
                        Cilj: {item.target} · Vrednost: {item.value} · Čas: {item.estimatedTime}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        Workflow: {item.workflow} · Agenti: {item.agents.join(", ")}
                      </div>
                      <div className="mt-1 text-sm text-gray-300">{item.output}</div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {matrix.medium && matrix.medium.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-medium uppercase text-amber-400">Srednja prioriteta</h3>
                <ul className="space-y-3">
                  {matrix.medium.map((item, i) => (
                    <li
                      key={i}
                      className="rounded border border-gray-600 bg-gray-700/50 p-4"
                    >
                      <div className="font-medium text-white">{item.useCase}</div>
                      <div className="mt-1 text-sm text-gray-400">
                        Cilj: {item.target} · Vrednost: {item.value} · Čas: {item.estimatedTime}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        Workflow: {item.workflow} · Agenti: {item.agents.join(", ")}
                      </div>
                      <div className="mt-1 text-sm text-gray-300">{item.output}</div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {details && Object.keys(details).length > 0 && (
          <section className="rounded-lg border border-gray-700 bg-gray-800 p-6">
            <h2 className="mb-4 text-xl font-semibold text-white">Implementacijski detajli</h2>
            <div className="space-y-4">
              {Object.entries(details).map(([key, d]) => (
                <div key={key} className="rounded border border-gray-600 p-4">
                  <h3 className="font-medium text-white capitalize">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </h3>
                  <p className="mt-2 text-sm text-gray-400">{d.description}</p>
                  {d.input && (
                    <p className="mt-1 text-xs text-gray-500"><span className="text-gray-500">Input:</span> {d.input}</p>
                  )}
                  {d.process && d.process.length > 0 && (
                    <ul className="mt-2 list-inside list-disc text-sm text-gray-400">
                      {d.process.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ul>
                  )}
                  {d.output && (
                    <p className="mt-2 text-sm text-gray-300"><span className="text-gray-500">Output:</span> {d.output}</p>
                  )}
                  {d.useCase && (
                    <p className="mt-1 text-xs text-gray-500">Use case: {d.useCase}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {data?.apiUsage && (
          <section className="rounded-lg border border-gray-700 bg-gray-800 p-6">
            <h2 className="mb-4 text-xl font-semibold text-white">API uporaba</h2>
            <pre className="overflow-x-auto rounded bg-gray-900 p-4 text-sm text-gray-300">
              {JSON.stringify(data.apiUsage, null, 2)}
            </pre>
          </section>
        )}

        {business && Object.keys(business).length > 0 && (
          <section className="rounded-lg border border-gray-700 bg-gray-800 p-6">
            <h2 className="mb-4 text-xl font-semibold text-white">Poslovna vrednost</h2>
            <ul className="space-y-2">
              {Object.entries(business).map(([key, value]) => (
                <li key={key} className="flex gap-2">
                  <span className="text-gray-500 capitalize shrink-0">
                    {key.replace(/([A-Z])/g, " $1").trim()}:
                  </span>
                  <span className="text-gray-300">{value}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {roadmap && (
          <section className="rounded-lg border border-gray-700 bg-gray-800 p-6">
            <h2 className="mb-4 text-xl font-semibold text-white">Roadmap</h2>
            <pre className="overflow-x-auto rounded bg-gray-900 p-4 text-sm text-gray-300">
              {JSON.stringify(roadmap, null, 2)}
            </pre>
          </section>
        )}
      </div>
    </div>
  );
}
