"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ContentItem {
  id: string;
  type: string;
  content: string;
  createdAt: string;
}

interface Checkpoint {
  id: string;
  nodeId: string;
  nodeLabel: string | null;
  status: string;
  createdAt: string;
  workflow: { id: string; name: string };
}

// ─── Onboarding Checklist ─────────────────────────────────────────────────────
const CHECKLIST_STEPS = [
  { id: "register",   label: "Ustvarili ste račun",          done: true },
  { id: "property",   label: "Dodajte nastanitev",           href: "/settings" },
  { id: "content",    label: "Ustvarite prvi opis sobe",     href: "/generate?template=booking-description" },
  { id: "email",      label: "Pošljite email dobrodošlice",  href: "/generate?template=guest-welcome-email" },
  { id: "landing",    label: "Ustvarite landing stran",      href: "/generate?template=landing-page" },
];

function OnboardingChecklist() {
  const [dismissed, setDismissed] = useState(false);
  const [completed, setCompleted] = useState<string[]>(["register"]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("agentflow-checklist");
      if (saved) setCompleted(JSON.parse(saved));
      const dis = localStorage.getItem("agentflow-checklist-dismissed");
      if (dis) setDismissed(true);
    } catch {}
  }, []);

  const markDone = (id: string) => {
    const next = [...completed, id];
    setCompleted(next);
    try { localStorage.setItem("agentflow-checklist", JSON.stringify(next)); } catch {}
  };

  const dismiss = () => {
    setDismissed(true);
    try { localStorage.setItem("agentflow-checklist-dismissed", "1"); } catch {}
  };

  if (dismissed) return null;

  const doneCount = CHECKLIST_STEPS.filter(s => completed.includes(s.id)).length;
  const pct = Math.round((doneCount / CHECKLIST_STEPS.length) * 100);

  if (doneCount === CHECKLIST_STEPS.length) return null;

  return (
    <div className="mb-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-blue-100 dark:border-blue-900 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">🎯 Vaš napredek: {doneCount}/{CHECKLIST_STEPS.length}</h2>
          <p className="text-sm text-gray-500">Dokončajte nastavitev za najboljšo izkušnjo</p>
        </div>
        <button onClick={dismiss} className="text-gray-400 hover:text-gray-600 text-xl leading-none" aria-label="Zapri">×</button>
      </div>
      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 mb-5">
        <div className="bg-blue-600 h-2 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <div className="space-y-3">
        {CHECKLIST_STEPS.map(step => {
          const done = completed.includes(step.id);
          return (
            <div key={step.id} className="flex items-center gap-3">
              <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${done ? "bg-green-500 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-400"}`}>
                {done ? "✓" : ""}
              </span>
              <span className={`flex-1 text-sm ${done ? "line-through text-gray-400" : "text-gray-700 dark:text-gray-300"}`}>
                {step.label}
              </span>
              {!done && step.href && (
                <Link
                  href={step.href}
                  onClick={() => markDone(step.id)}
                  className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Začni →
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Quick Action Card ────────────────────────────────────────────────────────
function QuickCard({
  emoji, title, desc, href, color,
}: {
  emoji: string; title: string; desc: string; href: string; color: string;
}) {
  return (
    <Link
      href={href}
      className={`group flex flex-col gap-3 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border-t-4 ${color} hover:-translate-y-1`}
    >
      <span className="text-4xl">{emoji}</span>
      <div>
        <h3 className="font-bold text-gray-900 dark:text-white text-lg leading-tight">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{desc}</p>
      </div>
      <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 group-hover:underline mt-auto">
        Začni →
      </span>
    </Link>
  );
}

// ─── Recent Content ───────────────────────────────────────────────────────────
function RecentContent() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/content?limit=5")
      .then(r => r.json())
      .then((data: ContentItem[] | { items?: ContentItem[] }) => {
        const list = Array.isArray(data) ? data : (data.items ?? []);
        setItems(list.slice(0, 5));
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-3">
      {[1,2,3].map(i => (
        <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
      ))}
    </div>
  );

  if (items.length === 0) return (
    <div className="text-center py-8 text-gray-400">
      <p className="text-4xl mb-2">📄</p>
      <p className="text-sm">Še nimate vsebine. Začnite s klikom na eno od akcij zgoraj!</p>
    </div>
  );

  const typeLabel: Record<string, string> = {
    blog: "📝 Blog", landing: "🌐 Landing", email: "📧 Email", social: "📱 Social",
  };

  return (
    <div className="space-y-3">
      {items.map(item => (
        <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <span className="text-lg">{typeLabel[item.type]?.split(" ")[0] ?? "📄"}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {item.content?.slice(0, 60) || "Brez naslova"}...
            </p>
            <p className="text-xs text-gray-400">
              {typeLabel[item.type] ?? item.type} · {new Date(item.createdAt).toLocaleDateString("sl-SI")}
            </p>
          </div>
          <Link href={`/content?id=${item.id}`} className="text-xs text-blue-500 hover:underline flex-shrink-0">
            Odpri
          </Link>
        </div>
      ))}
      <Link href="/content" className="block text-center text-sm text-blue-600 dark:text-blue-400 hover:underline pt-2">
        Vsa vsebina →
      </Link>
    </div>
  );
}

// ─── Approval Queue ───────────────────────────────────────────────────────────
function ApprovalQueue() {
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);

  const fetchCheckpoints = useCallback(() => {
    fetch("/api/workflows/checkpoint")
      .then(r => r.json())
      .then((list: Checkpoint[]) => setCheckpoints(Array.isArray(list) ? list : []))
      .catch(() => setCheckpoints([]));
  }, []);

  useEffect(() => { fetchCheckpoints(); }, [fetchCheckpoints]);

  const handle = (id: string, action: "approve" | "reject") => {
    fetch(`/api/workflows/checkpoint/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checkpointId: id }),
    }).then(() => fetchCheckpoints());
  };

  if (checkpoints.length === 0) return null;

  return (
    <div className="mb-8 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-200 dark:border-amber-800 p-6">
      <h2 className="font-bold text-amber-800 dark:text-amber-300 mb-3">⏳ Čaka na odobritev ({checkpoints.length})</h2>
      <div className="space-y-3">
        {checkpoints.map(cp => (
          <div key={cp.id} className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{cp.workflow.name} – {cp.nodeLabel ?? cp.nodeId}</p>
              <p className="text-xs text-gray-400">{new Date(cp.createdAt).toLocaleString("sl-SI")}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handle(cp.id, "reject")} className="px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">Zavrni</button>
              <button onClick={() => handle(cp.id, "approve")} className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700">Odobri</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { data: session } = useSession();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const firstName = session?.user?.name?.split(" ")[0] ?? session?.user?.email?.split("@")[0] ?? "tam";

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Dobro jutro";
    if (h < 17) return "Dober dan";
    return "Dober večer";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {getGreeting()}, {firstName}! 👋
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Kaj boste naredili danes?</p>
        </div>

        {/* Approval Queue */}
        <ApprovalQueue />

        {/* Onboarding Checklist */}
        <OnboardingChecklist />

        {/* 3 Main Actions */}
        <div className="grid sm:grid-cols-3 gap-5 mb-10">
          <QuickCard
            emoji="✍️"
            title="Ustvari vsebino"
            desc="Opis sobe, blog post, social objava"
            href="/generate"
            color="border-blue-500"
          />
          <QuickCard
            emoji="📧"
            title="Email za goste"
            desc="Dobrodošlica, opomnilo, zahvala"
            href="/generate?template=guest-welcome-email"
            color="border-green-500"
          />
          <QuickCard
            emoji="🌐"
            title="Landing stran"
            desc="SEO strani za direktne rezervacije"
            href="/generate?template=landing-page"
            color="border-purple-500"
          />
        </div>

        {/* Secondary Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          {[
            { emoji: "🏨", label: "Booking.com opis",   href: "/generate?template=booking-description" },
            { emoji: "✈️", label: "Airbnb story",        href: "/generate?template=airbnb-story" },
            { emoji: "📍", label: "Vodič destinacije",   href: "/generate?template=destination-guide" },
            { emoji: "📱", label: "Instagram caption",   href: "/generate?template=instagram-travel" },
          ].map(item => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-xl px-4 py-3 shadow hover:shadow-md transition-all text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 border border-gray-100 dark:border-gray-700"
            >
              <span>{item.emoji}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Recent Content */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">📁 Zadnja vsebina</h2>
            <Link href="/content" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">Vse →</Link>
          </div>
          <RecentContent />
        </div>

        {/* Advanced toggle */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <button
            onClick={() => setShowAdvanced(v => !v)}
            className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            <span>{showAdvanced ? "▲" : "▼"}</span>
            <span>{showAdvanced ? "Skrij napredno" : "Napredno (za izkušene uporabnike)"}</span>
          </button>

          {showAdvanced && (
            <div className="mt-5 grid sm:grid-cols-3 gap-4">
              {[
                { emoji: "⚡", label: "Workflow Builder",  href: "/workflows",  desc: "Vizualni gradnik avtomatizacij" },
                { emoji: "🤖", label: "Chat z agenti",     href: "/chat",       desc: "Direktno navodilo AI agentu" },
                { emoji: "🎨", label: "Canvas",            href: "/canvas",     desc: "Vizualni kampanjski načrtovalec" },
                { emoji: "📊", label: "Monitoring",        href: "/monitoring", desc: "Stanje sistemov in logov" },
                { emoji: "🧠", label: "Memory graph",      href: "/memory",     desc: "Graf znanja" },
                { emoji: "👑", label: "Admin",             href: "/admin",      desc: "Administracija" },
              ].map(item => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-start gap-3 bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-blue-400 transition-colors"
                >
                  <span className="text-2xl">{item.emoji}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.label}</p>
                    <p className="text-xs text-gray-400">{item.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
