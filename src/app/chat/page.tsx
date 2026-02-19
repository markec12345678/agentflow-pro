"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { PromptSelector } from "@/web/components/PromptSelector";
import { VariableForm } from "@/web/components/VariableForm";
import type { PromptTemplate } from "@/data/prompts";

function getMessageText(message: { parts?: Array<{ type: string; text?: string }> }): string {
  return (
    message.parts
      ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join("") ?? ""
  );
}

export default function ChatPage() {
  const searchParams = useSearchParams();
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });
  const [input, setInput] = useState("");

  useEffect(() => {
    const p = searchParams.get("prompt");
    if (p) setInput(decodeURIComponent(p));
  }, [searchParams]);
  const [selectedPrompt, setSelectedPrompt] = useState<PromptTemplate | null>(null);
  const [defaultCategory, setDefaultCategory] = useState<string>("all");
  const [savedPostIds, setSavedPostIds] = useState<Record<string, string>>({});
  const [savingMessageId, setSavingMessageId] = useState<string | null>(null);
  const [saveErrorForMessage, setSaveErrorForMessage] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/onboarding")
      .then((r) => r.json())
      .then((data: { onboarding?: { industry?: string } }) => {
        const industry = data.onboarding?.industry;
        if (
          industry === "tourism" ||
          industry === "travel-agency"
        ) {
          setDefaultCategory("tourism");
        }
      })
      .catch(() => { });
  }, []);

  const handleSaveAsBlogPost = async (messageId: string, content: string) => {
    if (content.length < 10) return;
    setSavingMessageId(messageId);
    setSaveErrorForMessage((prev) => ({ ...prev, [messageId]: "" }));
    try {
      const res = await fetch("/api/content/save-from-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = (await res.json()) as { id?: string; error?: string };
      if (!res.ok) {
        setSaveErrorForMessage((prev) => ({ ...prev, [messageId]: data.error ?? "Save failed" }));
        return;
      }
      if (data.id) {
        setSavedPostIds((prev) => ({ ...prev, [messageId]: data.id as string }));
      }
    } catch (e) {
      setSaveErrorForMessage((prev) => ({
        ...prev,
        [messageId]: e instanceof Error ? e.message : "Save failed",
      }));
    } finally {
      setSavingMessageId(null);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold dark:text-white mb-2">Boss Mode</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Klepetaj z AI asistentom za ustvarjanje in urejanje vsebine. Uporablja
          tvoj Brand Voice in Style Guide iz onboardinga.
        </p>

        <div className="rounded-xl bg-white dark:bg-gray-800 shadow-lg p-6 min-h-[400px] flex flex-col">
          <div className="flex-1 overflow-y-auto space-y-4 mb-6">
            {messages.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                Kaj bi rad danes ustvaril? Napiši prompt, npr. &quot;Napiši uvod
                za blog o AI avtomatizaciji&quot; ali &quot;Razširi ta naslov v
                kratek odstavek&quot;.
              </p>
            ) : (
              messages.map((message) => {
                const text = getMessageText(message);
                const isAssistant = message.role === "assistant";
                const postId = savedPostIds[message.id];
                const isSaving = savingMessageId === message.id;
                const saveError = saveErrorForMessage[message.id];

                return (
                  <div
                    key={message.id}
                    className={
                      message.role === "user"
                        ? "ml-auto max-w-[85%] rounded-lg bg-blue-600 text-white px-4 py-2"
                        : "rounded-lg bg-gray-200 dark:bg-gray-700 px-4 py-2"
                    }
                  >
                    <div className="text-sm font-medium mb-1 opacity-80">
                      {message.role === "user" ? "Ti" : "AgentFlow Pro"}
                    </div>
                    <div className="whitespace-pre-wrap">
                      {message.parts
                        ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
                        .map((p, i) => (
                          <span key={i}>{p.text}</span>
                        ))}
                    </div>
                    {isAssistant && text.length >= 10 && (
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        {postId ? (
                          <Link
                            href={`/content/${postId}`}
                            className="text-sm text-green-600 dark:text-green-400 hover:underline font-medium"
                          >
                            Shranjeno → Prikaži post
                          </Link>
                        ) : isSaving ? (
                          <span className="text-sm text-gray-500 dark:text-gray-400">Shranjam...</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSaveAsBlogPost(message.id, text)}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
                          >
                            Shrani kot BlogPost
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(text);
                            toast.success("Kopirano");
                          }}
                          className="text-sm text-gray-600 dark:text-gray-400 hover:underline font-medium"
                          aria-label="Kopiraj vsebino"
                        >
                          Kopiraj
                        </button>
                        {saveError && (
                          <span className="text-sm text-red-600 dark:text-red-400">{saveError}</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
            {status === "streaming" && (
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse delay-100" />
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse delay-200" />
              </div>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Prompt
            </label>
            <PromptSelector
              selectedPrompt={selectedPrompt}
              onSelect={setSelectedPrompt}
              defaultCategory={defaultCategory}
            />
          </div>

          {selectedPrompt?.variables && selectedPrompt.variables.length > 0 && (
            <div className="mb-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
              <VariableForm
                prompt={selectedPrompt}
                onSubmit={(filledPrompt) => {
                  sendMessage({ text: filledPrompt });
                  setSelectedPrompt(null);
                }}
                disabled={status !== "ready"}
              />
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (input.trim()) {
                sendMessage({ text: input });
                setInput("");
              }
            }}
            className="flex gap-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={status !== "ready"}
              placeholder="Napiši prompt..."
              className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={status !== "ready" || !input.trim()}
              className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === "streaming"
                ? "Pisem..."
                : status === "submitted"
                  ? "Čakam..."
                  : "Pošlji"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <Link href="/content" className="text-blue-600 hover:underline">
            ← Nazaj na My Content
          </Link>
        </p>
      </div>
    </main>
  );
}
