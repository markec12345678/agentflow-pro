"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Post {
  id: string;
  title: string | null;
  topic: string | null;
  pipelineStage?: string | null;
  fullContent?: string | null;
  createdAt: string;
}

const STAGES = ["draft", "review", "published"] as const;

export default function ContentPipelinePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [bulkMoving, setBulkMoving] = useState<string | null>(null);

  const refetch = () => {
    return fetch("/api/content/history")
      .then((r) => r.json())
      .then((data) => {
        if (data.posts) setPosts(data.posts);
      })
      .catch(() => setPosts([]));
  };

  useEffect(() => {
    refetch().finally(() => setLoading(false));
  }, []);

  const postsByStage = STAGES.reduce(
    (acc, stage) => {
      acc[stage] = posts.filter(
        (p) => (p.pipelineStage || "draft") === stage
      );
      return acc;
    },
    {} as Record<string, Post[]>
  );

  const movePost = async (postId: string, stage: string) => {
    try {
      const res = await fetch(`/api/content/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pipelineStage: stage }),
      });
      if (!res.ok) return;
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, pipelineStage: stage } : p))
      );
    } catch {
      // ignore
    }
  };

  const bulkMove = async (fromStage: string, toStage: string) => {
    const toMove = postsByStage[fromStage] ?? [];
    if (toMove.length === 0) return;
    setBulkMoving(`${fromStage}->${toStage}`);
    try {
      await Promise.all(
        toMove.map((p) =>
          fetch(`/api/content/${p.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pipelineStage: toStage }),
          })
        )
      );
      await refetch();
    } finally {
      setBulkMoving(null);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <p className="text-center text-gray-600 dark:text-gray-400">
          Loading pipeline...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold dark:text-white">
            Content Pipeline
          </h1>
          <div className="flex gap-3">
            <Link
              href="/content"
              className="text-blue-600 hover:underline"
            >
              ← My Content
            </Link>
            <Link
              href="/content/grid"
              className="text-blue-600 hover:underline"
            >
              Grid View
            </Link>
            <Link
              href="/generate"
              className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700"
            >
              Generate New
            </Link>
          </div>
        </div>

        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Brief → Draft → Review → Publish. Drag content through stages or use
          bulk actions.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STAGES.map((stage) => {
            const items = postsByStage[stage] ?? [];
            const nextStage =
              stage === "draft" ? "review" : stage === "review" ? "published" : null;
            return (
              <div
                key={stage}
                className="rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 min-h-[400px] flex flex-col"
              >
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <h2 className="text-lg font-semibold capitalize dark:text-white">
                    {stage}
                  </h2>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {items.length}
                  </span>
                </div>
                {nextStage && items.length > 0 && (
                  <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => bulkMove(stage, nextStage)}
                      disabled={bulkMoving !== null}
                      className="text-sm text-blue-600 hover:underline disabled:opacity-50"
                    >
                      {bulkMoving === `${stage}->${nextStage}`
                        ? "Moving..."
                        : `Move all → ${nextStage}`}
                    </button>
                  </div>
                )}
                <div className="p-4 flex-1 overflow-y-auto space-y-3">
                  {items.map((post) => (
                    <div
                      key={post.id}
                      className="rounded-lg border border-gray-200 dark:border-gray-600 p-3 bg-gray-50 dark:bg-gray-900"
                    >
                      <Link
                        href={`/content/${post.id}`}
                        className="block font-medium text-gray-900 dark:text-white hover:underline truncate"
                      >
                        {post.title ?? post.topic ?? "Untitled"}
                      </Link>
                      {post.topic && post.topic !== post.title && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                          {post.topic}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-2">
                        {STAGES.filter((s) => s !== stage).map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => movePost(post.id, s)}
                            className="text-xs px-2 py-1 rounded-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                          >
                            → {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && (
                    <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                      No content
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 rounded-xl bg-white dark:bg-gray-800 p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold dark:text-white mb-2">
            Pipeline rules
          </h3>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>• Draft: Newly generated content. Edit, add images, run Optimize.</li>
            <li>• Review: Ready for human review. Use inline Improve/Expand/Shorten.</li>
            <li>• Published: Finalized. Publish to WordPress, Medium, LinkedIn, or Twitter.</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
