"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PROMPTS } from "@/data/prompts";

interface Post {
  id?: string;
  title: string;
  excerpt: string;
  fullContent?: string;
}

export default function GeneratePage() {
  const searchParams = useSearchParams();
  const [topic, setTopic] = useState("");
  const [audienceId, setAudienceId] = useState<string>("");
  const [audiences, setAudiences] = useState<{ id: string; name: string }[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    const template = searchParams.get("template");
    if (template) {
      const prompt = PROMPTS.find((p) => p.id === template);
      if (prompt) setTopic(prompt.prompt);
    } else {
      const t = searchParams.get("topic");
      if (t) setTopic(decodeURIComponent(t));
    }
  }, [searchParams]);

  useEffect(() => {
    fetch("/api/onboarding")
      .then((r) => r.json())
      .then((data) => {
        const list = (data.onboarding?.audiences ?? []).filter(
          (a: { id?: string; name?: string }) => a.id && a.name
        );
        setAudiences(list);
        if (list.length === 1) setAudienceId((prev) => (prev ? prev : list[0].id));
      })
      .catch(() => { });
  }, []);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setPosts([]);

    try {
      const useMock =
        typeof window !== "undefined" &&
        new URLSearchParams(window.location.search).get("mock") === "1";
      const response = await fetch("/api/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          count: 10,
          useMock,
          audienceId: audienceId || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Generation failed");
      }

      setPosts(data.posts ?? []);
    } catch (err) {
      console.error(err);
      setPosts([]);
      alert(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-12 text-center">
        <h1 className="text-4xl font-bold mb-4">
          Generate Blog Posts in One Click
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Enter a topic. Get 10 SEO-optimized blog posts. Powered by AgentFlow
          Pro&apos;s AI agents.
        </p>
      </div>

      {/* Input */}
      <div className="max-w-2xl mx-auto mb-8">
        <label className="block text-lg font-medium mb-2">
          What should we write about?
        </label>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g., AI automation for small businesses"
          className="w-full px-6 py-4 text-lg rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:border-green-500"
          data-testid="generate-topic-input"
        />
        {audiences.length > 0 && (
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">
              Target audience (optional)
            </label>
            <select
              value={audienceId}
              onChange={(e) => setAudienceId(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
            >
              <option value="">None</option>
              {audiences.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Generate Button */}
      <div className="text-center mb-12">
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !topic.trim()}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-xl px-12 py-5 rounded-lg font-bold transition-all transform hover:scale-105"
          data-testid="generate-posts-button"
        >
          {isGenerating
            ? "Generating 10 Posts..."
            : "Generate 10 Blog Posts"}
        </button>
      </div>

      {/* Results */}
      {posts.length > 0 && (
        <div className="max-w-6xl mx-auto" data-testid="posts-results">
          <h2 className="text-2xl font-bold mb-6">Your Blog Posts</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {posts.map((post, i) => (
              <div
                key={post.id ?? i}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
              >
                <h3 className="text-xl font-bold mb-2">{post.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  {post.excerpt}
                </p>
                {post.id ? (
                  <div className="flex gap-2">
                    <Link
                      href={`/content/${post.id}`}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      View Full →
                    </Link>
                    <Link
                      href={`/content/${post.id}?publish=1`}
                      className="text-green-600 hover:underline text-sm"
                    >
                      Publish
                    </Link>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}

      {posts.length > 0 && (
        <p className="text-center mt-6 mb-4">
          <Link
            href="/content"
            className="text-blue-600 hover:underline font-semibold"
          >
            View all in My Content →
          </Link>
        </p>
      )}

      {/* Advanced Mode Link */}
      <div className="text-center mt-12">
        <p className="text-gray-600 dark:text-gray-400 mb-2">
          Need more control?
        </p>
        <Link
          href="/workflows"
          className="text-blue-600 hover:underline font-semibold"
        >
          Open Advanced Workflow Builder →
        </Link>
      </div>
    </div>
  );
}
