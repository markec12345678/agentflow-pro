"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Home, 
  ClipboardList, 
  PenTool, 
  FolderKanban, 
  Building,
  LayoutDashboard,
  Calendar,
  Mail,
  Hotel,
  FileText,
  Globe,
  BarChart3,
  Zap,
  MessageSquare,
  Brain,
  AlertCircle,
  Settings,
  Moon,
  Sun,
  Menu,
  X,
  ChevronDown,
  ChevronUp,
  Plus
} from "lucide-react";
import FloatingChat from "@/components/FloatingChat";
import { NotificationSidePanel } from "@/web/components/NotificationSidePanel";

// ─── Glavna navigacija (5 osnovnih) ─────────────────────────────────────────
const MAIN_NAV = [
  { icon: Home, label: "Pregled", href: "/dashboard" },
  { icon: Calendar, label: "Koledar", href: "/dashboard/tourism/calendar" },
  { icon: PenTool, label: "Ustvari", href: "/generate" },
  { icon: FolderKanban, label: "Vsebina", href: "/content" },
  { icon: Settings, label: "Nastavitve", href: "/settings" },
];

// ─── Turizem podmeni ──────────────────────────────────────────────────────────
const TOURISM_NAV = [
  { name: "Director", href: "/dashboard/director" },
  { name: "Pregled", href: "/dashboard/tourism" },
  { name: "Koledar", href: "/dashboard/tourism/calendar" },
  { name: "Povpraševanja", href: "/dashboard/tourism/inbox" },
  { name: "Komunikacija", href: "/dashboard/tourism/guest-communication" },
  { name: "Generiraj", href: "/generate" },
  { name: "Predloge", href: "/dashboard/tourism/templates" },
  { name: "Nastanitve", href: "/dashboard/properties" },
  { name: "Landing strani", href: "/dashboard/tourism/landing" },
  { name: "Page Builder", href: "/dashboard/page-builder" },
  { name: "Itinerarji", href: "/dashboard/tourism/itineraries" },
  { name: "Email", href: "/dashboard/tourism/email" },
  { name: "SEO", href: "/dashboard/tourism/seo" },
  { name: "Prevodi", href: "/dashboard/tourism/translate" },
  { name: "Konkurenti", href: "/dashboard/tourism/competitors" },
  { name: "Dinamične cene", href: "/dashboard/tourism/dynamic-pricing" },
  { name: "Revenue", href: "/dashboard/tourism/revenue" },
  { name: "Obvestila", href: "/dashboard/tourism/notifications" },
  { name: "eTurizem", href: "/dashboard/tourism/eturizem-settings" },
];

// ─── Napredno (skrito) ────────────────────────────────────────────────────────
const ADVANCED_NAV = [
  { icon: BarChart3, label: "Insights", href: "/dashboard/insights" },
  { icon: Zap, label: "Workflow Builder", href: "/workflows" },
  { icon: Globe, label: "Page Builder", href: "/dashboard/page-builder" },
  { icon: MessageSquare, label: "MCP Builder", href: "/dashboard/mcp-builder" },
  { icon: MessageSquare, label: "Chat z agenti", href: "/chat" },
  { icon: Brain, label: "Memory", href: "/memory" },
  { icon: AlertCircle, label: "Escalations", href: "/dashboard/escalations" },
  { icon: Settings, label: "Nastavitve", href: "/settings" },
  { icon: BarChart3, label: "Monitoring", href: "/monitoring" },
];

