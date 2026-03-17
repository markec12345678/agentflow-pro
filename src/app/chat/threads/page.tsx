"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Thread {
  id: string;
  title: string | null;
  parentThreadId: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function ThreadsPage() {
  const [threads, setThreads] = useState<Thread[]>([]);

  useEffect(() => {
    fetch("/api/v1/chat/threads")
      .then((r) => r.json())
      .then((list: Thread[]) => setThreads(Array.isArray(list) ? list : []))
      .catch(() => setThreads([]));
  }, []);

  const byParent = new Map<string | null, Thread[]>();
  for (const t of threads) {
    const key = t.parentThreadId ?? null;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(t);
  }

  function ThreadTree({ parentId }: { parentId: string | null }) {
    const children = byParent.get(parentId) ?? [];
    if (children.length === 0) return null;
    return (
      <ul className="list-disc list-inside ml-4 space-y-1">
        {children.map((t) => (
          <li key={t.id}>
            <Link
              href={`/chat?threadId=${t.id}`}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              {t.title ?? `Thread ${t.id.slice(0, 8)}`}
            </Link>
            <span className="text-gray-500 text-sm ml-1">
              {new Date(t.updatedAt).toLocaleDateString()}
            </span>
            <ThreadTree parentId={t.id} />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold dark:text-white mb-2">
          Conversation Threads
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Uporabi &quot;Create branch&quot; v pogovoru za ustvarjanje vej.
        </p>
        <div className="rounded-xl bg-white dark:bg-gray-800 shadow-lg p-6">
          {threads.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">
              Ni shranjenih niti. Začni pogovor in uporabi Create branch.
            </p>
          ) : (
            <ThreadTree parentId={null} />
          )}
        </div>
        <p className="mt-6 text-center">
          <Link href="/chat" className="text-blue-600 hover:underline">
            ← Nazaj na Chat
          </Link>
        </p>
      </div>
    </main>
  );
}
