"use client";

import { useState, useEffect } from "react";

const ENTITY_TYPES = ["Agent", "Workflow", "Task", "User", "Deploy"];

interface GraphNode {
  name: string;
  entityType: string;
  observations: string[];
}

export default function MemoryPage() {
  const [entities, setEntities] = useState<GraphNode[]>([]);
  const [name, setName] = useState("");
  const [entityType, setEntityType] = useState("Agent");
  const [observations, setObservations] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchGraph() {
    try {
      const res = await fetch("/api/memory/graph");
      const data = await res.json();
      setEntities(data.entities ?? []);
    } catch {
      setEntities([]);
    }
  }

  useEffect(() => {
    fetchGraph();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const obs = observations.trim() ? observations.split("\n").map((s) => s.trim()).filter(Boolean) : [];
      const res = await fetch("/api/memory/entities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entities: [{ name, entityType, observations: obs }],
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "Failed to add entity");
        return;
      }
      setName("");
      setObservations("");
      await fetchGraph();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen p-8">
      <h1 className="mb-4 text-2xl font-bold">Knowledge Graph</h1>
      <form onSubmit={handleSubmit} className="mb-8 flex flex-col gap-4 max-w-md">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium">
            Entity name
          </label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded border border-gray-300 px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="type" className="mb-1 block text-sm font-medium">
            Type
          </label>
          <select
            id="type"
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2"
          >
            {ENTITY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="obs" className="mb-1 block text-sm font-medium">
            Observations (one per line)
          </label>
          <textarea
            id="obs"
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            rows={3}
            className="w-full rounded border border-gray-300 px-3 py-2"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Adding..." : "Add Entity"}
        </button>
      </form>
      <h2 className="mb-2 text-lg font-semibold">Entities</h2>
      <ul className="list-disc pl-6 space-y-1">
        {entities.map((e) => (
          <li key={e.name}>
            <strong>{e.name}</strong> ({e.entityType})
            {e.observations?.length ? `: ${e.observations.join(", ")}` : ""}
          </li>
        ))}
        {entities.length === 0 && <li className="text-gray-500">No entities yet</li>}
      </ul>
    </main>
  );
}
