"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { PROMPTS } from "@/data/prompts";
import { SkeletonList } from "@/web/components/Skeleton";
import { PropertySelector } from "@/web/components/PropertySelector";

interface UserTemplate {
  id: string;
  name: string;
  basePrompt: string;
  customVars: Record<string, string> | null;
  language: string | null;
  createdAt: string;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("sl-SI", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return iso.slice(0, 10);
  }
}

export default function TourismTemplatesPage() {
  const [templates, setTemplates] = useState<UserTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePropertyId, setActivePropertyId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v1/user/active-property")
      .then((r) => r.json())
      .then((data) => setActivePropertyId(data.activePropertyId ?? null))
      .catch(() => setActivePropertyId(null));
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const url = activePropertyId
      ? `/api/v1/user/templates?category=tourism&propertyId=${encodeURIComponent(activePropertyId)}`
      : "/api/v1/user/templates?category=tourism";
    fetch(url, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((data) => {
        setTemplates(data?.templates ?? []);
      })
      .catch(() => {
        setTemplates([]);
        toast.error("Napaka pri nalaganju template-ov.");
      })
      .finally(() => {
        clearTimeout(t);
        setLoading(false);
      });
  }, [activePropertyId]);

  const handleDelete = (id: string) => {
    if (!confirm("Izbriši ta template?")) return;
    fetch(`/api/v1/user/templates/${id}`, { method: "DELETE" })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setTemplates((prev) => prev.filter((t) => t.id !== id));
        toast.success("Template izbrisan");
      })
      .catch((err) =>
        toast.error(err instanceof Error ? err.message : "Brisanje ni uspelo")
      );
  };

  const getPromptName = (basePrompt: string) => {
    return PROMPTS.find((p) => p.id === basePrompt)?.name ?? basePrompt;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 overflow-x-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Moji Template-i
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Shranjeni custom prompti za hitro ponovno uporabo
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PropertySelector
            value={activePropertyId}
            onChange={async (id) => {
              const res = await fetch("/api/v1/user/active-property", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ propertyId: id }),
              });
              if (res.ok) setActivePropertyId(id);
            }}
          />
          <Link
            href="/dashboard/tourism/generate"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            + Nov Template
          </Link>
        </div>
      </div>

      {loading ? (
        <SkeletonList count={4} />
      ) : templates.length === 0 ? (
        <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Še nimate shranjenih template-ov. Generirajte vsebino in jo shranite
            kot template za ponovno uporabo.
          </p>
          <Link
            href="/dashboard/tourism/generate"
            className="text-blue-600 hover:underline dark:text-blue-400 font-medium"
          >
            Pojdi na Generiraj
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            >
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {t.name}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {getPromptName(t.basePrompt)} • {formatDate(t.createdAt)}
                </div>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/dashboard/tourism/generate?template=${t.id}`}
                  className="px-3 py-2 min-h-[44px] inline-flex items-center text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Uporabi
                </Link>
                <button
                  type="button"
                  onClick={() => { }}
                  className="px-3 py-2 min-h-[44px] text-sm font-medium rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Uredi
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(t.id)}
                  aria-label={`Izbriši template ${t.name}`}
                  className="px-3 py-1.5 text-sm font-medium rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                >
                  Izbriši
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
        <Link
          href="/dashboard/tourism"
          className="text-blue-600 hover:underline dark:text-blue-400"
        >
          Tourism Hub
        </Link>
        {" · "}
        <Link
          href="/dashboard/tourism/generate"
          className="text-blue-600 hover:underline dark:text-blue-400"
        >
          Generiraj
        </Link>
      </p>
    </div>
  );
}
