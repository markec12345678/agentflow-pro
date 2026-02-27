"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PluginProvider, usePlugins, DragDropBuilder, TextPlugin, ImagePlugin, ButtonPlugin, FormPlugin } from "@/page-builder";

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
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pageId) return;
    fetch(`/api/page-builder/sync/${pageId}`)
      .then((r) => (r.status === 404 ? { components: [] } : r.json()))
      .then((data) => {
        const comps = Array.isArray(data.components) ? data.components : [];
        setComponents(
          comps.map((c: PageComponent) => ({
            ...c,
            position: c.position ?? { x: 0, y: 0 },
            content: c.content ?? {},
            styles: c.styles ?? {},
          }))
        );
      })
      .catch(() => setComponents([]))
      .finally(() => setLoading(false));
  }, [pageId]);

  const handleSync = useCallback(async () => {
    if (!pageId) return;
    try {
      await fetch(`/api/page-builder/sync/${pageId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ components }),
      });
    } catch (e) {
      console.error("Sync failed:", e);
    }
  }, [pageId, components]);

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
        <button
          onClick={handleSync}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        >
          Shrani
        </button>
      </div>
      <DragDropBuilder
        components={components}
        onComponentsChange={setComponents}
        selectedComponent={selectedComponent}
        onComponentSelect={setSelectedComponent}
      />
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
