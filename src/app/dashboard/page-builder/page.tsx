"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  PluginProvider,
  usePlugins,
  DragDropBuilder,
  TextPlugin,
  ImagePlugin,
  ButtonPlugin,
  FormPlugin,
} from "@/page-builder";

// Toast notification system
const showToast = (message: string, isError = false) => {
  const toast = document.createElement("div");
  toast.textContent = message;
  toast.style.position = "fixed";
  toast.style.bottom = "20px";
  toast.style.right = "20px";
  toast.style.padding = "12px 20px";
  toast.style.borderRadius = "8px";
  toast.style.background = isError ? "#ef4444" : "#10b981";
  toast.style.color = "white";
  toast.style.zIndex = "1000";
  toast.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
};

export interface PageComponent {
  id: string;
  type: "header" | "text" | "image" | "button" | "form" | "gallery";
  content: Record<string, unknown>;
  styles: Record<string, unknown>;
  position: { x: number; y: number };
}

const PLUGINS = [
  { ...TextPlugin, isActive: true },
  { ...ImagePlugin, isActive: true },
  { ...ButtonPlugin, isActive: true },
  { ...FormPlugin, isActive: true },
];

function PageBuilderInner({ pageId }: { pageId: string }) {
  const router = useRouter();
  const [components, setComponents] = useState<PageComponent[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [customPrompt, setCustomPrompt] = useState(
    "Najboljši apartmaji v Tolminu",
  );
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [generationHistory, setGenerationHistory] = useState<string[]>([]);

  useEffect(() => {
    if (!pageId) return;
    fetch(`/api/v1/business/sync/${pageId}`)
      .then((r) => (r.status === 404 ? { components: [] } : r.json()))
      .then((data) => {
        const comps = Array.isArray(data.components) ? data.components : [];
        setComponents(
          comps.map((c: PageComponent) => ({
            ...c,
            position: c.position ?? { x: 0, y: 0 },
            content: c.content ?? {},
            styles: c.styles ?? {},
          })),
        );
      })
      .catch(() => setComponents([]))
      .finally(() => setLoading(false));
  }, [pageId]);

  const handleSync = useCallback(async () => {
    if (!pageId) return;
    try {
      await fetch(`/api/v1/business/sync/${pageId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ components }),
      });
    } catch (e) {
      console.error("Sync failed:", e);
    }
  }, [pageId, components]);

  const handleAIGenerate = useCallback(async () => {
    if (!pageId) return;
    setAiGenerating(true);

    try {
      // Validate prompt
      if (!customPrompt.trim()) {
        throw new Error("Prosim vnesite iskalni niz");
      }

      const response = await fetch(`/api/v1/business/ai-generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: customPrompt }),
      });

      if (!response.ok) {
        throw new Error(`API napaka: ${response.status}`);
      }

      const data = await response.json();

      // Advanced error handling
      if (!data.content || data.content.length === 0) {
        throw new Error("Ni rezultatov iskanja");
      }

      // Convert AI response to PageComponent format
      const newComponents = data.content.map((item: any, index: number) => ({
        id: `ai-gen-${Date.now()}-${index}`,
        type: item.type.toLowerCase() as PageComponent["type"],
        content: item.payload,
        styles: {},
        position: { x: 0, y: index * 100 },
      }));

      // Update generation history
      setGenerationHistory((prev) => [customPrompt, ...prev.slice(0, 4)]);

      setComponents(newComponents);
      showToast(`Uspešno generirano: ${customPrompt}`);
    } catch (e: any) {
      console.error("AI Generation failed:", e);
      showToast(e.message || "Napaka pri generiranju", true);
    } finally {
      setAiGenerating(false);
    }
  }, [pageId, customPrompt]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <span className="text-gray-500">Nalaganje...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/tourism"
          className="text-sm text-blue-600 hover:underline"
        >
          ← Nazaj na Tourism
        </Link>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPromptModal(true)}
            disabled={aiGenerating}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm disabled:opacity-50"
          >
            {aiGenerating ? "Generiram..." : "Generiraj z AI"}
          </button>
          {generationHistory.length > 0 && (
            <div className="relative group">
              <button
                onClick={() => setShowPromptModal(true)}
                className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                title="Zgodovina generiranj"
              >
                🕒
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 hidden group-hover:block">
                <div className="p-2 text-sm text-gray-600 font-medium">
                  Zadnje generacije:
                </div>
                {generationHistory.slice(0, 3).map((item, index) => (
                  <div
                    key={index}
                    className="px-2 py-1 text-sm text-gray-800 hover:bg-gray-100 cursor-pointer"
                    onClick={() => {
                      setCustomPrompt(item);
                      setShowPromptModal(true);
                    }}
                  >
                    {item.substring(0, 30)}
                    {item.length > 30 ? "..." : ""}
                  </div>
                ))}
              </div>
            </div>
          )}
          <button
            onClick={handleSync}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            Shrani
          </button>
        </div>
      </div>
      <DragDropBuilder
        components={components}
        onComponentsChange={setComponents}
        selectedComponent={selectedComponent}
        onComponentSelect={setSelectedComponent}
      />

      {/* AI Prompt Modal */}
      {showPromptModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">AI Generiranje</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vnesite iskalni niz
              </label>
              <input
                type="text"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="npr. Najboljši apartmaji v Tolminu"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowPromptModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Prekliči
              </button>
              <button
                onClick={() => {
                  setShowPromptModal(false);
                  handleAIGenerate();
                }}
                disabled={aiGenerating}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {aiGenerating ? "Generiram..." : "Generiraj"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PluginRegistration({ children }: { children: React.ReactNode }) {
  const { registerPlugin } = usePlugins();
  useEffect(() => {
    PLUGINS.forEach((p) => registerPlugin(p));
  }, [registerPlugin]);
  return <>{children}</>;
}

function PageBuilderWithPlugins({ pageId }: { pageId: string }) {
  return (
    <PluginRegistration>
      <PageBuilderInner pageId={pageId} />
    </PluginRegistration>
  );
}

export default function PageBuilderPage() {
  const [pageId, setPageId] = useState<string | null>(null);

  useEffect(() => {
    const id = crypto.randomUUID?.() ?? `pb-${Date.now()}`;
    setPageId(id);
  }, []);

  return (
    <PluginProvider>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Page Builder
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Ustvarite spletno stran z vleci-in-spusti vmesnikom.
        </p>
        {pageId && <PageBuilderWithPlugins pageId={pageId} />}
      </div>
    </PluginProvider>
  );
}
