"use client";

import { useState } from "react";
import Link from "next/link";
import { PROMPTS, CATEGORY_LABELS, type PromptTemplate } from "@/data/prompts";

export default function PromptsPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const handleCopy = async (p: PromptTemplate) => {
    await navigator.clipboard.writeText(p.prompt);
    setCopiedId(p.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered =
    filter === "all"
      ? PROMPTS
      : PROMPTS.filter((p) => p.category === filter);

  const generateHref = (p: PromptTemplate) =>
    `/generate?topic=${encodeURIComponent(p.prompt)}`;

  const chatHref = (p: PromptTemplate) =>
    `/chat?prompt=${encodeURIComponent(p.prompt)}`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold dark:text-white mb-2">
          Prompt Library
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Template prompts to jumpstart your content. Copy to clipboard or use
          directly in Generate or Chat.
        </p>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === "all"
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
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === key
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold text-lg dark:text-white">
                  {p.name}
                </h3>
                <span className="shrink-0 px-2 py-0.5 text-xs font-medium rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                  {CATEGORY_LABELS[p.category]}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {p.description}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 font-mono bg-gray-100 dark:bg-gray-700/50 p-3 rounded-lg truncate max-h-16 overflow-hidden" title={p.prompt}>
                {p.prompt}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleCopy(p)}
                  className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  {copiedId === p.id ? "Copied!" : "Copy"}
                </button>
                <Link
                  href={generateHref(p)}
                  className="px-3 py-1.5 text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700"
                >
                  Use in Generate
                </Link>
                <Link
                  href={chatHref(p)}
                  className="px-3 py-1.5 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                >
                  Use in Chat
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
