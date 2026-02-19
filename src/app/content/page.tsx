"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Post {
  id: string;
  title: string | null;
  topic: string | null;
  createdAt: string;
}

export default function ContentPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/content/history")
      .then((r) => r.json())
      .then((data) => {
        if (data.posts) setPosts(data.posts);
      })
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <p className="text-center text-gray-600 dark:text-gray-400">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold dark:text-white">My Content</h1>
          <div className="flex gap-3">
            {posts.length > 0 && (
              <>
                <a
                  href="/api/content/export?format=markdown"
                  download
                  className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Export (.md)
                </a>
                <a
                  href="/api/content/export?format=json"
                  download
                  className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Export (.json)
                </a>
              </>
            )}
            <Link
              href="/content/grid"
              className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Grid View
            </Link>
            <Link
              href="/content/pipeline"
              className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Pipeline
            </Link>
            <Link
              href="/generate"
              className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700"
            >
              Generate New
            </Link>
          </div>
        </div>

        {posts.length === 0 ? (
          <div className="rounded-xl bg-white dark:bg-gray-800 p-12 text-center shadow-lg">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No content yet. Generate your first blog posts to get started.
            </p>
            <Link
              href="/generate"
              className="inline-block rounded-lg bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700"
            >
              Generate 10 Blog Posts
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-lg"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold dark:text-white mb-1">
                      {post.title ?? "Untitled"}
                    </h2>
                    {post.topic && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Topic: {post.topic}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Link
                    href={`/content/${post.id}`}
                    className="text-blue-600 hover:underline text-sm font-medium flex-shrink-0"
                  >
                    View →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="mt-8 text-center text-sm text-gray-500">
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            Back to Dashboard
          </Link>
        </p>
      </div>
    </main>
  );
}
