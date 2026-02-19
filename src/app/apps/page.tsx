"use client";

import { useState } from "react";
import Link from "next/link";
import {
  WORKFLOW_APPS,
  CATEGORY_LABELS,
  getWorkflowAppById,
} from "@/data/workflow-apps";

export default function AppsPage() {
  const [filter, setFilter] = useState<string>("all");
  const [installing, setInstalling] = useState<string | null>(null);

  const filtered =
    filter === "all"
      ? WORKFLOW_APPS
      : WORKFLOW_APPS.filter((a) => a.category === filter);

  const handleInstall = async (appId: string) => {
    const app = getWorkflowAppById(appId);
    if (!app) return;
    setInstalling(appId);
    try {
      const workflowId = `app-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: workflowId,
          name: app.workflow.name,
          nodes: app.workflow.nodes,
          edges: app.workflow.edges,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Install failed");
      window.location.href = `/workflows?id=${data.id ?? workflowId}`;
    } catch (e) {
      alert(e instanceof Error ? e.message : "Install failed");
    } finally {
      setInstalling(null);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <Link
            href="/workflows"
            className="text-blue-600 hover:underline dark:text-blue-400"
          >
            ← Workflows
          </Link>
        </div>
        <h1 className="text-3xl font-bold dark:text-white mb-2">
          App Library
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Ready-made workflow templates. Install one to get started quickly.
        </p>

        <div className="flex flex-wrap gap-2 mb-8">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === "all"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
          >
            All
          </button>
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === key
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {filtered.map((app) => (
            <div
              key={app.id}
              className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <h2 className="text-xl font-bold dark:text-white">
                  {app.workflow.name}
                </h2>
                <span className="shrink-0 px-2 py-0.5 text-xs font-medium rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                  {CATEGORY_LABELS[app.category]}
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                {app.description}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
                {app.workflow.nodes.length} nodes • {app.workflow.edges.length}{" "}
                connections
              </p>
              <button
                type="button"
                onClick={() => handleInstall(app.id)}
                disabled={installing !== null}
                className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {installing === app.id ? "Installing..." : "Install"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