const SHORTCUTS: Record<string, string> = {
  "g d": "/dashboard",
  "g c": "/content",
  "g n": "/generate",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [userIndustry, setUserIndustry] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [shortcutBuf, setShortcutBuf] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(true);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      if (e.key === "?") {
        e.preventDefault();
        setShowHelp((v) => !v);
        return;
      }
      if (e.key === "Escape") {
        setShowHelp(false);
        setShortcutBuf("");
        return;
      }
      const key = e.key.toLowerCase();
      if (
        key === "g" ||
        (shortcutBuf === "g" && ["d", "c", "n"].includes(key))
      ) {
        const seq = shortcutBuf === "g" ? `g ${key}` : key === "g" ? "g" : "";
        if (seq === "g") {
          setShortcutBuf("g");
          setTimeout(() => setShortcutBuf(""), 800);
          return;
        }
        const href = SHORTCUTS[seq];
        if (href) {
          e.preventDefault();
          router.push(href);
          setShortcutBuf("");
        }
        return;
      }
      setShortcutBuf("");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router, shortcutBuf]);

  useEffect(() => {
    const onToggle = () => setNotificationPanelOpen((v) => !v);
    window.addEventListener("toggle-notification-panel", onToggle);
    return () =>
      window.removeEventListener("toggle-notification-panel", onToggle);
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    fetch("/api/dashboard/boot", { signal: ctrl.signal })
      .then((r) => r.json())
      .then((data: { profile?: { onboarding?: { industry?: string } } }) => {
        setUserIndustry(data?.profile?.onboarding?.industry ?? null);
      })
      .catch(() => setUserIndustry(null))
      .finally(() => clearTimeout(t));
  }, []);

  // Privzeta Tourism stran za tourism uporabnike („Danes“ kot vhod)
  // Novi turistični uporabniki: privzeto vklopi reception mode (prvi obisk)
  useEffect(() => {
    if (
      pathname === "/dashboard" &&
      (userIndustry === "tourism" || userIndustry === "travel-agency")
    ) {
      try {
        if (typeof window !== "undefined") {
          const stored = localStorage.getItem("agentflow-reception-mode");
          if (stored === null) {
            localStorage.setItem("agentflow-reception-mode", "1");
          }
        }
        const reception =
          typeof window !== "undefined" &&
          localStorage.getItem("agentflow-reception-mode") === "1";
        router.replace(
          reception
            ? "/dashboard/tourism?mode=reception"
            : "/dashboard/tourism",
        );
      } catch {
        router.replace("/dashboard/tourism");
      }
    }
  }, [pathname, userIndustry, router]);

  const showTourismHub =
    userIndustry === "tourism" || userIndustry === "travel-agency";

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === href
      : pathname.startsWith(href.split("?")[0]);

  const navLinkClass = (href: string) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
      isActive(href)
        ? "bg-blue-600 text-white shadow-xs"
        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
    }`;

  const sidebar = (
    <nav className="p-4 space-y-1" aria-label="Navigacija">
      {/* Logo + theme toggle */}
      <div className="px-3 py-3 mb-2 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-bold text-gray-900 dark:text-white"
        >
          <Zap className="w-6 h-6 text-blue-600" />
          <span>
            AgentFlow<span className="text-blue-600"> Pro</span>
          </span>
        </Link>
        <button
          type="button"
          onClick={toggleTheme}
          className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          aria-label={darkMode ? "Svetla tema" : "Temna tema"}
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      {/* Hiter gumb Ustvari */}
      <Link
        href="/generate"
        className="flex items-center justify-center gap-2 w-full py-2.5 mb-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-all shadow-xs"
      >
        <Plus className="w-5 h-5" />
        <span>Nova vsebina</span>
      </Link>

      {/* Glavna nav */}
      {MAIN_NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={navLinkClass(item.href)}
        >
          <item.icon className="w-5 h-5" />
          <span>{item.label}</span>
        </Link>
      ))}

      {/* Tourism Hub */}
      {showTourismHub && (
        <div className="pt-3">
          <p className="px-3 py-1 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            Tourism Hub
          </p>
          {TOURISM_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-2 text-sm rounded-xl transition-all ${
                pathname.startsWith(item.href)
                  ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>
      )}

      {/* Napredno */}
      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="flex items-center gap-2 px-3 py-2 w-full text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          <span>Napredno</span>
        </button>
        {showAdvanced && (
          <div className="mt-1 space-y-0.5">
            {ADVANCED_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={navLinkClass(item.href)}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        {sidebar}
      </aside>

      {/* Mobile: hamburger header */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Mobile topbar */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-bold text-gray-900 dark:text-white"
          >
            <span>⚡</span>
            <span>
              AgentFlow<span className="text-blue-600"> Pro</span>
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            aria-label="Meni"
          >
            {mobileOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile menu overlay */}
        {mobileOpen && (
          <div className="md:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            {sidebar}
          </div>
        )}

        {/* Vsebina */}
        <main
          className={`flex-1 overflow-auto p-4 md:p-6 transition-[margin] ${
            showTourismHub && notificationPanelOpen
              ? "md:mr-80"
              : showTourismHub
                ? "md:mr-12"
                : ""
          }`}
        >
          {children}
        </main>

        {/* Notification side panel (tourism only) */}
        {showTourismHub && (
          <NotificationSidePanel
            isOpen={notificationPanelOpen}
            onOpenChange={setNotificationPanelOpen}
          />
        )}

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-2 flex items-center justify-around">
          {(() => {
            const base = [
              showTourismHub
                ? {
                    icon: Calendar,
                    label: "Danes",
                    href: "/dashboard/tourism?mode=reception",
                  }
                : { icon: Home, label: "Domov", href: "/dashboard" },
              { icon: PenTool, label: "Ustvari", href: "/generate" },
              { icon: FolderKanban, label: "Vsebina", href: "/content" },
              { icon: Settings, label: "Nastavitve", href: "/settings" },
            ];
            return base;
          })().map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
                isActive(item.href)
                  ? "text-blue-600"
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <item.icon className="w-6 h-6" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Prostor za mobile bottom nav */}
        <div className="md:hidden h-16" />
      </div>

      {/* Floating AI Chat Assistant */}
      <FloatingChat />

      {/* Keyboard shortcuts help overlay */}
      {showHelp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Bližnjice na tipkovnici
            </h3>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li>
                <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-sm">
                  g
                </kbd>{" "}
                <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-sm">
                  d
                </kbd>{" "}
                → Dashboard
              </li>
              <li>
                <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-sm">
                  g
                </kbd>{" "}
                <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-sm">
                  c
                </kbd>{" "}
                → Vsebina
              </li>
              <li>
                <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-sm">
                  g
                </kbd>{" "}
                <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-sm">
                  n
                </kbd>{" "}
                → Nova vsebina
              </li>
              <li>
                <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-sm">
                  ?
                </kbd>{" "}
                → Prikaži/skrij to pomoč
              </li>
            </ul>
            <button
              type="button"
              onClick={() => setShowHelp(false)}
              className="mt-4 w-full py-2 bg-gray-100 dark:bg-gray-700 rounded-xl text-sm font-medium"
            >
              Zapri
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
