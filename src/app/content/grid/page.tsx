"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Post {
  id: string;
  title: string | null;
  topic: string | null;
  imageUrl?: string | null;
  pipelineStage?: string | null;
  createdAt: string;
}

export default function ContentGridPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [bulkTopics, setBulkTopics] = useState("");
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<"title" | "topic">("title");
  const [editValue, setEditValue] = useState("");

  const refetch = () => {
    fetch("/api/content/history")
      .then((r) => r.json())
      .then((data) => {
        if (data.posts) setPosts(data.posts);
      })
      .catch(() => setPosts([]));
  };

  useEffect(() => {
    refetch();
    setLoading(false);
  }, []);

  const handleBulkGenerate = async () => {
    const topics = bulkTopics
      .split("\n")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 50);
    if (topics.length === 0) return;
    setBulkGenerating(true);
    try {
      const res = await fetch("/api/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topics }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setBulkTopics("");
      refetch();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setBulkGenerating(false);
    }
  };

  const startEdit = (post: Post, field: "title" | "topic") => {
    setEditingId(post.id);
    setEditingField(field);
    setEditValue((field === "title" ? post.title : post.topic) ?? "");
  };

  const moveStage = async (postId: string, stage: string) => {
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

  const saveEdit = async () => {
    if (!editingId) return;
    const payload =
      editingField === "title"
        ? { title: editValue }
        : { topic: editValue };
    try {
      const res = await fetch(`/api/content/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Update failed");
      setPosts((prev) =>
        prev.map((p) =>
          p.id === editingId
            ? { ...p, [editingField]: editValue }
            : p
        )
      );
    } catch {
      alert("Update failed");
    } finally {
      setEditingId(null);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <p className="text-center text-gray-600 dark:text-gray-400">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold dark:text-white">Bulk Content Grid</h1>
          <Link
            href="/content"
            className="text-blue-600 hover:underline"
          >
            ← My Content
          </Link>
        </div>

        {/* Bulk Generate */}
        <div className="mb-8 rounded-xl bg-white dark:bg-gray-800 p-6 shadow-lg">
          <h2 className="text-lg font-semibold dark:text-white mb-3">
            Bulk Generate
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            Enter one topic per line (up to 50). Each topic generates one post.
          </p>
          <textarea
            value={bulkTopics}
            onChange={(e) => setBulkTopics(e.target.value)}
            placeholder="Topic 1&#10;Topic 2&#10;Topic 3"
            rows={4}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-3"
          />
          <button
            type="button"
            onClick={handleBulkGenerate}
            disabled={
              bulkGenerating ||
              !bulkTopics.trim().split("\n").filter((t) => t.trim()).length
            }
            className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {bulkGenerating ? "Generating…" : "Generate"}
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl bg-white dark:bg-gray-800 shadow-lg">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3 text-left text-sm font-semibold dark:text-white">
                  Topic
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold dark:text-white">
                  Title
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold dark:text-white">
                  Stage
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold dark:text-white">
                  Image
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold dark:text-white">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr
                  key={post.id}
                  className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="px-4 py-3">
                    {editingId === post.id && editingField === "topic" ? (
                      <input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={saveEdit}
                        onKeyDown={(e) =>
                          e.key === "Enter" && saveEdit()
                        }
                        autoFocus
                        className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEdit(post, "topic")}
                        className="text-left hover:underline text-gray-700 dark:text-gray-300"
                      >
                        {post.topic || "—"}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === post.id && editingField === "title" ? (
                      <input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={saveEdit}
                        onKeyDown={(e) =>
                          e.key === "Enter" && saveEdit()
                        }
                        autoFocus
                        className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEdit(post, "title")}
                        className="text-left hover:underline font-medium text-gray-900 dark:text-white"
                      >
                        {post.title || "—"}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-block px-2 py-0.5 text-xs rounded ${
                        post.pipelineStage === "published"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : post.pipelineStage === "review"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {post.pipelineStage || "draft"}
                    </span>
                    {post.pipelineStage === "draft" && (
                      <button
                        type="button"
                        onClick={() => moveStage(post.id, "review")}
                        className="ml-1 text-xs text-blue-600 hover:underline"
                      >
                        → Review
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {post.imageUrl ? (
                      <span className="text-green-600 dark:text-green-400 text-sm">
                        Yes
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">No</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-2 justify-end">
                      <Link
                        href={`/content/${post.id}`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/content/${post.id}`}
                        className="text-sm text-gray-600 hover:underline dark:text-gray-400"
                      >
                        Gen Image
                      </Link>
                      <Link
                        href={`/content/${post.id}?publish=1`}
                        className="text-sm text-green-600 hover:underline"
                      >
                        Publish
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {posts.length === 0 && (
          <p className="mt-6 text-center text-gray-500 dark:text-gray-400">
            No content yet. Use Bulk Generate above or{" "}
            <Link href="/generate" className="text-blue-600 hover:underline">
              Generate New
            </Link>
            .
          </p>
        )}
      </div>
    </main>
  );
}
